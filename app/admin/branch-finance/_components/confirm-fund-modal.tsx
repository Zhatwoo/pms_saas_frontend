"use client";

import { useEffect, useState } from "react";

interface ConfirmFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receivedAmount: number, notes: string) => void;
  amount: number;
  requestNo?: string;
  branchName?: string;
}

export function ConfirmFundModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  requestNo,
  branchName,
}: ConfirmFundModalProps) {
  const [notes, setNotes] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setReceivedAmount(amount > 0 ? String(amount) : "");
    }
  }, [amount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(receivedAmount.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    onConfirm(parsed, notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-main px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Confirm Fund Receipt</h2>
              <p className="text-xs text-text-secondary">
                Finalize the transfer after your branch has received the funds.
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Awaiting Your Confirmation
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-900">
              PHP {amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-xs text-emerald-800/80">
              {requestNo ? `${requestNo} ` : ""}{branchName ? `for ${branchName}` : ""}
            </p>
          </div>

          <div className="rounded-xl border border-border-main bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
            Confirm this only after the transfer has been received by your branch. Once confirmed, the request will be marked as transferred and recorded in the branch ledger.
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Received Amount
            </label>
            <input
              type="text"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              className="w-full rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter actual amount received"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Confirmation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about the received funds"
              className="w-full resize-none rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input-border px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Confirm Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
