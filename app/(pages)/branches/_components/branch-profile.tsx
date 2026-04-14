"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { TransferEmployeeModal } from "./transfer-employee-modal";

/* ── Status badge mapping ─────────────────────────────────── */
const statusVariantMap: Record<string, "green" | "black" | "red" | "orange"> = {
  Active: "green",
  Inactive: "black",
  Terminated: "red",
  Process: "orange",
};

/* ── Mock data ────────────────────────────────────────────── */
const MOCK_STAFF = {
  manager: "Juan Dela Cruz",
  employees: [
    { name: "Maria Santos", role: "Appraiser" },
    { name: "Pedro Reyes", role: "Cashier" },
  ],
};

const MOCK_INVENTORY = {
  totalItems: 75,
  totalValue: "₱120,000",
  pawnedItems: 50,
  forSaleItems: 25,
  categories: [
    { name: "Jewelry", count: 40, color: "bg-amber-500" },
    { name: "Electronics", count: 20, color: "bg-blue-500" },
    { name: "Others", count: 15, color: "bg-purple-500" },
  ],
  alerts: [
    { text: "5 items nearing expiration", type: "warning" as const },
    { text: "2 high-value items flagged", type: "info" as const },
  ],
  recentActivity: [
    { action: "Added", item: "Gold Necklace", time: "10 mins ago" },
    { action: "Redeemed", item: "iPhone 11", time: "1 hour ago" },
  ],
};

const MOCK_TRANSACTIONS = {
  activePawnTickets: 32,
  redeemedToday: 5,
  overdue: 3,
  totalLoanReleased: "₱120,000",
  totalCollected: "₱80,000",
  estimatedProfit: "₱15,000",
  recentTransactions: [
    { type: "Pawn", item: "Gold Ring", amount: "₱5,000" },
    { type: "Redeem", item: "Watch", amount: "₱3,200" },
  ],
  warnings: [
    "3 overdue tickets",
    "2 high-value unredeemed items",
  ],
};

const MOCK_LOGS = [
  { text: "Pawn ticket created", time: "10 mins ago", icon: "ticket" },
  { text: "Item redeemed", time: "1 hour ago", icon: "check" },
  { text: "Employee transferred", time: "yesterday", icon: "transfer" },
];

const MOCK_BRANCH_LIST = ["Main Branch", "BGC Branch", "Makati Branch", "Quezon City Branch"];

/* ── SVG icons ────────────────────────────────────────────── */
function IconBuilding() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPackage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconUserPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

