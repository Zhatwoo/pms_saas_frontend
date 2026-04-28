"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { uploadFundTransferProof } from "@/lib/fund-transfer-storage";
import {
  buildFinanceQueues,
  formatCurrency,
  formatFinanceDate,
  getConfirmationLabel,
  getRequestAmount,
  type FundRequestRecord,
} from "@/lib/fund-finance";
import { FinanceQueueSection } from "@/components/shared/finance-queue-section";
import { ConfirmFundModal } from "./_components/confirm-fund-modal";
import { RequestFundsModal } from "./_components/request-funds-modal";
import type { RequestFundsData } from "./_components/request-funds-modal";
import {
  FinanceSummaryCards,
  LedgerTypeFilter,
} from "@/components/shared/finance-ledger-table";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import type {
  LedgerEntry,
  FinanceSummaryBreakdown,
} from "@/components/shared/finance-ledger-table";

interface BranchFinanceSummary {
  branchId: string;
  branchCode: string | null;
  name: string;
  location: string | null;
  status: string;
  startingBalance: number;
  currentBalance: number;
  totalAdded: number;
  totalTransferred: number;
  lastUpdated: string | null;
}

interface AdminDashboardResponse {
  view: "admin";
  branch: {
    id: string;
    name: string;
    branch_code: string | null;
    location: string | null;
    status: string;
  } | null;
  branchFinance: BranchFinanceSummary | null;
  currentBalance: number;
  fundRequests: {
    summary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      transferred: number;
      cancelled: number;
      totalRequested: number;
      totalApproved: number;
      totalTransferred: number;
    };
    recent: FundRequestRecord[];
  };
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
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "pending_source_confirmation":
      return "bg-orange-100 text-orange-700";
    case "pending_confirmation":
      return "bg-violet-100 text-violet-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "transferred":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-zinc-200 text-zinc-700";
  }
}

function toStatusLabel(status: FundRequestRecord["status"]) {
  if (status === "pending_source_confirmation") return "Pending Source Confirmation";
  if (status === "pending_confirmation") return "Pending Confirmation";
  return status;
}

