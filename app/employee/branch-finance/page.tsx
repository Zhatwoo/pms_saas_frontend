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
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { formatPeso } from "@/lib/currency";

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
    const today = new Date().toISOString().split("T")[0];
    const ledgerDateFromQuery = ledgerDateFrom || today;
    const ledgerDateToQuery = ledgerDateTo || today;
    try {
      const [dashboardData, requestData, summaryData, ledgerData] = await Promise.all([
        api.get<EmployeeDashboardResponse>("/dashboard"),
        api.get<FundRequestRecord[]>("/fund-requests"),
        api.get<BranchFinanceSummaryApi[]>("/branch-finance/summary"),
        api.get<{ entries: LedgerEntry[]; total: number }>(
          `/branch-finance/ledger?limit=500&dateFrom=${encodeURIComponent(
            ledgerDateFromQuery,
          )}&dateTo=${encodeURIComponent(ledgerDateToQuery)}`,
        ),
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
  }, [ledgerDateFrom, ledgerDateTo]);

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

  // ── Ledger rows: transactions only (no fund requests to avoid double-counting) ──
  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];

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

    // Sort by date ascending (chronological)
    rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

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
  }, [ledgerEntries, ledgerTypeFilter, ledgerSearch, ledgerDateFrom, ledgerDateTo]);

  const finance = dashboard?.branchFinance;
  const resolvedCurrentBalance = useMemo(() => {
    if (branchSummary) return branchSummary.currentBalance;
    return finance?.currentBalance ?? dashboard?.currentBalance ?? 0;
  }, [branchSummary, dashboard?.currentBalance, finance?.currentBalance]);

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
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700 hover:shadow-blue-900/40 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Request Funds
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {!dashboard && isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border-main bg-surface px-5 py-10 text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Loading branch finance data..." className="text-sm text-text-tertiary" />
        </div>
      ) : dashboard ? (
        <div className="space-y-6 transition-opacity duration-200">
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-6 shadow-2xl transition-all hover:shadow-emerald-900/20">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl transition-all group-hover:bg-white/10" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-400/5 blur-3xl" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400/80">
                    {finance?.name ?? dashboard?.branch?.name ?? "Branch Balance"}
                  </h2>
                </div>
                <p className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {formatCurrency(resolvedCurrentBalance)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-emerald-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
                    Last sync: {formatFinanceDate(finance?.lastUpdated)}
                  </p>
                </div>
              </div>
              
              <div className="hidden sm:block">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 opacity-50">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                  </svg>
                </div>
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
                  <div key={request.id} className="group relative overflow-hidden rounded-xl border border-blue-500/20 bg-surface p-4 shadow-sm transition-all hover:border-blue-500/40 hover:shadow-md">
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/5 transition-all group-hover:bg-blue-500/10" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-text-primary">
                            {request.requestNo}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-text-tertiary" />
                          <span className="text-sm font-black text-blue-500">
                            {formatCurrency(request.amountRequested)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-text-secondary">
                          <span className="text-text-tertiary font-medium">Purpose:</span> {request.purpose}
                        </p>
                        {request.notes ? (
                          <div className="mt-2 rounded-lg bg-surface-secondary/50 p-2 border border-border-subtle/50">
                            <p className="text-[11px] italic text-text-muted leading-relaxed">"{request.notes}"</p>
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Requested {formatFinanceDate(request.createdAt)}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">
                        Reviewing
                      </span>
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
                    <div key={request.id} className="group relative overflow-hidden rounded-xl border border-orange-500/20 bg-surface p-4 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md">
                      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/5 transition-all group-hover:bg-orange-500/10" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-text-primary">
                              {request.requestNo}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-text-tertiary" />
                            <span className="text-sm font-black text-orange-500">
                              {formatCurrency(getRequestAmount(request))}
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-text-secondary">
                            <span className="text-text-tertiary font-medium">{isSourceConfirmation ? "To:" : "From:"}</span> {isSourceConfirmation ? (request.branch?.name ?? "Unknown") : (request.sourceBranch?.name ?? "Management")}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-text-tertiary">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                              {request.transferMode?.replaceAll("_", " ") ?? "Cash"}
                            </div>
                            <div className="text-[10px] font-bold text-text-tertiary/40">|</div>
                            <div className="text-[10px] font-bold text-text-tertiary">
                              {formatFinanceDate(request.transferredAt ?? request.createdAt)}
                            </div>
                          </div>
                          
                          {(request.transferNotes || request.sourceConfirmationNotes) && (
                            <div className="mt-3 rounded-lg bg-orange-500/[0.03] p-2 border border-orange-500/10">
                              {request.transferNotes && <p className="text-[10px] text-text-secondary leading-tight"><span className="font-black text-orange-500/70">Note:</span> {request.transferNotes}</p>}
                              {request.sourceConfirmationNotes && <p className="mt-1 text-[10px] text-text-secondary leading-tight"><span className="font-black text-orange-500/70">Src:</span> {request.sourceConfirmationNotes}</p>}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmRequestClick(request)}
                          disabled={isSubmitting}
                          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-900/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* ── Unified Branch Finance Ledger ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 shadow-inner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-text-primary">Branch Finance Ledger</h2>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                      Transaction History
                    </span>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-indigo-400">
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

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-main bg-surface/50 p-4 backdrop-blur-sm shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full rounded-xl border border-border-main bg-surface pl-10 pr-4 py-2.5 text-sm font-medium text-text-primary placeholder:text-text-tertiary focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                />
              </div>
              
              <LedgerTypeFilter value={ledgerTypeFilter} onChange={setLedgerTypeFilter} />
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={ledgerDateFrom}
                    onChange={(e) => setLedgerDateFrom(e.target.value)}
                    className="rounded-xl border border-border-main bg-surface px-4 py-2.5 text-sm font-medium text-text-primary focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <div className="absolute -top-2 left-3 bg-surface px-1 text-[9px] font-black uppercase text-text-tertiary">From</div>
                </div>
                <div className="text-text-tertiary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={ledgerDateTo}
                    onChange={(e) => setLedgerDateTo(e.target.value)}
                    className="rounded-xl border border-border-main bg-surface px-4 py-2.5 text-sm font-medium text-text-primary focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <div className="absolute -top-2 left-3 bg-surface px-1 text-[9px] font-black uppercase text-text-tertiary">To</div>
                </div>
              </div>
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
                className="group flex items-center gap-2 rounded-xl border border-emerald-700 dark:border-emerald-400/80 bg-emerald-700 px-5 py-2.5 text-sm font-bold text-amber-400 transition-all hover:bg-emerald-800 dark:hover:bg-emerald-800 active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
              <div className="bg-emerald-800 text-white p-6 rounded-t-xl mb-6 border-b-4 border-amber-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                      JCLB Buy Back Shop
                    </h1>
                    <p className="text-sm font-bold text-emerald-100/80 uppercase tracking-[0.2em] mt-1">
                      {dashboard?.branch?.name || "Branch"} - Financial Ledger Report
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/60">
                      Official Document
                    </p>
                  </div>
                </div>
              </div>
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
                        <td className="p-2 whitespace-nowrap">TXN</td>
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
                        {formatPeso(unifiedRows.reduce((acc, r) => acc + (r.cashIn || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                      </td>
                      <td className="p-2 text-right font-bold font-mono text-red-600">
                        {formatPeso(unifiedRows.reduce((acc, r) => acc + (r.cashOut || 0), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Unified table */}
            <div className="print:hidden overflow-hidden rounded-2xl border border-border-main bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="bg-surface-secondary/50 border-b border-border-subtle text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                      <th className="px-4 py-4">Date & Time</th>
                      <th className="px-4 py-4">Src</th>
                      <th className="px-4 py-4">Transaction Type</th>
                      <th className="px-4 py-4">Item Name</th>
                      <th className="px-4 py-4">Details / Description</th>
                      <th className="px-4 py-4 text-right">Cash In</th>
                      <th className="px-4 py-4 text-right">Cash Out</th>
                      <th className="px-4 py-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {unifiedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="rounded-full bg-surface-secondary p-3">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-text-tertiary">No financial records found</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      unifiedRows.map((row) => (
                        <tr key={row.id} className="group transition-colors hover:bg-emerald-500/[0.02]">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-text-primary">{row.displayDate}</span>
                              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-tighter">{row.displayTime || "12:00 AM"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                              <span className="inline-flex items-center justify-center rounded-lg bg-indigo-500/10 px-2 py-1 text-[9px] font-black text-indigo-500 border border-indigo-500/20">
                              TXN
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {row.typeBadge}
                          </td>
                          <td className="px-4 py-4">
                            <span className="block max-w-[160px] truncate text-sm font-bold text-text-primary" title={row.itemName ?? ""}>
                              {row.itemName || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="block max-w-[240px] truncate text-sm text-text-secondary leading-tight" title={row.description}>
                              {row.description || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`text-sm font-black ${row.cashIn > 0 ? "text-emerald-600" : "text-text-tertiary/40"}`}>
                              {row.cashIn > 0 ? `+₱${row.cashIn.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`text-sm font-black ${row.cashOut > 0 ? "text-red-600" : "text-text-tertiary/40"}`}>
                              {row.cashOut > 0 ? `-₱${row.cashOut.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[11px] font-black font-mono text-text-tertiary bg-surface-secondary/80 px-2 py-0.5 rounded border border-border-subtle">{row.reference || "—"}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
      ) : null}

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
        isSubmitting={isSubmitting}
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
