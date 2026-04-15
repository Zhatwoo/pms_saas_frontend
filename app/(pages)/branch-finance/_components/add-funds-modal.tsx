"use client";

import { useState, useEffect, useMemo } from "react";
import type { BranchBalance } from "./balance-overview";

export interface Manager {
  id: string;
  name: string;
  role: string;
}

export interface UnifiedFundResult {
  sourceType: "MANAGEMENT" | "BRANCH_TRANSFER";
  fromBranchId?: string;
  toBranchId: string;
  amount: number;
  notes: string;
  approvers: string[];
  requireAllOrReceiving: boolean; // Meaning depends on sourceType
}

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UnifiedFundResult) => void;
  branchName: string; // Used as default target branch name
  managers: Manager[]; // Target branch managers (used if MANAGEMENT)
  branches: BranchBalance[]; // List of all branches for transfer
  currentBranchId: string; // The currently selected branch context
  getManagersForBranch: (branchId: string) => Manager[];
  defaultAmount?: string;
  defaultNotes?: string;
  allowBranchTransfer?: boolean;
  submitLabel?: string;
}

const MULTI_APPROVAL_THRESHOLD = 50_000;

export function AddFundsModal({
  isOpen,
  onClose,
  onSubmit,
  branchName,
  managers: targetManagers,
  branches,
  currentBranchId,
  getManagersForBranch,
  defaultAmount = "",
  defaultNotes = "",
  allowBranchTransfer = true,
  submitLabel,
}: AddFundsModalProps) {
  const [sourceType, setSourceType] = useState<"MANAGEMENT" | "BRANCH_TRANSFER">("MANAGEMENT");

  // Transfer specific state
  const [fromBranchId, setFromBranchId] = useState(currentBranchId || "");
  const [toBranchId, setToBranchId] = useState(currentBranchId || "");

  // Shared state
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isTransfer = sourceType === "BRANCH_TRANSFER";
  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;

  // Active managers depend on mode
  const activeManagers = isTransfer
    ? getManagersForBranch(fromBranchId)
    : targetManagers;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSourceType("MANAGEMENT");
      setAmount(defaultAmount);
      setNotes(defaultNotes);
      setFromBranchId(currentBranchId || (branches[0]?.branchId ?? ""));
      setToBranchId(currentBranchId !== "001" ? currentBranchId : ""); // 001 usually means All Branches
      setErrors({});
    }
  }, [isOpen, defaultAmount, defaultNotes, currentBranchId, branches]);

  // Handle source toggle change reset
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
  }, [sourceType, isOpen]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!amount.trim() || numericAmount <= 0) errs.amount = "Enter a valid amount";

    if (toBranchId === "001") {
      errs.to = "Please select a specific target branch";
    }

    if (isTransfer) {
      if (!fromBranchId) errs.from = "Select source branch";
      if (!toBranchId) errs.to = "Select target branch";
      if (fromBranchId && toBranchId && fromBranchId === toBranchId)
        errs.to = "Cannot transfer to the same branch";

      const fromBr = branches.find((b) => b.branchId === fromBranchId);
      if (fromBr && numericAmount > fromBr.currentBalance) {
        errs.amount = `Insufficient balance (available: ₱${fromBr.currentBalance.toLocaleString("en-PH")})`;
      }
    } else {
      // Management mode: just need a target
      if (!toBranchId || toBranchId === "001") errs.to = "Select a valid target branch";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      sourceType,
      fromBranchId: isTransfer ? fromBranchId : undefined,
      toBranchId: toBranchId,
      amount: numericAmount,
      notes: notes.trim(),
      approvers: activeManagers.map((m) => m.id),
      requireAllOrReceiving: false,
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg animate-[fadeInUp_0.25s_ease-out] rounded-xl border border-border-main bg-surface shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isTransfer ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"}`}>
              {isTransfer ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Manage Branch Funds</h2>
              <p className="text-xs text-text-tertiary">Direct capital injection or branch transfers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Source Toggle */}
          {allowBranchTransfer ? (
            <div className="flex rounded-lg border border-border-subtle bg-surface-secondary p-1">
              <button
                type="button"
                onClick={() => setSourceType("MANAGEMENT")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  !isTransfer ? "bg-surface shadow-sm text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Management
              </button>
              <button
                type="button"
                onClick={() => setSourceType("BRANCH_TRANSFER")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  isTransfer ? "bg-surface shadow-sm text-blue-700 dark:text-blue-400 border border-blue-500/20" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Branch Fund Transfer
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-border-subtle bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary">
              Transfer funds to the selected branch request.
            </div>
          )}

          <div className="h-px w-full bg-border-subtle" />

          {/* Branch Routing */}
          <div className={`grid gap-4 ${isTransfer ? "grid-cols-2" : "grid-cols-1"}`}>
            {isTransfer && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Source Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                  className={`rounded-lg border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-pawn-sidebar ${
                    errors.from ? "border-red-400" : "border-input-border"
                  }`}
                >
                  <option value="">Select source...</option>
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.from && <span className="text-[10px] text-red-500">{errors.from}</span>}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Target Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className={`rounded-lg border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-pawn-sidebar h-[38px] ${
                  errors.to ? "border-red-400" : "border-input-border"
                }`}
              >
                <option value="">Select target...</option>
                <option value="001">All Branches</option>
                {branches
                  .filter((b) => !isTransfer || b.branchId !== fromBranchId)
                  .map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.name}
                    </option>
                  ))}
              </select>
              {errors.to && <span className="text-[10px] text-red-500">{errors.to}</span>}
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">₱</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0.00"
                className={`w-full rounded-lg border bg-input-bg py-2 pl-8 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-pawn-sidebar ${
                  errors.amount ? "border-red-400" : "border-input-border"
                }`}
              />
            </div>
            {errors.amount && <span className="text-[10px] text-red-500">{errors.amount}</span>}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isTransfer ? "Reason for transfer..." : "e.g. Weekly cash replenishment"}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-pawn-sidebar resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-lg border px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 ${
                isTransfer ? "border-blue-700 bg-blue-600" : "border-emerald-700 bg-emerald-600"
              }`}
            >
              {submitLabel ?? `Submit ${isTransfer ? "Transfer" : "Funds"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
