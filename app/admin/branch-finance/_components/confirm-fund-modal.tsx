"use client";

import { useEffect, useState } from "react";
import { formatPeso } from "@/lib/currency";

interface ConfirmFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    receivedAmount: number;
    notes: string;
    proofFile: File | null;
  }) => void | Promise<void>;
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

  async function runConfirm(): Promise<void> {
    if (isSubmitting) return;

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

    setError(null);
    try {
      await Promise.resolve(
        onConfirm({
          receivedAmount: parsed,
          notes: notes.trim(),
          proofFile,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Confirmation failed.";
      setError(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-main px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 sm:h-10 sm:w-10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-text-primary sm:text-lg">{stageLabel}</h2>
              <p className="text-xs text-text-secondary">
                Finalize the transfer after your branch has received the funds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void runConfirm();
          }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5"
        >
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Receipt Confirmation
            </p>
            <p className="mt-2 break-words text-2xl font-extrabold text-emerald-200 sm:text-3xl">
              {formatPeso(amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
            </p>
            <p className="mt-2 break-words text-xs text-emerald-200/80">
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

          <div className="rounded-xl border border-border-main bg-surface-secondary px-3 py-3 text-xs leading-relaxed text-text-secondary sm:px-4 sm:text-sm">
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
              className="w-full rounded-lg border border-input-border bg-input-bg p-3 text-base text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
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
              onChange={handleProofFileChange}
              className="sr-only"
            />
            <div
              role="button"
              tabIndex={0}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleProofDrop}
              onPaste={handleProofPaste}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  proofInputRef.current?.click();
                }
              }}
              onClick={() => proofInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input-border bg-input-bg p-3 text-center text-sm font-semibold text-text-primary outline-none transition-colors hover:border-emerald-500 hover:bg-emerald-500/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{proofName ? "Change proof image" : "Drop or choose proof image"}</span>
              <span className="text-xs font-medium text-text-tertiary">Paste image also works</span>
            </div>
            {proofFile ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                {proofPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proofPreviewUrl} alt="Selected proof preview" className="h-28 w-full object-cover sm:h-36" />
                ) : null}
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <p className="min-w-0 truncate text-xs font-semibold text-text-secondary">
                    {proofName}
                  </p>
                  <button
                    type="button"
                    onClick={clearProofFile}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
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
              className="w-full resize-none rounded-lg border border-input-border bg-input-bg p-3 text-base text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3 sm:pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input-border bg-surface-secondary px-5 py-3 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-hover sm:py-2.5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void runConfirm()}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5"
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
