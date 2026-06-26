"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import type { UnifiedFundResult, Manager } from "./_components/add-funds-modal";
import { BalanceOverview } from "./_components/balance-overview";
import type { BranchBalance } from "./_components/balance-overview";
import { RejectRequestModal } from "./_components/reject-request-modal";
import { TransactionFilters } from "./_components/transaction-filters";
import { TransactionTable } from "./_components/transaction-table";
import type { FinanceTransaction } from "./_components/transaction-table";
import { AddSystemExpenseModal } from "./_components/add-system-expense-modal";
import type { AddSystemExpenseData } from "./_components/add-system-expense-modal";
import { FinanceQueueSection } from "@/components/shared/finance-queue-section";
import {
  FinanceSummaryCards,
  LedgerTypeFilter,
} from "@/components/shared/finance-ledger-table";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { ActionButton } from "@/components/shared/action-button";
import type {
  LedgerEntry,
  FinanceSummaryBreakdown,
} from "@/components/shared/finance-ledger-table";
import { formatPeso } from "@/lib/currency";
import {
  subscribeToFinanceRelevantNotifications,
} from "@/lib/notification-stream";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { sortLedgerEntries } from "@/lib/ledger-sort";

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
    systemExpenses?: number;
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

function fmtDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface UserRecord {
  id?: string;
  authId?: string;
  auth_id?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  role: string;
  branchId?: string | null;
  branch_id?: string | null;
}

