"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { calculateGadgetInterest } from "@/lib/interest";
import { formatDateToYMD } from "@/lib/time";
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
function RotateCcw({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>);
}
function ShieldCheck({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>);
}
function Info({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);
}
function Calendar({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
}
function Tag({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
}
function User({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
}
function Layout({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>);
}
function Lock({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>);
}
function Minus({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>);
}
function Plus({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
}
function AlertCircle({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
}
function TrendingUp({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
}

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  branchId: string;
  onSuccess?: () => void;
}

interface PawnItemDetails {
  id: string;
  name: string;
  unitCode: string;
  unit: string;
  serialNumber: string;
  itemsIncluded: string;
  condition: string;
  memory: string;
  category: string;
  barcodeId: string;
  contactNumber: string;
  remarks: string;
  storageFee: string;
  parkingFee: string;
  purchasedDate: string;
  expirationDate: string;
  amount: number;
}

export function RenewModal({ isOpen, onClose, branchName, branchId, onSuccess }: RenewModalProps) {
  const [searchCode, setSearchCode] = useState("");
  const [selectedItem, setSelectedItem] = useState<PawnItemDetails | null>(null);
  const [itemsRenewed, setItemsRenewed] = useState(1);
  const [isRenewActive, setIsRenewActive] = useState(true);
  const [isReappraiseActive, setIsReappraiseActive] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState<number>(0);
  const [adminForm, setAdminForm] = useState({
    approvedBy: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interest Computation based on selected item
  const interestCalc = useMemo(() => {
    if (!selectedItem) return { percentage: 0, interestAmount: 0, totalAmount: 0, daysPassed: 0 };
    return calculateGadgetInterest(selectedItem.amount, selectedItem.purchasedDate);
  }, [selectedItem]);

  const handleSearch = async () => {
    if (!searchCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ items: any[] }>(`/inventory/pawned?status=Active&search=${searchCode}`);
      if (response.items && response.items.length > 0) {
        const item = response.items[0];
        const customer = Array.isArray(item.customers) ? item.customers[0] : item.customers;
        
        const details = {
          id: item.id,
          name: customer?.full_name || "---",
          unitCode: item.itemId || "---",
          unit: item.itemName || "---",
          serialNumber: item.serialNumber || "---",
          itemsIncluded: item.itemsIncluded || "---",
          condition: item.condition || "---",
          memory: item.memoryStorage || "---",
          category: item.category || "---",
          barcodeId: item.id.substring(0, 8).toUpperCase(),
          contactNumber: customer?.contact_number || "---",
          remarks: item.remarks || "---",
          storageFee: "0.00",
          parkingFee: "0.00",
          purchasedDate: item.pawnDate || item.created_at || "---",
          expirationDate: "---",
          amount: Number(item.amount || 0)
        };
        setSelectedItem(details);
        setNewPrincipal(details.amount);
      } else {
        setError("Item not found. Please verify the Unit Code.");
        setSelectedItem(null);
      }
    } catch (err) {
      setError("Failed to fetch item details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!selectedItem) return;
    if (!adminForm.password) {
      setError("Authorization required.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify Password
      await api.post("/auth/verify-password", { password: adminForm.password });

      // 2. Compute Amount Paid (Cash In)
      // If Renew: Paid Interest
      // If Reappraise: Depends on if they paid partial or just interest
      const cashIn = interestCalc.interestAmount; 

      // 3. Create Renew Transaction
      await api.post("/transactions", {
        purpose: isReappraiseActive ? "Reappraise" : "Renew",
        transaction_date: formatDateToYMD(),
        branch_id: branchId,
        branch: branchName,
        cash_in: cashIn,
        cash_out: 0,
        unit: selectedItem.unit,
        unit_code: selectedItem.unitCode,
        pawn_amount: isReappraiseActive ? newPrincipal : selectedItem.amount,
        storage_fee: interestCalc.interestAmount,
        details: `${isReappraiseActive ? 'Reappraised' : 'Renewed'} for ${itemsRenewed} period(s). ${isReappraiseActive ? `New Principal: ₱${newPrincipal}` : ''} | Processed by: ${adminForm.approvedBy || 'Admin'}`,
        related_pawned_item_id: selectedItem.id
      });

      // 4. Update Inventory if needed (New principal)
      if (isReappraiseActive) {
        await api.patch(`/inventory/pawned/${selectedItem.id}`, { amount: newPrincipal });
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
      toast.success(`Transaction ${isReappraiseActive ? "reappraised" : "renewed"} successfully!`);
    } catch (err: any) {
      const msg = err.message || "Failed to process transaction.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-7xl h-[90vh] flex flex-col bg-white dark:bg-surface rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10">
        
        {/* Top Floating Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white shrink-0 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-emerald-300 shadow-inner border border-emerald-700/50">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90 dark:text-emerald-400">
                  {branchName} Branch
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white leading-none">
                  Renew Transaction
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-emerald-100/60 uppercase tracking-widest">Unit Code</span>
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    placeholder="Type Full Unit Code..."
                    className="h-10 w-48 bg-white/10 border border-white/20 outline-none focus:border-emerald-400 focus:bg-white/20 transition-all px-4 font-black text-white placeholder:text-white/40 text-xs rounded-l-xl"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={handleSearch}
                    className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-r-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-lg flex items-center gap-2"
                  >
                    <Search className="w-3 h-3" />
                    Search
                  </button>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Info Area */}
          <div className="flex-1 p-8 flex gap-8 bg-emerald-50/20 dark:bg-surface-secondary overflow-hidden">
            {/* Left Column: Specs */}
            <div className="flex-1 space-y-5 flex flex-col">
              <SectionHeader title="Loan & Item Identity" icon={Info} />
              
              <div className="space-y-3 px-1">
                <StaticDetailRow label="Name" value={selectedItem?.name} />
                <StaticDetailRow label="Unit Code" value={selectedItem?.unitCode} />
                <StaticDetailRow label="Unit" value={selectedItem?.unit} />
                <StaticDetailRow label="Serial No." value={selectedItem?.serialNumber} />
                <StaticDetailRow label="Items Included" value={selectedItem?.itemsIncluded} />
                <StaticDetailRow label="Condition" value={selectedItem?.condition} />
                <StaticDetailRow label="Memory" value={selectedItem?.memory} />
                <StaticDetailRow label="Barcode ID" value={selectedItem?.barcodeId} />
                <StaticDetailRow label="Category" value={selectedItem?.category} />
              </div>
            </div>

            {/* Middle Column: Transaction Specs */}
            <div className="flex-1 space-y-5 flex flex-col">
              <SectionHeader title="Additional Records" icon={Layout} />

              <div className="space-y-3 px-1">
                <StaticDetailRow label="Contact Number" value={selectedItem?.contactNumber} />
                <StaticDetailRow label="Remarks" value={selectedItem?.remarks} />
                <StaticDetailRow label="Storage Fee" value={selectedItem?.storageFee} />
                <StaticDetailRow label="Parking Fee" value={selectedItem?.parkingFee} />
                <StaticDetailRow label="Purchased Date" value={selectedItem?.purchasedDate} />
                <StaticDetailRow label="Expiration Date" value={selectedItem?.expirationDate} />
                <div className="pt-3 border-t border-emerald-100 space-y-1 mt-auto">
                   <p className="text-[9px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest">Principal Amount</p>
                   <div className="flex items-center gap-2">
                     <span className="text-2xl font-black text-emerald-950 dark:text-white">₱ {selectedItem?.amount.toLocaleString() || '0.00'}</span>
                     <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-tighter border border-emerald-200">Value Assessed</div>
                   </div>
                </div>
            </div>
          </div>
        </div>

          {/* Right Action Panel */}
          <div className="w-[340px] bg-emerald-900 p-6 flex flex-col gap-4 shrink-0 overflow-hidden">
             <div className="space-y-3">
                <SectionHeader title="Transaction Type" icon={Tag} isDark />
                
                <div className="grid grid-cols-2 gap-2">
                  <ActionToggle 
                    label="Renew" 
                    isActive={isRenewActive} 
                    onClick={() => {
                      setIsRenewActive(true);
                      setIsReappraiseActive(false);
                    }} 
                    sub="Interest Payment"
                  />
                  <ActionToggle 
                    label="ReAppraise" 
                    isActive={isReappraiseActive} 
                    onClick={() => {
                      setIsReappraiseActive(true);
                      setIsRenewActive(false);
                    }} 
                    sub="Re-assess Value"
                  />
                </div>
             </div>

             <div className="space-y-3">
                <SectionHeader title="Period Settings" icon={Calendar} isDark />
                
                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl shadow-lg">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest">Items Renewed</p>
                    <p className="text-[7px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-tighter">Extend Multiplier</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setItemsRenewed(Math.max(1, itemsRenewed - 1))}
                      className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100 flex items-center justify-center transition-all active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-2xl font-black text-emerald-950 dark:text-white min-w-[1.5ch] text-center">{itemsRenewed}</span>
                    <button 
                      onClick={() => setItemsRenewed(itemsRenewed + 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
             </div>

             {/* Dynamic Section: Principal Adjustment OR Interest View */}
             <div className="space-y-3">
               {isReappraiseActive ? (
                 <div className="bg-emerald-950/50 rounded-xl border border-white/5 p-4 space-y-2 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Adjust Principal</p>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xs">₱</span>
                      <input 
                        type="number"
                        className="w-full h-9 pl-8 pr-3 bg-white/10 border-2 border-emerald-500/30 rounded-lg text-white font-black text-lg outline-none focus:border-emerald-500 transition-all"
                        value={newPrincipal}
                        onChange={(e) => setNewPrincipal(Number(e.target.value))}
                      />
                    </div>
                 </div>
               ) : (
                 <div className="bg-white/5 rounded-xl border border-white/5 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-emerald-900/40 dark:text-white uppercase tracking-widest">Interest Due</p>
                      <p className="text-[7px] font-bold text-emerald-500/50 uppercase">({interestCalc.percentage}% Rate)</p>
                    </div>
                    <p className="text-xl font-black text-emerald-950 dark:text-white">₱ {interestCalc.interestAmount.toLocaleString()}</p>
                 </div>
               )}
             </div>

             <div className="mt-auto space-y-3">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                       <p className="text-[9px] font-black text-emerald-100/60 dark:text-white/60 uppercase tracking-widest">TOTAL INTEREST DUE</p>
                       <p className="text-lg font-black text-emerald-600 dark:text-white font-mono">
                         ₱ {(interestCalc.interestAmount * itemsRenewed).toLocaleString()}
                       </p>
                    </div>
                   <div className="relative group">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-white transition-colors"><User className="w-3.5 h-3.5" /></span>
                     <input 
                       type="text" 
                       placeholder="Approved By"
                       className="w-full h-9 pl-10 pr-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-white text-[10px] font-bold"
                       value={adminForm.approvedBy}
                       onChange={(e) => setAdminForm({...adminForm, approvedBy: e.target.value})}
                     />
                   </div>
                   <div className="relative group">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-white transition-colors"><Lock className="w-3.5 h-3.5" /></span>
                     <input 
                       type="password" 
                       placeholder="Security Password"
                       className="w-full h-9 pl-10 pr-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-emerald-500 focus:bg-white/10 transition-all text-white text-[10px] font-bold"
                       value={adminForm.password}
                       onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                     />
                   </div>
                 </div>

                 {error && (
                   <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 text-[8px] font-bold uppercase tracking-widest">
                     <AlertCircle className="w-3 h-3 shrink-0" />
                     {error}
                   </div>
                 )}

                 <button 
                    disabled={isLoading || !selectedItem}
                    onClick={handleProceed}
                    className="h-14 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center transition-all active:scale-[0.98]"
                  >
                   {isLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="anim-loading h-5 w-5 border-white/30 border-t-white rounded-full" />
                        <span>Processing...</span>
                      </div>
                   ) : (
                      <>
                        Process Renewal
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                   )}
                  </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ title, icon: Icon, isDark = false }: { title: string, icon: any, isDark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-white text-emerald-600 shadow-sm border border-emerald-50 dark:bg-surface dark:border-border-subtle'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className={`text-[9px] font-black uppercase tracking-[2px] ${isDark ? 'text-emerald-400' : 'text-emerald-900/40 dark:text-white'}`}>
        {title}
      </h3>
    </div>
  );
}

function StaticDetailRow({ label, value }: { label: string, value: string | number | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 group">
      <span className="text-[10px] font-bold text-emerald-900/40 dark:text-white/60 uppercase tracking-tighter whitespace-nowrap shrink-0">
        {label}:
      </span>
      <div className="flex-1 border-b border-emerald-100 dark:border-border-subtle border-dashed group-hover:border-emerald-300 transition-colors" />
      <span className="text-[12px] font-black text-emerald-950 dark:text-white tracking-tight">
        {value || "---"}
      </span>
    </div>
  );
}

function ActionToggle({ label, isActive, onClick, sub }: { label: string, isActive: boolean, onClick: () => void, sub?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative p-3 rounded-2xl border-2 transition-all text-left flex flex-col gap-0.5 overflow-hidden group ${
        isActive 
          ? 'bg-emerald-50 dark:bg-emerald-600/40 border-emerald-400 shadow-xl' 
          : 'bg-white dark:bg-surface/5 border-transparent dark:border-white/5 text-zinc-400 dark:text-white/40 hover:border-emerald-200 dark:hover:bg-white/5'
      }`}
    >
      <div className={`w-3 h-3 rounded-full border-2 mb-1 flex items-center justify-center ${isActive ? 'border-emerald-600 dark:border-white' : 'border-current'}`}>
        {isActive && <div className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-white" />}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-emerald-950 dark:text-white' : 'text-current'}`}>{label}</p>
      {sub && <p className={`text-[8px] font-bold leading-none ${isActive ? 'text-emerald-600/60 dark:text-white/60' : 'text-current'}`}>{sub}</p>}
    </button>
  );
}
