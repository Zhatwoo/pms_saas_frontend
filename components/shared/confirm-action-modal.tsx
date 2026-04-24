"use client";

import { useState } from "react";

export type ConfirmActionVariant = "warning" | "danger";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmActionVariant;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "warning",
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  const [isWorking, setIsWorking] = useState(false);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const borderClass = isDanger ? "border-red-200 dark:border-red-900/50" : "border-orange-200 dark:border-orange-900/50";
  const iconWrapClass = isDanger ? "bg-red-100 dark:bg-red-950/60" : "bg-orange-100 dark:bg-orange-950/50";
  const iconStroke = isDanger ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400";
  const btnClass = isDanger
    ? "border-red-600 bg-red-600 hover:opacity-90"
    : "border-orange-600 bg-orange-600 hover:opacity-90";

  async function handleConfirm() {
    setIsWorking(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!isWorking) onClose();
        }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className={`relative z-10 w-full max-w-md rounded-xl border ${borderClass} bg-surface shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pt-6">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconWrapClass}`}>
            {isDanger ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconStroke}>
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconStroke}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>
          <h3 id="confirm-action-title" className="mt-4 text-base font-bold text-text-primary">
            {title}
          </h3>
          <p className="mt-2 text-center text-sm leading-relaxed text-text-secondary">{message}</p>
        </div>
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="flex-1 rounded-lg border border-border-main bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isWorking}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50 ${btnClass}`}
          >
            {isWorking ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
