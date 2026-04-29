import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BrowserQRCodeReader } from "@zxing/browser";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { useTheme } from "@/contexts/theme-context";
import { StatusBadge } from "./status-badge";

interface InventoryAuditModalProps {
  isOpen: boolean;
  displayMode?: "modal" | "page" | "embedded";
  onConfirm: () => void;
  onClose: () => void;
}

interface ScannedItemDetails {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  pawnDate: string;
  status: string;
  amount?: number;
  originalPhoto?: string;
  ownerIdPhoto?: string;
  customerName?: string;
  customerAddress?: string;
  customerContact?: string;
  customerIdPresented?: string;
  scanPayload?: string;
  serialNumber?: string;
  scanSerialNumber?: string;
  itemPhotos?: string[];
  item_photos?: string[];
}

interface ParsedScan {
  rawValue: string;
  itemId: string;
  itemName?: string;
  serialNumber?: string;
}

type CameraState = "loading" | "ready" | "unsupported" | "error";
type ScanStage = "aligning" | "scanning" | "matched" | "duplicate" | "failed";

interface InventoryTally {
  totalInSystem: number;
  totalScanned: number;
  matched: number;
  missingInVault: string[];
  missingItems: Array<{
    itemId: string;
    itemName: string;
    category: string;
  }>;
  extraInVault: string[];
}

type ZXingDecodeResult = {
  getText: () => string;
};

type ZXingControls = Awaited<ReturnType<BrowserQRCodeReader["decodeFromConstraints"]>>;

const statusVariant: Record<string, "green" | "blue" | "red" | "orange"> = {
  Active: "green",
  Redeemed: "blue",
  Expired: "red",
};

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "N/A";
  }

  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function decodeScanPayload(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractItemIdFromPayload(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const extractFromUrl = (urlValue: URL) => {
    const queryItemId =
      urlValue.searchParams.get("itemId") ??
      urlValue.searchParams.get("unitCode") ??
      urlValue.searchParams.get("code") ??
      "";

    if (queryItemId.trim()) {
      return queryItemId.trim();
    }

    const pathSegments = urlValue.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      return pathSegments[pathSegments.length - 1].trim();
    }

    return "";
  };

  try {
    return extractFromUrl(new URL(trimmedValue));
  } catch {
    try {
      return extractFromUrl(new URL(trimmedValue, "https://placeholder.invalid"));
    } catch {
      return trimmedValue;
    }
  }
}

