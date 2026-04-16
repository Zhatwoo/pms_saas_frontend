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

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const branchQuery = isAllBranches ? "" : `?branch=${selectedBranch.id}`;

    try {
      const [dashboardData, requestData, transactionData] = await Promise.all([
        api.get<DashboardSummary>("/dashboard"),
        api.get<FundRequestRecord[]>(`/fund-requests${branchQuery}`),
        api.get<ApiTransaction[]>(`/transactions${branchQuery}`),
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
              relatedRequest?.status === "pending_source_confirmation"
                ? ("Pending Source Confirmation" as const)
                : relatedRequest?.status === "pending_confirmation"
                  ? ("Pending Confirmation" as const)
                  : relatedRequest?.status === "rejected"
                    ? ("Rejected" as const)
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

  const approvedRequests = useMemo(
    () => fundRequests.filter((request) => request.status === "approved"),
    [fundRequests],
  );

  const availableBranches = useMemo(
    () => branchBalances.map((branch) => ({ branchId: branch.branchId, name: branch.name })),
    [branchBalances],
  );

  const handleRejectRequestClick = useCallback((id: string) => {
    const target = queues.pendingReview.find((request) => request.id === id) ?? null;
    setSelectedRejectRequest(target);
    setRejectModalOpen(true);
  }, [queues.pendingReview]);

  const handleApproveRequest = useCallback(
    async (request: FundRequestRecord) => {
      try {
        await api.patch<FundRequestRecord>(`/fund-requests/${request.id}/review`, {
          decision: "approved",
          approvedAmount: request.amountRequested,
          reviewNotes: `Approved for ${request.branch?.name ?? request.branchId}`,
        });
        showToast("Fund request approved. It is now ready for transfer.");
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve request.");
      }
    },
    [loadFinanceData, showToast],
  );

  const handleApproveAndTransferRequest = useCallback(
    async (request: FundRequestRecord) => {
      try {
        await api.patch<FundRequestRecord>(`/fund-requests/${request.id}/review`, {
          decision: "approved",
          approvedAmount: request.amountRequested,
          reviewNotes: `Approved for ${request.branch?.name ?? request.branchId}`,
        });
        showToast("Fund request approved. Continue with fund release.");
        await loadFinanceData();
        setSelectedTransferRequest(request);
        setTransferModalOpen(true);
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

  const handleTransferRequestClick = useCallback(
    async (id: string) => {
      const target = approvedRequests.find((request) => request.id === id) ?? null;
      await loadFinanceData();
      setSelectedTransferRequest(target);
      setTransferModalOpen(true);
    },
    [approvedRequests, loadFinanceData],
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
              title="Pending Super Admin Review"
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
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {formatCurrency(request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">Branch: {request.branch?.name ?? "Unknown Branch"}</p>
                        <p className="mt-1 text-xs text-text-secondary">Purpose: {request.purpose}</p>
                        {request.notes ? <p className="mt-1 text-xs text-text-muted">{request.notes}</p> : null}
                        <p className="mt-1 text-xs text-text-muted">Requested by {request.requestedBy?.fullName ?? "Branch Staff"}</p>
                        <p className="mt-1 text-xs text-text-muted">Submitted: {formatFinanceDate(request.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-center text-[11px] font-bold text-blue-700">
                          Pending
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(request)}
                            className="rounded-lg border border-blue-200 bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveAndTransferRequest(request)}
                            className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                          >
                            Approve & Transfer
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

          <div className="space-y-3 rounded-xl border border-border-main bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-text-primary">Approved Requests Ready for Transfer</h3>
                <p className="text-xs text-text-muted">
                  {approvedRequests.length === 0
                    ? "No approved requests are waiting for release."
                    : `${approvedRequests.length} approved request${approvedRequests.length === 1 ? "" : "s"} waiting for release.`}
                </p>
              </div>
            </div>

            {approvedRequests.length > 0 ? (
              <div className="space-y-3">
                {approvedRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {formatCurrency(request.approvedAmount ?? request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">Branch: {request.branch?.name ?? "Unknown Branch"}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          Approved {formatFinanceDate(request.reviewedAt ?? request.createdAt)}
                        </p>
                        {request.reviewNotes ? (
                          <p className="mt-1 text-xs text-text-muted">Review notes: {request.reviewNotes}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTransferRequestClick(request.id)}
                        className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                      >
                        Transfer Funds
                      </button>
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
