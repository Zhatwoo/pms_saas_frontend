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
}: ConfirmFundModalProps) {
  const [notes, setNotes] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError("Enter a valid amount.");
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Receipt Confirmation
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-900">
              ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-xs text-emerald-800/80">
              {requestNo ? `${requestNo} ` : ""}{branchName ? `for ${branchName}` : ""}
            </p>
            {sourceBranchName ? (
              <p className="mt-1 text-xs text-emerald-800/80">
                Source: {sourceBranchName}
              </p>
            ) : null}
            {transferMode ? (
              <p className="mt-1 text-xs text-emerald-800/80">
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
              onChange={(e) => setReceivedAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

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
