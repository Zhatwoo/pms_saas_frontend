"use client";

import { useState, useEffect } from "react";

interface DailyBalanceConfirmationProps {
  isOpen: boolean;
  type: "starting" | "ending";
  currentCash: string;
  onConfirm: (amount: string) => void;
  onClose: () => void;
}

export function DailyBalanceConfirmation({
  isOpen,
  type,
  currentCash,
  onConfirm,
  onClose,
}: DailyBalanceConfirmationProps) {
  const [confirmedAmount, setConfirmedAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmedAmount("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatWithCommas = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    if (!cleanValue) return "";
    const parts = cleanValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    const rawValue = confirmedAmount.replace(/,/g, "");
    if (!rawValue || isNaN(parseFloat(rawValue))) return;

    setIsSubmitting(true);
    try {
      await onConfirm(rawValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md scale-in-center rounded-2xl bg-surface p-6 shadow-2xl border border-border-main">
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${type === "starting" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary capitalize">{type} Cash Confirmation</h2>
            <p className="text-xs text-text-tertiary">Please verify the physical cash on hand before proceeding.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-surface-secondary p-4 border border-border-subtle">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Expected Amount</label>
            <p className="text-2xl font-black text-text-primary">₱{parseFloat(currentCash).toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary">Actual Physical Cash</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">₱</span>
              <input
                type="text"
                placeholder="0.00"
                value={confirmedAmount}
                onChange={(e) => setConfirmedAmount(formatWithCommas(e.target.value))}
                disabled={isSubmitting}
                className="w-full rounded-xl border-2 border-border-main bg-surface py-4 pl-10 pr-4 text-xl font-black text-emerald-700 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
            <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
              <span className="font-bold">Note:</span> Any discrepancy will be logged and flagged for management review. Ensure all coins and bills are counted.
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-border-main py-3 text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !confirmedAmount}
            className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              type === "starting" ? "bg-emerald-700 shadow-emerald-700/20" : "bg-amber-600 shadow-amber-600/20"
            }`}
          >
            {isSubmitting ? "Processing..." : "Confirm & Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}
