"use client";

import { useState, useEffect } from "react";

export interface ManualTransactionPayload {
  transactionNo: string;
  type: "Cash In" | "Cash Transfer";
  amount: number;
  details: string;
  date: string;
  time: string;
  branch?: string;
  fromBranch?: string;
  toBranch?: string;
}

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualTransactionPayload) => void;
  branches?: string[];
  currentBranch?: string;
}

export function ManualTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  branches = [],
  currentBranch = "",
}: ManualTransactionModalProps) {
  const [type, setType] = useState<"Cash In" | "Cash Transfer">("Cash Transfer");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [transactionNo, setTransactionNo] = useState("");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDetails("");
      // Generate a mock transaction number
      setTransactionNo("MT" + Math.random().toString(36).substr(2, 6).toUpperCase());
      const defaultBranch = currentBranch && currentBranch !== "All Branches" ? currentBranch : (branches[1] || branches[0] || "");
      setFromBranch(defaultBranch);
      setToBranch(branches[1] || branches[0] || "");
      setTargetBranch(defaultBranch);
    }
  }, [isOpen, currentBranch, branches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      transactionNo,
      type,
      amount: parseFloat(amount.replace(/,/g, "")) || 0,
      details,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(type === "Cash In" ? { branch: targetBranch } : { fromBranch, toBranch }),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-[fadeInUp_0.2s_ease-out] rounded-xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 bg-brand-green/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green shadow-sm border border-brand-green/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-green leading-tight">Cash Transfer Entry</h2>
              <p className="text-[10px] font-medium text-text-tertiary">Record cash adjustments manually</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-surface-secondary rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setType("Cash In")}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  type === "Cash In"
                    ? "bg-brand-green text-white shadow-md scale-[1.02]"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Cash In
              </button>
              <button
                type="button"
                onClick={() => setType("Cash Transfer")}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  type === "Cash Transfer" 
                    ? "bg-amber-600 text-white shadow-md scale-[1.02]" 
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 11l4-4-4-4M21 7H9a5 5 0 0 0-5 5v3M7 13l-4 4 4 4M3 17h12a5 5 0 0 0 5-5v-3"></path></svg>
                Transfer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Transaction No.</label>
              <input
                type="text"
                value={transactionNo}
                onChange={(e) => setTransactionNo(e.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-xs font-mono outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Amount (₱)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">₱</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setAmount(val);
                  }}
                  placeholder="0.00"
                  required
                  className="w-full rounded-lg border border-border-main bg-surface pl-7 pr-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 font-bold text-brand-green"
                />
              </div>
            </div>
          </div>

          {type === "Cash Transfer" ? (
            <div className="grid grid-cols-2 gap-4 bg-brand-green/5 p-3 rounded-xl border border-brand-green/10">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-green">From Branch</label>
                <select
                  value={fromBranch}
                  onChange={(e) => setFromBranch(e.target.value)}
                  className="w-full rounded-lg border border-brand-green/20 bg-surface px-3 py-2 text-xs outline-none focus:border-brand-green"
                >
                  {branches.filter(b => b !== "All Branches").map((b) => (
                    <option key={`from-${b}`} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-700">To Branch</label>
                <select
                  value={toBranch}
                  onChange={(e) => setToBranch(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-surface px-3 py-2 text-xs outline-none focus:border-amber-500"
                >
                  {branches.filter(b => b !== "All Branches").map((b) => (
                    <option key={`to-${b}`} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 bg-brand-green/5 p-3 rounded-xl border border-brand-green/10">
              <label className="text-[11px] font-bold uppercase tracking-wider text-brand-green">Branch (Where to Cash In)</label>
              <select
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="w-full rounded-lg border border-brand-green/20 bg-surface px-3 py-2 text-xs outline-none focus:border-brand-green"
              >
                {branches.filter(b => b !== "All Branches").map((b) => (
                  <option key={`target-${b}`} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Remarks / Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Enter transaction details..."
              className="w-full rounded-xl border border-border-main bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 resize-none transition-shadow duration-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-xs font-bold text-white rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all ${
                type === "Cash In" ? "bg-brand-green shadow-brand-green/20" : "bg-amber-600 shadow-amber-600/20"
              }`}
            >
              Complete Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