function parseScanPayload(value: string): ParsedScan {
  const rawValue = decodeScanPayload(value).trim();
  const codeMatch = rawValue.match(/(?:^|\|)\s*Code:\s*([^|]+)/i);
  const itemMatch = rawValue.match(/(?:^|\|)\s*Item:\s*([^|]+)/i);
  const serialMatch = rawValue.match(/(?:^|\|)\s*(?:SN|Serial(?:\s*No\.?|\s*Number)?|Serial #):\s*([^|]+)/i);

  const itemId = (codeMatch?.[1] ?? extractItemIdFromPayload(rawValue) ?? rawValue).trim();

  return {
    rawValue,
    itemId,
    itemName: itemMatch?.[1]?.trim(),
    serialNumber: serialMatch?.[1]?.trim(),
  };
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = typeof error.message === "string" ? error.message.trim() : "";
    if (message) {
      return message;
    }
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return "Unable to open the camera. Check permissions or use manual entry below.";
}

const INVENTORY_AUDIT_STORAGE_PREFIX = "pms-inventory-audit";

interface InventoryAuditStorageState {
  scannedItems: ScannedItemDetails[];
  pendingItem: ScannedItemDetails | null;
  detectedScan: ParsedScan | null;
  currentScan: string;
}

export function InventoryAuditModal({ isOpen, displayMode = "modal", onConfirm, onClose }: InventoryAuditModalProps) {
  const { selectedBranch } = useBranch();
  const { isDark, toggleTheme } = useTheme();
  const [scannedItems, setScannedItems] = useState<ScannedItemDetails[]>([]);
  const [currentScan, setCurrentScan] = useState("");
  const [detectedScan, setDetectedScan] = useState<ParsedScan | null>(null);
  const [pendingItem, setPendingItem] = useState<ScannedItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [scanStage, setScanStage] = useState<ScanStage>("aligning");
  const [cameraMessage, setCameraMessage] = useState("Preparing the camera...");
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);
  const [selectedVerifiedItem, setSelectedVerifiedItem] = useState<ScannedItemDetails | null>(null);
  const [rejectedScanItem, setRejectedScanItem] = useState<ScannedItemDetails | null>(null);
  const [tally, setTally] = useState<InventoryTally | null>(null);
  const [isCheckingTally, setIsCheckingTally] = useState(false);
  const [tallyError, setTallyError] = useState("");
  const [pendingPhotoBroken, setPendingPhotoBroken] = useState(false);
  const [verifiedPhotoBroken, setVerifiedPhotoBroken] = useState(false);
  const [hasLoadedPersistedState, setHasLoadedPersistedState] = useState(false);
  const [verifiedItemPhotoIndex, setVerifiedItemPhotoIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<ZXingControls | null>(null);
  const scanLockRef = useRef(false);
  const scannedItemsRef = useRef<ScannedItemDetails[]>([]);
  const pendingItemRef = useRef<ScannedItemDetails | null>(null);
  const lastDecodedRawRef = useRef<string | null>(null);
  const branchId = selectedBranch.id;
  const persistenceKey = branchId && branchId !== "__all__" ? `${INVENTORY_AUDIT_STORAGE_PREFIX}:${branchId}` : null;

  useEffect(() => {
    scannedItemsRef.current = scannedItems;
  }, [scannedItems]);

  useEffect(() => {
    pendingItemRef.current = pendingItem;
  }, [pendingItem]);

  useEffect(() => {
    setHasLoadedPersistedState(false);

    if (!isOpen || !persistenceKey) {
      return;
    }

    try {
      const rawState = window.localStorage.getItem(persistenceKey);

      if (!rawState) {
        setScannedItems([]);
        setPendingItem(null);
        setDetectedScan(null);
        setCurrentScan("");
        setHasLoadedPersistedState(true);
        return;
      }

      const savedState = JSON.parse(rawState) as Partial<InventoryAuditStorageState>;
      setScannedItems(Array.isArray(savedState.scannedItems) ? savedState.scannedItems : []);
      setPendingItem(savedState.pendingItem ?? null);
      setDetectedScan(savedState.detectedScan ?? null);
      setCurrentScan(savedState.currentScan ?? "");

      if (savedState.pendingItem) {
        setScanStage("matched");
      }
      setHasLoadedPersistedState(true);
    } catch {
      setScannedItems([]);
      setPendingItem(null);
      setDetectedScan(null);
      setCurrentScan("");
      setHasLoadedPersistedState(true);
    }
  }, [isOpen, persistenceKey]);

  useEffect(() => {
    if (!isOpen || !persistenceKey || !hasLoadedPersistedState) {
      return;
    }

    const state: InventoryAuditStorageState = {
      scannedItems,
      pendingItem,
      detectedScan,
      currentScan,
    };

    window.localStorage.setItem(persistenceKey, JSON.stringify(state));
  }, [currentScan, detectedScan, hasLoadedPersistedState, isOpen, pendingItem, persistenceKey, scannedItems]);

  useEffect(() => {
    setPendingPhotoBroken(false);
  }, [pendingItem?.ownerIdPhoto, pendingItem?.originalPhoto]);

  useEffect(() => {
    setVerifiedPhotoBroken(false);
    setVerifiedItemPhotoIndex(0);
  }, [selectedVerifiedItem?.ownerIdPhoto, selectedVerifiedItem?.originalPhoto, selectedVerifiedItem?.id]);

  const clearCameraLoop = useCallback(() => {
    if (controlsRef.current) {
      void controlsRef.current.stop();
      controlsRef.current = null;
    }

    readerRef.current = null;
    lastDecodedRawRef.current = null;

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }
  }, []);

  const resetPendingState = useCallback(() => {
    setPendingItem(null);
    setDetectedScan(null);
    setCurrentScan("");
    setError("");
    lastDecodedRawRef.current = null;
    setScanStage("aligning");
  }, []);

  const holdScanCooldown = useCallback((delay = 1200) => {
    scanLockRef.current = true;
    window.setTimeout(() => {
      scanLockRef.current = false;
    }, delay);
  }, []);

  const closeRejectedScan = useCallback(() => {
    setRejectedScanItem(null);
    resetPendingState();
    holdScanCooldown();
    setCameraMessage("Ready for the next QR code.");
  }, [holdScanCooldown, resetPendingState]);

  const loadItemFromScan = useCallback(async (rawValue: string) => {
    const parsed = parseScanPayload(rawValue);
    const cleanItemId = parsed.itemId.trim();

    if (!cleanItemId) {
      setError("The QR code did not include a valid item code.");
      return;
    }

    if (scanLockRef.current || pendingItemRef.current) {
      return;
    }

    const alreadyScanned = scannedItemsRef.current.some(
      (item) => item.itemId.toUpperCase() === cleanItemId.toUpperCase(),
    );

    if (alreadyScanned) {
      setDetectedScan(parsed);
      setCurrentScan(cleanItemId);
      setScanStage("duplicate");
      setError("Item already scanned and verified.");
      return;
    }

    scanLockRef.current = true;
    setDetectedScan(parsed);
    setCurrentScan(cleanItemId);
    setIsLoading(true);
    setScanStage("scanning");
    setError("");

    try {
      const data = await api.get<ScannedItemDetails>(`/inventory/item/${encodeURIComponent(cleanItemId)}`);
      const fetchedSerialNumber = typeof data.serialNumber === "string" ? data.serialNumber.trim() : "";
      const resolvedSerialNumber = fetchedSerialNumber || parsed.serialNumber;

      if (String(data.status || "").toLowerCase() !== "active") {
        setScanStage("failed");
        setRejectedScanItem({
          ...data,
          scanPayload: parsed.rawValue,
          serialNumber: resolvedSerialNumber,
          scanSerialNumber: parsed.serialNumber,
        });
        setPendingItem(null);
        setError("Only active pawned items are accepted.");
        return;
      }

      setPendingItem({
        ...data,
        scanPayload: parsed.rawValue,
        serialNumber: resolvedSerialNumber,
        scanSerialNumber: parsed.serialNumber,
      });
      setScanStage("matched");
    } catch (scanError) {
      setScanStage("failed");
      setError(scanError instanceof Error ? scanError.message : "Item not found in system.");
    } finally {
      setIsLoading(false);
      window.setTimeout(() => {
        scanLockRef.current = false;
      }, 700);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || showCompletionConfirm) {
      clearCameraLoop();
      setCameraState("loading");
      setCameraMessage("Preparing the camera...");
      setScanStage("aligning");
      setSelectedVerifiedItem(null);
      setRejectedScanItem(null);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setCameraState("loading");
      setCameraMessage("Requesting camera access...");

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraState("unsupported");
          setCameraMessage("This browser cannot open a camera feed. Use manual item entry below.");
          return;
        }

        if (!videoRef.current) {
          setCameraState("error");
          setCameraMessage("Camera preview is not ready.");
          return;
        }

        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;
        setCameraState("ready");
        setCameraMessage("Point the QR code inside the frame and hold it steady.");

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
            },
          },
          videoRef.current,
          (result: ZXingDecodeResult | undefined, error: unknown) => {
            if (cancelled) {
              return;
            }

            if (result) {
              const rawValue = result.getText().trim();

              if (!rawValue || rawValue === lastDecodedRawRef.current) {
                return;
              }

              lastDecodedRawRef.current = rawValue;
              void loadItemFromScan(rawValue);
              return;
            }

            if (error instanceof Error && error.name !== "NotFoundException") {
              setCameraMessage(getCameraErrorMessage(error));
            }
          },
        );

        controlsRef.current = controls;
      } catch (cameraError) {
        setCameraState("error");
        setCameraMessage(getCameraErrorMessage(cameraError));
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      clearCameraLoop();
    };
  }, [clearCameraLoop, isOpen, loadItemFromScan, showCompletionConfirm]);

  const handleManualScan = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const value = currentScan.trim();

      if (!value) {
        return;
      }

      await loadItemFromScan(value);
    },
    [currentScan, loadItemFromScan],
  );

  const verifyItem = useCallback(() => {
    if (!pendingItem) {
      return;
    }

    setScannedItems((previous) => [pendingItem, ...previous]);
    resetPendingState();
    holdScanCooldown();
    setSelectedVerifiedItem(null);
  }, [holdScanCooldown, pendingItem, resetPendingState]);

  const handleConfirmCompletion = useCallback(() => {
    if (persistenceKey) {
      window.localStorage.removeItem(persistenceKey);
    }

    setHasLoadedPersistedState(false);
    setScannedItems([]);
    setPendingItem(null);
    setDetectedScan(null);
    setCurrentScan("");
    onConfirm();
  }, [onConfirm, persistenceKey]);

  const discardPendingItem = useCallback(() => {
    resetPendingState();
    holdScanCooldown();
    setCameraMessage("Ready for the next QR code.");
  }, [holdScanCooldown, resetPendingState]);

  const branchReady = branchId && branchId !== "__all__";

  useEffect(() => {
    if (!isOpen || showCompletionConfirm) {
      return;
    }

    if (!branchReady) {
      setTally(null);
      setTallyError("Select a single branch before completing the checklist.");
      return;
    }

    let cancelled = false;

    const refreshTally = async () => {
      setIsCheckingTally(true);
      setTallyError("");

      try {
        const normalizedScannedIds = Array.from(
          new Set(
            scannedItems
              .map((item) => String(item.itemId || "").trim().toUpperCase())
              .filter((v) => v.length > 0),
          ),
        );

        const data = await api.post<InventoryTally>("/inventory/pawned/qr-tally", {
          branch_id: branchId,
          scanned_item_ids: normalizedScannedIds,
        });

        if (!cancelled) {
          setTally(data);
        }
      } catch (tallyException) {
        if (!cancelled) {
          setTally(null);
          setTallyError(
            tallyException instanceof Error
              ? tallyException.message
              : "Unable to refresh verification checklist.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsCheckingTally(false);
        }
      }
    };

    void refreshTally();

    return () => {
      cancelled = true;
    };
  }, [branchId, branchReady, isOpen, scannedItems, showCompletionConfirm]);

  const canComplete = Boolean(
    tally &&
      (tally.totalInSystem === 0 ||
        (tally.totalInSystem > 0 &&
          tally.missingInVault.length === 0 &&
          tally.extraInVault.length === 0)),
  );

  const completionLabel = tally
    ? `${tally.matched}/${tally.totalInSystem} verified`
    : "0 verified";

  if (!isOpen) return null;

  if (showCompletionConfirm) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-xl">
        <div className="relative w-full max-w-sm scale-in-center rounded-3xl border border-emerald-500/20 bg-surface p-8 text-center shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label="Close inventory audit modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-black text-text-primary">Audit Complete!</h2>
          <p className="mb-8 text-sm text-text-tertiary">
            You have successfully verified {scannedItems.length} items. All branch inventory items are accounted for.
          </p>
          <button
            onClick={handleConfirmCompletion}
            className="w-full rounded-2xl bg-emerald-700 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-700/20 transition-all hover:bg-emerald-800 hover:scale-[1.02] active:scale-95"
          >
            Finish & Open Dashboard
          </button>
        </div>
      </div>
    );
  }

  const cameraStatusLabel =
    cameraState === "ready"
      ? "Camera live"
      : cameraState === "loading"
        ? "Starting camera"
        : cameraState === "unsupported"
          ? "Manual mode"
          : "Camera issue";

  const scanStageLabel =
    scanStage === "aligning"
      ? "Aligning frame"
      : scanStage === "scanning"
        ? "Scanning item"
        : scanStage === "matched"
          ? "Item matched"
          : scanStage === "duplicate"
            ? "Already verified"
            : "Scan failed";

  const scanStageTone =
    scanStage === "aligning"
      ? "text-emerald-200 border-emerald-300/30 bg-emerald-400/10"
      : scanStage === "scanning"
        ? "text-amber-100 border-amber-300/30 bg-amber-400/10"
        : scanStage === "matched"
          ? "text-emerald-100 border-emerald-300/30 bg-emerald-400/10"
          : "text-rose-100 border-rose-300/30 bg-rose-400/10";

  const tallySummary = tally
    ? `${tally.matched} of ${tally.totalInSystem} items verified`
    : branchReady
      ? "Checklist syncing"
      : "Select one branch to sync the checklist";

  const activeCompletionBlocked = !canComplete || !branchReady || isCheckingTally;

  const activeItem = pendingItem ?? null;
  const ownerPhoto = activeItem?.ownerIdPhoto || activeItem?.originalPhoto || "";
  const isEmbeddedMode = displayMode === "embedded";
  const isPageMode = displayMode === "page";
  const isImmersiveMode = isPageMode || isEmbeddedMode;
  const immersiveLightMode = isImmersiveMode && !isDark;
  const cameraFields = [
    { label: "Item ID", value: activeItem?.itemId || detectedScan?.itemId || "N/A" },
    { label: "Item Name", value: activeItem?.itemName || detectedScan?.itemName || "N/A" },
    { label: "Serial Number", value: activeItem?.serialNumber || activeItem?.scanSerialNumber || detectedScan?.serialNumber || "N/A" },
    { label: "Category", value: activeItem?.category || "N/A" },
    { label: "Amount", value: formatCurrency(activeItem?.amount) },
    { label: "Branch", value: activeItem?.branch || "N/A" },
    { label: "Pawn Date", value: activeItem?.pawnDate || "N/A" },
    { label: "Status", value: activeItem?.status || "N/A" },
  ];

  const resolvedScanSerial = activeItem?.serialNumber || activeItem?.scanSerialNumber || detectedScan?.serialNumber || "N/A";

  return (
    <div className={isPageMode ? (isDark ? "relative flex min-h-[100svh] w-full items-stretch justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_40%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-3 py-3 text-white lg:px-6 lg:py-6" : "relative flex min-h-[100svh] w-full items-stretch justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-3 py-3 text-slate-900 lg:px-6 lg:py-6") : isEmbeddedMode ? (isDark ? "relative flex h-full min-h-0 w-full items-stretch justify-center overflow-hidden bg-slate-950 text-white" : "relative flex h-full min-h-0 w-full items-stretch justify-center overflow-hidden bg-stone-50 text-slate-900") : "fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-3 py-3 backdrop-blur-xl lg:px-6 lg:py-6"}>
      <div className={isPageMode || isEmbeddedMode ? (isDark ? "relative flex h-full min-h-0 w-full max-w-none overflow-hidden rounded-none border-0 bg-slate-950 shadow-none" : "relative flex h-full min-h-0 w-full max-w-none overflow-hidden rounded-none border-0 bg-white shadow-none") : "relative h-[88vh] w-full max-w-[1440px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface shadow-2xl"}>
        {!isImmersiveMode && (
          <button
            type="button"
            onClick={onClose}
            className={isDark ? "absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white transition-colors hover:bg-black/55" : "absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50"}
            aria-label="Close inventory audit modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
        <div className={isImmersiveMode ? "mx-auto grid h-full min-h-0 w-full max-w-[1280px] lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,.92fr)]" : "grid h-full min-h-0 lg:grid-cols-[1.25fr_.88fr]"}>
          <section className={isImmersiveMode ? (isDark ? "relative flex min-h-0 flex-col overflow-hidden border-b border-white/10 bg-slate-950 p-4 text-white lg:border-b-0 lg:border-r lg:p-5" : "relative flex min-h-0 flex-col overflow-hidden border-b border-slate-200 bg-white p-4 text-slate-900 lg:border-b-0 lg:border-r lg:p-5") : "relative flex min-h-0 flex-col overflow-hidden bg-white p-4 text-zinc-900 lg:p-6"}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={isImmersiveMode ? (isDark ? "text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300/70" : "text-[10px] font-black uppercase tracking-[0.4em] text-emerald-700/70") : "text-[10px] font-black uppercase tracking-[0.4em] text-emerald-700/70"}>Opening Workflow</p>
                <h2 className={isImmersiveMode ? (isDark ? "mt-2 text-2xl font-black leading-tight text-white lg:text-[1.9rem]" : "mt-2 text-2xl font-black leading-tight text-slate-950 lg:text-[1.9rem]") : "mt-2 text-2xl font-black leading-tight lg:text-3xl"}>Inventory QR Scan</h2>
                <p className={isImmersiveMode ? (isDark ? "mt-2 max-w-xl text-xs leading-5 text-slate-300/80 lg:text-sm" : "mt-2 max-w-xl text-xs leading-5 text-slate-500 lg:text-sm") : "mt-2 max-w-xl text-xs leading-5 text-zinc-600 lg:text-sm"}>
                  The camera opens automatically so you can scan each pawned item QR code before starting the day.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-nowrap">
                <div className={isImmersiveMode ? (isDark ? "rounded-full border border-emerald-200/30 bg-white/10 px-3 py-2 text-[10px] font-bold text-emerald-100 shadow-sm lg:px-4 lg:text-xs whitespace-nowrap" : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700 shadow-sm lg:px-4 lg:text-xs whitespace-nowrap") : "rounded-full border border-emerald-200 bg-white px-3 py-2 text-[10px] font-bold text-emerald-700 shadow-sm lg:px-4 lg:text-xs whitespace-nowrap"}>
                  {scannedItems.length} Verified
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={isImmersiveMode ? (isDark ? "h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10" : "h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50") : "h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50"}
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                >
                  {isDark ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="M4.93 4.93l1.41 1.41" />
                      <path d="M17.66 17.66l1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="M4.93 19.07l1.41-1.41" />
                      <path d="M17.66 6.34l1.41-1.41" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                  <span className="sr-only">{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
                </button>
              </div>
            </div>

            <div className={isImmersiveMode ? (isDark ? "mt-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300 lg:mt-5 lg:text-xs" : "mt-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 lg:mt-5 lg:text-xs") : "mt-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 lg:mt-5 lg:text-xs"}>
              <span
                className={`h-2.5 w-2.5 rounded-full ${cameraState === "ready" ? "bg-emerald-500 animate-pulse" : cameraState === "loading" ? "bg-amber-400 animate-pulse" : cameraState === "unsupported" ? "bg-sky-400" : "bg-rose-400"}`}
              />
              <span>{cameraStatusLabel}</span>
            </div>

            <div className={isImmersiveMode ? (isDark ? "relative mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/90 shadow-[0_24px_70px_rgba(2,6,23,0.35)] lg:mt-5" : "relative mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:mt-5") : "relative mt-4 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-zinc-50 shadow-[0_24px_70px_rgba(15,23,42,0.05)] lg:mt-5"}>
              <div className={isImmersiveMode ? "relative aspect-[15/10] w-full lg:aspect-[16/9]" : "relative aspect-[16/10] w-full lg:aspect-[16/9]"}>
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay playsInline muted />
                <div className={isImmersiveMode ? (isDark ? "absolute inset-0 bg-slate-950/25" : "absolute inset-0 bg-white/30") : "absolute inset-0 bg-black/8"} />

                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className={`animate-scan-glow relative aspect-square w-[min(74%,22rem)] rounded-[1.5rem] border bg-transparent shadow-[0_0_0_9999px_${isImmersiveMode ? (isDark ? "rgba(2,6,23,0.42)" : "rgba(255,255,255,0.56)") : "rgba(255,255,255,0.08)"}] ${scanStage === "failed" ? isImmersiveMode ? "border-rose-400/90" : "border-rose-300/80" : scanStage === "duplicate" ? isImmersiveMode ? "border-amber-300/90" : "border-amber-300/80" : "border-emerald-300/90"}`}>
                    <span className={`absolute left-0 top-0 h-8 w-8 -translate-x-1 -translate-y-1 rounded-tl-[1.5rem] border-l-2 border-t-2 ${scanStage === "failed" ? "border-rose-300" : scanStage === "duplicate" ? "border-amber-300" : "border-emerald-300"}`} />
                    <span className={`absolute right-0 top-0 h-8 w-8 translate-x-1 -translate-y-1 rounded-tr-[1.5rem] border-r-2 border-t-2 ${scanStage === "failed" ? "border-rose-300" : scanStage === "duplicate" ? "border-amber-300" : "border-emerald-300"}`} />
                    <span className={`absolute bottom-0 left-0 h-8 w-8 -translate-x-1 translate-y-1 rounded-bl-[1.5rem] border-b-2 border-l-2 ${scanStage === "failed" ? "border-rose-300" : scanStage === "duplicate" ? "border-amber-300" : "border-emerald-300"}`} />
                    <span className={`absolute bottom-0 right-0 h-8 w-8 translate-x-1 translate-y-1 rounded-br-[1.5rem] border-b-2 border-r-2 ${scanStage === "failed" ? "border-rose-300" : scanStage === "duplicate" ? "border-amber-300" : "border-emerald-300"}`} />

                    {(cameraState === "ready" || cameraState === "loading") && (
                      <span
                        className={`animate-scan-line absolute left-[12%] right-[12%] top-0 h-0.5 rounded-full ${scanStage === "failed" ? "bg-rose-300" : scanStage === "duplicate" ? "bg-amber-300" : "bg-emerald-300"}`}
                      />
                    )}

                    <div className={isImmersiveMode ? (isDark ? "absolute inset-x-6 top-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-white/65" : "absolute inset-x-6 top-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500") : "absolute inset-x-6 top-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-950/55"}>
                      <span>QR Scan Window</span>
                      <span>{scanStageLabel}</span>
                    </div>

                    {tally && tally.totalInSystem === 0 && !isCheckingTally && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 p-8 text-center animate-in fade-in duration-500">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <h4 className={isImmersiveMode ? (isDark ? "text-lg font-black tracking-tight text-slate-950 uppercase" : "text-lg font-black tracking-tight text-slate-900 uppercase") : "text-lg font-black tracking-tight text-zinc-900 uppercase"}>Empty Inventory</h4>
                        <p className={isImmersiveMode ? (isDark ? "mt-2 max-w-xs text-xs font-semibold leading-relaxed text-slate-600" : "mt-2 max-w-xs text-xs font-semibold leading-relaxed text-slate-500") : "mt-2 max-w-xs text-xs font-semibold leading-relaxed text-zinc-600"}>
                          No active pawned items found for this branch. You can complete the audit immediately.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4">
                  <div className={isImmersiveMode ? (isDark ? "mx-auto max-w-lg px-1 text-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" : "mx-auto max-w-lg px-1 text-center text-slate-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.55)]") : "mx-auto max-w-lg px-1 text-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"}>
                    <p className="text-sm font-bold">{cameraMessage}</p>
                    <p className={isImmersiveMode ? (isDark ? "mt-1 text-[10px] uppercase tracking-[0.28em] text-white/60" : "mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-500") : "mt-1 text-[10px] uppercase tracking-[0.28em] text-white/60"}>
                      Keep the QR code inside the frame until the item card appears.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={isImmersiveMode ? (isDark ? "mt-3 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/80 p-3 shadow-sm scrollbar-hide lg:p-4" : "mt-3 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-sm scrollbar-hide lg:p-4") : "mt-4 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-zinc-100 bg-zinc-50 p-4 shadow-sm scrollbar-hide"}>
              {(pendingItem || detectedScan) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-700/70">Pawned Item Details</p>
                      <h3 className="mt-1 text-sm font-black text-zinc-900">Key fields from the verified item record</h3>
                    </div>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                      {activeItem ? "Fetched" : "Decoded"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {cameraFields.map((field) => (
                      <div key={field.label} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">{field.label}</p>
                        <p className="mt-2 break-words text-sm font-bold text-zinc-900">{field.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">QR Payload</p>
                    <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-[12px] font-semibold leading-5 text-zinc-700">
                      {activeItem?.scanPayload || detectedScan?.rawValue || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {!pendingItem && !detectedScan && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-zinc-500">
                  <p className="text-sm font-bold text-zinc-700">Waiting for QR input</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-zinc-400">The decoded payload will appear here after scanning</p>
                </div>
              )}
            </div>
          </section>

          <aside className={isImmersiveMode ? (isDark ? "flex h-full min-h-0 flex-col overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900 p-4 scrollbar-hide lg:p-6" : "flex h-full min-h-0 flex-col overflow-y-auto bg-gradient-to-b from-white to-zinc-50 p-4 scrollbar-hide lg:p-6") : "flex h-full min-h-0 flex-col overflow-y-auto bg-gradient-to-b from-white to-zinc-50 p-4 scrollbar-hide lg:p-6"}>
            <div className={isImmersiveMode ? (isDark ? "rounded-3xl border border-white/10 bg-slate-900/85 p-4 shadow-sm lg:p-5" : "rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:p-5") : "rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:p-5"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Manual fallback</p>
                  <h3 className="mt-1 text-lg font-black text-zinc-900 lg:text-xl">Scan or type an item code</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-500 lg:text-sm">
                    The QR payload is parsed automatically. If needed, paste the code value from the QR data string.
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 whitespace-nowrap">
                  Auto scan first
                </div>
              </div>

              <form onSubmit={handleManualScan} className="mt-4">
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Code: 10-jclb-11543 | Item: oppo a94 | Serial: ..."
                    value={currentScan}
                    onChange={(event) => setCurrentScan(event.target.value)}
                    disabled={isLoading}
                    className={`w-full rounded-2xl border-2 ${error ? "border-rose-500 bg-rose-50/50" : "border-emerald-200 bg-white"} py-4 pl-12 pr-32 text-sm font-bold text-zinc-900 outline-none transition-all focus:border-emerald-500`}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !currentScan.trim()}
                    className={isDark ? "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-black disabled:opacity-50" : "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-800 disabled:opacity-50"}
                  >
                    {isLoading ? "Scanning..." : "Scan Item"}
                  </button>
                </div>
                {error && <p className="mt-2 text-[10px] font-bold italic text-rose-600">{error}</p>}
              </form>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm lg:mt-5 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Checklist progress</p>
                  <h4 className="mt-1 text-base font-black text-zinc-900 lg:text-lg">{completionLabel}</h4>
                </div>
                <StatusBadge label={cameraStatusLabel} variant={statusVariant[pendingItem?.status || ""] || "blue"} />
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-600">
                  <span>{tallySummary}</span>
                  <span>{isCheckingTally ? "Syncing" : canComplete ? "Ready" : "Locked"}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{
                      width:
                        tally && tally.totalInSystem > 0
                          ? `${Math.min(100, Math.round((tally.matched / tally.totalInSystem) * 100))}%`
                          : "0%",
                    }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <div className="rounded-xl bg-zinc-50 p-3 text-center">
                    <div className="text-sm font-black text-zinc-900">{scannedItems.length}</div>
                    Verified
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3 text-center">
                    <div className="text-sm font-black text-zinc-900">{tally?.totalInSystem ?? "-"}</div>
                    In branch
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3 text-center">
                    <div className="text-sm font-black text-zinc-900">{tally?.missingInVault?.length ?? "-"}</div>
                    Missing
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Missing items</p>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      {tally?.missingItems?.length ?? 0} not yet scanned
                    </span>
                  </div>
                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
                    {tally?.missingItems?.length ? (
                      tally.missingItems.map((item) => (
                        <div key={item.itemId} className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                          <p className="text-sm font-black text-zinc-900">{item.itemName}</p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            {item.category}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-3 py-4 text-center">
                        <p className="text-xs font-bold text-zinc-600">No missing items</p>
                      </div>
                    )}
                  </div>
                </div>
                {tallyError && <p className="mt-3 text-xs font-semibold text-rose-600">{tallyError}</p>}
              </div>

              {pendingItem ? (
                <div className="mt-4 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-2 shadow-sm">
                      {ownerPhoto && !pendingPhotoBroken ? (
                        <Image
                          src={ownerPhoto}
                          alt={pendingItem.customerName || pendingItem.itemName}
                          width={80}
                          height={112}
                          unoptimized
                          className="h-full w-full rounded-xl object-cover object-center"
                          onError={() => setPendingPhotoBroken(true)}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-zinc-300">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <p className="mt-1 text-[10px] font-bold uppercase text-zinc-400">No ID Photo</p>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Owner / Customer</p>
                      <h3 className="mt-1 break-words text-lg font-black text-zinc-900">{pendingItem.customerName || "Unknown owner"}</h3>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">ID Type:</p>
                          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                            {pendingItem.customerIdPresented || "ID not captured"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Address:</p>
                          <p className="mt-0.5 text-xs leading-5 text-zinc-600">
                            {pendingItem.customerAddress || "Customer address unavailable."}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Contact Number:</p>
                          <p className="mt-0.5 text-xs font-semibold text-zinc-600">
                            {pendingItem.customerContact || "No contact number"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Serial number</p>
                    <p className="mt-2 break-words text-sm font-bold text-zinc-900">{resolvedScanSerial}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={discardPendingItem}
                      className="flex-1 rounded-2xl border border-zinc-200 bg-white py-3 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95"
                    >
                      Rescan
                    </button>
                    <button
                      onClick={verifyItem}
                      className="flex-1 rounded-2xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95"
                    >
                      Verify Item
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-white text-zinc-300">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">Waiting for a QR code</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-zinc-400">Align the item QR inside the camera frame</p>
                </div>
              )}
            </div>

            <div className={isImmersiveMode ? "mt-4 flex min-h-[20rem] flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm" : "mt-5 flex min-h-[24rem] flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm"}>
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Verified items</p>
                  <h4 className="mt-1 text-lg font-black text-zinc-900">{scannedItems.length} accounted for</h4>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  {scannedItems.length} scanned
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-hide">
                {scannedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-zinc-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
                      <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <p className="mt-3 text-sm font-bold text-zinc-700">No items verified yet</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em]">The list will populate after the first successful scan</p>
                  </div>
                ) : (
                  scannedItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedVerifiedItem(item)}
                      className="flex w-full items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/60 text-xs font-black text-emerald-700">
                          {scannedItems.length - index}
                        </span>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{item.itemId}</p>
                          <p className="text-[10px] font-medium text-zinc-500">{item.itemName}</p>
                        </div>
                      </div>
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-emerald-700"
                        aria-hidden="true"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={isImmersiveMode ? "mt-4 shrink-0 rounded-3xl border border-zinc-100 bg-zinc-50 p-4" : "mt-5 shrink-0 rounded-3xl border border-zinc-100 bg-zinc-50 p-5"}>
              <div className="flex items-start gap-3 text-amber-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-xs font-bold leading-relaxed text-zinc-700">
                  Access to inventory tools stays locked until this scan is submitted and confirmed.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!activeCompletionBlocked) {
                    setShowCompletionConfirm(true);
                  }
                }}
                disabled={activeCompletionBlocked}
                className={isDark ? "mt-4 w-full rounded-2xl bg-zinc-900 py-4 text-sm font-black text-white shadow-2xl transition-all hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" : "mt-4 w-full rounded-2xl bg-emerald-700 py-4 text-sm font-black text-white shadow-2xl transition-all hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"}
              >
                Complete Inventory Count
              </button>
              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                {activeCompletionBlocked ? "Verify every branch item before finishing." : "All items verified. You can complete the checklist."}
              </p>
            </div>
          </aside>
        </div>

        {selectedVerifiedItem && (() => {
          const itemPhotos = Array.from(new Set([
            ...(selectedVerifiedItem.itemPhotos ?? selectedVerifiedItem.item_photos ?? []),
          ].filter((photo): photo is string => Boolean(photo))));

          return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-xl">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[1.75rem] border border-white/10 bg-surface p-5 shadow-2xl lg:p-6">
              <button
                type="button"
                aria-label="Close item details"
                onClick={() => setSelectedVerifiedItem(null)}
                className="absolute right-4 top-4 rounded-full border border-zinc-200 bg-white p-2 text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900 z-10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="pr-10">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Verified item details</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-900">{selectedVerifiedItem.itemId}</h3>
                <p className="mt-1 text-sm font-semibold text-zinc-500">{selectedVerifiedItem.itemName}</p>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm h-full flex flex-col">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Owner / Customer</p>
                    <h4 className="mt-1 break-words text-lg font-black text-zinc-900">{selectedVerifiedItem.customerName || "Unknown owner"}</h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">ID Type</p>
                      <p className="mt-2 text-sm font-black text-zinc-900 uppercase">{selectedVerifiedItem.customerIdPresented || "None"}</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Contact Number</p>
                      <p className="mt-2 text-sm font-black text-zinc-900">{selectedVerifiedItem.customerContact || "—"}</p>
                    </div>
                  </div>
                  <div className="flex-1 rounded-2xl bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Address</p>
                    <p className="mt-2 text-sm font-black text-zinc-900 leading-relaxed">{selectedVerifiedItem.customerAddress || "No address on file."}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Amount</p>
                    <p className="mt-2 text-sm font-black text-zinc-900">{formatCurrency(selectedVerifiedItem.amount)}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Serial</p>
                    <p className="mt-2 break-words text-sm font-black text-zinc-900">{selectedVerifiedItem.serialNumber || selectedVerifiedItem.scanSerialNumber || detectedScan?.serialNumber || "N/A"}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Branch</p>
                      <p className="mt-2 text-sm font-black text-zinc-900">{selectedVerifiedItem.branch || "N/A"}</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Pawn date</p>
                      <p className="mt-2 text-sm font-black text-zinc-900">{selectedVerifiedItem.pawnDate || "N/A"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Status</p>
                    <p className="mt-2 text-sm font-black text-zinc-900">{selectedVerifiedItem.status || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm h-full flex flex-col">
                  <div className="flex-1 flex flex-col justify-center w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-4 text-center">Customer Image</p>
                    <div className="relative aspect-square w-full max-w-[240px] mx-auto overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
                      {((selectedVerifiedItem.ownerIdPhoto || selectedVerifiedItem.originalPhoto) && !verifiedPhotoBroken) ? (
                        <Image
                          src={selectedVerifiedItem.ownerIdPhoto || selectedVerifiedItem.originalPhoto || ""}
                          alt={selectedVerifiedItem.customerName || selectedVerifiedItem.itemName}
                          fill
                          unoptimized
                          className="object-cover object-center"
                          onError={() => setVerifiedPhotoBroken(true)}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-zinc-300 gap-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm h-full flex flex-col">
                  <div className="flex-1 flex flex-col justify-center w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-4 text-center">Item Visuals</p>
                    <div className="relative aspect-square w-full max-w-[240px] mx-auto overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
                      {itemPhotos.length > 0 ? (
                        <>
                          <div
                            className="flex h-full w-full transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${verifiedItemPhotoIndex * 100}%)` }}
                          >
                            {itemPhotos.map((photo, index) => (
                              <div key={index} className="relative h-full w-full shrink-0">
                                <Image
                                  src={photo}
                                  alt={`${selectedVerifiedItem.itemName} photo ${index + 1}`}
                                  fill
                                  unoptimized
                                  className="object-cover object-center"
                                />
                              </div>
                            ))}
                          </div>
                          {itemPhotos.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVerifiedItemPhotoIndex((prev) => (prev - 1 + itemPhotos.length) % itemPhotos.length);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-sm font-black text-white backdrop-blur transition hover:bg-black/60"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVerifiedItemPhotoIndex((prev) => (prev + 1) % itemPhotos.length);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-sm font-black text-white backdrop-blur transition hover:bg-black/60"
                              >
                                ›
                              </button>
                              <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
                                {itemPhotos.map((_, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVerifiedItemPhotoIndex(index);
                                    }}
                                    className={`h-1.5 rounded-full transition-all ${index === verifiedItemPhotoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-zinc-300 gap-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">No Visuals</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {rejectedScanItem && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4 py-4 backdrop-blur-xl">
            <div className="w-full max-w-md rounded-[1.75rem] border border-rose-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-400">Scan rejected</p>
                  <h3 className="mt-1 text-xl font-black text-zinc-900">Only active pawned items are accepted</h3>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-bold text-zinc-900">{rejectedScanItem.itemName || rejectedScanItem.itemId}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {rejectedScanItem.category || "Uncategorized"}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-600">
                This item is marked <span className="font-black text-rose-600">{rejectedScanItem.status}</span>. Rescan a current active pawned item to continue.
              </p>

              <button
                type="button"
                onClick={closeRejectedScan}
                className={isDark ? "mt-6 w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-black text-white transition-all hover:bg-black active:scale-95" : "mt-6 w-full rounded-2xl bg-emerald-700 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-800 active:scale-95"}
              >
                Close and Rescan
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
