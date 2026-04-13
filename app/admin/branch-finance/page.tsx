"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmFundModal } from "./_components/confirm-fund-modal";
import { RequestFundsModal } from "./_components/request-funds-modal";
import type { RequestFundsData } from "./_components/request-funds-modal";

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
interface BranchBalance {
  branchId: string;
  name: string;
  startingBalance: number;
  currentBalance: number;
  totalAdded: number;
  totalTransferred: number;
  lastUpdated: string;
}

interface FinanceTransaction {
  id: string;
  date: string;
  type: "ADD_FUNDS" | "TRANSFER_IN" | "TRANSFER_OUT";
  amount: number;
  balanceAfter: number;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy: string | null;
  approvalDate: string | null;
  notes: string;
  requestedBy: string;
}

interface ApprovalRequest {
  id: string;
  txnId: string;
  type: "ADD_FUNDS" | "TRANSFER_IN" | "TRANSFER_OUT";
  amount: number;
  requestedBy: string;
  date: string;
  notes: string;
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA — scoped to the admin's branch
   ══════════════════════════════════════════════════════════ */
const MY_BRANCH: BranchBalance = {
  branchId: "002",
  name: "BGC Branch",
  startingBalance: 300_000,
  currentBalance: 342_000,
  totalAdded: 80_000,
  totalTransferred: 38_000,
  lastUpdated: "2026-04-10T09:30:00Z",
};

const INITIAL_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: "TXN-003",
    date: "2026-04-09",
    type: "TRANSFER_IN",
    amount: 20_000,
    balanceAfter: 342_000,
    status: "Approved",
    approvedBy: "Maria Santos",
    approvalDate: "2026-04-09",
    notes: "Received from Main Branch",
    requestedBy: "Super Admin",
  },
  {
    id: "TXN-004",
    date: "2026-04-10",
    type: "ADD_FUNDS",
    amount: 75_000,
    balanceAfter: 417_000,
    status: "Pending",
    approvedBy: null,
    approvalDate: null,
    notes: "Emergency fund request",
    requestedBy: "Super Admin",
  },
  {
    id: "TXN-009",
    date: "2026-04-07",
    type: "ADD_FUNDS",
    amount: 40_000,
    balanceAfter: 322_000,
    status: "Rejected",
    approvedBy: "Maria Santos",
    approvalDate: "2026-04-07",
    notes: "Budget not approved by HQ",
    requestedBy: "Super Admin",
  },
  {
    id: "TXN-011",
    date: "2026-04-06",
    type: "ADD_FUNDS",
    amount: 15_000,
    balanceAfter: 282_000,
    status: "Approved",
    approvedBy: "Pedro Reyes",
    approvalDate: "2026-04-06",
    notes: "Weekly petty cash",
    requestedBy: "Super Admin",
  },
  {
    id: "TXN-012",
    date: "2026-04-05",
    type: "TRANSFER_OUT",
    amount: 10_000,
    balanceAfter: 267_000,
    status: "Approved",
    approvedBy: "Maria Santos",
    approvalDate: "2026-04-05",
    notes: "Transfer to Makati Branch",
    requestedBy: "Super Admin",
  },
];

