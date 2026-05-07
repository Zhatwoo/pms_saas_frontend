"use client";

import { useState } from "react";
import { formatPeso } from "@/lib/currency";
interface CancelFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  amount: number;
}

export function CancelFundModal({ isOpen, onClose, onConfirm, amount }: CancelFundModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border-main px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Cancel Fund Transfer</h2>
              <p className="text-xs text-text-secondary">Provide a reason for cancellation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Amount to Cancel
            </p>
            <p className="mt-1 text-3xl font-extrabold text-red-800 dark:text-red-300">
              {formatPeso(amount)}
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you cancelling this transaction?"
              className="h-24 w-full resize-none rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-red-400 focus:ring-1 focus:ring-red-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input-border px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={reason.trim() === ""}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
