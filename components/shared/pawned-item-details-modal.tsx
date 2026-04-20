"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "./status-badge";

interface Renewal {
  date: string;
  amount: number;
}

interface Customer {
  id: string;
  full_name: string;
  address: string;
  barangay?: string;
  city?: string;
  province?: string;
  contact_number?: string;
  email?: string;
  id_presented?: string;
}

export interface DetailedPawnedItem {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  branch: string;
  branch_id: string;
  pawn_date: string;
  status: "Active" | "Redeemed" | "Expired";
  remarks: string;
  qr_code?: string;
  profile_photo?: string;
  id_photo?: string;
  condition?: string;
  serial_number?: string;
  items_included?: string;
  memory_storage?: string;
  amount: number;
  renewalCount: number;
  renewals: Renewal[];
  customer?: Customer;
  created_at?: string;
}

interface PawnedItemDetailsModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRemarks?: (id: string, remarks: string) => Promise<void>;
  userRole?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/70 border-b border-emerald-100 pb-2">
      {children}
    </h3>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-emerald-700" : "text-text-primary"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

const statusVariant: Record<string, "green" | "blue" | "red" | "orange"> = {
  Active: "green",
  Redeemed: "blue",
  Expired: "red",
};

export function PawnedItemDetailsModal({ itemId, isOpen, onClose, onSaveRemarks, userRole }: PawnedItemDetailsModalProps) {
  const [item, setItem] = useState<DetailedPawnedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = userRole === "super_admin" || userRole === "admin" || userRole === "employee";

  useEffect(() => {
    if (isOpen && itemId) {
      fetchDetails();
    } else {
      setItem(null);
      setRemarks("");
      setError(null);
    }
  }, [isOpen, itemId]);

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<DetailedPawnedItem>(`/inventory/pawned/${itemId}`);
      setItem(data);
      setRemarks(data.remarks || "");
    } catch (err: any) {
      setError(err.message || "Failed to fetch item details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!item || !onSaveRemarks) return;
    setIsSaving(true);
    try {
      await onSaveRemarks(item.id, remarks);
    } catch (err: any) {
      alert("Failed to save remarks.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8 overflow-y-auto print:bg-white print:p-0 print:block"
      onClick={onClose}
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-label, #print-label * {
            visibility: visible;
          }
          #print-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      {/* Neat Print Label Section (Only visible during print) */}
      <div id="print-label" className="hidden print:flex flex-col items-center justify-center bg-white p-4 text-black border border-zinc-200 rounded-lg w-[300px] h-[180px] mx-auto">
        <div className="flex w-full items-start gap-3">
          <div className="shrink-0">
             {item?.qr_code && (
               <img 
                 src={item.qr_code.startsWith('data:') ? item.qr_code : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${item.qr_code}`} 
                 alt="QR" 
                 className="w-24 h-24 object-contain"
               />
             )}
          </div>
          <div className="flex flex-col justify-center flex-1 min-w-0">
             <p className="text-[10px] font-black leading-none mb-1 text-emerald-800 uppercase">JCLB PAWNSHOP</p>
             <p className="text-xs font-black leading-tight uppercase truncate">{item?.item_name || "Unknown Item"}</p>
             <div className="mt-2 py-1 px-2 bg-zinc-100 rounded border border-zinc-200">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Unit Code</p>
                <p className="text-sm font-black tracking-tighter uppercase leading-none">{item?.item_id || "N/A"}</p>
             </div>
             <div className="mt-2 text-[8px] font-bold text-zinc-400 uppercase leading-none">
                <p>{item?.branch || "Unknown Branch"}</p>
                <p className="mt-0.5">{item?.pawn_date || "—"}</p>
             </div>
          </div>
        </div>
        <div className="mt-2 w-full border-t border-zinc-100 pt-1 text-center">
           <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.2em]">Inventory Security Label</p>
        </div>
      </div>

      <div 
        className="relative w-full max-w-5xl bg-surface rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row transition-all duration-500 scale-in-center print:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Section: Visuals & QR */}
        <div className="w-full md:w-[350px] bg-emerald-950 p-8 flex flex-col items-center text-center text-white shrink-0">
          <div className="mb-8 w-full">
             <SectionTitle><span className="text-emerald-400">Item Visuals</span></SectionTitle>
             <div className="relative group">
               <div className="aspect-square w-full rounded-3xl bg-emerald-900/50 border border-emerald-800 flex items-center justify-center overflow-hidden shadow-2xl">
                 {item?.profile_photo ? (
                   <img src={item.profile_photo} alt={item.item_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 ) : (
                   <div className="flex flex-col items-center opacity-30">
                     <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                     <p className="mt-4 text-[10px] font-black uppercase tracking-widest">No Image Available</p>
                   </div>
                 )}
               </div>
               <div className="absolute top-4 right-4">
                 <StatusBadge label={item?.status || "..."} variant={statusVariant[item?.status || ""] || "black"} />
               </div>
             </div>
          </div>

          <div className="w-full mt-auto">
             <p className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/50">Security Identity</p>
             <div className="bg-white p-4 rounded-[2rem] shadow-inner inline-block mx-auto mb-4 border-4 border-emerald-500/20">
               {item?.qr_code ? (
                 <img 
                   src={item.qr_code.startsWith('data:') ? item.qr_code : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${item.qr_code}`} 
                   alt="Security QR" 
                   className="w-40 h-40 object-contain"
                 />
               ) : (
                 <div className="w-40 h-40 flex items-center justify-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl">
                   <p className="text-[10px] font-bold text-zinc-400">NO QR GENERATED</p>
                 </div>
               )}
             </div>
             <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Scan to verify physical item</p>
             <p className="mt-1 text-[8px] opacity-40 uppercase">ITEM ID: {item?.item_id}</p>
          </div>
        </div>

        {/* Right Section: Detailed Information */}
        <div className="flex-1 p-8 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
               <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
               <p className="text-xs font-black uppercase tracking-widest">Retrieving Secure Data...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
               <div className="mb-6 text-rose-500">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               </div>
               <h4 className="text-lg font-black text-text-primary mb-2">Access Error</h4>
               <p className="text-sm text-text-tertiary mb-6">{error}</p>
               <button onClick={fetchDetails} className="px-6 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800">Retry Fetch</button>
            </div>
          ) : !item ? null : (
            <div className="space-y-10">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-main">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Pawned Inventory Record</span>
                  <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase">{item.item_name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-tighter">{item.category}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300" />
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-tighter">{item.branch}</span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Pawn Value</p>
                   <p className="text-3xl font-black text-emerald-700">₱{item.amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Grid 1: Item specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <DetailItem label="Unit Code" value={item.item_id} highlight />
                <DetailItem label="Pawn Date" value={item.pawn_date} />
                <DetailItem label="Serial #" value={item.serial_number || "—"} />
                <DetailItem label="Renewals" value={`${item.renewalCount} Cycles`} />
                <DetailItem label="Memory/Storage" value={item.memory_storage || "—"} />
                <DetailItem label="Condition" value={item.condition || "—"} />
                <DetailItem label="Includes" value={item.items_included || "—"} />
                <DetailItem label="Records Date" value={item.created_at?.split('T')[0] || item.pawn_date} />
              </div>

              {/* Grid 2: Customer info */}
              <div className="rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 space-y-6">
                <SectionTitle>Customer Profile</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <DetailItem label="Full Name" value={item.customer?.full_name || "WALK-IN CUSTOMER"} />
                   <DetailItem label="Contact Number" value={item.customer?.contact_number || "—"} />
                   <DetailItem label="ID Presented" value={item.customer?.id_presented || "—"} />
                   <div className="md:col-span-2 lg:col-span-3">
                      <DetailItem label="Primary Residence / Address" value={
                        [item.customer?.address, item.customer?.barangay, item.customer?.city, item.customer?.province]
                          .filter(Boolean)
                          .join(", ") || "No address recorded"
                      } />
                   </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <SectionTitle>Inventory Remarks & Investigations</SectionTitle>
                {canEdit ? (
                  <div className="space-y-3">
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add internal notes about the item condition or specific investigations..."
                      className="w-full min-h-[120px] rounded-3xl border border-border-main bg-white p-6 text-sm font-medium text-text-primary outline-none focus:border-emerald-500 shadow-inner"
                    />
                    {onSaveRemarks && (
                      <div className="flex justify-end">
                        <button 
                          onClick={handleSaveRemarks}
                          disabled={isSaving || remarks === item.remarks}
                          className="rounded-2xl bg-emerald-700 px-8 py-3 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-30 transition-all flex items-center gap-2"
                        >
                          {isSaving && <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                          {isSaving ? "SAVING..." : "UPDATE REMARKS"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-zinc-50 p-6 border border-zinc-200">
                    <p className="text-sm font-medium italic text-text-secondary leading-relaxed">
                      "{item.remarks || "No additional notes or description provided for this item."}"
                    </p>
                  </div>
                )}
              </div>

              {/* Renewal History */}
              <div className="space-y-6">
                 <SectionTitle>Financial Renewal Lifecycle</SectionTitle>
                 <div className="space-y-3">
                    {item.renewals.length > 0 ? (
                      item.renewals.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-100 group hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700">R{i+1}</div>
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight">Renewal Payment Cycle {i+1}</p>
                                <p className="text-[10px] font-bold text-text-tertiary">PROCESSED ON {r.date}</p>
                             </div>
                          </div>
                          <p className="text-sm font-black text-emerald-700">₱{r.amount.toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center opacity-30 border-2 border-dashed border-zinc-200 rounded-[2rem]">
                         <p className="text-[10px] font-black uppercase tracking-widest">Original Pawn Cycle (No Renewals)</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-8 border-t border-zinc-100 flex items-center justify-between">
                 <p className="text-[10px] font-bold text-text-tertiary italic">Last updated: {item.created_at?.split('T')[0] || "—"}</p>
                 <div className="flex gap-4">
                    <button 
                      onClick={onClose}
                      className="px-8 py-4 rounded-2xl border border-border-main text-xs font-black text-text-secondary hover:bg-surface-secondary active:scale-95 transition-all"
                    >
                      CLOSE RECORD
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="px-8 py-4 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-black active:scale-95 transition-all shadow-xl"
                    >
                      PRINT LABEL
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button Top-Right (Desktop) */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-50 md:hidden lg:flex"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  );
}
