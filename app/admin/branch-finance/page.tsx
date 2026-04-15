"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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

interface FundRequestRecord {
  id: string;
  requestNo: string;
  amountRequested: number;
  approvedAmount: number | null;
  amountTransferred: number | null;
  purpose: string;
  notes?: string | null;
  status: "pending" | "approved" | "pending_confirmation" | "rejected" | "transferred" | "cancelled";
  createdAt: string;
  reviewedAt?: string | null;
  transferredAt?: string | null;
  reviewNotes?: string | null;
  transferReference?: string | null;
  transferNotes?: string | null;
  confirmationNotes?: string | null;
  confirmedAt?: string | null;
  confirmedReceivedAmount?: number | null;
  receiverUserId?: string | null;
  receiverRole?: "admin" | "employee" | null;
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
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
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
  return status === "pending_confirmation" ? "Pending Confirmation" : status;
}

export default function AdminBranchFinancePage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [requests, setRequests] = useState<FundRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FundRequestRecord["status"] | "all">("all");
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

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );
  const pendingConfirmationRequests = useMemo(
    () => requests.filter((request) => request.status === "pending_confirmation"),
    [requests],
  );

  const handleConfirmRequestClick = useCallback((request: FundRequestRecord) => {
    setSelectedConfirmRequest(request);
    setConfirmModalOpen(true);
  }, []);

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
        showToast("Branch receipt confirmed and transfer recorded successfully.");
        await loadFinanceData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to confirm fund receipt.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadFinanceData, selectedConfirmRequest, showToast],
  );

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
                {fmtCurrency(finance?.currentBalance ?? dashboard?.currentBalance ?? 0)}
              </p>
              <p className="mt-2 text-xs text-emerald-200/80">
                Last updated: {fmtDate(finance?.lastUpdated)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 px-6 pb-6 md:grid-cols-4">
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs uppercase text-emerald-300/70">Starting</p>
                <p className="mt-1 text-lg font-bold text-white">{fmtCurrency(finance?.startingBalance ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-xs uppercase text-emerald-300/70">Transferred In</p>
                <p className="mt-1 text-lg font-bold text-white">{fmtCurrency(finance?.totalAdded ?? 0)}</p>
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

          <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Pending Super Admin Review</h3>
                <p className="text-xs text-text-muted">
                  {pendingRequests.length === 0
                    ? "You have no requests waiting for review."
                    : `${pendingRequests.length} request${pendingRequests.length === 1 ? "" : "s"} currently under review.`}
                </p>
              </div>
            </div>

            {pendingRequests.length > 0 ? (
              <div className="mt-4 space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-amber-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {request.requestNo} - {fmtCurrency(request.amountRequested)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          Purpose: {request.purpose}
                        </p>
                        {request.notes ? (
                          <p className="mt-1 text-xs text-text-muted">{request.notes}</p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-violet-300/40 bg-violet-50/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Pending Branch Confirmation</h3>
                <p className="text-xs text-text-muted">
                  {pendingConfirmationRequests.length === 0
                    ? "No transfers are waiting for branch receipt confirmation."
                    : `${pendingConfirmationRequests.length} transfer${pendingConfirmationRequests.length === 1 ? "" : "s"} released by Super Admin and waiting for your confirmation.`}
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
                          Purpose: {request.purpose}
                        </p>
                        {request.transferNotes ? (
                          <p className="mt-1 text-xs text-text-muted">
                            Release notes: {request.transferNotes}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-text-muted">
                          Sent for confirmation: {fmtDate(request.transferredAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleConfirmRequestClick(request)}
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

          <div className="space-y-4 rounded-xl border border-border-main bg-surface p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-text-primary">Fund Request History</h3>
                <p className="text-xs text-text-muted">Track approval decisions and completed transfers from Super Admin.</p>
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as FundRequestRecord["status"] | "all")
                }
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="rejected">Rejected</option>
                <option value="transferred">Transferred</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-3 py-3">Request</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Reviewed</th>
                    <th className="px-3 py-3">Transferred</th>
                    <th className="px-3 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-text-tertiary">
                        No fund requests found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b border-border-subtle">
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-text-primary">{request.requestNo}</p>
                          <p className="mt-1 text-xs text-text-muted">{request.purpose}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-text-primary">{fmtCurrency(request.amountRequested)}</p>
                          {request.approvedAmount != null ? (
                            <p className="mt-1 text-xs text-text-muted">
                              Approved: {fmtCurrency(request.approvedAmount)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${toStatusClass(request.status)}`}>
                            {toStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top text-text-secondary">{fmtDate(request.createdAt)}</td>
                        <td className="px-3 py-3 align-top text-text-secondary">{fmtDate(request.reviewedAt)}</td>
                        <td className="px-3 py-3 align-top text-text-secondary">{fmtDate(request.transferredAt)}</td>
                        <td className="px-3 py-3 align-top text-xs text-text-muted">
                          {request.transferNotes ?? request.reviewNotes ?? request.notes ?? "-"}
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
        onClose={() => {
          if (!isSubmitting) setRequestModalOpen(false);
        }}
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
        branchName={dashboard?.branch?.name ?? finance?.name ?? "Branch"}
      />
    </div>
  );
}
