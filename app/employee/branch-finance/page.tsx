"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ConfirmFundModal } from "@/app/admin/branch-finance/_components/confirm-fund-modal";
import {
  FinanceSummaryCards,
  LedgerTypeFilter,
} from "@/components/shared/finance-ledger-table";
import type {
  LedgerEntry,
  FinanceSummaryBreakdown,
} from "@/components/shared/finance-ledger-table";

interface FundRequestRecord {
  id: string;
  requestNo: string;
  amountRequested: number;
  approvedAmount: number | null;
  amountTransferred: number | null;
  confirmedReceivedAmount?: number | null;
  purpose: string;
  status: "pending" | "approved" | "pending_confirmation" | "rejected" | "transferred" | "cancelled";
  createdAt: string;
  transferredAt?: string | null;
  confirmedAt?: string | null;
  transferNotes?: string | null;
  confirmationNotes?: string | null;
  receiverUserId?: string | null;
  receiverRole?: "admin" | "employee" | null;
}

interface EmployeeDashboardResponse {
  branchFinance: {
    name: string;
    currentBalance: number;
    startingBalance: number;
    totalAdded: number;
    totalTransferred: number;
    lastUpdated: string | null;
  } | null;
  branch: { name: string } | null;
}

interface BranchFinanceSummaryApi {
  branchId: string;
  branchName: string;
  currentBalance: number;
  startingBalance: number;
  todayCashIn: number;
  todayCashOut: number;
  breakdown: FinanceSummaryBreakdown;
  fundRequests: { pending: number; approved: number; transferred: number };
}