export default function AdminBranchFinancePage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [requests, setRequests] = useState<FundRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedConfirmRequest, setSelectedConfirmRequest] = useState<FundRequestRecord | null>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [branchSummary, setBranchSummary] = useState<BranchFinanceSummaryApi | null>(null);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FundRequestRecord["status"] | "all">("all");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");
  const [ledgerViewFilter, setLedgerViewFilter] = useState<"all" | "transactions" | "fund_requests">("all");

  useEffect(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setLedgerDateFrom(today);
    setLedgerDateTo(today);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardData, requestData, summaryData, ledgerData] = await Promise.all([
        api.get<AdminDashboardResponse>("/dashboard"),
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

  const handleRequestFunds = useCallback(
    async (data: RequestFundsData) => {
      setIsSubmitting(true);
      try {
        await api.post<FundRequestRecord>("/fund-requests", {
          amountRequested: data.amount,
          purpose: data.category,
          notes: data.notes,
        });
        setRequestModalOpen(false);
        showToast("Fund request submitted to Super Admin.");
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit fund request.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadFinanceData, showToast],
  );

  const queues = useMemo(
    () => buildFinanceQueues(requests, dashboard?.branch?.id ?? undefined),
    [dashboard?.branch?.id, requests],
  );

  const confirmationRequests = useMemo(
    () => [...queues.sourceConfirmation, ...queues.destinationConfirmation],
    [queues.destinationConfirmation, queues.sourceConfirmation],
  );

  const handleConfirmRequestClick = useCallback((request: FundRequestRecord) => {
    setSelectedConfirmRequest(request);
    setConfirmModalOpen(true);
  }, []);

  const handleConfirmReceipt = useCallback(
    async (data: { receivedAmount: number; notes: string; proofFile: File | null }) => {
      if (!selectedConfirmRequest || !data.proofFile) return;

      setIsSubmitting(true);
      try {
        const stage = selectedConfirmRequest.status === "pending_source_confirmation" ? "source" : "destination";
        const proofUrl = await uploadFundTransferProof({
          file: data.proofFile,
          requestNo: selectedConfirmRequest.requestNo,
          stage,
          branchId: dashboard?.branch?.id ?? selectedConfirmRequest.branchId,
        });

        if (stage === "source") {
          await api.patch<FundRequestRecord>(`/fund-requests/${selectedConfirmRequest.id}/source-confirm`, {
            sentAmount: data.receivedAmount,
            proofUrl,
            confirmationNotes: data.notes,
          });
          showToast("Source branch deduction confirmed successfully.");
        } else {
          await api.patch<FundRequestRecord>(`/fund-requests/${selectedConfirmRequest.id}/confirm`, {
            receivedAmount: data.receivedAmount,
            proofUrl,
            confirmationNotes: data.notes,
          });
          showToast("Branch receipt confirmed and transfer recorded successfully.");
        }

        setConfirmModalOpen(false);
        setSelectedConfirmRequest(null);
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to confirm fund receipt.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [dashboard?.branch?.id, loadFinanceData, selectedConfirmRequest, showToast],
  );

  interface UnifiedRow {
    id: string;
    sortDate: string;
    displayDate: string;
    displayTime: string | null;
    source: "transaction" | "fund_request";
    typeBadge: React.ReactNode;
    typeKey: string;
    statusKey: string;
    itemName: string | null;
    description: string;
    cashIn: number;
    cashOut: number;
    reference: string | null;
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

  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];

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
          typeKey: entry.type,
          statusKey: "",
          itemName: entry.itemName ?? null,
          description: entry.description,
          cashIn: entry.cashIn,
          cashOut: entry.cashOut,
          reference: entry.reference,
        });
      }
    }

    if (ledgerViewFilter !== "transactions") {
      for (const req of requests) {
        if (statusFilter !== "all" && req.status !== statusFilter) continue;
        const amount = req.amountTransferred ?? req.approvedAmount ?? req.amountRequested;
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
          typeKey: "fund_request",
          statusKey: req.status,
          itemName: null,
          description: `${req.requestNo} — ${req.purpose}${req.notes ? ` | ${req.notes}` : ""}${req.transferNotes ? ` | ${req.transferNotes}` : ""}${req.reviewNotes ? ` | ${req.reviewNotes}` : ""}`,
          cashIn: isIncoming ? amount : 0,
          cashOut: 0,
          reference: req.requestNo,
        });
      }
    }

    rows.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    if (ledgerSearch) {
      const q = ledgerSearch.toLowerCase();
      return rows.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          (r.itemName ?? "").toLowerCase().includes(q) ||
          (r.reference ?? "").toLowerCase().includes(q),
      );
    }

    return rows.filter((r) => {
      const d = r.sortDate.split("T")[0];
      if (ledgerDateFrom && d < ledgerDateFrom) return false;
      if (ledgerDateTo && d > ledgerDateTo) return false;
      return true;
    });
  }, [ledgerEntries, requests, ledgerViewFilter, ledgerTypeFilter, statusFilter, ledgerSearch, ledgerDateFrom, ledgerDateTo]);

  const finance = dashboard?.branchFinance;
  const resolvedCurrentBalance = useMemo(() => {
    const current = finance?.currentBalance ?? dashboard?.currentBalance ?? 0;
    if (current !== 0) {
      return current;
    }

    if (!finance) {
      return current;
    }

    return Number((finance.startingBalance + finance.totalAdded - finance.totalTransferred).toFixed(2));
  }, [dashboard?.currentBalance, finance]);

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl">
            {toast}
          </div>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mt-1 text-sm text-text-tertiary">
            Request additional funds from Super Admin and monitor approval and transfer status in real time.
          </p>
        </div>
        <button
          onClick={() => setRequestModalOpen(true)}
          className="rounded-lg border border-blue-700 bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        >
          Request Funds
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {!dashboard && isLoading ? (
        <div className="rounded-xl border border-border-main bg-surface px-5 py-10 text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Loading branch finance data..." className="text-sm text-text-tertiary" />
        </div>
      ) : dashboard ? (
        <div className={`space-y-6 transition-opacity duration-200 ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
          <div className="overflow-hidden rounded-xl border border-border-main bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 shadow-lg">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h2 className="text-xl font-bold text-white">{finance?.name ?? dashboard?.branch?.name ?? "Branch"}</h2>
                <p className="text-xs uppercase tracking-wider text-emerald-300/80">
                  {finance?.branchCode ? `Code ${finance.branchCode}` : "Branch Finance Overview"}
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                {finance?.status ?? dashboard?.branch?.status ?? "Unknown"}
              </span>
            </div>

            <div className="px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">Current Balance</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">{formatCurrency(resolvedCurrentBalance)}</p>
              <p className="mt-2 text-xs text-emerald-200/80">Last updated: {formatFinanceDate(finance?.lastUpdated)}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 px-6 pb-6 md:grid-cols-4">
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs uppercase text-emerald-300/70">Starting</p>
                <p className="mt-1 text-lg font-bold text-white">{formatCurrency(finance?.startingBalance ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs uppercase text-emerald-300/70">Transferred In</p>
                <p className="mt-1 text-lg font-bold text-white">{formatCurrency(finance?.totalAdded ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs uppercase text-emerald-300/70">Pending Requests</p>
                <p className="mt-1 text-lg font-bold text-white">{dashboard?.fundRequests.summary.pending ?? 0}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs uppercase text-emerald-300/70">Transferred Requests</p>
                <p className="mt-1 text-lg font-bold text-white">{dashboard?.fundRequests.summary.transferred ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FinanceQueueSection
              accent="blue"
              title="Pending Super Admin Review"
              subtitle={
                queues.pendingReview.length === 0
                  ? "You have no requests waiting for review."
                  : `${queues.pendingReview.length} request${queues.pendingReview.length === 1 ? "" : "s"} currently under review.`
              }
              count={queues.pendingReview.length}
              expanded
            >
              {queues.pendingReview.length > 0 ? (
                queues.pendingReview.map((request) => (
                  <div key={request.id} className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {formatCurrency(request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">Purpose: {request.purpose}</p>
                        {request.notes ? <p className="mt-1 text-xs text-text-muted">{request.notes}</p> : null}
                        <p className="mt-1 text-xs text-text-muted">Requested: {formatFinanceDate(request.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">Pending</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-text-tertiary">
                  No requests are waiting for review.
                </div>
              )}
            </FinanceQueueSection>

            <FinanceQueueSection
              accent="orange"
              title="Pending Receiving Confirmation"
              subtitle={
                confirmationRequests.length === 0
                  ? "No transfers are waiting for receiving confirmation."
                  : `${confirmationRequests.length} transfer${confirmationRequests.length === 1 ? "" : "s"} awaiting receiving confirmation.`
              }
              count={confirmationRequests.length}
              expanded
            >
              {confirmationRequests.length > 0 ? (
                confirmationRequests.map((request) => {
                  const isSourceConfirmation = request.status === "pending_source_confirmation";
                  return (
                    <div key={request.id} className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            {request.requestNo} - {formatCurrency(getRequestAmount(request))}
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {isSourceConfirmation
                              ? `Sending branch: ${request.sourceBranch?.name ?? request.sourceBranchId ?? "Unknown Branch"}`
                              : `Receiving branch: ${request.branch?.name ?? "Unknown Branch"}`}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            Transfer mode: {request.transferMode?.replaceAll("_", " ") ?? "Cash"}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {isSourceConfirmation
                              ? `Outgoing deduction pending since ${formatFinanceDate(request.transferredAt ?? request.createdAt)}`
                              : `Sent for receipt confirmation: ${formatFinanceDate(request.transferredAt ?? request.createdAt)}`}
                          </p>
                          {request.transferNotes ? <p className="mt-1 text-xs text-text-muted">Release notes: {request.transferNotes}</p> : null}
                          {request.sourceConfirmationNotes ? <p className="mt-1 text-xs text-text-muted">Source notes: {request.sourceConfirmationNotes}</p> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmRequestClick(request)}
                          disabled={isSubmitting}
                          className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {getConfirmationLabel(request)}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-text-tertiary">
                  No transfers are waiting for confirmation.
                </div>
              )}
            </FinanceQueueSection>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-text-primary">Branch Finance Ledger</h2>
            </div>

            {branchSummary ? (
              <FinanceSummaryCards
                breakdown={branchSummary.breakdown}
                todayCashIn={branchSummary.todayCashIn}
                todayCashOut={branchSummary.todayCashOut}
              />
            ) : null}

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
              {ledgerViewFilter !== "fund_requests" ? (
                <LedgerTypeFilter value={ledgerTypeFilter} onChange={setLedgerTypeFilter} />
              ) : null}
              {ledgerViewFilter !== "transactions" ? (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FundRequestRecord["status"] | "all")}
                  className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="pending_source_confirmation">Pending Source Confirmation</option>
                  <option value="pending_confirmation">Pending Confirmation</option>
                  <option value="rejected">Rejected</option>
                  <option value="transferred">Transferred</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : null}
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
              {(ledgerSearch || ledgerTypeFilter !== "all" || ledgerDateFrom || ledgerDateTo || statusFilter !== "all") ? (
                <button
                  onClick={() => {
                    setLedgerSearch("");
                    setLedgerTypeFilter("all");
                    setLedgerDateFrom("");
                    setLedgerDateTo("");
                    setStatusFilter("all");
                  }}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>

            <div className="flex justify-end print:hidden mb-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                Print Ledger
              </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                #print-ledger-section, #print-ledger-section * { visibility: visible; }
                #print-ledger-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
              }
            `}} />

            <div id="print-ledger-section" className="hidden print:block mb-8">
              <h1 className="text-xl font-bold text-black border-b border-black pb-2 mb-4">
                Branch Financial Ledger
              </h1>
              <div className="text-sm text-black space-y-1 mb-4">
                {dashboard?.branch ? (
                  <>
                    <p><strong>Branch:</strong> {dashboard.branch.name}</p>
                    <p><strong>Branch Code:</strong> {dashboard.branch.branch_code || "N/A"}</p>
                  </>
                ) : (
                  <p><strong>Scope:</strong> All Branches</p>
                )}
                <p><strong>Date Generated:</strong> {new Date().toLocaleString()}</p>
                {ledgerDateFrom && <p><strong>From:</strong> {ledgerDateFrom}</p>}
                {ledgerDateTo && <p><strong>To:</strong> {ledgerDateTo}</p>}
              </div>

              <table className="w-full text-left text-sm border-collapse text-black print:text-[11px]">
                <thead>
                  <tr className="bg-gray-100 border-y border-black">
                    <th className="p-2 font-bold whitespace-nowrap">Date</th>
                    <th className="p-2 font-bold whitespace-nowrap">Source</th>
                    <th className="p-2 font-bold">Item Name</th>
                    <th className="p-2 font-bold">Description</th>
                    <th className="p-2 font-bold text-right whitespace-nowrap">Cash In</th>
                    <th className="p-2 font-bold text-right whitespace-nowrap">Cash Out</th>
                    <th className="p-2 font-bold">Ref No.</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center italic text-gray-500 border-b border-black">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    unifiedRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-300">
                        <td className="p-2 whitespace-nowrap">{row.displayDate} {row.displayTime || ""}</td>
                        <td className="p-2 whitespace-nowrap">{row.source === "transaction" ? "TXN" : "FUND REQ"}</td>
                        <td className="p-2 truncate max-w-[200px]">{row.itemName || "—"}</td>
                        <td className="p-2 truncate max-w-[250px]">{row.description || "—"}</td>
                        <td className="p-2 text-right font-mono">{row.cashIn > 0 ? `+₱${row.cashIn.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                        <td className="p-2 text-right font-mono text-red-600">{row.cashOut > 0 ? `-₱${row.cashOut.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                        <td className="p-2 font-mono text-[10px] truncate max-w-[120px] text-gray-700">{row.reference || "—"}</td>
                      </tr>
                    ))
                  )}
                  {unifiedRows.length > 0 && (
                    <tr className="border-b-2 border-black bg-gray-50 uppercase">
                      <td colSpan={4} className="p-2 font-bold text-right">Total:</td>
                      <td className="p-2 text-right font-bold font-mono">
                        ₱{unifiedRows.reduce((acc, r) => acc + (r.source === "transaction" ? (r.cashIn || 0) : 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-bold font-mono text-red-600">
                        ₱{unifiedRows.reduce((acc, r) => acc + (r.source === "transaction" ? (r.cashOut || 0) : 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="print:hidden overflow-x-auto rounded-xl border border-border-main bg-surface">
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
                          {row.displayTime ? <span className="ml-1.5 text-xs text-text-muted">{row.displayTime}</span> : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${row.source === "transaction" ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700"
                              }`}
                          >
                            {row.source === "transaction" ? "TXN" : "FUND REQ"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">{row.typeBadge}</td>
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
          </div>
      ) : null}

      <RequestFundsModal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} onSubmit={handleRequestFunds} />

      <ConfirmFundModal
        isOpen={confirmModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setConfirmModalOpen(false);
            setSelectedConfirmRequest(null);
          }
        }}
        onConfirm={handleConfirmReceipt}
        amount={selectedConfirmRequest?.amountTransferred ?? selectedConfirmRequest?.approvedAmount ?? selectedConfirmRequest?.amountRequested ?? 0}
        requestNo={selectedConfirmRequest?.requestNo}
        branchName={finance?.name ?? dashboard?.branch?.name ?? "Branch"}
        sourceBranchName={selectedConfirmRequest?.sourceBranch?.name ?? null}
        transferMode={selectedConfirmRequest?.transferMode ?? null}
        stageLabel={selectedConfirmRequest?.status === "pending_source_confirmation" ? "Confirm Source Deduction" : "Confirm Receipt"}
        amountLabel={selectedConfirmRequest?.status === "pending_source_confirmation" ? "Sent Amount" : "Actual Amount Received"}
        helperText={
          selectedConfirmRequest?.status === "pending_source_confirmation"
            ? "Confirm the outgoing deduction after the source branch has released the funds. The amount entered here will be deducted from the source branch balance."
            : "Upload a proof image of the transaction and enter the actual amount received. The system will post this amount to your branch balance."
        }
      />
    </div>
  );
}
