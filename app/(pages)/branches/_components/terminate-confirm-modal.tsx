"use client";

import { useState } from "react";

interface TerminateConfirmModalProps {
  isOpen: boolean;
  branchName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function TerminateConfirmModal({
  isOpen,
  branchName,
  onClose,
  onConfirm,
}: TerminateConfirmModalProps) {
  const [isTerminating, setIsTerminating] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    setIsTerminating(true);
    try {
      await onConfirm();
    } finally {
      setIsTerminating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm animate-[fadeInUp_0.25s_ease-out] rounded-xl border border-red-200 bg-surface shadow-2xl">
        {/* Warning Icon */}
        <div className="flex flex-col items-center px-6 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h3 className="mt-4 text-base font-bold text-text-primary">
            Terminate Branch
          </h3>
          <p className="mt-2 text-center text-xs leading-relaxed text-text-tertiary">
            Are you sure you want to terminate{" "}
            <span className="font-bold text-text-primary">{branchName}</span>?
            This will set the branch status to{" "}
            <span className="font-semibold text-red-600">Terminated</span> and
            it will no longer appear as active.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isTerminating}
            className="flex-1 rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isTerminating}
            className="flex-1 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isTerminating ? "Terminating..." : "Yes, Terminate"}
          </button>
        </div>
      </div>
    </div>
  );
}
