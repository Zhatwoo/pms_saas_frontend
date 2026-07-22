"use client";

import { useState, useEffect } from "react";

interface TransferEmployeeModalProps {
  isOpen: boolean;
  employeeName: string;
  fromBranch: string;
  branches: string[];
  onClose: () => void;
  onConfirm: (toBranch: string) => void;
}

export function TransferEmployeeModal({
  isOpen,
  employeeName,
  fromBranch,
  branches,
  onClose,
  onConfirm,
}: TransferEmployeeModalProps) {
  const [toBranch, setToBranch] = useState("");

  useEffect(() => {
    setToBranch("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md animate-[fadeInUp_0.25s_ease-out] rounded-xl border border-border-main bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-surface text-emerald-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 14 20 9 15 4" />
                <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Transfer Employee
              </h2>
              <p className="text-xs text-text-tertiary">
                Move employee to another branch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 px-6 py-5">
          {/* Employee Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Employee Name
            </label>
            <input
              type="text"
              value={employeeName}
              readOnly
              disabled
              className="cursor-not-allowed rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm font-semibold text-text-muted outline-none"
            />
          </div>

          {/* From Branch */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              From Branch
            </label>
            <input
              type="text"
              value={fromBranch}
              readOnly
              disabled
              className="cursor-not-allowed rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm font-semibold text-text-muted outline-none"
            />
          </div>

          {/* To Branch */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              To Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={toBranch}
              onChange={(e) => setToBranch(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-pawn-sidebar"
            >
              <option value="">Select destination branch...</option>
              {branches
                .filter((b) => b !== fromBranch)
                .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
            <svg className="mt-0.5 shrink-0 text-amber-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
              This will transfer <span className="font-semibold">{employeeName}</span> from{" "}
              <span className="font-semibold">{fromBranch}</span> to the selected branch.
              The employee&apos;s records will be updated accordingly.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (toBranch) {
                onConfirm(toBranch);
                onClose();
              }
            }}
            disabled={!toBranch}
            className="rounded-lg border border-pawn-sidebar-light bg-pawn-sidebar px-4 py-2 text-xs font-bold text-pawn-gold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
