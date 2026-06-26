"use client";

import { useState, useEffect } from "react";
import { formatPeso } from "@/lib/currency";

interface BranchEndDayModalProps {
  isOpen: boolean;
  systemEndingBalance: number;
  manilaBusinessDate: string;
  onClose: () => void;
  onConfirm: (physicalEndingAmount: number | undefined) => Promise<void>;
}

/**
 * Branch-wide end day: ledger reconciliation uses system ending; optional physical count for audit trail.
 */
export function BranchEndDayModal({
  isOpen,
  systemEndingBalance,
  manilaBusinessDate,
  onClose,
  onConfirm,
}: BranchEndDayModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [physicalInput, setPhysicalInput] = useState("0.00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setPhysicalInput(
        systemEndingBalance.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
      setIsSubmitting(false);
    }
  }, [isOpen, systemEndingBalance]);

  if (!isOpen) return null;

  const formatCurrencyInput = (value: string) => {
    const trimmed = value.replace(/\s/g, "");
    const negative = trimmed.startsWith("-");
    const digits = trimmed.replace(/-/g, "").replace(/\D/g, "");
    if (!digits) {
      return negative ? "-0.00" : "0.00";
    }
    const amount = parseInt(digits, 10) / 100;
    const signed = negative ? -amount : amount;
    return signed.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePhysicalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhysicalInput(formatCurrencyInput(e.target.value));
  };

  const handleSubmit = async () => {
    if (!confirmed || isSubmitting) return;
    const raw = physicalInput.replace(/,/g, "");
    const parsed = parseFloat(raw);
    const physical =
      Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

    setIsSubmitting(true);
    try {
      await onConfirm(physical);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md scale-in-center rounded-2xl bg-surface p-6 shadow-2xl border border-border-main">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text-primary">End branch business day</h2>
          <p className="mt-1 text-xs text-text-tertiary">
            This closes the branch-wide finance session for Manila calendar date{" "}
            <span className="font-semibold text-text-secondary">{manilaBusinessDate}</span>. All employees share this
            close; it is not tied to one employee session.
          </p>
        </div>

        <div className="rounded-xl bg-surface-secondary p-4 border border-border-subtle mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">System ending balance</p>
          <p className="text-2xl font-black text-amber-400">{formatPeso(systemEndingBalance)}</p>
          <p className="mt-2 text-[10px] text-text-tertiary leading-relaxed">
            Stored totals use branch ledger reconciliation (starting balance plus operational cash movement). Adjust the
            physical count below only if you need that figure recorded for audit. The system figure can be negative when
            cash out exceeds cash in for the day.
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-text-secondary">Physical cash on hand</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">₱</span>
            <input
              type="text"
              value={physicalInput}
              onChange={handlePhysicalChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border-2 border-border-main bg-surface py-3 pl-10 pr-4 text-lg font-bold text-amber-400 outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3 mb-6">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 h-4 w-4 rounded border-border-main text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs text-text-secondary leading-relaxed">
            I confirm the branch business day is ending for this branch. Transactions for this calendar date will be
            locked after close until the next business day starts with a new branch starting balance.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-border-main py-3 text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !confirmed}
            className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Closing…" : "Confirm end day"}
          </button>
        </div>
      </div>
    </div>
  );
}
