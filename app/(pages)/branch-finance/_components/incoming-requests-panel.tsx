import { useState } from "react";

export interface BranchFundRequest {
  id: string;
  branchId: string;
  branchName: string;
  amount: number;
  category: string;
  notes: string;
  date: string;
}

interface IncomingRequestsPanelProps {
  requests: BranchFundRequest[];
  onFulfill: (request: BranchFundRequest) => void;
  onReject: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

export function IncomingRequestsPanel({
  requests,
  onFulfill,
  onReject,
  expanded = true,
  onToggle,
}: IncomingRequestsPanelProps) {
  const count = requests.length;

  if (count === 0) return null;

  return (
    <div 
      className={`flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 ${
        expanded 
          ? "border-blue-500/50 bg-blue-500/5 ring-4 ring-blue-500/10" 
          : "border-border-subtle bg-white hover:border-blue-300 hover:bg-blue-50/50"
      }`}
    >
      {/* Header (Clickable) */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white shadow-sm">
              {count}
            </span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-text-primary">Incoming Branch Requests</h3>
            <p className="text-[10px] text-text-muted">
              {count} branch{count !== 1 ? "es" : ""} requesting funds
            </p>
          </div>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
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
          <div className="border-t border-blue-500/20 px-5 pb-5 pt-3">
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:h-[136px] sm:flex-row sm:items-center sm:justify-between relative overflow-hidden flex-shrink-0"
                >
                {/* Info side */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-2 ring-blue-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">
                        {req.branchName}
                      </h4>
                      <span className="text-[10px] text-text-muted">
                        • {new Date(req.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <span className="text-lg font-extrabold text-blue-700 tracking-tight">
                        ₱{req.amount.toLocaleString("en-PH")}
                      </span>
                      <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 font-bold uppercase tracking-wide">
                        {req.category}
                      </span>
                    </div>
                    {req.notes && (
                      <p className="mt-2 text-[11px] text-text-muted italic border-l-2 border-blue-200 pl-2 line-clamp-2">
                        "{req.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions side */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onFulfill(req)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Fulfill Request
                  </button>
                  <button
                    onClick={() => onReject(req.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Reject
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
