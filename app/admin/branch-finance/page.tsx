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

function toStageLabel(status: FundRequestRecord["status"]) {
  return status === "pending_source_confirmation"
    ? "Pending Source Confirmation"
    : status === "pending_confirmation"
      ? "Pending Confirmation"
      : status;
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

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardData, requestData] = await Promise.all([
        api.get<AdminDashboardResponse>("/dashboard"),
        api.get<FundRequestRecord[]>("/fund-requests"),
      ]);
      setDashboard(dashboardData);
      setRequests(requestData);
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
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">
                Current Balance
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                {formatCurrency(resolvedCurrentBalance)}
              </p>
              <p className="mt-2 text-xs text-emerald-200/80">
                Last updated: {formatFinanceDate(finance?.lastUpdated)}
              </p>
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
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        Pending
                      </span>
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
                          className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {getConfirmationLabel(request)}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-orange-200 bg-white p-4 text-sm text-text-tertiary">
                  No transfers are waiting for confirmation.
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

            <div className="space-y-3 rounded-xl border border-border-main bg-surface p-5">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-3 py-3">Request</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Transferred At</th>
                    <th className="px-3 py-3">Confirmed At</th>
                    <th className="px-3 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.transferred.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-text-tertiary">
                        No completed transfers yet.
                      </td>
                    </tr>
                  ) : (
                    queues.transferred.map((request) => (
                      <tr key={request.id} className="border-b border-border-subtle">
                        <td className="px-3 py-3 font-semibold text-text-primary">{request.requestNo}</td>
                        <td className="px-3 py-3 text-text-secondary">{formatCurrency(getRequestAmount(request))}</td>
                        <td className="px-3 py-3 text-text-secondary">{formatFinanceDate(request.transferredAt)}</td>
                        <td className="px-3 py-3 text-text-secondary">{formatFinanceDate(request.confirmedAt)}</td>
                        <td className="px-3 py-3 text-xs text-text-muted">
                          {request.confirmationNotes ?? request.transferNotes ?? "-"}
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