const INITIAL_PENDING: ApprovalRequest[] = [
  {
    id: "APR-001",
    txnId: "TXN-004",
    type: "ADD_FUNDS",
    amount: 75_000,
    requestedBy: "Super Admin",
    date: "2026-04-10",
    notes: "Emergency fund request",
  },
];

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const typeConfig = {
  ADD_FUNDS: { label: "Add Funds", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", dot: "bg-emerald-500", sign: "+" },
  TRANSFER_IN: { label: "Transfer In", badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", dot: "bg-blue-500", sign: "+" },
  TRANSFER_OUT: { label: "Transfer Out", badge: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400", dot: "bg-red-500", sign: "-" },
};

const statusConfig = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  Rejected: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
};

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function AdminBranchFinancePage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(MY_BRANCH);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [pending, setPending] = useState(INITIAL_PENDING);
  const [toast, setToast] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const selectedPendingAmount = useMemo(() => {
    return pending.find((p) => p.id === selectedPendingId)?.amount || 0;
  }, [pending, selectedPendingId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  /* ── Confirm ─────────────────────────────────────── */
  const handleConfirm = useCallback(
    (approvalId: string, proofFile: File | null) => {
      const req = pending.find((p) => p.id === approvalId);
      if (!req) return;

      // Update transaction status
      setTransactions((txns) =>
        txns.map((t) =>
          t.id === req.txnId
            ? {
                ...t,
                status: "Approved" as const, // Conceptually Approved/Completed
                approvedBy: user?.fullName || "Branch Admin",
                approvalDate: new Date().toISOString().slice(0, 10),
                notes: proofFile ? `${t.notes} [Proof Uploaded]` : t.notes,
              }
            : t,
        ),
      );

      // Update balance
      setBalance((b) => {
        if (req.type === "ADD_FUNDS" || req.type === "TRANSFER_IN") {
          return {
            ...b,
            currentBalance: b.currentBalance + req.amount,
            totalAdded: b.totalAdded + req.amount,
            lastUpdated: new Date().toISOString(),
          };
        }
        if (req.type === "TRANSFER_OUT") {
          return {
            ...b,
            currentBalance: b.currentBalance - req.amount,
            totalTransferred: b.totalTransferred + req.amount,
            lastUpdated: new Date().toISOString(),
          };
        }
        return b;
      });

      setPending((prev) => prev.filter((p) => p.id !== approvalId));
      showToast("Verification successful. Balance updated.");
      setConfirmModalOpen(false);
      setSelectedPendingId(null);
    },
    [pending, user?.fullName],
  );

  /* ── Request Funds ───────────────────────────────── */
  function handleRequestFunds(data: RequestFundsData) {
    // In a real app, this sends a POST request to the server, and the Super Admin sees it.
    showToast(`Successfully requested ₱${data.amount.toLocaleString("en-PH")} from Super Admin`);
  }

  /* ── Filtered transactions ───────────────────────── */
  const filteredTxns = useMemo(() => {
    if (filterType === "all") return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  const delta = balance.currentBalance - balance.startingBalance;
  const deltaPercent =
    balance.startingBalance > 0
      ? ((delta / balance.startingBalance) * 100).toFixed(1)
      : "0.0";
  const isPositive = delta >= 0;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-300/70 bg-emerald-100/70 px-5 py-3 shadow-xl backdrop-blur-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-emerald-900">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="mt-1 text-sm text-text-tertiary">
          View your branch balance, review pending transactions, and track financial activity.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
         SECTION 1: BALANCE OVERVIEW
         ═══════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-xl border border-border-main bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 shadow-lg">
        {/* Header row */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-pawn-gold backdrop-blur-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{balance.name}</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/70">
                Balance Overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-emerald-300 backdrop-blur-sm">
              Read-Only
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-[10px] text-emerald-300">{fmtDateTime(balance.lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Current balance hero */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
              Current Balance
            </p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {fmt(balance.currentBalance)}
              </span>
              <span
                className={`mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  isPositive
                    ? "bg-emerald-400/20 text-emerald-300"
                    : "bg-red-400/20 text-red-300"
                }`}
              >
                {isPositive ? "+" : ""}
                {deltaPercent}% from start
              </span>
            </div>
          </div>
          <button
            onClick={() => setRequestModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Request Funds
          </button>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-6">
          <div className="rounded-lg bg-white/5 px-3.5 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase text-emerald-400/70">Starting</p>
            <p className="mt-0.5 text-sm font-bold text-white">{fmt(balance.startingBalance)}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3.5 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-emerald-400/70">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
              <p className="text-[10px] font-medium uppercase">Total Added</p>
            </div>
            <p className="mt-0.5 text-sm font-bold text-emerald-300">{fmt(balance.totalAdded)}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3.5 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-red-400/70">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
              <p className="text-[10px] font-medium uppercase">Transferred</p>
            </div>
            <p className="mt-0.5 text-sm font-bold text-red-300">{fmt(balance.totalTransferred)}</p>
          </div>
        </div>
      </div>

      {/* Info header */}
      <div className="flex items-center gap-2 rounded-lg border border-border-main bg-surface-secondary px-4 py-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-[11px] text-text-muted">
          Fund additions and transfers are initiated by the Super Admin. You must confirm receipt and upload a proof image before the amount takes effect on your branch balance.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
         SECTION 2: PENDING CONFIRMATIONS
         ═══════════════════════════════════════════════════ */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {pending.length}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Pending Confirmation</h3>
              <p className="text-[10px] text-text-muted">
                Review fund transactions initiated by Super Admin for your branch. Please confirm receipt.
              </p>
            </div>
          </div>

          <div className="border-t border-amber-500/20 px-5 pb-4 pt-2 space-y-3">
            {pending.map((req) => {
              const cfg = typeConfig[req.type];
              return (
                <div
                  key={req.id}
                  className="rounded-lg border border-border-main bg-surface p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <div>
                        <p className="text-lg font-bold text-text-primary">{fmt(req.amount)}</p>
                        <p className="mt-0.5 text-[11px] text-text-secondary">
                          Initiated by <span className="font-semibold">{req.requestedBy}</span>
                          {" · "}
                          {fmtDate(req.date)}
                        </p>
                        {req.notes && (
                          <p className="mt-1 text-[11px] text-text-muted italic">
                            &ldquo;{req.notes}&rdquo;
                          </p>
                        )}
                        {req.amount >= 50_000 && (
                          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-600">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            High-value transaction — review carefully before approving
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPendingId(req.id);
                          setConfirmModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 active:scale-[0.97]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Confirm Receipt
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no pending */}
      {pending.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">All caught up!</p>
            <p className="text-[11px] text-text-muted">No pending confirmations for your branch.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
         SECTION 3: TRANSACTION HISTORY
         ═══════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-text-tertiary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-text-primary">Transaction History</h2>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-emerald-400"
          >
            <option value="all">All Types</option>
            <option value="ADD_FUNDS">Add Funds</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400">
                  {["Date", "Type", "Amount", "Balance After", "Status", "Processed By", "Notes"].map((h) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${
                        h === "Amount" || h === "Balance After" 
                          ? "text-right" 
                          : h === "Status" 
                            ? "text-center" 
                            : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-tertiary">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((t, idx) => {
                    const cfg = typeConfig[t.type];
                    const stsCls = statusConfig[t.status];
                    return (
                      <tr
                        key={t.id}
                        className={`border-t border-border-subtle ${
                          idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">
                          {fmtDate(t.date)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          <span className={`text-xs font-bold ${
                            t.type === "TRANSFER_OUT" ? "text-red-600" : t.type === "TRANSFER_IN" ? "text-blue-600" : "text-emerald-600"
                          }`}>
                            {cfg.sign}{fmt(t.amount)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-text-primary">
                          {fmt(t.balanceAfter)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${stsCls}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">
                          {t.approvedBy || <span className="text-text-muted">—</span>}
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 text-xs text-text-muted" title={t.notes}>
                          {t.notes || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm fund modal */}
      {selectedPendingId && (
        <ConfirmFundModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setSelectedPendingId(null);
          }}
          onConfirm={(file) => handleConfirm(selectedPendingId, file)}
          amount={selectedPendingAmount}
        />
      )}
      {/* Request funds modal */}
      <RequestFundsModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleRequestFunds}
      />
    </div>
  );
}
