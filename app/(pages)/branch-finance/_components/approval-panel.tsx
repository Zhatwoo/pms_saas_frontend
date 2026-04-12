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
  onCancelClick: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

const typeLabel: Record<string, string> = {
  ADD_FUNDS: "Add Funds",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
};

const typeColor: Record<string, string> = {
  ADD_FUNDS: "bg-emerald-100 text-emerald-700",
  TRANSFER_OUT: "bg-red-100 text-red-600",
  TRANSFER_IN: "bg-blue-100 text-blue-700",
};

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}

export function ApprovalPanel({
  requests,
  onCancelClick,
  expanded = false,
  onToggle,
}: ApprovalPanelProps) {
  const pendingCount = requests.length;

  if (pendingCount === 0) return null;

  return (
    <div 
      className={`flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 ${
        expanded 
          ? "border-amber-500/50 bg-amber-500/5 ring-4 ring-amber-500/10" 
          : "border-border-subtle bg-white hover:border-amber-300 hover:bg-amber-50/50"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            {/* Badge */}
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-600 text-[10px] font-bold text-white shadow-sm">
              {pendingCount}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Pending Confirmations</h3>
            <p className="text-[10px] text-text-muted">
              {pendingCount} transaction{pendingCount !== 1 ? "s" : ""} waiting for branch admin confirmation
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
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
                  className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:h-[136px] sm:flex-row sm:items-center sm:justify-between relative overflow-hidden flex-shrink-0"
                >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 ring-2 ring-amber-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">
                        {req.branch}
                      </h4>
                      <span className="text-[10px] text-text-muted">
                        • {new Date(req.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - Waiting for Confirmation
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <span className="text-lg font-extrabold text-amber-700 tracking-tight">
                        {fmt(req.amount)}
                      </span>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeColor[req.type]}`}>
                        {typeLabel[req.type]}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-text-muted italic border-l-2 border-amber-200 pl-2 line-clamp-2">
                      Requested by {req.requestedBy}{req.notes ? ` · ${req.notes}` : ""}
                    </p>

                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onCancelClick(req.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Cancel Fund
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