export default function BranchFinancePage() {
  const searchParams = useSearchParams();
  const { selectedBranch, isAllBranches, setSelectedBranch, branches: contextBranches } = useBranch();

  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersByBranch, setManagersByBranch] = useState<Record<string, Manager[]>>({});
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [fundRequests, setFundRequests] = useState<FundRequestRecord[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const branchFilter = isAllBranches ? "all" : selectedBranch.id;
  const [dateFilter, setDateFilter] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState<FundRequestRecord | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferRequest, setSelectedTransferRequest] = useState<FundRequestRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemExpenseModalOpen, setSystemExpenseModalOpen] = useState(false);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [financeSummaries, setFinanceSummaries] = useState<BranchFinanceSummaryItem[]>([]);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");

  useEffect(() => {
    const today = getPhCalendarDateString();
    setLedgerDateFrom(today);
    setLedgerDateTo(today);
  }, []);

  useEffect(() => {
    const branchId = searchParams.get("branch");
    if (!branchId || contextBranches.length === 0) return;

    const targetBranch = contextBranches.find((branch) => branch.id === branchId);
    if (targetBranch) {
      setSelectedBranch(targetBranch);
    }
  }, [contextBranches, searchParams, setSelectedBranch]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const branchQuery = isAllBranches ? "" : `?branch=${selectedBranch.id}`;
    const today = getPhCalendarDateString();
    const ledgerDateFromQuery = ledgerDateFrom || today;
    const ledgerDateToQuery = ledgerDateTo || today;

    try {
      const [dashboardData, requestData, transactionResponse, summaryData, ledgerData, usersData] = await Promise.all([
        api.get<DashboardSummary>("/dashboard"),
        api.get<FundRequestRecord[]>(`/fund-requests${branchQuery}`),
        api.get<ApiTransaction[] | TransactionsResponse>(`/transactions${branchQuery ? branchQuery + "&" : "?"}range=all`),
        api.get<BranchFinanceSummaryItem[]>(`/branch-finance/summary${branchQuery}`),
        api.get<{ entries: LedgerEntry[]; total: number }>(
          `/branch-finance/ledger${branchQuery ? branchQuery + "&" : "?"}limit=500&dateFrom=${encodeURIComponent(
            ledgerDateFromQuery,
          )}&dateTo=${encodeURIComponent(ledgerDateToQuery)}`,
        ),
        api.get<UserRecord[]>("/users").catch(() => [] as UserRecord[]),
      ]);

      const adminUsers = (usersData ?? []).filter(
        (u) => u.role === "admin" || u.role === "super_admin",
      );
      const allManagers: Manager[] = adminUsers.map((u) => ({
        id: u.id ?? u.authId ?? u.auth_id ?? u.email,
        name: u.fullName ?? u.full_name ?? u.email,
        role: u.role,
      }));
      setManagers(allManagers);

      const byBranch: Record<string, Manager[]> = {};
      for (const u of adminUsers) {
        const bid = u.branchId ?? u.branch_id;
        if (bid) {
          (byBranch[bid] ??= []).push({
            id: u.id ?? u.authId ?? u.auth_id ?? u.email,
            name: u.fullName ?? u.full_name ?? u.email,
            role: u.role,
          });
        }
      }
      setManagersByBranch(byBranch);

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
  }, [isAllBranches, ledgerDateFrom, ledgerDateTo, selectedBranch.id]);

  useEffect(() => {
    void loadFinanceData();
  }, [loadFinanceData]);

  useEffect(() => {
    return subscribeToFinanceRelevantNotifications(() => {
      void loadFinanceData();
    });
  }, [loadFinanceData]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadFinanceData(), 60_000);
    return () => window.clearInterval(interval);
  }, [loadFinanceData]);


  const branchBalances = useMemo<BranchBalance[]>(() => {
    // Prefer branch-finance summary because it reflects latest daily_balances math.
    if (financeSummaries.length > 0) {
      const dashboardByBranch = new Map(
        (dashboard?.branchBalances ?? []).map((b) => [b.branchId, b]),
      );

      return financeSummaries.map((summary) => {
        const fallback = dashboardByBranch.get(summary.branchId);
        return {
          branchId: summary.branchId,
          name: summary.branchName,
          startingBalance: summary.startingBalance,
          currentBalance: summary.currentBalance,
          totalAdded: fallback?.totalAdded ?? 0,
          totalTransferred: fallback?.totalTransferred ?? 0,
          lastUpdated: fallback?.lastUpdated ?? new Date().toISOString(),
          status: summary.status ?? "Unknown",
        };
      });
    }

    return (dashboard?.branchBalances ?? []).map((branch) => ({
      branchId: branch.branchId,
      name: branch.name,
      startingBalance: branch.startingBalance,
      currentBalance: branch.currentBalance,
      totalAdded: branch.totalAdded,
      totalTransferred: branch.totalTransferred,
      lastUpdated: branch.lastUpdated ?? new Date().toISOString(),
      status: branch.status,
    }));
  }, [dashboard, financeSummaries]);

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
      pawnOut: 0, redeemIn: 0, buyBackIn: 0, renewalIn: 0, saleIn: 0,
      fundTransferIn: 0, fundTransferOut: 0, startBalance: 0, other: 0,
    };
    for (const s of scoped) {
      agg.pawnOut += s.breakdown.pawnOut;
      agg.redeemIn += s.breakdown.redeemIn ?? 0;
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

    // Include system-level expenses in the "Today" summary if viewing All Branches
    if (isAllBranches) {
      const today = getPhCalendarDateString();
      const systemEntriesToday = ledgerEntries.filter(
        (e) => (!e.branchId || e.branchId === "null" || e.branchName?.includes("System")) && e.date === today
      );
      for (const e of systemEntriesToday) {
        cashIn += e.cashIn || 0;
        cashOut += e.cashOut || 0;
      }
    }

    return { cashIn, cashOut };
  }, [financeSummaries, isAllBranches, selectedBranch.id, ledgerEntries]);

  const printLedgerRows = useMemo(() => {
    const rows = ledgerEntries.filter((entry) => {
      if (!isAllBranches && entry.branchId !== selectedBranch.id) return false;
      if (ledgerTypeFilter !== "all" && entry.type !== ledgerTypeFilter) return false;
      if (ledgerDateFrom && entry.date < ledgerDateFrom) return false;
      if (ledgerDateTo && entry.date > ledgerDateTo) return false;
      if (ledgerSearch) {
        const q = ledgerSearch.toLowerCase();
        const haystack = [
          entry.description ?? "",
          entry.itemName ?? "",
          entry.reference ?? "",
          entry.branchName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return sortLedgerEntries(rows, "desc");
  }, [
    isAllBranches,
    ledgerDateFrom,
    ledgerDateTo,
    ledgerEntries,
    ledgerSearch,
    ledgerTypeFilter,
    selectedBranch.id,
  ]);

  const printLedgerTotals = useMemo(() => {
    const cashIn = printLedgerRows.reduce((acc, r) => acc + (Number(r.cashIn) || 0), 0);
    const cashOut = printLedgerRows.reduce((acc, r) => acc + (Number(r.cashOut) || 0), 0);
    return { cashIn, cashOut, net: cashIn - cashOut };
  }, [printLedgerRows]);

  const handleRejectRequestClick = useCallback((id: string) => {
    const target = queues.pendingReview.find((request) => request.id === id) ?? null;
    setSelectedRejectRequest(target);
    setRejectModalOpen(true);
  }, [queues.pendingReview]);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!selectedRejectRequest || isSubmitting) return;
      setIsSubmitting(true);
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
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, loadFinanceData, selectedRejectRequest, showToast],
  );

  const handleTransferSubmit = useCallback(
    async (data: UnifiedFundResult) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        if (selectedTransferRequest) {
          const approvedAmount = data.amount || selectedTransferRequest.amountRequested;

          await api.patch<FundRequestRecord>(`/fund-requests/${selectedTransferRequest.id}/review`, {
            decision: "approved",
            approvedAmount,
            reviewNotes: data.notes || selectedTransferRequest.notes || undefined,
          });

          await api.patch<FundRequestRecord>(`/fund-requests/${selectedTransferRequest.id}/transfer`, {
            amount: approvedAmount,
            transferNotes: data.notes,
            sourceBranchId: data.sourceType === "BRANCH_TRANSFER" ? data.fromBranchId : undefined,
          });
          showToast(
            data.sourceType === "BRANCH_TRANSFER"
              ? "Fund request approved and routed through the source branch."
              : "Fund request approved and sent to the branch.",
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
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, loadFinanceData, selectedTransferRequest, showToast],
  );

  const handleSystemExpenseSubmit = useCallback(
    async (data: AddSystemExpenseData) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        await api.post("/transactions", {
          purpose: "Expense",
          cash_out: data.amount,
          details: `System Expense: ${data.category}${data.notes ? ` - ${data.notes}` : ""}`,
        });
        showToast("System expense recorded successfully.");
        setSystemExpenseModalOpen(false);
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record system expense.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, loadFinanceData, showToast],
  );

  const handleHeaderTransfer = useCallback(() => {
    void loadFinanceData().finally(() => {
      setSelectedTransferRequest(null);
      setTransferModalOpen(true);
    });
  }, [loadFinanceData]);

  const handleBranchFilterChange = useCallback((val: string) => {
    const target = contextBranches.find((b) => b.id === (val === "all" ? "__all__" : val));
    if (target) {
      setSelectedBranch(target);
    }
  }, [contextBranches, setSelectedBranch]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDateFilter("");
  }, []);

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

      {!dashboard && isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border-main bg-surface px-5 py-10 text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Loading branch finance data..." className="text-sm text-text-tertiary" />
        </div>
      ) : dashboard ? (
        <div className="space-y-6">
          <BalanceOverview
            isAllBranches={isAllBranches}
            selectedBranchId={selectedBranch.id}
            selectedBranchName={selectedBranch.name}
            balances={scopedBalances}
            systemExpenses={dashboard?.summary?.systemExpenses ?? 0}
            onAddFunds={handleHeaderTransfer}
            onAddSystemExpense={isAllBranches ? () => setSystemExpenseModalOpen(true) : undefined}
          />

          <div>
            <p className="mt-1 text-sm text-text-tertiary">
              Branch admins submit requests first. Super Admin can fulfill directly from management or route the transfer through another branch. Source-branch deductions must be confirmed before destination receipt confirmations can complete the transfer.
            </p>
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
                  <div key={request.id} className="rounded-xl border border-border-main bg-surface-secondary p-4 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900/60">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-text-primary">
                            {request.requestNo} - {formatCurrency(request.amountRequested)}
                          </p>
                          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
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
                <div className="py-6 text-center text-sm text-text-tertiary">
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
                <div className="py-6 text-center text-sm text-text-tertiary">
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
                        <div key={request.id} className="rounded-xl border border-border-main bg-surface-secondary p-4 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900/60">
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
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
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
                        <div key={request.id} className="rounded-xl border border-border-main bg-surface-secondary p-4 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900/60">
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
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
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
              onBranchFilterChange={handleBranchFilterChange}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              branches={availableBranches}
              onClearFilters={clearFilters}
            />

            <TransactionTable
              transactions={transactions}
              searchQuery={searchQuery}
              branchFilter={branchFilter}
              dateFilter={dateFilter}
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

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Search transactions..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none sm:w-auto"
              />
              <div className="w-full sm:w-auto">
                <LedgerTypeFilter value={ledgerTypeFilter} onChange={setLedgerTypeFilter} />
              </div>
              <input
                type="date"
                value={ledgerDateFrom}
                onChange={(e) => setLedgerDateFrom(e.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none sm:w-auto"
              />
              <input
                type="date"
                value={ledgerDateTo}
                onChange={(e) => setLedgerDateTo(e.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none sm:w-auto"
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

            <div className="flex justify-end print:hidden mb-2">
              <ActionButton
                variant="primary"
                onClick={() => window.print()}
                size="md"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                Print Ledger
              </ActionButton>
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
                {isAllBranches ? (
                  <p><strong>Scope:</strong> All Branches</p>
                ) : (
                  <>
                    <p><strong>Branch:</strong> {selectedBranch.name}</p>
                    <p><strong>Branch Code:</strong> {financeSummaries[0]?.branchCode || selectedBranch.code || "N/A"}</p>
                  </>
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
                  {printLedgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center italic text-gray-500 border-b border-black">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    printLedgerRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-300">
                        <td className="p-2 whitespace-nowrap">{fmtDate(row.date)} {row.time || ""}</td>
                        <td className="p-2 whitespace-nowrap">TXN</td>
                        <td className="p-2 truncate max-w-[200px]">{row.itemName || "—"}</td>
                        <td className="p-2 truncate max-w-[250px]">{row.description || "—"}</td>
                        <td className="p-2 text-right font-mono">{row.cashIn > 0 ? `+₱${row.cashIn.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                        <td className="p-2 text-right font-mono text-red-600">{row.cashOut > 0 ? `-₱${row.cashOut.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                        <td className="p-2 font-mono text-[10px] truncate max-w-[120px] text-gray-700">{row.reference || "—"}</td>
                      </tr>
                    ))
                  )}
                  {printLedgerRows.length > 0 && (
                    <>
                      <tr className="border-b-2 border-black bg-gray-50 uppercase">
                        <td colSpan={4} className="p-2 font-bold text-right">
                          Total:
                        </td>
                        <td className="p-2 text-right font-bold font-mono">{formatPeso(printLedgerTotals.cashIn)}</td>
                        <td className="p-2 text-right font-bold font-mono text-red-600">
                          {printLedgerTotals.cashOut > 0
                            ? `-${formatPeso(printLedgerTotals.cashOut)}`
                            : formatPeso(0)}
                        </td>
                        <td />
                      </tr>
                      <tr className="border-b-2 border-black bg-white">
                        <td colSpan={4} className="p-2 font-bold text-right normal-case">
                          Net income (cash in − cash out):
                        </td>
                        <td
                          colSpan={3}
                          className={`p-2 text-right font-black font-mono normal-case ${
                            printLedgerTotals.net >= 0 ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {formatPeso(printLedgerTotals.net)}
                        </td>
                      </tr>
                    </>
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
                  {printLedgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-text-tertiary">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    printLedgerRows.map((row) => (
                      <tr key={row.id} className="border-b border-border-subtle transition-colors hover:bg-surface-secondary/50">
                        <td className="px-3 py-3 align-top">
                          <span className="text-sm text-text-secondary">{fmtDate(row.date)}</span>
                          {row.time ? <span className="ml-1.5 text-xs text-text-muted">{row.time}</span> : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            TXN
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="text-xs font-semibold text-text-secondary uppercase">{row.type.replaceAll("_", " ")}</span>
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
          </div>
      ) : null}

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
        managers={managers}
        branches={branchBalances}
        currentBranchId={selectedTransferRequest?.branch?.id ?? (isAllBranches ? "001" : selectedBranch.id)}
        getManagersForBranch={(branchId: string) => managersByBranch[branchId] ?? managers}
        defaultAmount={String(selectedTransferRequest?.approvedAmount ?? selectedTransferRequest?.amountRequested ?? "")}
        defaultNotes={selectedTransferRequest?.reviewNotes ?? selectedTransferRequest?.notes ?? ""}
        allowBranchTransfer={true}
        submitLabel="Confirm and Send"
        lockedTargetBranchId={selectedTransferRequest?.branch?.id ?? undefined}
        lockedTargetBranchName={selectedTransferRequest?.branch?.name ?? undefined}
      />

      <AddSystemExpenseModal
        isOpen={systemExpenseModalOpen}
        onClose={() => setSystemExpenseModalOpen(false)}
        onSubmit={handleSystemExpenseSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
