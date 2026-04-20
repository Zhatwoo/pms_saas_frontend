"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import {
  buildFinanceQueues,
  formatCurrency,
  formatFinanceDate,
  getRequestAmount,
  type FundRequestRecord,
} from "@/lib/fund-finance";
import { AddFundsModal } from "./_components/add-funds-modal";
import type { UnifiedFundResult } from "./_components/add-funds-modal";
import { BalanceOverview } from "./_components/balance-overview";
import type { BranchBalance } from "./_components/balance-overview";
import { RejectRequestModal } from "./_components/reject-request-modal";
import { TransactionFilters } from "./_components/transaction-filters";
import { TransactionTable } from "./_components/transaction-table";
import type { FinanceTransaction } from "./_components/transaction-table";
import { FinanceQueueSection } from "@/components/shared/finance-queue-section";
import {
  FinanceLedgerTable,
  FinanceSummaryCards,
  LedgerTypeFilter,
} from "@/components/shared/finance-ledger-table";
import type {
  LedgerEntry,
  FinanceSummaryBreakdown,
} from "@/components/shared/finance-ledger-table";

interface DashboardSummary {
  view: "super_admin";
  summary: {
    branches: {
      total: number;
      active: number;
      inactive: number;
    };
    users: {
      total: number;
      pendingApproval: number;
    };
    fundRequests: {
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
  };
  branchBalances: Array<{
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
  }>;
}

interface ApiTransaction {
  id: string;
  transaction_date: string;
  branch_id: string;
  branch: string;
  purpose: string;
  cash_in: number | string | null;
  cash_out: number | string | null;
  details: string | null;
  unit?: string | null;
}

interface TransactionsResponse {
  transactions: ApiTransaction[];
  stats?: unknown;
}

interface BranchFinanceSummaryItem {
  branchId: string;
  branchName: string;
  branchCode: string | null;
  status: string | null;
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

export default function BranchFinancePage() {
  const { selectedBranch, isAllBranches } = useBranch();

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [fundRequests, setFundRequests] = useState<FundRequestRecord[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState<FundRequestRecord | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferRequest, setSelectedTransferRequest] = useState<FundRequestRecord | null>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [financeSummaries, setFinanceSummaries] = useState<BranchFinanceSummaryItem[]>([]);
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

    const branchQuery = isAllBranches ? "" : `?branch=${selectedBranch.id}`;

    try {
      const [dashboardData, requestData, transactionResponse, summaryData, ledgerData] = await Promise.all([
        api.get<DashboardSummary>("/dashboard"),
        api.get<FundRequestRecord[]>(`/fund-requests${branchQuery}`),
        api.get<ApiTransaction[] | TransactionsResponse>(`/transactions${branchQuery}`),
        api.get<BranchFinanceSummaryItem[]>(`/branch-finance/summary${branchQuery}`),
        api.get<{ entries: LedgerEntry[]; total: number }>(`/branch-finance/ledger${branchQuery ? branchQuery + "&" : "?"}limit=100`),
      ]);

      const transactionData = Array.isArray(transactionResponse)
        ? transactionResponse
        : transactionResponse?.transactions ?? [];

      const transferRequestByTransactionId = new Map(
        requestData
          .filter((request) => request.relatedTransactionId)
          .map((request) => [request.relatedTransactionId as string, request]),
      );

      const liveTransactions: FinanceTransaction[] = transactionData
        .filter(
          (transaction) =>
            transaction.purpose === "Fund Transfer" ||
            transaction.purpose === "Cash Transfer" ||
            transaction.unit === "fund_transfer" ||
            transaction.unit === "fund_transfer_out",
        )
        .map((transaction) => {
          const relatedRequest = transferRequestByTransactionId.get(transaction.id);
          const cashIn = Number(transaction.cash_in ?? 0);
          const cashOut = Number(transaction.cash_out ?? 0);

          return {
            id: transaction.id,
            date: transaction.transaction_date,
            branch: transaction.branch,
            branchId: transaction.branch_id,
            type: cashOut > 0 ? "TRANSFER_OUT" : "ADD_FUNDS",
            amount: cashOut > 0 ? cashOut : cashIn,
            balanceAfter: null,
            status:
              relatedRequest?.status === "rejected"
                ? ("Rejected" as const)
                : relatedRequest?.status === "pending"
                  ? ("Pending" as const)
                  : ("Approved" as const),
            approvedBy: relatedRequest?.transferredBy?.fullName ?? "Super Admin",
            approvalDate: relatedRequest?.transferredAt ?? null,
            notes:
              `${relatedRequest?.confirmedReceivedAmount
                ? `Received: ${formatCurrency(relatedRequest.confirmedReceivedAmount)} | `
                : ""}${
                relatedRequest?.transferNotes ??
                relatedRequest?.reviewNotes ??
                transaction.details ??
                "Fund transfer processed"
              }`,
          };
        });

      setDashboard(dashboardData);
      setFundRequests(requestData);
      setTransactions(liveTransactions);
      setFinanceSummaries(summaryData ?? []);
      setLedgerEntries(ledgerData?.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branch finance data.");
    } finally {
      setIsLoading(false);
    }
  }, [isAllBranches, selectedBranch.id]);

