"use client";

import { useState } from "react";

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
}

export function RenewModal({ isOpen, onClose, branchName }: RenewModalProps) {
  const [unitCode, setUnitCode] = useState("");
  const [itemsRenewed, setItemsRenewed] = useState(0);
  const [amount, setAmount] = useState("0.00");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/80 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-5xl h-[650px] overflow-hidden rounded-2xl border border-emerald-500/20 bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-6 py-3 border-b border-emerald-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none">Renew Transaction</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{branchName}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-400 group-hover:text-zinc-900">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Section - Data */}
          <div className="w-[60%] p-8 pt-6 overflow-y-auto bg-slate-50/30 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <DetailGroup title="Loan Info">
                <DetailRow label="Name" value="--" />
                <DetailRow label="Contact Number" value="--" />
                <DetailRow label="Unit Code" value="----" />
                <DetailRow label="Unit" value="----" />
                <DetailRow label="Category" value="----" highlight />
              </DetailGroup>

              <DetailGroup title="Item Details">
                <DetailRow label="Serial No." value="----" />
                <DetailRow label="Condition" value="--" />
                <DetailRow label="Memory" value="----" />
                <DetailRow label="Items Included" value="----" color="text-emerald-700" />
              </DetailGroup>

              <DetailGroup title="Financials">
                <DetailRow label="Amount" value={amount} onChange={setAmount} isEditable prefix="₱" />
                <DetailRow label="Storage Fee" value="₱ 0.00" />
                <DetailRow label="Parking Fee" value="₱ 0.00" />
                <DetailRow label="Remarks" value="-----" italic />
              </DetailGroup>

              <DetailGroup title="Logistics & Admin">
                <DetailRow label="Barcode ID" value="--" />
                <DetailRow label="Processed by" value="--" />
                <DetailRow label="Purchased" value="----" />
                <DetailRow label="Expiration" value="----" color="text-red-500" />
              </DetailGroup>
            </div>
          </div>

          {/* Right Section - Action Panel */}
          <div className="w-[40%] bg-emerald-900 p-6 pt-5 text-white flex flex-col gap-5">
            {/* Unit Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Unit Code</label>
              <div className="flex bg-white/10 rounded-xl overflow-hidden border border-white/10 p-1 group focus-within:ring-2 ring-emerald-400/50">
                <div className="bg-emerald-950 px-3 py-2 text-emerald-400 font-black text-sm rounded-lg border border-white/5">
                  10-JCLB-
                </div>
                <input 
                  type="text" 
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 font-bold outline-none text-white min-w-0"
                />
                <button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2 rounded-lg font-black text-xs uppercase transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                  Search
                </button>
              </div>
            </div>

            {/* Checkboxes Layout */}
            <div className="space-y-4 py-1">
              <div className="flex items-center justify-between group">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-emerald-500 rounded border-white/20 bg-white/10" defaultChecked />
                  <span className="text-lg font-black uppercase tracking-tight group-hover:text-emerald-300 transition-colors">Renew</span>
                </label>
                <div className="flex flex-col items-center opacity-60">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Period</span>
                  <div className="w-16 h-0.5 bg-emerald-400/30 mt-1" />
                </div>
              </div>

              <div className="flex items-center justify-between group">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-emerald-500 rounded border-white/20 bg-white/10" />
                  <span className="text-lg font-black uppercase tracking-tight group-hover:text-emerald-300 transition-colors">ReAppraise</span>
                </label>
                <div className="flex flex-col items-center opacity-60">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Extend</span>
                  <div className="w-16 h-0.5 bg-emerald-400/30 mt-1" />
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between bg-emerald-950/50 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Qty of items</span>
              <div className="flex items-center gap-5">
                <button onClick={() => setItemsRenewed(Math.max(0, itemsRenewed - 1))} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-black transition-all active:scale-90">-</button>
                <div className="w-10 h-10 flex items-center justify-center font-black text-3xl">{itemsRenewed}</div>
                <button onClick={() => setItemsRenewed(itemsRenewed + 1)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-black transition-all active:scale-90">+</button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] ml-1">Processed By</label>
                <input type="text" className="w-full bg-white/10 rounded-xl px-4 py-3 font-bold border border-white/10 outline-none focus:bg-white/20 transition-all text-sm" placeholder="Admin Name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] ml-1">Password</label>
                <input type="password" className="w-full bg-white/10 text-white rounded-xl px-4 py-3 font-bold border border-white/10 outline-none focus:bg-white/20 transition-all" placeholder="••••••••" />
              </div>
              <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 rounded-xl shadow-[0_15px_30px_-5px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] text-xl uppercase tracking-tighter mt-1 flex items-center justify-center gap-2 border-t border-emerald-300/30">
                Proceed
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3.5">
      <h3 className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.4em] border-b border-emerald-900/5 pb-1">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ 
  label, 
  value, 
  highlight, 
  color, 
  isEditable, 
  onChange, 
  prefix,
  italic 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean; 
  color?: string;
  isEditable?: boolean;
  onChange?: (val: string) => void;
  prefix?: string;
  italic?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 group">
      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest group-hover:text-emerald-700 transition-colors shrink-0">{label}:</span>
      <div className="flex-1 border-b border-dashed border-zinc-200" />
      {isEditable ? (
        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          {prefix && <span className="text-emerald-700 font-black text-xs">{prefix}</span>}
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange?.(e.target.value)}
            className="w-16 bg-transparent text-right font-black text-sm text-emerald-900 outline-none"
          />
        </div>
      ) : (
        <span className={`font-black text-sm tracking-tight ${italic ? 'italic font-medium text-zinc-500' : ''} ${highlight ? 'text-emerald-900 text-base' : color || 'text-zinc-800'}`}>
          {value}
        </span>
      )}
    </div>
  );
}
