"use client";

import { useState, useMemo, useEffect, useRef, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { calculateGadgetInterest } from "@/lib/interest";
import { formatDateToYMD } from "@/lib/time";
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

export function RedeemModal({ isOpen, onClose, branchId, branchName, onSuccess }: RedeemModalProps) {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user?.fullName) {
      setAdminForm(prev => ({ ...prev, processedBy: user.fullName }));
    }
  }, [user]);

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

    isProcessingRef.current = true;
    setIsConfirming(true);
    try {
      // 1. Verify Password
      await api.post("/auth/verify-password", { password: adminForm.password });

      // 2. Process Redemption (Transaction)
      await api.post("/transactions", {
        purpose: "Redeem",
        transaction_date: formatDateToYMD(),
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
      toast.success("Item redeemed successfully!");
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
        className="relative w-full max-w-7xl h-[90vh] flex flex-col bg-white dark:bg-background rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10"
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
                  Redeem Pawn Ticket
                </h1>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close Redeem Pawn Ticket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
          {/* Left Side: Search & Selection */}
          <div className="w-full xl:w-[400px] border-r border-emerald-50 dark:border-border bg-emerald-50/30 dark:bg-surface-secondary flex flex-col shrink-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-emerald-600/40" />
                <h3 className="text-xs font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-wider">Search Active Pawn</h3>
              </div>
              
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Name, Unit Code, Serial..."
                  className="w-full h-12 pl-12 pr-4 bg-white dark:bg-surface border-2 border-emerald-100 dark:border-border-subtle rounded-xl outline-none focus:border-emerald-50 dark:border-border0 transition-all text-sm font-medium shadow-sm"
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

            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
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
                  <p className="text-[10px] text-emerald-900/30 uppercase mt-1 tracking-tighter">Only Active items can be Redeemed</p>
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

          {/* Right Side: Details & Computation */}
          <div className="flex-1 bg-white dark:bg-surface overflow-y-auto scrollbar-hide">
            {selectedItem ? (
              <div className="p-4 sm:p-6 xl:p-12 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1 mb-8">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-[2px]">Redemption Preview</p>
                  <h2 className="text-4xl font-black text-emerald-950 dark:text-white dark:text-white tracking-tighter leading-none">
                    {selectedItem.unit}
                  </h2>
                  <p className="text-emerald-900/40 dark:text-emerald-400 font-bold flex items-center gap-2">
                    {selectedItem.name} • {selectedItem.contactNumber}
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
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
                    
                    <div className="mt-4 pt-4 border-t border-emerald-50 dark:border-border font-google">
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
                  </DetailSection>
                </div>

                {/* Computation Summary */}
                <div className="mb-10 p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden group">
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
        </div>

        {/* --- MODIFIED SECURITY FOOTER (Like Image 2) --- */}
        <div className="bg-[#0a0f0d] border-t border-white/5 p-6 shrink-0 relative z-20">
          <div className="max-w-full flex items-center justify-between gap-8">
            
            {/* Left: Cancel Action */}
            <button 
              onClick={onClose}
              className="text-[10px] font-black text-emerald-100/40 hover:text-white uppercase tracking-[0.2em] transition-colors"
            >
              CANCEL
            </button>

            {/* Middle: Security Verification */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[9px] font-black text-[#34D399] uppercase tracking-widest">
                  SECURITY PASSWORD VERIFICATION
                </p>
                <span className="text-[9px] font-bold text-emerald-100/20 italic">
                  ({user?.fullName?.toLowerCase() || 'lysa'})
                </span>
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full h-12 bg-[#1a2421] border border-white/10 rounded-xl px-4 text-white text-lg tracking-[0.5em] font-black outline-none focus:border-[#34D399]/50 transition-all placeholder:text-white/5"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                />
              </div>
            </div>

            {/* Right: Summary & Process Button */}
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[9px] font-black text-emerald-100/40 uppercase tracking-widest mb-1">TOTAL LOAN AMOUNT</p>
                <p className="text-2xl font-black text-white leading-none">
                  ₱ {interestCalc.totalAmount.toLocaleString()}
                </p>
              </div>

              <button 
                disabled={isConfirming || !selectedItem}
                onClick={handleConfirmRedeem}
                className="h-14 px-8 bg-[#34D399] hover:bg-[#10B981] disabled:bg-emerald-800/50 text-emerald-950 rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 flex items-center justify-center transition-all active:scale-[0.98] text-xs gap-3"
              >
                {isConfirming ? (
                   <span className="anim-loading h-4 w-4 border-emerald-950/30 border-t-emerald-950 rounded-full" />
                ) : (
                   <>
                     CONFIRM REDEMPTION
                     <ArrowRight className="w-5 h-5" />
                   </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-[8px] font-bold uppercase tracking-widest animate-in slide-in-from-bottom-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
      <QrScanner 
        isOpen={isScannerOpen} 
        onScan={handleQrScan} 
        onClose={() => setIsScannerOpen(false)} 
      />
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