  useEffect(() => {
    void loadFinanceData();
  }, [loadFinanceData]);

  useEffect(() => {
    setBranchFilter(isAllBranches ? "all" : selectedBranch.id);
  }, [isAllBranches, selectedBranch.id]);

  const branchBalances = useMemo<BranchBalance[]>(
    () =>
      (dashboard?.branchBalances ?? []).map((branch) => ({
        branchId: branch.branchId,
        name: branch.name,
        startingBalance: branch.startingBalance,
        currentBalance: branch.currentBalance,
        totalAdded: branch.totalAdded,
        totalTransferred: branch.totalTransferred,
        lastUpdated: branch.lastUpdated ?? new Date().toISOString(),
        status: branch.status,
      })),
    [dashboard],
  );

  const scopedBalances = useMemo(() => {
    if (isAllBranches) return branchBalances;
    return branchBalances.filter((branch) => branch.branchId === selectedBranch.id);
  }, [branchBalances, isAllBranches, selectedBranch.id]);

  const queues = useMemo(
    () => buildFinanceQueues(fundRequests),
    [fundRequests],
  );

  const availableBranches = useMemo(
    () => branchBalances.map((branch) => ({ branchId: branch.branchId, name: branch.name })),
    [branchBalances],
  );

  const aggregatedBreakdown = useMemo<FinanceSummaryBreakdown>(() => {
    const scoped = isAllBranches
      ? financeSummaries
      : financeSummaries.filter((s) => s.branchId === selectedBranch.id);
    const agg: FinanceSummaryBreakdown = {
      pawnOut: 0, buyBackIn: 0, renewalIn: 0, saleIn: 0,
      fundTransferIn: 0, fundTransferOut: 0, startBalance: 0, other: 0,
    };
    for (const s of scoped) {
      agg.pawnOut += s.breakdown.pawnOut;
      agg.buyBackIn += s.breakdown.buyBackIn;
      agg.renewalIn += s.breakdown.renewalIn;
      agg.saleIn += s.breakdown.saleIn;
      agg.fundTransferIn += s.breakdown.fundTransferIn;
      agg.fundTransferOut += s.breakdown.fundTransferOut;
      agg.startBalance += s.breakdown.startBalance;
      agg.other += s.breakdown.other;
    }
    return agg;
  }, [financeSummaries, isAllBranches, selectedBranch.id]);

  const aggregatedTodayCash = useMemo(() => {
    const scoped = isAllBranches
      ? financeSummaries
      : financeSummaries.filter((s) => s.branchId === selectedBranch.id);
    let cashIn = 0;
    let cashOut = 0;
    for (const s of scoped) {
      cashIn += s.todayCashIn;
      cashOut += s.todayCashOut;
    }
    return { cashIn, cashOut };
  }, [financeSummaries, isAllBranches, selectedBranch.id]);

