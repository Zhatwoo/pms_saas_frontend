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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-emerald-950/80 p-4 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-emerald-500/20 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-emerald-50 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </div>
            <div>
              <h1 className="leading-none text-xl font-black uppercase tracking-tight text-emerald-950">Renew Transaction</h1>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">{branchName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-zinc-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-400 hover:text-zinc-900">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8">
          <div className="flex h-full w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white">
            <div className="flex w-3/5 flex-col gap-6 overflow-y-auto p-8">
              <div className="grid grid-cols-2 gap-6">
                <InfoCard title="Loan Info" />
                <InfoCard title="Item Details" />
                <InfoCard title="Financials" />
                <InfoCard title="Logistics & Admin" />
              </div>
            </div>

            <div className="flex w-2/5 flex-col gap-6 bg-emerald-900 p-8 text-white">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-400">Unit Code</label>
                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/10 p-1">
                  <div className="rounded-lg border border-white/5 bg-emerald-950 px-3 py-2 text-sm font-black text-emerald-400">10-JCLB-</div>
                  <input
                    type="text"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 font-bold text-white outline-none"
                  />
                  <button className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-black uppercase text-emerald-950 hover:bg-emerald-400">Search</button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-emerald-950/50 p-4">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Qty of items</span>
                <div className="flex items-center gap-5">
                  <button onClick={() => setItemsRenewed(Math.max(0, itemsRenewed - 1))} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 font-black hover:bg-white/20">-</button>
                  <div className="flex h-10 w-10 items-center justify-center text-3xl font-black">{itemsRenewed}</div>
                  <button onClick={() => setItemsRenewed(itemsRenewed + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 font-black hover:bg-white/20">+</button>
                </div>
              </div>

              <button className="mt-auto w-full rounded-xl bg-emerald-500 py-4 text-lg font-black uppercase tracking-tight text-emerald-950 hover:bg-emerald-400">
                Proceed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">{title}</h3>
      <div className="space-y-3">
        <DetailRow label="Name" value="--" />
        <DetailRow label="Code" value="----" />
        <DetailRow label="Status" value="--" />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-slate-500">{label}:</span>
      <div className="flex-1 border-b border-dashed border-slate-200" />
      <span className="text-sm font-bold tracking-tight text-slate-700">{value}</span>
    </div>
  );
}
