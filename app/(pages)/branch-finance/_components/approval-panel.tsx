"use client";

import { useState } from "react";

export interface ApprovalRequest {
  id: string;
  type: "ADD_FUNDS" | "TRANSFER_OUT" | "TRANSFER_IN";
  amount: number;
  requestedBy: string;
  branch: string;
  date: string;
  requiredApprovers: number;
  currentApprovals: number;
  notes: string;
}

interface ApprovalPanelProps {
  requests: ApprovalRequest[];
  onActionClick: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionVariant?: "danger" | "primary";
}

const typeLabel: Record<string, string> = {
  ADD_FUNDS: "Add Funds",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
};

const typeColor: Record<string, string> = {
  ADD_FUNDS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  TRANSFER_OUT: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  TRANSFER_IN: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
};

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ApprovalPanel({
  requests,
  onActionClick,
  expanded = false,
  onToggle,
  title = "Pending Confirmations",
  subtitle,
  actionLabel = "Cancel Fund",
  actionVariant = "danger",
}: ApprovalPanelProps) {
  const pendingCount = requests.length;
  const actionClass =
    actionVariant === "primary"
      ? "border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
      : "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20";

  if (pendingCount === 0) return null;

  return (
    <div 
      className={`flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 ${
        expanded 
          ? "border-amber-500/50 bg-amber-500/5 ring-4 ring-amber-500/10 dark:ring-amber-500/5" 
          : "border-border-subtle bg-surface hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/10"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            {/* Badge */}
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-amber-600 text-xs font-bold text-white shadow-sm">
              {pendingCount}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">
              {subtitle ??
                `${pendingCount} transaction${pendingCount !== 1 ? "s" : ""} waiting for branch admin confirmation`}
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Body */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-amber-500/20 px-5 pb-5 pt-3">
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-surface p-4 shadow-sm transition-all hover:shadow-md sm:h-[136px] sm:flex-row sm:items-center sm:justify-between relative overflow-hidden flex-shrink-0"
                >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-100 dark:ring-amber-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-text-primary">
                        {req.branch}
                      </h4>
                      <span className="text-xs text-text-muted">
                        • {new Date(req.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - Waiting for Confirmation
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-sm font-medium text-text-secondary">
                      <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400 tracking-tight">
                        {fmt(req.amount)}
                      </span>
                      <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${typeColor[req.type]}`}>
                        {typeLabel[req.type]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-text-muted italic border-l-2 border-amber-200 dark:border-amber-500/30 pl-2 line-clamp-2">
                        Requested by {req.requestedBy}{req.notes ? ` · ${req.notes}` : ""}
                      </p>

                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onActionClick(req.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-5 py-2.5 text-sm font-bold transition-colors shadow-sm ${actionClass}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    {actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