/* ── Section wrapper ──────────────────────────────────────── */
function ProfileSection({
  title,
  icon,
  children,
  accentColor = "text-emerald-text",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border-main bg-surface shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-surface ${accentColor}`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Stat mini card ───────────────────────────────────────── */
function MiniStat({
  label,
  value,
  accent = "text-text-primary",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3.5 transition-colors duration-300">
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
interface BranchProfileProps {
  branch: {
    branchId: string;
    name: string;
    location: string;
    status: string;
    createdAt?: string;
  };
}

export function BranchProfile({ branch }: BranchProfileProps) {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState("");

  function openTransfer(empName: string) {
    setTransferEmployee(empName);
    setTransferModalOpen(true);
  }

  return (
    <>
      <div className="space-y-6 pb-8">
        {/* ═══════════════════════════════════════════════════════
            1. BRANCH OVERVIEW
           ═══════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border-main bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-pawn-gold backdrop-blur-sm">
                <IconBuilding />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StatusBadge
                    label={branch.status}
                    variant={statusVariantMap[branch.status] || "black"}
                  />
                  <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <span className="font-mono font-bold">ID: {branch.branchId}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconMapPin /></span>
              <div>
                <p className="text-[10px] font-medium uppercase text-emerald-400/70">Location</p>
                <p className="text-xs font-semibold text-white">{branch.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconCalendar /></span>
              <div>
                <p className="text-[10px] font-medium uppercase text-emerald-400/70">Created</p>
                <p className="text-xs font-semibold text-white">
                  {branch.createdAt
                    ? new Date(branch.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconClock /></span>
              <div>
                <p className="text-[10px] font-medium uppercase text-emerald-400/70">Last Activity</p>
                <p className="text-xs font-semibold text-white">10 mins ago</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconUsers /></span>
              <div>
                <p className="text-[10px] font-medium uppercase text-emerald-400/70">Staff</p>
                <p className="text-xs font-semibold text-white">{MOCK_STAFF.employees.length + 1} members</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            2. STAFF ASSIGNMENT
           ═══════════════════════════════════════════════════════ */}
        <ProfileSection title="Staff Assignment" icon={<IconUsers />}>
          {/* Manager */}
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Branch Manager
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pawn-sidebar text-xs font-bold text-pawn-gold">
                  {MOCK_STAFF.manager.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{MOCK_STAFF.manager}</p>
                  <p className="text-[10px] text-text-muted">Manager</p>
                </div>
              </div>
              <select
                className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-pawn-sidebar"
                defaultValue={MOCK_STAFF.manager}
              >
                <option>{MOCK_STAFF.manager}</option>
                <option>Ana Garcia</option>
                <option>Carlos Rivera</option>
              </select>
            </div>
          </div>

          {/* Employees */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-text-muted">
            Employees
          </p>
          <div className="space-y-2">
            {MOCK_STAFF.employees.map((emp) => (
              <div
                key={emp.name}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary p-3.5 transition-colors hover:border-emerald-border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-text-secondary">
                    {emp.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{emp.name}</p>
                    <p className="text-[10px] text-text-muted">{emp.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => openTransfer(emp.name)}
                  className="flex items-center gap-1.5 rounded-lg border border-border-main bg-surface px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600"
                >
                  <IconShuffle />
                  Transfer
                </button>
              </div>
            ))}
          </div>

          {/* Add Employee button */}
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-main bg-surface py-2.5 text-xs font-semibold text-text-muted transition-colors hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
            <IconUserPlus />
            Add Employee
          </button>
        </ProfileSection>

        {/* ═══════════════════════════════════════════════════════
            3. INVENTORY SNAPSHOT
           ═══════════════════════════════════════════════════════ */}
        <ProfileSection title="Inventory Snapshot" icon={<IconPackage />}>
          {/* Summary stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Total Items" value={MOCK_INVENTORY.totalItems} accent="text-text-primary" />
            <MiniStat label="Total Value" value={MOCK_INVENTORY.totalValue} accent="text-emerald-text" />
            <MiniStat label="Pawned Items" value={MOCK_INVENTORY.pawnedItems} accent="text-amber-500" />
            <MiniStat label="Items for Sale" value={MOCK_INVENTORY.forSaleItems} accent="text-blue-500" />
          </div>

          {/* Category Breakdown */}
          <div className="mb-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Category Breakdown
            </p>
            <div className="space-y-2.5">
              {MOCK_INVENTORY.categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex w-24 items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                    <span className="text-xs font-medium text-text-secondary">{cat.name}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                        style={{ width: `${(cat.count / MOCK_INVENTORY.totalItems) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="min-w-[2rem] text-right text-xs font-bold text-text-primary">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="mb-5 space-y-2">
            {MOCK_INVENTORY.alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 ${
                  alert.type === "warning"
                    ? "border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                    : "border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400"
                }`}
              >
                <IconAlertTriangle />
                <span className="text-xs font-medium">{alert.text}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mb-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Recent Activity
            </p>
            <div className="space-y-2">
              {MOCK_INVENTORY.recentActivity.map((act, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        act.action === "Added" ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                    />
                    <span className="text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary">{act.action}:</span>{" "}
                      {act.item}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-border bg-emerald-surface py-2.5 text-xs font-bold text-emerald-text transition-colors hover:bg-emerald-border/20">
            View Full Inventory
            <IconArrowRight />
          </button>
        </ProfileSection>

        {/* ═══════════════════════════════════════════════════════
            4. TRANSACTION SNAPSHOT
           ═══════════════════════════════════════════════════════ */}
        <ProfileSection title="Transaction Snapshot" icon={<IconDollar />}>
          {/* Summary */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <MiniStat label="Active Pawn Tickets" value={MOCK_TRANSACTIONS.activePawnTickets} />
            <MiniStat label="Redeemed Today" value={MOCK_TRANSACTIONS.redeemedToday} accent="text-emerald-text" />
            <MiniStat label="Overdue" value={MOCK_TRANSACTIONS.overdue} accent="text-red-500" />
          </div>

          {/* Financial Overview */}
          <div className="mb-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Financial Overview
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
                <p className="text-[10px] font-medium text-text-muted">Total Loan Released</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{MOCK_TRANSACTIONS.totalLoanReleased}</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
                <p className="text-[10px] font-medium text-text-muted">Total Collected</p>
                <p className="mt-1 text-sm font-bold text-emerald-text">{MOCK_TRANSACTIONS.totalCollected}</p>
              </div>
              <div className="rounded-lg border border-emerald-border bg-emerald-surface p-3.5">
                <p className="text-[10px] font-medium text-emerald-text">Estimated Profit</p>
                <p className="mt-1 text-sm font-bold text-emerald-text">{MOCK_TRANSACTIONS.estimatedProfit}</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mb-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Recent Transactions
            </p>
            <div className="space-y-2">
              {MOCK_TRANSACTIONS.recentTransactions.map((txn, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                        txn.type === "Pawn"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {txn.type === "Pawn" ? "P" : "R"}
                    </div>
                    <span className="text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary">{txn.type}:</span>{" "}
                      {txn.item}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-text-primary">{txn.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          <div className="mb-4 space-y-2">
            {MOCK_TRANSACTIONS.warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-red-500"
              >
                <IconAlertTriangle />
                <span className="text-xs font-medium">{w}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-border bg-emerald-surface py-2.5 text-xs font-bold text-emerald-text transition-colors hover:bg-emerald-border/20">
            View Full Transactions
            <IconArrowRight />
          </button>
        </ProfileSection>

        {/* ═══════════════════════════════════════════════════════
            5. ACTIVITY LOGS
           ═══════════════════════════════════════════════════════ */}
        <ProfileSection title="Activity Logs" icon={<IconActivity />}>
          <div className="relative space-y-0">
            {MOCK_LOGS.map((log, i) => (
              <div key={i} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-border bg-emerald-surface text-emerald-text">
                    {log.icon === "ticket" && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 1 1 0-4V7a2 2 0 0 0-2-2H5z" />
                      </svg>
                    )}
                    {log.icon === "check" && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {log.icon === "transfer" && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 14 20 9 15 4" />
                        <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                      </svg>
                    )}
                  </div>
                  {i < MOCK_LOGS.length - 1 && (
                    <div className="h-8 w-px bg-border-subtle" />
                  )}
                </div>
                {/* Content */}
                <div className="flex flex-1 items-center justify-between pb-4">
                  <p className="text-xs font-medium text-text-secondary">{log.text}</p>
                  <span className="text-[10px] text-text-muted">{log.time}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border-main bg-surface-secondary py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover">
            View Full Logs
            <IconArrowRight />
          </button>
        </ProfileSection>

        {/* ═══════════════════════════════════════════════════════
            6. ACTIONS
           ═══════════════════════════════════════════════════════ */}
        <ProfileSection title="Quick Actions" icon={<IconSettings />}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
              <IconPackage />
              View Inventory
            </button>
            <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
              <IconDollar />
              View Transactions
            </button>
            <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Branch Info
            </button>
            <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
              <IconShuffle />
              Transfer Staff
            </button>
            <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
              <IconActivity />
              View Logs
            </button>
            <button className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs font-semibold text-red-500 transition-all hover:border-red-500 hover:bg-red-500/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Deactivate Branch
            </button>
          </div>
        </ProfileSection>
      </div>

      {/* Transfer Employee Modal */}
      <TransferEmployeeModal
        isOpen={transferModalOpen}
        employeeName={transferEmployee}
        fromBranch={branch.name}
        branches={MOCK_BRANCH_LIST}
        onClose={() => setTransferModalOpen(false)}
        onConfirm={() => {
          // UI only — no backend logic
          setTransferModalOpen(false);
        }}
      />
    </>
  );
}
