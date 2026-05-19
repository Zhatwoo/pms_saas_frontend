"use client";

import { useState, useEffect } from "react";
import { formatPeso } from "@/lib/currency";
import { toast } from "sonner";

interface DailyBalanceConfirmationProps {
  isOpen: boolean;
  type: "starting" | "ending";
  currentCash: string;
  onConfirm: (amount: string) => void;
  onClose: () => void;
  /** Override title line (e.g. new business day branch messaging). */
  titleOverride?: string;
  /** Override subtitle under title. */
  subtitleOverride?: string;
  /** When true, disables Confirm button to prevent submission while expected amount is loading. */
  isLoadingExpectedAmount?: boolean;
}

export function DailyBalanceConfirmation({
  isOpen,
  type,
  currentCash,
  onConfirm,
  onClose,
  titleOverride,
  subtitleOverride,
  isLoadingExpectedAmount,
}: DailyBalanceConfirmationProps) {
  const [confirmedAmount, setConfirmedAmount] = useState("0.00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsSubmitting(false);
    if (type === "starting") {
      const raw = parseFloat(String(currentCash ?? "").replace(/,/g, ""));
      const n = Number.isFinite(raw) ? raw : 0;
      setConfirmedAmount(
        n.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
      return;
    }

    setConfirmedAmount("0.00");
  }, [isOpen, currentCash, type]);

  if (!isOpen) return null;

  const formatCurrencyInput = (value: string) => {
    // Remove all non-numeric characters
    const digits = value.replace(/\D/g, "");
    if (!digits) return "0.00";

    // Convert to number and back to string with 2 decimal places
    const amount = parseInt(digits, 10) / 100;
    return amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setConfirmedAmount(formatted);
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    const rawValue = confirmedAmount.replace(/,/g, "");
    if (isNaN(parseFloat(rawValue))) return;

    setIsSubmitting(true);
    try {
      await onConfirm(rawValue);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save balance. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md scale-in-center rounded-2xl bg-surface p-6 shadow-2xl border border-border-main">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-amber-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary capitalize">
              {titleOverride ?? `${type} Cash Confirmation`}
            </h2>
            <p className="text-xs text-text-tertiary">
              {subtitleOverride ??
                "Please verify the physical cash on hand before proceeding."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-surface-secondary p-4 border border-border-subtle">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Expected Amount</label>
            <p className="text-2xl font-black text-amber-400">
              {formatPeso(
                Number(String(currentCash ?? "0").replace(/,/g, "")) || 0,
              )}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary">Actual Physical Cash</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">₱</span>
              <input
                type="text"
                value={confirmedAmount}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border-2 border-border-main bg-surface py-4 pl-10 pr-4 text-xl font-black text-amber-400 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
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
          {type !== "starting" && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-border-main py-3 text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !confirmedAmount || isLoadingExpectedAmount}
            className={`${type !== "starting" ? "flex-1" : "w-full"} rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              type === "starting" ? "bg-emerald-700 shadow-emerald-700/20" : "bg-amber-600 shadow-amber-600/20"
            }`}
          >
            {isSubmitting ? "Processing..." : isLoadingExpectedAmount ? "Loading expected amount..." : "Confirm & Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}
