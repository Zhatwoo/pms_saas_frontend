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
import { ConfirmFundModal } from "@/app/admin/branch-finance/_components/confirm-fund-modal";
import {
  FinanceSummaryCards,
  LedgerTypeFilter,
} from "@/components/shared/finance-ledger-table";
import type {
  LedgerEntry,
  FinanceSummaryBreakdown,
} from "@/components/shared/finance-ledger-table";
import { RequestFundsModal } from "@/app/admin/branch-finance/_components/request-funds-modal";
import type { RequestFundsData } from "@/app/admin/branch-finance/_components/request-funds-modal";

interface EmployeeDashboardResponse {
  currentBalance: number;
  branchFinance: {
    name: string;
    currentBalance: number;
    startingBalance: number;
    totalAdded: number;
    totalTransferred: number;
    lastUpdated: string | null;
  } | null;
  branch: { 
    name: string;
    branch_code?: string | null;
  } | null;
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

function toStatusClass(status: FundRequestRecord["status"]) {
  switch (status) {
    case "pending": return "bg-amber-500/15 text-amber-300";
    case "approved": return "bg-blue-500/15 text-blue-300";
    case "pending_confirmation": return "bg-violet-500/15 text-violet-300";
    case "rejected": return "bg-red-500/15 text-red-300";
    case "transferred": return "bg-emerald-500/15 text-emerald-300";
    case "cancelled": return "bg-slate-500/15 text-slate-300";
  }
}

function toStatusLabel(status: FundRequestRecord["status"]) {
  return status === "pending_confirmation" ? "Pending Confirmation" : status;
}

function fmtDate(value: string | null | undefined) {
  return formatFinanceDate(value);
}

const TYPE_CONFIG: Record<string, { label: string; bgClass: string; dotClass: string }> = {
  pawn: { label: "Pawn", bgClass: "bg-orange-500/15 text-orange-300", dotClass: "bg-orange-400" },
  buy_back: { label: "Buy Back", bgClass: "bg-blue-500/15 text-blue-300", dotClass: "bg-blue-400" },
  renewal: { label: "Renewal", bgClass: "bg-teal-500/15 text-teal-300", dotClass: "bg-teal-400" },
  sale: { label: "Sale", bgClass: "bg-purple-500/15 text-purple-300", dotClass: "bg-purple-400" },
  fund_transfer_in: { label: "Fund In", bgClass: "bg-emerald-500/15 text-emerald-300", dotClass: "bg-emerald-400" },
  fund_transfer_out: { label: "Fund Out", bgClass: "bg-red-500/15 text-red-300", dotClass: "bg-red-400" },
  start: { label: "Opening", bgClass: "bg-indigo-500/15 text-indigo-300", dotClass: "bg-indigo-400" },
  other: { label: "Other", bgClass: "bg-slate-500/15 text-slate-300", dotClass: "bg-slate-400" },
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
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedConfirmRequest, setSelectedConfirmRequest] = useState<FundRequestRecord | null>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [branchSummary, setBranchSummary] = useState<BranchFinanceSummaryApi | null>(null);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
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

  const queues = useMemo(() => buildFinanceQueues(requests), [requests]);
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
          branchId: selectedConfirmRequest.branchId,
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
          showToast("Transfer receipt confirmed successfully.");
        }

        setConfirmModalOpen(false);
        setSelectedConfirmRequest(null);
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
  const resolvedCurrentBalance = useMemo(() => {
    const current = finance?.currentBalance ?? dashboard?.currentBalance ?? 0;
    if (current !== 0) {
      return current;
    }

    if (!finance) {
      return current;
    }

    return Number(
      (finance.startingBalance + finance.totalAdded - finance.totalTransferred).toFixed(2),
    );
  }, [dashboard?.currentBalance, finance]);

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-500/20 bg-surface-secondary px-5 py-3 text-sm font-semibold text-emerald-300 shadow-xl shadow-black/20">
            {toast}
          </div>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mt-1 text-sm text-text-tertiary">
            Request additional funds from Super Admin and confirm incoming or outgoing transfers in real time.
          </p>
        </div>
        <button
          onClick={() => setRequestModalOpen(true)}
          className="rounded-lg border border-blue-500/20 bg-blue-500/15 px-4 py-2 text-sm font-bold text-blue-300 transition-colors hover:bg-blue-500/25"
        >
          Request Funds
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-border-main bg-surface px-5 py-10 text-sm text-text-tertiary">
          Loading branch finance data...
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border-main bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary">
              {finance?.name ?? dashboard?.branch?.name ?? "Branch Finance"}
            </h2>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              {formatCurrency(resolvedCurrentBalance)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Last updated: {formatFinanceDate(finance?.lastUpdated)}
            </p>
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
                  <div key={request.id} className="rounded-xl border border-blue-500/20 bg-surface px-4 py-4 shadow-sm shadow-black/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {formatCurrency(request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">Purpose: {request.purpose}</p>
                        {request.notes ? <p className="mt-1 text-xs text-text-muted">{request.notes}</p> : null}
                        <p className="mt-1 text-xs text-text-muted">Requested: {formatFinanceDate(request.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                        Pending
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-blue-500/20 bg-surface px-4 py-4 text-sm text-text-tertiary">
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
                    <div key={request.id} className="rounded-xl border border-orange-500/20 bg-surface px-4 py-4 shadow-sm shadow-black/10">
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
                          {request.transferNotes ? (
                            <p className="mt-1 text-xs text-text-muted">Release notes: {request.transferNotes}</p>
                          ) : null}
                          {request.sourceConfirmationNotes ? (
                            <p className="mt-1 text-xs text-text-muted">Source notes: {request.sourceConfirmationNotes}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmRequestClick(request)}
                          disabled={isSubmitting}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {getConfirmationLabel(request)}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-orange-500/20 bg-surface px-4 py-4 text-sm text-text-tertiary">
                  No transfers are waiting for confirmation.
                </div>
              )}
            </FinanceQueueSection>
          </div>

          {/* ── Unified Branch Finance Ledger ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-text-primary">Branch Finance Ledger</h2>
              <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-bold text-text-secondary">
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
                  className="text-xs font-bold text-red-300 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex justify-end print:hidden mb-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20"
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
                  <p><strong>Scope:</strong> Personal Ledger</p>
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

            {/* Unified table */}
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
                          {row.displayTime ? (
                            <span className="ml-1.5 text-xs text-text-muted">{row.displayTime}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              row.source === "transaction"
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "bg-cyan-500/15 text-cyan-300"
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

      <RequestFundsModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleRequestFunds}
      />

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
        sourceBranchName={selectedConfirmRequest?.sourceBranch?.name ?? null}
        transferMode={selectedConfirmRequest?.transferMode ?? null}
        stageLabel={
          selectedConfirmRequest?.status === "pending_source_confirmation"
            ? "Confirm Source Deduction"
            : "Confirm Receipt"
        }
        amountLabel={
          selectedConfirmRequest?.status === "pending_source_confirmation"
            ? "Sent Amount"
            : "Actual Amount Received"
        }
        helperText={
          selectedConfirmRequest?.status === "pending_source_confirmation"
            ? "Confirm the outgoing deduction after the source branch has released the funds. The amount entered here will be deducted from the source branch balance."
            : "Upload a proof image of the transaction and enter the actual amount received. The system will post this amount to your branch balance."
        }
      />
    </div>
  );
}
