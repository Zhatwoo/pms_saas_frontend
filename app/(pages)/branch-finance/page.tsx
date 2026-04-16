"use client";

import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddFundsModal } from "./_components/add-funds-modal";
import type { UnifiedFundResult } from "./_components/add-funds-modal";
import { ApprovalPanel } from "./_components/approval-panel";
import type { ApprovalRequest } from "./_components/approval-panel";
import { BalanceOverview } from "./_components/balance-overview";
import type { BranchBalance } from "./_components/balance-overview";
import { IncomingRequestsPanel } from "./_components/incoming-requests-panel";
import type { BranchFundRequest } from "./_components/incoming-requests-panel";
import { RejectRequestModal } from "./_components/reject-request-modal";
import { TransactionFilters } from "./_components/transaction-filters";
import { TransactionTable } from "./_components/transaction-table";
import type { FinanceTransaction } from "./_components/transaction-table";
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

interface FundRequestRecord {
  id: string;
  requestNo: string;
  branchId: string;
  amountRequested: number;
  purpose: string;
  notes: string | null;
  status: "pending" | "approved" | "pending_confirmation" | "rejected" | "transferred" | "cancelled";
  approvedAmount: number | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  amountTransferred: number | null;
  transferredAt: string | null;
  transferReference: string | null;
  transferNotes: string | null;
  confirmationNotes: string | null;
  confirmedAt: string | null;
  relatedTransactionId: string | null;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    branchCode: string | null;
    location: string | null;
  } | null;
  requestedBy: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  reviewedBy: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  transferredBy: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  confirmedBy?: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  flowType?: "request_based" | "direct_push";
  receiverUserId?: string | null;
  receiverRole?: "admin" | "employee" | null;
  confirmedReceivedAmount?: number | null;
  confirmationNote?: string | null;
  transferReferenceNo?: string | null;
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
  const [activePanel, setActivePanel] = useState<"incoming" | "approval" | null>("incoming");
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

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const branchQuery = isAllBranches ? "" : `?branch=${selectedBranch.id}`;

    try {
      const [dashboardData, requestData, transactionData, summaryData, ledgerData] = await Promise.all([
        api.get<DashboardSummary>("/dashboard"),
        api.get<FundRequestRecord[]>(`/fund-requests${branchQuery}`),
        api.get<ApiTransaction[]>(`/transactions${branchQuery}`),
        api.get<BranchFinanceSummaryItem[]>(`/branch-finance/summary${branchQuery}`),
        api.get<{ entries: LedgerEntry[]; total: number }>(`/branch-finance/ledger${branchQuery ? branchQuery + "&" : "?"}limit=100`),
      ]);

      const transferRequestByTransactionId = new Map(
        requestData
          .filter((request) => request.relatedTransactionId)
          .map((request) => [request.relatedTransactionId as string, request]),
      );

      const liveTransactions: FinanceTransaction[] = transactionData
        .filter(
          (transaction) =>
            transaction.purpose === "Fund Transfer" ||
            transaction.unit === "fund_transfer",
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
              relatedRequest?.status === "pending_confirmation"
                ? ("Pending" as const)
                : relatedRequest?.status === "rejected"
                  ? ("Rejected" as const)
                  : ("Approved" as const),
            approvedBy: relatedRequest?.transferredBy?.fullName ?? "Super Admin",
            approvalDate: relatedRequest?.transferredAt ?? null,
            notes:
              `${relatedRequest?.confirmedReceivedAmount
                ? `Received: ${fmtCurrency(relatedRequest.confirmedReceivedAmount)} | `
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

  const pendingRequests = useMemo<FundRequestRecord[]>(
    () => fundRequests.filter((request) => request.status === "pending"),
    [fundRequests],
  );

  const approvedRequests = useMemo<FundRequestRecord[]>(
    () => fundRequests.filter((request) => request.status === "approved"),
    [fundRequests],
  );

  const pendingConfirmationRequests = useMemo<FundRequestRecord[]>(
    () => fundRequests.filter((request) => request.status === "pending_confirmation"),
    [fundRequests],
  );

  const incomingRequests = useMemo<BranchFundRequest[]>(
    () =>
      pendingRequests.map((request) => ({
        id: request.id,
        branchId: request.branch?.id ?? request.branchId,
        branchName: request.branch?.name ?? "Unknown Branch",
        amount: request.amountRequested,
        category: request.purpose,
        notes: request.notes ?? "",
        date: request.createdAt,
      })),
    [pendingRequests],
  );

  const approvalRequests = useMemo<ApprovalRequest[]>(
    () =>
      approvedRequests.map((request) => ({
        id: request.id,
        type: "ADD_FUNDS",
        amount: request.approvedAmount ?? request.amountRequested,
        requestedBy: request.requestedBy?.fullName ?? "Branch Admin",
        branch: request.branch?.name ?? "Unknown Branch",
        date: request.reviewedAt ?? request.createdAt,
        requiredApprovers: 1,
        currentApprovals: 1,
        notes: request.reviewNotes ?? request.notes ?? "Approved and ready for transfer",
      })),
    [approvedRequests],
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
    const target = pendingRequests.find((request) => request.id === id) ?? null;
    setSelectedRejectRequest(target);
    setRejectModalOpen(true);
  }, [pendingRequests]);

  const handleApproveRequest = useCallback(
    async (request: BranchFundRequest) => {
      try {
        await api.patch<FundRequestRecord>(`/fund-requests/${request.id}/review`, {
          decision: "approved",
          approvedAmount: request.amount,
          reviewNotes: `Approved for ${request.branchName}`,
        });
        showToast("Fund request approved. It is now ready for transfer.");
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve request.");
      }
    },
    [loadFinanceData, showToast],
  );

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!selectedRejectRequest) return;
      try {
        await api.patch<FundRequestRecord>(
          `/fund-requests/${selectedRejectRequest.id}/review`,
          {
            decision: "rejected",
            reviewNotes: reason,
          },
        );
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

  const handleTransferRequestClick = useCallback((id: string) => {
    const target = approvedRequests.find((request) => request.id === id) ?? null;
    setSelectedTransferRequest(target);
    setTransferModalOpen(true);
  }, [approvedRequests]);

  const handleTransferSubmit = useCallback(
    async (data: UnifiedFundResult) => {
      try {
        if (selectedTransferRequest) {
          await api.patch<FundRequestRecord>(
            `/fund-requests/${selectedTransferRequest.id}/transfer`,
            {
              amount: data.amount,
              transferNotes: data.notes,
            },
          );
          showToast("Funds sent to the branch and are now awaiting branch confirmation.");
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
          showToast("Direct cash transfer released and awaiting branch confirmation.");
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
    setSelectedTransferRequest(null);
    setTransferModalOpen(true);
  }, []);

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
            Branch admins submit requests first. After approval, release the funds from the panel below. The request stays in pending confirmation until the requesting branch admin confirms receipt.
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <IncomingRequestsPanel
              requests={incomingRequests}
              onFulfill={handleApproveRequest}
              onReject={handleRejectRequestClick}
              expanded={activePanel === "incoming"}
              onToggle={() =>
                setActivePanel(activePanel === "incoming" ? null : "incoming")
              }
            />

            <ApprovalPanel
              requests={approvalRequests}
              onActionClick={handleTransferRequestClick}
              expanded={activePanel === "approval"}
              onToggle={() =>
                setActivePanel(activePanel === "approval" ? null : "approval")
              }
              title="Approved Requests Ready for Transfer"
              subtitle={
                approvalRequests.length === 0
                  ? "No approved requests are waiting for transfer."
                  : `${approvalRequests.length} approved request${approvalRequests.length === 1 ? "" : "s"} ready for fund release`
              }
              actionLabel="Transfer Funds"
              actionVariant="primary"
            />
          </div>

          <div className="rounded-xl border border-violet-300/40 bg-violet-50/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Awaiting Branch Confirmation</h3>
                <p className="text-xs text-text-muted">
                  {pendingConfirmationRequests.length === 0
                    ? "No released transfers are waiting for branch confirmation."
                    : `${pendingConfirmationRequests.length} request${pendingConfirmationRequests.length === 1 ? "" : "s"} sent by Super Admin and awaiting confirmation from the requesting branch.`}
                </p>
              </div>
            </div>

            {pendingConfirmationRequests.length > 0 ? (
              <div className="mt-4 space-y-3">
                {pendingConfirmationRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-violet-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {fmtCurrency(request.amountTransferred ?? request.approvedAmount ?? request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {request.branch?.name ?? "Unknown Branch"}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          Requested by {request.requestedBy?.fullName ?? "Branch Admin"}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          Sent for confirmation: {new Date(request.transferredAt ?? request.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {request.transferNotes ? (
                          <p className="mt-1 text-xs text-text-muted">Release notes: {request.transferNotes}</p>
                        ) : null}
                        {request.receiverRole ? (
                          <p className="mt-1 text-xs text-text-muted">
                            Receiver role: {request.receiverRole}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                        Pending Confirmation
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
        currentBranchId={
          selectedTransferRequest?.branch?.id ?? (isAllBranches ? "001" : selectedBranch.id)
        }
        getManagersForBranch={() => []}
        defaultAmount={String(selectedTransferRequest?.approvedAmount ?? selectedTransferRequest?.amountRequested ?? "")}
        defaultNotes={selectedTransferRequest?.reviewNotes ?? selectedTransferRequest?.notes ?? ""}
        allowBranchTransfer={false}
        submitLabel="Confirm and Send"
      />
    </div>
  );
}
