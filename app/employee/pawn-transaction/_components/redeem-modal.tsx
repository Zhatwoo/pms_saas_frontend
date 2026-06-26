"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { calculateGadgetInterest } from "@/lib/interest";
import { getTransactionDateTimeFields } from "@/lib/time";
import { formatPeso } from "@/lib/currency";
import { QrScanner } from "@/components/shared/qr-scanner";
import { useAuth } from "@/contexts/auth-context";

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
  const [error, setError] = useState<string | null>(null);
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
            status: item.status
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
    return calculateGadgetInterest(Number(selectedItem.amount), selectedItem.purchasedDate, selectedItem.category);
  }, [selectedItem]);

  const handleConfirmRedeem = async () => {
    if (isProcessingRef.current) return;
    if (!selectedItem) return;
    setError(null);

    if (!adminForm.password) {
      setError("Please enter password to verify.");
      return;
    }

    if (!proofImage) {
      setError("A proof of buy back photo is required before confirming.");
      return;
    }

    isProcessingRef.current = true;
    setIsConfirming(true);
    try {
      // 1. Verify Password
      await api.post("/auth/verify-password", { password: adminForm.password });

      // 2. Process Redemption (Transaction)
      await api.post("/transactions", {
        ...getTransactionDateTimeFields(),
        purpose: "Redeem",
        branch_id: branchId,
        branch: branchName,
        cash_in: interestCalc.totalAmount,
        cash_out: 0,
        unit: selectedItem.unit,
        unit_code: selectedItem.unitCode,
        pawn_amount: Number(selectedItem.amount),
        storage_fee: interestCalc.interestAmount,
        details: `Redeemed by ${selectedItem.name} | Days: ${interestCalc.daysPassed} | Processed by: ${adminForm.processedBy || 'Admin'}`,
        related_pawned_item_id: selectedItem.id
      });

      await api.patch(`/inventory/pawned/${selectedItem.id}`, { status: 'Redeemed' });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
      toast.success("Item bought back successfully!");
    } catch (err: any) {
      const msg = err.message || "Failed to process transaction.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsConfirming(false);
      isProcessingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity no-print" onClick={onClose} />
      <div 
        className={`relative w-full max-w-7xl h-[90vh] flex flex-col bg-white dark:bg-background rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10 ${compactTablet ? "md:h-[calc(100dvh-4rem)] md:max-w-6xl lg:h-[88vh] xl:max-w-7xl" : "md:h-[calc(100dvh-3rem)] lg:h-[90vh]"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white shrink-0 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-emerald-300 shadow-inner border border-emerald-700/50">
                <Undo2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90 dark:text-emerald-400">
                  {branchName} | Active Pawn
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white leading-none">
                  Buy Back Pawn Ticket
                </h1>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close Buy Back Pawn Ticket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={`flex min-h-0 flex-1 flex-col xl:flex-row ${compactTablet ? "overflow-y-auto" : "overflow-hidden"}`}>
          {/* Left Side: Search & Selection */}
          <div className="flex w-full shrink-0 flex-col border-emerald-50 bg-emerald-50/30 dark:border-border dark:bg-surface-secondary xl:w-[400px] xl:border-r">
            <div className={`space-y-4 p-4 ${compactTablet ? "md:p-5" : "md:p-6"}`}>
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-emerald-600/40" />
                <h3 className="text-xs font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-wider">Search Active Pawn</h3>
              </div>
              
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Name, Unit Code, Serial..."
                  className="w-full h-12 pl-12 pr-4 bg-white dark:bg-surface border-2 border-emerald-100 dark:border-border-subtle rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-medium shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200 group-focus-within:text-emerald-500 transition-colors" />
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-all active:scale-95 border border-emerald-100"
                  title="Scan QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`overflow-y-auto px-4 pb-6 scrollbar-hide ${compactTablet ? "max-h-[210px] md:max-xl:max-h-[230px]" : "flex-1"}`}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-50 dark:border-border0 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase">Linking to Database...</p>
                </div>
              ) : pawnedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-6 bg-white dark:bg-surface rounded-2xl border-2 border-dashed border-emerald-100 dark:border-border-subtle shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-emerald-200" />
                  </div>
                  <p className="text-sm font-bold text-emerald-900/60">No active pawns found</p>
                  <p className="text-[10px] text-emerald-900/30 uppercase mt-1 tracking-tighter">Only Active items can be Bought Back</p>
                </div>
              ) : (
                pawnedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full p-4 mb-3 rounded-2xl border-2 transition-all flex flex-col gap-2 text-left relative group ${
                      selectedItem?.id === item.id 
                        ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-400 shadow-xl shadow-emerald-900/5 ring-4 ring-emerald-500/5' 
                        : 'bg-white dark:bg-surface/5 border-transparent hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-600/10 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.unitCode}</p>
                      <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-emerald-600/20">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-black text-emerald-950 dark:text-white leading-tight pr-8">{item.unit}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-50 dark:border-border">
                      <p className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 capitalize">{item.name}</p>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs">₱ {Number(item.amount).toLocaleString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Details & Computation (desktop xl+) */}
          <div className={`min-h-0 flex-1 overflow-y-auto bg-white scrollbar-hide dark:bg-surface ${compactTablet ? "hidden xl:block" : ""}`}>
            {selectedItem ? (
              <div className="animate-in fade-in slide-in-from-right-4 p-4 duration-300 sm:p-6 xl:p-12">
                <div className="space-y-1 mb-8">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-[2px]">Redemption Preview</p>
                  <h2 className="text-4xl font-black text-emerald-950 dark:text-white dark:text-white tracking-tighter leading-none">
                    {selectedItem.unit}
                  </h2>
                  <p className="text-emerald-900/40 dark:text-emerald-400 font-bold flex items-center gap-2">
                    {selectedItem.name} • {selectedItem.contactNumber}
                  </p>
                </div>

                <div className="mb-10 grid grid-cols-1 gap-8 xl:grid-cols-2">
                  <DetailSection title="Loan & Item Details" icon={Smartphone}>
                    <DetailRow label="Principal Amount" value={formatPeso(Number(selectedItem.amount))} />
                    <DetailRow 
                      label="Maturity Interest" 
                      value={<span className="text-emerald-600">₱ {interestCalc.interestAmount.toLocaleString()} ({interestCalc.percentage}%)</span>} 
                    />
                    <DetailRow label="Purchased Date" value={selectedItem.purchasedDate} />
                    <DetailRow 
                      label="Days Since Pawn" 
                      value={<span className="text-emerald-600">{interestCalc.daysPassed} Days</span>} 
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
                      <div className="mt-4 pt-4 border-t border-emerald-50 dark:border-border font-google flex flex-col items-center">
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
                <div className="relative mb-10 overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest">Computation Summary</p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-900/30 dark:text-emerald-400 uppercase">Principal</p>
                          <p className="text-xl font-black text-emerald-900 dark:text-white">{formatPeso(Number(selectedItem.amount))}</p>
                        </div>
                        <div className="h-8 w-px bg-emerald-200" />
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-900/30 dark:text-emerald-400 uppercase">Interest ({interestCalc.percentage}%)</p>
                          <p className="text-xl font-black text-emerald-900 dark:text-white">{formatPeso(interestCalc.interestAmount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest">Total Amount Due</p>
                      <p className="text-5xl font-black text-emerald-950 dark:text-emerald-400 tracking-tighter">
                        ₱ {interestCalc.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof of Buy Back — Camera Capture */}
                <div className="mb-8 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-[10px] font-black text-emerald-900/60 dark:text-emerald-400 uppercase tracking-[2px]">Proof of Buy Back <span className="text-red-500">*</span></p>
                  </div>
                  {proofImage ? (
                    <div className="relative group">
                      <img src={proofImage} alt="Proof of buy back" className="w-full max-h-48 object-cover rounded-xl border border-emerald-200 shadow-sm" />
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
                        className="mt-3 w-full py-2 rounded-xl border border-emerald-200 text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all"
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void openProofCamera()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white dark:bg-surface hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">Open Camera</p>
                        <p className="text-[10px] text-emerald-900/40 mt-1">Required — Proof of buy back transaction</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6">
                  <Undo2 className="w-12 h-12 text-emerald-200" />
                </div>
                <h3 className="text-2xl font-black text-emerald-950 dark:text-white dark:text-white uppercase tracking-tight italic">Scan or Search Item</h3>
                <p className="text-emerald-900/30 font-bold max-w-xs mt-2 leading-relaxed">
                  "Only active items within the loan period are eligible for redemption."
                </p>
              </div>
            )}
          </div>

          {compactTablet && !selectedItem && (
            <div className="flex flex-1 flex-col items-center justify-center border-t border-emerald-50 bg-white p-8 text-center dark:bg-surface xl:hidden">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50">
                <Undo2 className="h-12 w-12 text-emerald-200" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-emerald-950 dark:text-white">
                Scan or Search Item
              </h3>
              <p className="mt-2 max-w-xs font-bold leading-relaxed text-emerald-900/30">
                Only active items within the loan period are eligible for redemption.
              </p>
            </div>
          )}

          {compactTablet && selectedItem && (
            <div className="w-full shrink-0 border-t border-emerald-50 bg-white px-4 pb-4 pt-4 dark:bg-surface xl:hidden">
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1 mb-5">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-[2px]">Redemption Preview</p>
                  <h2 className="text-3xl font-black text-emerald-950 dark:text-white tracking-tighter leading-none md:max-xl:text-[2.15rem]">
                    {selectedItem.unit}
                  </h2>
                  <p className="text-emerald-900/40 dark:text-emerald-400 font-bold flex items-center gap-2">
                    {selectedItem.name} • {selectedItem.contactNumber}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-6">
                  <DetailSection title="Loan & Item Details" icon={Smartphone}>
                    <DetailRow label="Principal Amount" value={formatPeso(Number(selectedItem.amount))} />
                    <DetailRow 
                      label="Maturity Interest" 
                      value={<span className="text-emerald-600">₱ {interestCalc.interestAmount.toLocaleString()} ({interestCalc.percentage}%)</span>} 
                    />
                    <DetailRow label="Purchased Date" value={selectedItem.purchasedDate} />
                    <DetailRow 
                      label="Days Since Pawn" 
                      value={<span className="text-emerald-600">{interestCalc.daysPassed} Days</span>} 
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
                      <div className="mt-3 pt-3 border-t border-emerald-50 dark:border-border font-google flex flex-col items-center">
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

                <div className="mb-5 p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden group md:max-xl:p-4">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest">Computation Summary</p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-900/30 dark:text-emerald-400 uppercase">Principal</p>
                          <p className="text-lg font-black text-emerald-900 dark:text-white md:max-xl:text-[1.05rem]">{formatPeso(Number(selectedItem.amount))}</p>
                        </div>
                        <div className="h-8 w-px bg-emerald-200" />
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-900/30 dark:text-emerald-400 uppercase">Interest ({interestCalc.percentage}%)</p>
                          <p className="text-lg font-black text-emerald-900 dark:text-white md:max-xl:text-[1.05rem]">{formatPeso(interestCalc.interestAmount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest">Total Amount Due</p>
                      <p className="text-4xl font-black text-emerald-950 dark:text-emerald-400 tracking-tighter md:max-xl:text-[2.25rem]">
                        ₱ {interestCalc.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof of Buy Back — Camera Capture (compact tablet) */}
                <div className="mb-5 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-[10px] font-black text-emerald-900/60 dark:text-emerald-400 uppercase tracking-[2px]">Proof of Buy Back <span className="text-red-500">*</span></p>
                  </div>
                  {proofImage ? (
                    <div className="relative group">
                      <img src={proofImage} alt="Proof" className="w-full max-h-36 object-cover rounded-xl border border-emerald-200 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => { setProofImage(null); void openProofCamera(); }}
                        className="mt-2 w-full py-2 rounded-xl border border-emerald-200 text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all"
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void openProofCamera()}
                      className="w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white dark:bg-surface hover:bg-emerald-50 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">Open Camera</p>
                        <p className="text-[10px] text-emerald-900/40">Required proof of buy back</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`border-t border-emerald-50 bg-white dark:bg-surface flex flex-col sm:flex-row items-center justify-between shrink-0 ${compactTablet ? "gap-4 p-4 md:p-5 md:max-xl:gap-5" : "gap-8 p-8"}`}>
          <div className="flex items-center gap-8 w-full sm:w-auto">
             <button 
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel Process
              </button>
              <div className="h-10 w-px bg-zinc-100 dark:bg-surface-hover hidden sm:block" />
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-40">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[0.2em]">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className={`h-10 rounded-lg border bg-slate-50 dark:bg-surface-secondary px-3 text-sm text-text-primary outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-text-muted ${
                        error && error.toLowerCase().includes('password')
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-emerald-100 dark:border-border-subtle focus:border-emerald-500'
                      }`}
                      value={adminForm.password}
                      onChange={(e) => { setAdminForm({...adminForm, password: e.target.value}); setError(null); }}
                    />
                    {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                  </div>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-emerald-50">
             <div className="text-right">
                <p className="text-[9px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[0.2em] leading-none mb-1">
                  TOTAL LOAN AMOUNT
                </p>
                <p className="text-3xl font-black text-emerald-950 dark:text-white tracking-tighter leading-none">
                  ₱ {interestCalc.totalAmount.toLocaleString()}
                </p>
              </div>

              <button 
                disabled={isConfirming || !selectedItem || !proofImage}
                onClick={handleConfirmRedeem}
                className={`flex items-center justify-center gap-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] ${compactTablet ? "px-8 py-4" : "px-12 py-5"} ${isConfirming || !selectedItem || !proofImage ? 'bg-zinc-100 dark:bg-surface-hover text-zinc-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30'}`}
              >
                {isConfirming ? (
                   <span className="anim-loading h-4 w-4 border-emerald-950/30 border-t-emerald-950 rounded-full" />
                ) : (
                   <>
                     CONFIRM BUY BACK
                     <ArrowRight className="w-5 h-5" />
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

      {/* Buy Back Proof Camera Modal */}
      {showProofCamera && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 border border-emerald-500/20 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Transaction Proof</p>
                <h3 className="text-base font-black uppercase tracking-wider mt-0.5">Buy Back Proof Capture</h3>
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
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-emerald-500/20 shadow-inner flex items-center justify-center">
                {cameraError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500 mb-3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-xs font-bold text-zinc-500 mb-4 max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => proofFileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider rounded-xl transition"
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
                        <span className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                        <span className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                        <span className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                        <span className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
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
                    className="w-14 h-14 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
                    title="Capture proof photo"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-600 block hover:bg-emerald-700 transition" />
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
        <Icon className="w-4 h-4 text-emerald-600/40" />
        <h4 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[2px]">{title}</h4>
      </div>
      <div className="divide-y divide-emerald-50 border-t border-emerald-50 dark:border-border">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string | React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <span className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter">{label}</span>
      <span className="text-xs font-black text-emerald-950 dark:text-white dark:text-white">{value}</span>
    </div>
  );
}