  const handleRejectRequestClick = useCallback((id: string) => {
    const target = queues.pendingReview.find((request) => request.id === id) ?? null;
    setSelectedRejectRequest(target);
    setRejectModalOpen(true);
  }, [queues.pendingReview]);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!selectedRejectRequest) return;
      try {
        await api.patch<FundRequestRecord>(`/fund-requests/${selectedRejectRequest.id}/review`, {
          decision: "rejected",
          reviewNotes: reason,
        });
        setRejectModalOpen(false);
        setSelectedRejectRequest(null);
        showToast("Fund request rejected.");
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject request.");
      }
    },
    [loadFinanceData, selectedRejectRequest, showToast],
  );

  const handleTransferSubmit = useCallback(
    async (data: UnifiedFundResult) => {
      try {
        if (selectedTransferRequest) {
          await api.patch<FundRequestRecord>(`/fund-requests/${selectedTransferRequest.id}/transfer`, {
            amount: data.amount,
            transferNotes: data.notes,
            sourceBranchId: data.sourceType === "BRANCH_TRANSFER" ? data.fromBranchId : undefined,
          });
          showToast(
            data.sourceType === "BRANCH_TRANSFER"
              ? "Funds routed through the source branch and are now awaiting source confirmation."
              : "Funds sent to the branch and are now awaiting branch confirmation.",
          );
        } else {
          await api.post<FundRequestRecord>("/fund-requests/direct-transfer", {
            amount: data.amount,
            toBranchId: data.toBranchId,
            fromBranchId: data.sourceType === "BRANCH_TRANSFER" ? data.fromBranchId : undefined,
            notes: data.notes,
            purpose:
              data.sourceType === "BRANCH_TRANSFER"
                ? "Direct branch-to-branch transfer"
                : "Direct management cash transfer",
          });
          showToast(
            data.sourceType === "BRANCH_TRANSFER"
              ? "Direct branch transfer released and awaiting source confirmation."
              : "Direct cash transfer released and awaiting branch confirmation.",
          );
        }
        setTransferModalOpen(false);
        setSelectedTransferRequest(null);
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to transfer funds.");
      }
    },
    [loadFinanceData, selectedTransferRequest, showToast],
  );

  const handleHeaderTransfer = useCallback(() => {
    void loadFinanceData().finally(() => {
      setSelectedTransferRequest(null);
      setTransferModalOpen(true);
    });
  }, [loadFinanceData]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setBranchFilter(isAllBranches ? "all" : selectedBranch.id);
    setDateFrom("");
    setDateTo("");
  }, [isAllBranches, selectedBranch.id]);

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
          Review branch fund requests, transfer approved funds, and track transfer history from live backend data.
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
          <BalanceOverview
            isAllBranches={isAllBranches}
            selectedBranchId={selectedBranch.id}
            selectedBranchName={selectedBranch.name}
            balances={scopedBalances}
            onAddFunds={handleHeaderTransfer}
          />

          <div className="rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-[11px] text-text-muted">
            Branch admins submit requests first. Super Admin can fulfill directly from management or route the transfer through another branch. Source-branch deductions must be confirmed before destination receipt confirmations can complete the transfer.
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FinanceQueueSection
              accent="blue"
              title="Branch Fund Requests"
              subtitle={
                queues.pendingReview.length === 0
                  ? "No requests are waiting for review."
                  : `${queues.pendingReview.length} request${queues.pendingReview.length === 1 ? "" : "s"} waiting for review.`
              }
              count={queues.pendingReview.length}
              expanded
            >
              {queues.pendingReview.length > 0 ? (
                queues.pendingReview.map((request) => (
                  <div key={request.id} className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-text-primary">
                            {request.requestNo} - {formatCurrency(request.amountRequested)}
                          </p>
                          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                            Pending
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">Branch: {request.branch?.name ?? "Unknown Branch"}</p>
                        <p className="mt-1 text-xs text-text-secondary">Purpose: {request.purpose}</p>
                        {request.notes ? <p className="mt-1 text-xs text-text-muted">{request.notes}</p> : null}
                        <p className="mt-1 text-xs text-text-muted">Requested by {request.requestedBy?.fullName ?? "Branch Staff"}</p>
                        <p className="mt-1 text-xs text-text-muted">Submitted: {formatFinanceDate(request.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTransferRequest(request);
                            setTransferModalOpen(true);
                          }}
                          className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          Confirm & Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequestClick(request.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-blue-200 bg-white p-4 text-sm text-text-tertiary">
                  No requests are waiting for review.
                </div>
              )}
            </FinanceQueueSection>

            <FinanceQueueSection
              accent="orange"
              title="Pending Branch Confirmation"
              subtitle={
                queues.sourceConfirmation.length + queues.destinationConfirmation.length === 0
                  ? "No transfers are waiting for confirmation."
                  : `${queues.sourceConfirmation.length + queues.destinationConfirmation.length} transfer${queues.sourceConfirmation.length + queues.destinationConfirmation.length === 1 ? "" : "s"} awaiting confirmation.`
              }
              count={queues.sourceConfirmation.length + queues.destinationConfirmation.length}
              expanded
            >
              {queues.sourceConfirmation.length === 0 && queues.destinationConfirmation.length === 0 ? (
                <div className="rounded-xl border border-orange-200 bg-white p-4 text-sm text-text-tertiary">
                  No transfers are waiting for confirmation.
                </div>
              ) : (
                <div className="space-y-4">
                  {queues.sourceConfirmation.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-orange-700">Awaiting Source Branch Confirmation</h4>
                        <p className="text-[11px] text-text-muted">The source branch must confirm the outgoing deduction before the destination branch can receive the transfer.</p>
                      </div>
                      {queues.sourceConfirmation.map((request) => (
                        <div key={request.id} className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-text-primary">
                                {request.requestNo} - {formatCurrency(getRequestAmount(request))}
                              </p>
                              <p className="mt-1 text-xs text-text-secondary">
                                Source branch: {request.sourceBranch?.name ?? request.sourceBranchId ?? "Unknown Branch"}
                              </p>
                              <p className="mt-1 text-xs text-text-secondary">
                                Destination branch: {request.branch?.name ?? "Unknown Branch"}
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Transfer mode: {request.transferMode?.replaceAll("_", " ") ?? "Cash"}
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Outgoing confirmation pending since {formatFinanceDate(request.transferredAt ?? request.createdAt)}
                              </p>
                              {request.transferNotes ? (
                                <p className="mt-1 text-xs text-text-muted">Release notes: {request.transferNotes}</p>
                              ) : null}
                            </div>
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                              Pending Source Confirmation
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {queues.destinationConfirmation.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-orange-700">Awaiting Destination Receipt Confirmation</h4>
                        <p className="text-[11px] text-text-muted">The destination branch can confirm the received amount after proof of receipt is uploaded.</p>
                      </div>
                      {queues.destinationConfirmation.map((request) => (
                        <div key={request.id} className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-text-primary">
                                {request.requestNo} - {formatCurrency(getRequestAmount(request))}
                              </p>
                              <p className="mt-1 text-xs text-text-secondary">
                                Destination branch: {request.branch?.name ?? "Unknown Branch"}
                              </p>
                              <p className="mt-1 text-xs text-text-secondary">
                                Source branch: {request.sourceBranch?.name ?? request.sourceBranchId ?? "Management"}
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Transfer mode: {request.transferMode?.replaceAll("_", " ") ?? "Cash"}
                              </p>
                              <p className="mt-1 text-xs text-text-muted">
                                Sent for receipt confirmation: {formatFinanceDate(request.transferredAt ?? request.createdAt)}
                              </p>
                              {request.transferNotes ? (
                                <p className="mt-1 text-xs text-text-muted">Release notes: {request.transferNotes}</p>
                              ) : null}
                              {request.sourceConfirmationNotes ? (
                                <p className="mt-1 text-xs text-text-muted">Source notes: {request.sourceConfirmationNotes}</p>
                              ) : null}
                            </div>
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                              Pending Confirmation
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </FinanceQueueSection>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-surface text-emerald-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-text-primary">Transfer History</h2>
            </div>

            <TransactionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              branchFilter={branchFilter}
              onBranchFilterChange={setBranchFilter}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              branches={availableBranches}
              onClearFilters={clearFilters}
            />

            <TransactionTable
              transactions={transactions}
              searchQuery={searchQuery}
              branchFilter={branchFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </div>

          {/* ── All Financial Activity (Unified Ledger) ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-text-primary">All Financial Activity</h2>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                Per Branch Monitoring
              </span>
            </div>

            <FinanceSummaryCards
              breakdown={aggregatedBreakdown}
              todayCashIn={aggregatedTodayCash.cashIn}
              todayCashOut={aggregatedTodayCash.cashOut}
            />

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search transactions..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
              />
              <LedgerTypeFilter value={ledgerTypeFilter} onChange={setLedgerTypeFilter} />
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

            <FinanceLedgerTable
              entries={ledgerEntries}
              isLoading={isLoading}
              showBranchColumn={isAllBranches}
              searchQuery={ledgerSearch}
              typeFilter={ledgerTypeFilter}
              dateFrom={ledgerDateFrom}
              dateTo={ledgerDateTo}
              branchName={isAllBranches ? null : selectedBranch.name}
              branchCode={isAllBranches ? null : (financeSummaries[0]?.branchCode ?? selectedBranch.branch_code ?? null)}
            />
          </div>
        </>
      )}

      <RejectRequestModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedRejectRequest(null);
        }}
        onConfirm={handleRejectConfirm}
        amount={selectedRejectRequest?.amountRequested ?? 0}
        branchName={selectedRejectRequest?.branch?.name ?? ""}
      />

      <AddFundsModal
        isOpen={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setSelectedTransferRequest(null);
        }}
        onSubmit={handleTransferSubmit}
        branchName={selectedTransferRequest?.branch?.name ?? selectedBranch.name}
        managers={[]}
        branches={branchBalances}
        currentBranchId={selectedTransferRequest?.branch?.id ?? (isAllBranches ? "001" : selectedBranch.id)}
        getManagersForBranch={() => []}
        defaultAmount={String(selectedTransferRequest?.approvedAmount ?? selectedTransferRequest?.amountRequested ?? "")}
        defaultNotes={selectedTransferRequest?.reviewNotes ?? selectedTransferRequest?.notes ?? ""}
        allowBranchTransfer={true}
        submitLabel="Confirm and Send"
        lockedTargetBranchId={selectedTransferRequest?.branch?.id ?? undefined}
        lockedTargetBranchName={selectedTransferRequest?.branch?.name ?? undefined}
      />
    </div>
  );
}
