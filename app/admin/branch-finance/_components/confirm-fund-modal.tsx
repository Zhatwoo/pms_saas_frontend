"use client";

import { useEffect, useState } from "react";

interface ConfirmFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    receivedAmount: number;
    notes: string;
    proofFile: File | null;
  }) => void;
  amount: number;
  requestNo?: string;
  branchName?: string;
  sourceBranchName?: string | null;
  transferMode?: string | null;
  stageLabel?: string;
  amountLabel?: string;
  helperText?: string;
  isSubmitting?: boolean;
}

export function ConfirmFundModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  requestNo,
  branchName,
  sourceBranchName,
  transferMode,
  stageLabel = "Confirm Fund Receipt",
  amountLabel = "Actual Amount Received",
  helperText = "Upload a proof image of the transaction and enter the actual amount received. The system will use this amount as the transfer basis.",
  isSubmitting = false,
}: ConfirmFundModalProps) {
  const [notes, setNotes] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasMaxAmount = Number.isFinite(amount) && amount > 0;

  const formatAmountError = () =>
    hasMaxAmount
      ? `Amount cannot exceed ₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      : "Enter a valid amount.";

  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setReceivedAmount(amount > 0 ? String(amount) : "");
      setProofFile(null);
      setProofName(null);
      setError(null);
    }
  }, [amount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(receivedAmount.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(formatAmountError());
      return;
    }
    if (hasMaxAmount && parsed > amount) {
      setError(formatAmountError());
      return;
    }
    if (!proofFile) {
      setError("Upload a proof image before confirming.");
      return;
    }

    onConfirm({
      receivedAmount: parsed,
      notes: notes.trim(),
      proofFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-main px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{stageLabel}</h2>
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Receipt Confirmation
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-200">
              ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-xs text-emerald-200/80">
              {requestNo ? `${requestNo} ` : ""}{branchName ? `for ${branchName}` : ""}
            </p>
            {sourceBranchName ? (
              <p className="mt-1 text-xs text-emerald-200/80">
                Source: {sourceBranchName}
              </p>
            ) : null}
            {transferMode ? (
              <p className="mt-1 text-xs text-emerald-200/80">
                Transfer mode: {transferMode.replaceAll("_", " ")}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border-main bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
            {helperText}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              {amountLabel}
            </label>
            <input
              type="text"
              value={receivedAmount}
              onChange={(e) => {
                const nextValue = e.target.value.replace(/[^0-9.,]/g, "");
                if (!hasMaxAmount) {
                  setReceivedAmount(nextValue);
                  setError(null);
                  return;
                }

                const parsed = Number(nextValue.replace(/,/g, ""));
                if (Number.isFinite(parsed) && parsed > amount) {
                  setReceivedAmount(String(amount));
                  setError(formatAmountError());
                  return;
                }

                setReceivedAmount(nextValue);
                setError(null);
              }}
              className="w-full rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter actual amount received"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Proof of Transaction
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setProofFile(file);
                setProofName(file?.name ?? null);
                setError(null);
              }}
              className="w-full rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
            {proofName ? (
              <p className="mt-2 text-xs text-text-muted">Selected proof: {proofName}</p>
            ) : null}
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

          {error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input-border bg-surface-secondary px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {isSubmitting ? "Processing..." : "Confirm Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
