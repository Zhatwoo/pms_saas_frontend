"use client";

import { useState, useMemo, useEffect, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { calculateGadgetInterest } from "@/lib/interest";
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

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
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

export function RedeemModal({ isOpen, onClose, branchId, branchName }: RedeemModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<PawnedSearchItem | null>(null);
  const [adminForm, setAdminForm] = useState({
    processedBy: "",
    password: "",
  });

  const [pawnedItems, setPawnedItems] = useState<PawnedSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const interestCalc = useMemo(() => {
    if (!selectedItem) return { percentage: 0, interestAmount: 0, totalAmount: 0, daysPassed: 0 };
    return calculateGadgetInterest(Number(selectedItem.amount), selectedItem.purchasedDate);
  }, [selectedItem]);

  const handleConfirmRedeem = async () => {
    if (!selectedItem) return;
    setError(null);

    if (!adminForm.password) {
      setError("Please enter password to verify.");
      return;
    }

    setIsConfirming(true);
    try {
      // 1. Verify Password
      await api.post("/auth/verify-password", { password: adminForm.password });

      // 2. Process Redemption (Transaction)
      await api.post("/transactions", {
        purpose: "Redeem",
        transaction_date: new Date().toISOString().split('T')[0],
        branch_id: branchId,
        branch: branchName,
        cash_in: interestCalc.totalAmount,
        cash_out: 0,
        unit: selectedItem.unit,
        unit_code: selectedItem.unitCode,
        pawn_amount: Number(selectedItem.amount),
        storage_fee: interestCalc.interestAmount,
        details: `Redeemed by ${selectedItem.name} | Days: ${interestCalc.daysPassed}`,
        related_pawned_item_id: selectedItem.id
      });

      // 3. Update Item status to Redeemed
      await api.patch(`/inventory/pawned/${selectedItem.id}`, { status: 'Redeemed' });

      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/80 backdrop-blur-sm p-4 text-zinc-900 dark:text-zinc-100">
      <div 
        className="relative w-full max-w-7xl h-[90vh] overflow-hidden rounded-2xl border border-emerald-500/20 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 px-6 py-4 border-b border-emerald-50 dark:border-zinc-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Undo2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-tight">Redeem Pawn Ticket</h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{branchName} | Active Pawn</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-full transition-colors text-emerald-900/40 dark:text-emerald-300/60 hover:text-emerald-900 dark:hover:text-emerald-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Side: Search & Selection */}
          <div className="w-full lg:w-[400px] border-r border-emerald-50 dark:border-zinc-700 bg-emerald-50/30 dark:bg-zinc-900 flex flex-col shrink-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-emerald-600/40" />
                <h3 className="text-xs font-black text-emerald-900/40 uppercase tracking-wider">Search Active Pawn</h3>
              </div>
              
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Name, Unit Code, Serial..."
                  className="w-full h-12 pl-12 pr-4 bg-white dark:bg-zinc-800 border-2 border-emerald-100 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-medium shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200 group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-emerald-900/40 uppercase">Linking to Database...</p>
                </div>
              ) : pawnedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-6 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-emerald-100 dark:border-zinc-700 shadow-sm">
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
                                ? 'bg-white dark:bg-zinc-800 border-emerald-500 shadow-xl shadow-emerald-900/5 ring-4 ring-emerald-500/5' 
                                : 'bg-white/60 dark:bg-zinc-800/70 border-transparent hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.unitCode}</p>
                      <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-emerald-600/20">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-black text-emerald-950 leading-tight pr-8">{item.unit}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-50">
                      <p className="text-[10px] font-bold text-emerald-900/40 capitalize">{item.name}</p>
                      <p className="font-black text-emerald-600 text-xs">₱ {Number(item.amount).toLocaleString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Details & Computation */}
          <div className="flex-1 bg-white dark:bg-zinc-900 overflow-y-auto scrollbar-hide">
            {selectedItem ? (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1 mb-8">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-[2px]">Redemption Preview</p>
                  <h2 className="text-4xl font-black text-emerald-950 dark:text-emerald-100 tracking-tighter leading-none">
                    {selectedItem.unit}
                  </h2>
                  <p className="text-emerald-900/40 font-bold flex items-center gap-2">
                    {selectedItem.name} • {selectedItem.contactNumber}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <DetailSection title="Loan & Item Details" icon={Smartphone}>
                    <DetailRow label="Principal Amount" value={`₱ ${Number(selectedItem.amount).toLocaleString()}`} />
                    <DetailRow 
                      label="Maturity Interest" 
                      value={<span className="text-orange-600">₱ {interestCalc.interestAmount.toLocaleString()} ({interestCalc.percentage}%)</span>} 
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
                    
                    <div className="mt-4 pt-4 border-t border-emerald-50 font-google">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Security QR Code</p>
                      {selectedItem.qrCode ? (
                        <div className="w-32 h-32 rounded-xl border border-zinc-100 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                          <img src={selectedItem.qrCode} alt="Unit QR" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                          <p className="text-[8px] font-bold text-zinc-300 uppercase">No QR Generated</p>
                        </div>
                      )}
                    </div>
                  </DetailSection>
                </div>

                {/* Computation Summary */}
                <div className="mb-10 p-6 rounded-3xl bg-emerald-50 border border-emerald-100 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">Computation Summary</p>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-900/30 uppercase">Principal</p>
                          <p className="text-xl font-black text-emerald-900">₱{Number(selectedItem.amount).toLocaleString()}</p>
                        </div>
                        <div className="h-8 w-px bg-emerald-200" />
                        <div className="text-center">
                          <p className="text-[9px] font-black text-emerald-900/30 uppercase">Interest ({interestCalc.percentage}%)</p>
                          <p className="text-xl font-black text-emerald-900">₱{interestCalc.interestAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">Total Amount Due</p>
                      <p className="text-5xl font-black text-emerald-950 tracking-tighter">
                        ₱ {interestCalc.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirm Section */}
                <div className="p-8 rounded-3xl bg-emerald-900 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-8">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                        <h4 className="text-xl font-black uppercase tracking-tight">Verify Authorisation</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest ml-1">Processed By</label>
                          <input 
                            type="text"
                            placeholder="Admin Name"
                            className="w-full h-12 px-4 bg-emerald-800/50 border-2 border-emerald-700/50 rounded-xl outline-none focus:border-emerald-400 transition-all text-sm font-medium"
                            value={adminForm.processedBy}
                            onChange={(e) => setAdminForm({...adminForm, processedBy: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest ml-1">Security Password</label>
                          <input 
                            type="password"
                            placeholder="••••••••"
                            className="w-full h-12 px-4 bg-emerald-800/50 border-2 border-emerald-700/50 rounded-xl outline-none focus:border-emerald-400 transition-all text-sm font-medium"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          <p className="text-xs font-bold text-orange-200">{error}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-[320px] bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Net Cash Received</p>
                          <p className="text-3xl font-black text-white leading-none">₱ {interestCalc.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-emerald-200">Proceed with Redemption?</p>
                            <p className="text-[10px] text-emerald-400/60 leading-tight">Verify full payment and password.</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmRedeem}
                        disabled={isConfirming}
                        className="w-full h-14 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        {isConfirming ? "Processing..." : (
                          <>
                            Confirm Redemption
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-3xl bg-emerald-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
                  <Undo2 className="w-12 h-12 text-emerald-200" />
                </div>
                <h3 className="text-2xl font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-tight italic">Scan or Search Item</h3>
                <p className="text-emerald-900/30 font-bold max-w-xs mt-2 leading-relaxed">
                  "Only active items within the loan period are eligible for redemption."
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
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
        <h4 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[2px]">{title}</h4>
      </div>
      <div className="divide-y divide-emerald-50 dark:divide-zinc-700 border-t border-emerald-50 dark:border-zinc-700">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string | React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <span className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-300/60 uppercase tracking-tighter">{label}</span>
      <span className="text-xs font-black text-emerald-950 dark:text-emerald-100">{value}</span>
    </div>
  );
}