function fmtCurrency(value: number) {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toStatusClass(status: FundRequestRecord["status"]) {
  switch (status) {
    case "pending": return "bg-amber-100 text-amber-700";
    case "approved": return "bg-blue-100 text-blue-700";
    case "pending_confirmation": return "bg-violet-100 text-violet-700";
    case "rejected": return "bg-red-100 text-red-700";
    case "transferred": return "bg-emerald-100 text-emerald-700";
    case "cancelled": return "bg-zinc-200 text-zinc-700";
  }
}

function toStatusLabel(status: FundRequestRecord["status"]) {
  return status === "pending_confirmation" ? "Pending Confirmation" : status;
}

const TYPE_CONFIG: Record<string, { label: string; bgClass: string; dotClass: string }> = {
  pawn: { label: "Pawn", bgClass: "bg-orange-100 text-orange-700", dotClass: "bg-orange-500" },
  buy_back: { label: "Buy Back", bgClass: "bg-blue-100 text-blue-700", dotClass: "bg-blue-500" },
  renewal: { label: "Renewal", bgClass: "bg-teal-100 text-teal-700", dotClass: "bg-teal-500" },
  sale: { label: "Sale", bgClass: "bg-purple-100 text-purple-700", dotClass: "bg-purple-500" },
  fund_transfer_in: { label: "Fund In", bgClass: "bg-emerald-100 text-emerald-700", dotClass: "bg-emerald-500" },
  fund_transfer_out: { label: "Fund Out", bgClass: "bg-red-100 text-red-600", dotClass: "bg-red-500" },
  start: { label: "Opening", bgClass: "bg-indigo-100 text-indigo-700", dotClass: "bg-indigo-500" },
  other: { label: "Other", bgClass: "bg-zinc-100 text-zinc-600", dotClass: "bg-zinc-400" },
};

interface UnifiedRow {
  id: string;
  sortDate: string;
  displayDate: string;
  displayTime: string | null;
  source: "transaction" | "fund_request";
  typeBadge: React.ReactNode;
  itemName: string | null;
  description: string;
  cashIn: number;
  cashOut: number;
  reference: string | null;
}

export default function EmployeeBranchFinancePage() {
  const [dashboard, setDashboard] = useState<EmployeeDashboardResponse | null>(null);
  const [requests, setRequests] = useState<FundRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedConfirmRequest, setSelectedConfirmRequest] = useState<FundRequestRecord | null>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [branchSummary, setBranchSummary] = useState<BranchFinanceSummaryApi | null>(null);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");
  const [ledgerViewFilter, setLedgerViewFilter] = useState<"all" | "transactions" | "fund_requests">("all");

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardData, requestData, summaryData, ledgerData] = await Promise.all([
        api.get<EmployeeDashboardResponse>("/dashboard"),
        api.get<FundRequestRecord[]>("/fund-requests"),
        api.get<BranchFinanceSummaryApi[]>("/branch-finance/summary"),
        api.get<{ entries: LedgerEntry[]; total: number }>("/branch-finance/ledger?limit=100"),
      ]);
      setDashboard(dashboardData);
      setRequests(requestData);
      setBranchSummary(summaryData?.[0] ?? null);
      setLedgerEntries(ledgerData?.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branch finance data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinanceData();
  }, [loadFinanceData]);

  const pendingConfirmationRequests = useMemo(
    () => requests.filter((request) => request.status === "pending_confirmation"),
    [requests],
  );

  const handleConfirmReceipt = useCallback(
    async (receivedAmount: number, notes: string) => {
      if (!selectedConfirmRequest) return;
      setIsSubmitting(true);
      try {
        await api.patch<FundRequestRecord>(`/fund-requests/${selectedConfirmRequest.id}/confirm`, {
          receivedAmount,
          confirmationNotes: notes,
        });
        setConfirmModalOpen(false);
        setSelectedConfirmRequest(null);
        showToast("Transfer receipt confirmed successfully.");
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to confirm transfer receipt.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadFinanceData, selectedConfirmRequest, showToast],
  );

  // ── Unified rows: merge ledger entries + fund requests ──
  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];

    // Add transaction rows
    if (ledgerViewFilter !== "fund_requests") {
      for (const entry of ledgerEntries) {
        if (ledgerTypeFilter !== "all" && entry.type !== ledgerTypeFilter) continue;
        const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.other;
        rows.push({
          id: `txn-${entry.id}`,
          sortDate: entry.date + (entry.time ? `T${entry.time}` : "T00:00:00"),
          displayDate: fmtDate(entry.date),
          displayTime: entry.time,
          source: "transaction",
          typeBadge: (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bgClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
              {cfg.label}
            </span>
          ),
          itemName: entry.itemName ?? null,
          description: entry.description,
          cashIn: entry.cashIn,
          cashOut: entry.cashOut,
          reference: entry.reference,
        });
      }
    }

    // Add fund request rows
    if (ledgerViewFilter !== "transactions") {
      for (const req of requests) {
        const amount = req.confirmedReceivedAmount ?? req.amountTransferred ?? req.approvedAmount ?? req.amountRequested;
        const isIncoming = req.status === "transferred" || req.status === "pending_confirmation";

        rows.push({
          id: `fr-${req.id}`,
          sortDate: req.createdAt,
          displayDate: fmtDate(req.createdAt),
          displayTime: null,
          source: "fund_request",
          typeBadge: (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${toStatusClass(req.status)}`}>
              {toStatusLabel(req.status)}
            </span>
          ),
          itemName: null,
          description: `${req.requestNo} — ${req.purpose}${req.transferNotes ? ` | ${req.transferNotes}` : ""}${req.confirmationNotes ? ` | ${req.confirmationNotes}` : ""}`,
          cashIn: isIncoming ? amount : 0,
          cashOut: 0,
          reference: req.requestNo,
        });
      }
    }

    // Sort by date descending
    rows.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    // Apply search filter
    const searched = ledgerSearch
      ? rows.filter((r) => {
          const q = ledgerSearch.toLowerCase();
          return (
            r.description.toLowerCase().includes(q) ||
            (r.itemName ?? "").toLowerCase().includes(q) ||
            (r.reference ?? "").toLowerCase().includes(q)
          );
        })
      : rows;

    // Apply date filters
    return searched.filter((r) => {
      const d = r.sortDate.split("T")[0];
      if (ledgerDateFrom && d < ledgerDateFrom) return false;
      if (ledgerDateTo && d > ledgerDateTo) return false;
      return true;
    });
  }, [ledgerEntries, requests, ledgerViewFilter, ledgerTypeFilter, ledgerSearch, ledgerDateFrom, ledgerDateTo]);

  const finance = dashboard?.branchFinance;

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl">
            {toast}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mt-1 text-sm text-text-tertiary">
          Confirm incoming cash transfers and monitor your branch cash on hand in real time.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-border-main bg-surface px-5 py-10 text-sm text-text-tertiary">
          Loading branch finance data...
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border-main bg-surface p-5">
            <h2 className="text-lg font-bold text-text-primary">
              {finance?.name ?? dashboard?.branch?.name ?? "Branch Finance"}
            </h2>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {fmtCurrency(finance?.currentBalance ?? 0)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Last updated: {fmtDate(finance?.lastUpdated)}
            </p>
          </div>

          <div className="rounded-xl border border-violet-300/40 bg-violet-50/60 p-4">
            <h3 className="text-sm font-bold text-text-primary">Pending Transfer Confirmation</h3>
            <p className="text-xs text-text-muted">
              {pendingConfirmationRequests.length === 0
                ? "No pending transfers for your confirmation."
                : `${pendingConfirmationRequests.length} transfer${pendingConfirmationRequests.length === 1 ? "" : "s"} waiting for your confirmation.`}
            </p>
            {pendingConfirmationRequests.length > 0 ? (
              <div className="mt-4 space-y-3">
                {pendingConfirmationRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-violet-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {fmtCurrency(request.amountTransferred ?? request.approvedAmount ?? request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">{request.purpose}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          Sent for confirmation: {fmtDate(request.transferredAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedConfirmRequest(request);
                          setConfirmModalOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirm Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Unified Branch Finance Ledger ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-text-primary">Branch Finance Ledger</h2>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                View Only
              </span>
            </div>

            {branchSummary && (
              <FinanceSummaryCards
                breakdown={branchSummary.breakdown}
                todayCashIn={branchSummary.todayCashIn}
                todayCashOut={branchSummary.todayCashOut}
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={ledgerViewFilter}
                onChange={(e) => setLedgerViewFilter(e.target.value as "all" | "transactions" | "fund_requests")}
                className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm font-semibold text-text-primary focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Activity</option>
                <option value="transactions">Transactions Only</option>
                <option value="fund_requests">Fund Requests Only</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
              />
              {ledgerViewFilter !== "fund_requests" && (
                <LedgerTypeFilter value={ledgerTypeFilter} onChange={setLedgerTypeFilter} />
              )}
              <input
                type="date"
                value={ledgerDateFrom}
                onChange={(e) => setLedgerDateFrom(e.target.value)}
                className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="date"
                value={ledgerDateTo}
                onChange={(e) => setLedgerDateTo(e.target.value)}
                className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
              />
              {(ledgerSearch || ledgerTypeFilter !== "all" || ledgerDateFrom || ledgerDateTo) && (
                <button
                  onClick={() => {
                    setLedgerSearch("");
                    setLedgerTypeFilter("all");
                    setLedgerDateFrom("");
                    setLedgerDateTo("");
                  }}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Unified table */}
            <div className="overflow-x-auto rounded-xl border border-border-main bg-surface">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Type / Status</th>
                    <th className="px-3 py-3">Item Name</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3 text-right">Cash In</th>
                    <th className="px-3 py-3 text-right">Cash Out</th>
                    <th className="px-3 py-3">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-text-tertiary">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    unifiedRows.map((row) => (
                      <tr key={row.id} className="border-b border-border-subtle transition-colors hover:bg-surface-secondary/50">
                        <td className="px-3 py-3 align-top">
                          <span className="text-sm text-text-secondary">{row.displayDate}</span>
                          {row.displayTime ? (
                            <span className="ml-1.5 text-xs text-text-muted">{row.displayTime}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            row.source === "transaction"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-cyan-100 text-cyan-700"
                          }`}>
                            {row.source === "transaction" ? "TXN" : "FUND REQ"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {row.typeBadge}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="block max-w-[160px] truncate text-sm font-medium text-text-primary" title={row.itemName ?? ""}>
                            {row.itemName || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="block max-w-[240px] truncate text-sm text-text-secondary" title={row.description}>
                            {row.description || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top text-right">
                          <span className={`text-sm font-bold ${row.cashIn > 0 ? "text-emerald-600" : "text-text-muted"}`}>
                            {row.cashIn > 0 ? `+₱${row.cashIn.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top text-right">
                          <span className={`text-sm font-bold ${row.cashOut > 0 ? "text-red-600" : "text-text-muted"}`}>
                            {row.cashOut > 0 ? `-₱${row.cashOut.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="text-xs font-mono text-text-muted">{row.reference || "—"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ConfirmFundModal
        isOpen={confirmModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setConfirmModalOpen(false);
            setSelectedConfirmRequest(null);
          }
        }}
        onConfirm={handleConfirmReceipt}
        amount={
          selectedConfirmRequest?.amountTransferred ??
          selectedConfirmRequest?.approvedAmount ??
          selectedConfirmRequest?.amountRequested ??
          0
        }
        requestNo={selectedConfirmRequest?.requestNo}
        branchName={finance?.name ?? dashboard?.branch?.name ?? "Branch"}
      />
    </div>
  );
}
