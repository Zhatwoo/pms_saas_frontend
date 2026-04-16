"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ConfirmFundModal } from "@/app/admin/branch-finance/_components/confirm-fund-modal";
import {
  FinanceLedgerTable,
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

  const completedTransfers = useMemo(
    () => requests.filter((request) => request.status === "transferred"),
    [requests],
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

          <div className="space-y-3 rounded-xl border border-border-main bg-surface p-5">
            <h3 className="text-base font-bold text-text-primary">Transfer History</h3>
            <div className="overflow-x-auto">
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
                  {completedTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-text-tertiary">
                        No completed transfers yet.
                      </td>
                    </tr>
                  ) : (
                    completedTransfers.map((request) => (
                      <tr key={request.id} className="border-b border-border-subtle">
                        <td className="px-3 py-3 font-semibold text-text-primary">{request.requestNo}</td>
                        <td className="px-3 py-3 text-text-secondary">
                          {fmtCurrency(
                            request.confirmedReceivedAmount ??
                              request.amountTransferred ??
                              request.approvedAmount ??
                              request.amountRequested,
                          )}
                        </td>
                        <td className="px-3 py-3 text-text-secondary">{fmtDate(request.transferredAt)}</td>
                        <td className="px-3 py-3 text-text-secondary">{fmtDate(request.confirmedAt)}</td>
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

          {/* ── Branch Financial Activity (Read-Only) ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-text-primary">All Branch Financial Activity</h2>
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
              showBranchColumn={false}
              searchQuery={ledgerSearch}
              typeFilter={ledgerTypeFilter}
              dateFrom={ledgerDateFrom}
              dateTo={ledgerDateTo}
            />
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
