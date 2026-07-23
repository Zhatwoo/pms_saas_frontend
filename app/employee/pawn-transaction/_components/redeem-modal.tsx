"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { calculateGadgetInterest } from "@/lib/interest";
import { getContractInterestRateGroup } from "@/lib/pawn-transaction-mapper";
import { getTransactionDateTimeFields } from "@/lib/time";
import { formatPeso } from "@/lib/currency";
import { QrScanner } from "@/components/shared/qr-scanner";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";
import { useAuth } from "@/contexts/auth-context";
import {
  isTransactionPasswordError,
  TRANSACTION_PASSWORD_VERIFY_MESSAGE,
  transactionPasswordErrorClass,
  transactionPasswordInputClass,
} from "@/lib/transaction-password";

/* ── Inline SVG Icon Components (replacing lucide-react) ── */
function X({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
}
function Search({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
}
function ArrowRight({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
}
function Package({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
}
function ShieldCheck({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>);
}
function Smartphone({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>);
}
function Undo2({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 015.5 5.5v0a5.5 5.5 0 01-5.5 5.5H11"/></svg>);
}
function QrCode({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><path d="M14 14h3v3h-3z"/></svg>);
}
function Menu({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function AlertCircle({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
}

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  onSuccess?: () => void;
  compactTablet?: boolean;
}

interface PawnedSearchItem {
  id: string;
  name: string;
  unitCode: string;
  unit: string;
  serialNumber: string;
  itemsIncluded: string;
  condition: string;
  memory: string;
  qrCode: string;
  category: string;
  purchasedDate: string;
  amount: string;
  storageFee: string;
  contactNumber: string;
  status: string;
  interestRateSnapshot?: unknown;
}

export function RedeemModal({ isOpen, onClose, branchId, branchName, onSuccess, compactTablet = false }: RedeemModalProps) {
  const { user } = useAuth();
  const isAdminOrSuperAdmin =
    user?.role === "admin" || user?.role === "super_admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<PawnedSearchItem | null>(null);
  const [adminForm, setAdminForm] = useState({
    processedBy: "",
    password: "",
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const isProcessingRef = useRef(false);
  const [pawnedItems, setPawnedItems] = useState<PawnedSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileItemList, setShowMobileItemList] = useState(true);
  // Proof of buy back — camera capture
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [showProofCamera, setShowProofCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const proofVideoRef = useRef<HTMLVideoElement>(null);
  const proofCanvasRef = useRef<HTMLCanvasElement>(null);
  const proofStreamRef = useRef<MediaStream | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.fullName) {
      setAdminForm(prev => ({ ...prev, processedBy: user.fullName }));
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    setShowMobileItemList(true);
    setIsCancelConfirmOpen(false);
  }, [isOpen]);

  // Clear proof image when selected item changes
  useEffect(() => {
    setProofImage(null);
    setCameraError("");
  }, [selectedItem?.id]);

  const openProofCamera = useCallback(async () => {
    setCameraError("");
    setShowProofCamera(true);
    setIsCameraStreaming(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      proofStreamRef.current = stream;
      setCameraStream(stream);
      if (proofVideoRef.current) {
        proofVideoRef.current.srcObject = stream;
        proofVideoRef.current.onloadedmetadata = () => {
          proofVideoRef.current?.play().catch(() => undefined);
          setIsCameraStreaming(true);
        };
      }
    } catch {
      setCameraError("Camera access denied or not available. Please upload an image file instead.");
    }
  }, []);

  const stopProofCamera = useCallback(() => {
    if (proofStreamRef.current) {
      proofStreamRef.current.getTracks().forEach(t => t.stop());
      proofStreamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraStreaming(false);
  }, []);

  const captureProofPhoto = useCallback(() => {
    const video = proofVideoRef.current;
    const canvas = proofCanvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setProofImage(canvas.toDataURL("image/jpeg", 0.9));
      stopProofCamera();
      setShowProofCamera(false);
    }
  }, [stopProofCamera]);

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setProofImage(ev.target.result as string);
        stopProofCamera();
        setShowProofCamera(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<{ items: any[] }>(`/inventory/pawned?status=Active&search=${searchQuery}`);
        
        // Map backend format to component format
        const mapped = (response.items || []).map(item => {
          // Handle cases where Supabase might return customers as an array
          const customerData = Array.isArray(item.customers) ? item.customers[0] : item.customers;
          
          return {
            id: item.id,
            name: customerData?.full_name || "Unknown Customer",
            unitCode: item.itemId || "---",
            unit: item.itemName || "---",
            serialNumber: item.serialNumber || "---",
            itemsIncluded: item.itemsIncluded || "---",
            condition: item.condition || "---",
            memory: item.memoryStorage || "---",
            qrCode: item.qrCode || "",
            category: item.category || "---",
            purchasedDate: item.pawnDate || item.created_at,
            amount: String(item.amount || 0),
            storageFee: "0", 
            contactNumber: customerData?.contact_number || "---",
            status: item.status,
            interestRateSnapshot: item.interestRateSnapshot ?? item.interest_rate_snapshot ?? null,
          };
        });
        
        setPawnedItems(mapped);
      } catch (err) {
        console.error("Failed to fetch pawned items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, searchQuery]);

  const handleQrScan = (text: string) => {
    // 1. Try to extract from "Code: ID | ..." format
    const codeMatch = text.match(/Code:\s*([^|]+)/i);
    if (codeMatch) {
      setSearchQuery(codeMatch[1].trim());
      return;
    }

    // 2. Try to extract from URL format: .../view-ticket/UNITCODE
    const urlMatch = text.match(/\/view-ticket\/([^/?#\s]+)/i);
    if (urlMatch) {
      setSearchQuery(urlMatch[1].trim());
      return;
    }

    // 3. Fallback to whole text
    setSearchQuery(text.trim());
  };

  const interestCalc = useMemo(() => {
    if (!selectedItem) return { percentage: 0, interestAmount: 0, totalAmount: 0, daysPassed: 0 };
    const contractRate = getContractInterestRateGroup(
      selectedItem.category,
      selectedItem.interestRateSnapshot,
    );
    return calculateGadgetInterest(
      Number(selectedItem.amount),
      selectedItem.purchasedDate,
      selectedItem.category,
      contractRate ?? undefined,
    );
  }, [selectedItem]);

  const handleConfirmRedeemRequest = () => {
    if (!selectedItem) return;
    setError(null);

    if (!adminForm.password) {
      setError(TRANSACTION_PASSWORD_VERIFY_MESSAGE);
      return;
    }

    if (!proofImage) {
      setError("A proof of buy out photo is required before confirming.");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (isProcessingRef.current) return;
    if (!selectedItem) return;
    setError(null);

    if (!adminForm.password) {
      setError(TRANSACTION_PASSWORD_VERIFY_MESSAGE);
      return;
    }

    if (!proofImage) {
      setError("A proof of buy out photo is required before confirming.");
      return;
    }

    isProcessingRef.current = true;
    setIsConfirming(true);
    try {
      // 1. Verify Password
      await api.post("/auth/verify-password", { password: adminForm.password });

      // 2. Upload buyback proof image to Supabase
      console.log('[REDEEM MODAL] Uploading buyback proof...');
      const { uploadBuybackProof } = await import("@/lib/fund-transfer-storage");
      
      // Convert base64 data URL to File object (without fetch to avoid CSP issues)
      const base64Data = proofImage.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const proofFile = new File([blob], `buyback_proof_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const buybackProofUrl = await uploadBuybackProof({
        file: proofFile,
        transactionNo: `BU-${Date.now()}`, // Generate transaction number
        branchId: branchId
      });
      
      console.log('[REDEEM MODAL] Proof uploaded successfully:', buybackProofUrl);

      // 3. Process Buy Out (full settlement) with buyback_proof URL
      await api.post("/transactions", {
        ...getTransactionDateTimeFields(),
        purpose: "Buy Out",
        branch_id: branchId,
        branch: branchName,
        cash_in: interestCalc.totalAmount,
        cash_out: 0,
        unit: selectedItem.unit,
        unit_code: selectedItem.unitCode,
        pawn_amount: Number(selectedItem.amount),
        storage_fee: interestCalc.interestAmount,
        details: `Bought out by ${selectedItem.name} | Days: ${interestCalc.daysPassed} | Processed by: ${adminForm.processedBy || 'Admin'}`,
        related_pawned_item_id: selectedItem.id,
        buyback_proof: buybackProofUrl
      });

      await api.patch(`/inventory/pawned/${selectedItem.id}`, { status: 'Redeemed' });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
      toast.success("Item bought out successfully!");
      setIsConfirmOpen(false);
    } catch (err: any) {
      const msg = err.message || "Failed to process transaction.";
      setError(msg);
      toast.error(msg);
      setIsConfirmOpen(false);
    } finally {
      setIsConfirming(false);
      isProcessingRef.current = false;
    }
  };

  if (!isOpen) return null;

  const passwordFieldError = isTransactionPasswordError(error) ? error : null;
  const proofFieldError = error && !passwordFieldError ? error : null;
  const hideMobileSidebar = Boolean(selectedItem && !showMobileItemList);

  const handleSelectItem = (item: PawnedSearchItem) => {
    setSelectedItem(item);
    setShowMobileItemList(false);
  };

  const handleOpenMobileItemList = () => {
    setShowMobileItemList(true);
  };

  const handleRequestClose = () => {
    if (isConfirming) return;
    setIsCancelConfirmOpen(true);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-brand-green/40 backdrop-blur-md transition-opacity no-print" onClick={handleRequestClose} />
      <div
        className={`relative z-10 flex h-[calc(100dvh-2rem)] max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-green/20 animate-in fade-in zoom-in-95 duration-300 dark:bg-background sm:h-[calc(100dvh-3rem)] ${compactTablet ? "md:h-[calc(100dvh-4rem)] md:max-w-6xl lg:h-[88vh] xl:max-w-7xl" : "lg:h-[90vh]"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative z-10 shrink-0 bg-gradient-to-r from-brand-green via-brand-green to-brand-green px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-green/50 bg-brand-green text-pawn-gold shadow-inner sm:h-12 sm:w-12">
                <Undo2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-pawn-gold/90 sm:text-[10px] sm:tracking-[0.28em] dark:text-pawn-gold">
                  {branchName} | Active Pawn
                </p>
                <h1 className="mt-1 text-lg font-black leading-none tracking-tight text-white sm:text-2xl">
                  Buy Out Pawn Ticket
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleRequestClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-brand-green transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
                aria-label="Close Buy Out Pawn Ticket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
          {/* Left Side: Search & Selection */}
          <div
            className={`w-full shrink-0 flex-col border-b border-brand-green/20 bg-brand-green/5 dark:border-border dark:bg-surface-secondary xl:flex xl:w-[min(400px,36%)] xl:border-b-0 xl:border-r ${
              hideMobileSidebar ? "hidden" : "flex min-h-0 flex-1"
            }`}
          >
            <div className="space-y-4 p-4 sm:p-5 xl:p-6">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-green/70 dark:text-pawn-gold">Search Active Pawn</h3>
              </div>

              <div className="group relative">
                <input
                  type="text"
                  placeholder="Name, Unit Code, Serial..."
                  className="h-11 w-full rounded-xl border-2 border-brand-green/20 bg-white px-4 pl-12 text-sm font-medium text-text-primary shadow-sm outline-none transition-all focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white dark:placeholder:text-zinc-500 sm:h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-green/40 transition-colors group-focus-within:text-brand-green dark:text-pawn-gold" />
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/10 text-brand-green transition-all hover:bg-brand-green/20 active:scale-95 dark:border-border-subtle dark:bg-surface dark:text-pawn-gold dark:hover:bg-surface-hover"
                  title="Scan QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:pb-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-8 h-8 border-4 border-brand-green/20 dark:border-border0 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-bold uppercase text-brand-green/70 dark:text-pawn-gold">Linking to Database...</p>
                </div>
              ) : pawnedItems.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-green/20 bg-white p-6 text-center shadow-sm dark:border-border-subtle dark:bg-surface">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 dark:bg-brand-green/20">
                    <Package className="h-6 w-6 text-brand-green/40 dark:text-brand-green" />
                  </div>
                  <p className="text-sm font-bold text-brand-green/70 dark:text-zinc-200">No active pawns found</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-brand-green/45 dark:text-zinc-400">Only Active items can be bought out</p>
                </div>
              ) : (
                pawnedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`group relative mb-3 flex w-full flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-brand-green/40 bg-brand-green/10 shadow-xl shadow-brand-green/5 ring-4 ring-brand-green/5 dark:bg-brand-green/20'
                        : 'border-transparent bg-white hover:border-brand-green/20 hover:bg-brand-green/10 hover:shadow-lg dark:bg-surface/40 dark:hover:border-brand-green/30 dark:hover:bg-brand-green/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green dark:text-pawn-gold">{item.unitCode}</p>
                      <span className="bg-brand-green text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-brand-green/20">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-black text-brand-green dark:text-white leading-tight pr-8">{item.unit}</h4>
                    <div className="mt-2 flex items-center justify-between border-t border-brand-green/20 pt-2 dark:border-border-subtle">
                      <p className="text-[10px] font-bold capitalize text-brand-green/70 dark:text-zinc-300">{item.name}</p>
                      <p className="text-xs font-black text-brand-green dark:text-pawn-gold">₱ {Number(item.amount).toLocaleString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Details & Computation (desktop xl+) */}
          <div className="hidden min-h-0 flex-1 overflow-y-auto bg-white scrollbar-hide dark:bg-surface xl:block">
            {selectedItem ? (
              <div className="animate-in fade-in slide-in-from-right-4 p-4 duration-300 sm:p-6 xl:p-12">
                <div className="space-y-1 mb-8">
                  <p className="text-xs font-black text-brand-green uppercase tracking-[2px]">Redemption Preview</p>
                  <h2 className="text-4xl font-black text-brand-green dark:text-white dark:text-white tracking-tighter leading-none">
                    {selectedItem.unit}
                  </h2>
                  <p className="text-brand-green/70 dark:text-pawn-gold font-bold flex items-center gap-2">
                    {selectedItem.name} • {selectedItem.contactNumber}
                  </p>
                </div>

                <div className="mb-10 grid grid-cols-1 gap-8 xl:grid-cols-2">
                  <DetailSection title="Loan & Item Details" icon={Smartphone}>
                    <DetailRow label="Principal Amount" value={formatPeso(Number(selectedItem.amount))} />
                    <DetailRow
                      label="Maturity Interest"
                      value={<span className="text-brand-green dark:text-pawn-gold">₱ {interestCalc.interestAmount.toLocaleString()} ({interestCalc.percentage}%)</span>}
                    />
                    <DetailRow label="Purchased Date" value={selectedItem.purchasedDate} />
                    <DetailRow
                      label="Days Since Pawn"
                      value={<span className="text-brand-green dark:text-pawn-gold">{interestCalc.daysPassed} Days</span>}
                    />
                    <DetailRow label="Category" value={selectedItem.category} />
                    <DetailRow label="Unit Code" value={selectedItem.unitCode} />
                  </DetailSection>

                  <DetailSection title="Physical Specs" icon={ShieldCheck}>
                    <DetailRow label="Serial Number" value={selectedItem.serialNumber} />
                    <DetailRow label="Condition" value={selectedItem.condition} />
                    <DetailRow label="Memory" value={selectedItem.memory} />
                    <DetailRow label="Items Included" value={selectedItem.itemsIncluded} />

                    {isAdminOrSuperAdmin && (
                      <div className="mt-4 pt-4 border-t border-brand-green/20 dark:border-border font-google flex flex-col items-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Security QR Code</p>
                        {selectedItem.qrCode ? (
                          <div className="w-32 h-32 rounded-xl border border-zinc-100 p-2 bg-white dark:bg-surface flex items-center justify-center shadow-sm">
                            <img src={selectedItem.qrCode} alt="Unit QR" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center">
                            <p className="text-[8px] font-bold text-zinc-300 uppercase">No QR Generated</p>
                          </div>
                        )}
                      </div>
                    )}
                  </DetailSection>
                </div>

                {/* Computation Summary */}
                <div className="relative mb-10 overflow-hidden rounded-3xl border border-brand-green/20 bg-brand-green/10 p-6 dark:border-brand-green/30 dark:bg-brand-green/20">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-brand-green/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green/70 dark:text-pawn-gold">Computation Summary</p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase text-brand-green/65 dark:text-zinc-300">Principal</p>
                          <p className="text-xl font-black text-brand-green dark:text-white">{formatPeso(Number(selectedItem.amount))}</p>
                        </div>
                        <div className="h-8 w-px bg-brand-green/20 dark:bg-brand-green/40" />
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase text-brand-green/65 dark:text-zinc-300">Interest ({interestCalc.percentage}%)</p>
                          <p className="text-xl font-black text-brand-green dark:text-white">{formatPeso(interestCalc.interestAmount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green/70 dark:text-pawn-gold">Total Amount Due</p>
                      <p className="text-5xl font-black text-brand-green dark:text-pawn-gold tracking-tighter">
                        ₱ {interestCalc.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof of Buy Back — Camera Capture */}
                <div className="mb-8 rounded-2xl border-2 border-dashed border-brand-green/20 dark:border-brand-green/40 bg-brand-green/5 dark:bg-brand-green/10 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-green/75 dark:text-pawn-gold">Proof of Buy Out <span className="text-red-500">*</span></p>
                  </div>
                  {proofImage ? (
                    <div className="relative group">
                      <img src={proofImage} alt="Proof of buy back" className="w-full max-h-48 object-cover rounded-xl border border-brand-green/20 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setProofImage(null)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        title="Retake photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setProofImage(null); void openProofCamera(); }}
                        className="mt-3 w-full py-2 rounded-xl border border-brand-green/20 text-xs font-black text-brand-green hover:bg-brand-green/10 transition-all"
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void openProofCamera()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-brand-green/20 hover:border-brand-green/40 bg-white dark:bg-surface hover:bg-brand-green/10 dark:hover:bg-brand-green/10 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-brand-green dark:text-pawn-gold">Open Camera</p>
                        <p className="text-[10px] text-brand-green/70 dark:text-zinc-400 mt-1">Required — Proof of buy back transaction</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center sm:p-12">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-green/10 dark:bg-brand-green/20">
                  <Undo2 className="h-12 w-12 text-brand-green/40 dark:text-brand-green" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight text-brand-green dark:text-white sm:text-2xl">Scan or Search Item</h3>
                <p className="mt-2 max-w-xs font-bold leading-relaxed text-brand-green/60 dark:text-zinc-400">
                  Only active items within the loan period are eligible for redemption.
                </p>
              </div>
            )}
          </div>

          {selectedItem && !showMobileItemList && (
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto border-t border-brand-green/20 bg-white dark:border-border-subtle dark:bg-surface xl:hidden">
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 p-4 duration-300 sm:px-5 sm:pb-4 sm:pt-4">
                <button
                  type="button"
                  onClick={handleOpenMobileItemList}
                  className="mb-1 inline-flex items-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/20 dark:border-brand-green/40 dark:bg-brand-green/20 dark:text-pawn-gold dark:hover:bg-brand-green/30"
                >
                  <Menu className="h-4 w-4" />
                  Change Item
                </button>
                <div className="mb-5 space-y-1">
                  <p className="text-xs font-black text-brand-green uppercase tracking-[2px]">Redemption Preview</p>
                  <h2 className="text-3xl font-black text-brand-green dark:text-white tracking-tighter leading-none md:max-xl:text-[2.15rem]">
                    {selectedItem.unit}
                  </h2>
                  <p className="text-brand-green/70 dark:text-pawn-gold font-bold flex items-center gap-2">
                    {selectedItem.name} • {selectedItem.contactNumber}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-6">
                  <DetailSection title="Loan & Item Details" icon={Smartphone}>
                    <DetailRow label="Principal Amount" value={formatPeso(Number(selectedItem.amount))} />
                    <DetailRow
                      label="Maturity Interest"
                      value={<span className="text-brand-green dark:text-pawn-gold">₱ {interestCalc.interestAmount.toLocaleString()} ({interestCalc.percentage}%)</span>}
                    />
                    <DetailRow label="Purchased Date" value={selectedItem.purchasedDate} />
                    <DetailRow
                      label="Days Since Pawn"
                      value={<span className="text-brand-green dark:text-pawn-gold">{interestCalc.daysPassed} Days</span>}
                    />
                    <DetailRow label="Category" value={selectedItem.category} />
                    <DetailRow label="Unit Code" value={selectedItem.unitCode} />
                  </DetailSection>

                  <DetailSection title="Physical Specs" icon={ShieldCheck}>
                    <DetailRow label="Serial Number" value={selectedItem.serialNumber} />
                    <DetailRow label="Condition" value={selectedItem.condition} />
                    <DetailRow label="Memory" value={selectedItem.memory} />
                    <DetailRow label="Items Included" value={selectedItem.itemsIncluded} />
                    {isAdminOrSuperAdmin && (
                      <div className="mt-3 pt-3 border-t border-brand-green/20 dark:border-border font-google flex flex-col items-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Security QR Code</p>
                        {selectedItem.qrCode ? (
                          <div className="h-28 w-28 rounded-xl border border-zinc-100 p-2 bg-white dark:bg-surface flex items-center justify-center shadow-sm md:max-xl:h-24 md:max-xl:w-24">
                            <img src={selectedItem.qrCode} alt="Unit QR" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-28 w-28 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center md:max-xl:h-24 md:max-xl:w-24">
                            <p className="text-[8px] font-bold text-zinc-300 uppercase">No QR Generated</p>
                          </div>
                        )}
                      </div>
                    )}
                  </DetailSection>
                </div>

                <div className="mb-5 p-4 rounded-3xl bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/20 dark:border-brand-green/30 relative overflow-hidden group md:max-xl:p-4">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-brand-green/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green/70 dark:text-pawn-gold">Computation Summary</p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase text-brand-green/65 dark:text-zinc-300">Principal</p>
                          <p className="text-lg font-black text-brand-green dark:text-white md:max-xl:text-[1.05rem]">{formatPeso(Number(selectedItem.amount))}</p>
                        </div>
                        <div className="h-8 w-px bg-brand-green/20 dark:bg-brand-green/40" />
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase text-brand-green/65 dark:text-zinc-300">Interest ({interestCalc.percentage}%)</p>
                          <p className="text-lg font-black text-brand-green dark:text-white md:max-xl:text-[1.05rem]">{formatPeso(interestCalc.interestAmount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green/70 dark:text-pawn-gold">Total Amount Due</p>
                      <p className="text-4xl font-black text-brand-green dark:text-pawn-gold tracking-tighter md:max-xl:text-[2.25rem]">
                        ₱ {interestCalc.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof of Buy Back — Camera Capture (compact tablet) */}
                <div className="mb-5 rounded-2xl border-2 border-dashed border-brand-green/20 dark:border-brand-green/40 bg-brand-green/5 dark:bg-brand-green/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-green/75 dark:text-pawn-gold">Proof of Buy Out <span className="text-red-500">*</span></p>
                  </div>
                  {proofImage ? (
                    <div className="relative group">
                      <img src={proofImage} alt="Proof" className="w-full max-h-36 object-cover rounded-xl border border-brand-green/20 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => { setProofImage(null); void openProofCamera(); }}
                        className="mt-2 w-full py-2 rounded-xl border border-brand-green/20 text-xs font-black text-brand-green hover:bg-brand-green/10 transition-all"
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void openProofCamera()}
                      className="w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed border-brand-green/20 hover:border-brand-green/40 bg-white dark:bg-surface hover:bg-brand-green/10 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-brand-green dark:text-pawn-gold">Open Camera</p>
                        <p className="text-[10px] text-brand-green/70 dark:text-zinc-400">Required proof of buy back</p>
                      </div>
                    </button>
                  )}
                  {proofFieldError && (
                    <p className="mt-2 text-[10px] font-semibold text-red-500 sm:text-xs">{proofFieldError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 border-t border-brand-green/20 bg-white dark:border-border-subtle dark:bg-surface">
          <div className={`flex items-end gap-2 p-3 sm:gap-4 sm:p-5 ${compactTablet ? "md:gap-5 xl:p-6" : "lg:gap-6 lg:p-6 xl:p-8"}`}>
            <div className="flex min-w-0 flex-1 items-end gap-2 sm:gap-4">
              <div className="w-[min(38%,8.5rem)] shrink-0 sm:w-44">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-green/70 dark:text-pawn-gold">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={transactionPasswordInputClass(
                      Boolean(passwordFieldError),
                      "h-10 w-full rounded-lg border bg-slate-50 px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 dark:border-border-subtle dark:bg-surface-secondary border-brand-green/20",
                    )}
                    value={adminForm.password}
                    onChange={(e) => { setAdminForm({ ...adminForm, password: e.target.value }); setError(null); }}
                  />
                  {passwordFieldError && (
                    <p className={transactionPasswordErrorClass}>{passwordFieldError}</p>
                  )}
                </div>
              </div>

              <div className="hidden h-10 w-px shrink-0 bg-zinc-100 dark:bg-surface-hover sm:block" />

              <div className="min-w-0 shrink-0 text-left">
                <p className="mb-1 text-[9px] font-black uppercase leading-none tracking-[0.2em] text-brand-green/70 dark:text-pawn-gold">
                  TOTAL LOAN AMOUNT
                </p>
                <p className="text-xl font-black leading-none tracking-tighter text-brand-green dark:text-white sm:text-2xl md:text-3xl">
                  ₱ {interestCalc.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              disabled={isConfirming || !selectedItem || !proofImage}
              onClick={handleConfirmRedeemRequest}
              className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[9px] font-black uppercase tracking-wide transition-all active:scale-[0.98] sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm sm:tracking-wider ${compactTablet ? "md:px-8" : "sm:px-10 md:px-12 md:py-5"} ${isConfirming || !selectedItem || !proofImage ? "cursor-not-allowed bg-zinc-100 text-zinc-300 dark:bg-surface-hover" : "bg-brand-green text-white shadow-xl shadow-brand-green/30 hover:brightness-110"}`}
            >
              {isConfirming ? (
                <span className="anim-loading h-4 w-4 rounded-full border-brand-green/30 border-t-brand-green" />
              ) : (
                <>
                  CONFIRM BUY OUT
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <QrScanner 
        isOpen={isScannerOpen} 
        onScan={handleQrScan} 
        onClose={() => setIsScannerOpen(false)} 
      />
      <ConfirmActionModal
        isOpen={isCancelConfirmOpen}
        title="Cancel buy out?"
        message="Are you sure you want to cancel this buy out transaction? Your progress will not be saved."
        confirmLabel="Yes, Cancel"
        cancelLabel="Continue"
        variant="warning"
        zIndexClass="z-[210]"
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={async () => {
          onClose();
        }}
      />
      <TransactionConfirmModal
        isOpen={isConfirmOpen}
        title="Confirm buy out?"
        message="This will permanently settle the pawn, record the buy out transaction, and mark the item as redeemed."
        details={selectedItem ? [
          { label: "Customer", value: selectedItem.name },
          { label: "Unit", value: selectedItem.unit },
          { label: "Unit Code", value: selectedItem.unitCode },
          { label: "Total Amount", value: `₱ ${interestCalc.totalAmount.toLocaleString()}` },
        ] : []}
        confirmLabel="Yes, Confirm Buy Out"
        isLoading={isConfirming}
        onClose={() => {
          if (!isConfirming) setIsConfirmOpen(false);
        }}
        onConfirm={handleConfirmRedeem}
      />

      {/* Buy Back Proof Camera Modal */}
      {showProofCamera && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-950 border border-brand-green/20 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-green via-brand-green to-brand-green px-5 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-pawn-gold">Transaction Proof</p>
                <h3 className="text-base font-black uppercase tracking-wider mt-0.5">Buy Out Proof Capture</h3>
              </div>
              <button
                onClick={() => { stopProofCamera(); setShowProofCamera(false); }}
                className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera view */}
            <div className="p-5 flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-brand-green/20 shadow-inner flex items-center justify-center">
                {cameraError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500 mb-3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-xs font-bold text-zinc-500 mb-4 max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => proofFileInputRef.current?.click()}
                      className="px-4 py-2 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green dark:text-pawn-gold border border-brand-green/20 text-xs font-black uppercase tracking-wider rounded-xl transition"
                    >
                      Upload Image File
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={proofVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {isCameraStreaming && (
                      <>
                        <span className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-pawn-gold rounded-tl-lg" />
                        <span className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-pawn-gold rounded-tr-lg" />
                        <span className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-pawn-gold rounded-bl-lg" />
                        <span className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-pawn-gold rounded-br-lg" />
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="w-full mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => proofFileInputRef.current?.click()}
                  className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition"
                >
                  Upload File
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={captureProofPhoto}
                    disabled={!isCameraStreaming}
                    className="w-14 h-14 rounded-full bg-white border-4 border-brand-green flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
                    title="Capture proof photo"
                  >
                    <span className="w-10 h-10 rounded-full bg-brand-green block hover:brightness-110 transition" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { stopProofCamera(); setShowProofCamera(false); }}
                  className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Hidden file input + canvas */}
            <input ref={proofFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProofFileUpload} />
            <canvas ref={proofCanvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Plus({ className }: { className?: string }) {
  return (
    <svg 
      width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function DetailSection({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-brand-green/70 dark:text-pawn-gold" />
        <h4 className="text-[10px] font-black uppercase tracking-[2px] text-brand-green/70 dark:text-pawn-gold">{title}</h4>
      </div>
      <div className="divide-y divide-brand-green/20 border-t border-brand-green/20 dark:divide-border-subtle dark:border-border-subtle">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string | React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-1">
      <span className="text-[10px] font-bold uppercase tracking-tighter text-brand-green/70 dark:text-zinc-300">{label}</span>
      <span className="text-right text-xs font-black text-brand-green dark:text-white">{value}</span>
    </div>
  );
}
