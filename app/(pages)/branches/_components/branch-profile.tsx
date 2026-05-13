"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

/* ── Status badge mapping ─────────────────────────────────── */
const statusVariantMap: Record<string, "green" | "black" | "red" | "orange"> = {
  Active: "green",
  Inactive: "black",
  Terminated: "red",
  Process: "orange",
};

interface BranchUserApiRecord {
  id?: string;
  fullName?: string | null;
  full_name?: string | null;
  email: string;
  role: "super_admin" | "superadmin" | "admin" | "employee" | "branch";
  branchId?: string | null;
  branch_id?: string | null;
}

// Removed MOCK_INVENTORY, MOCK_TRANSACTIONS, MOCK_LOGS

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

function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.93.33 1.84.63 2.72a2 2 0 0 1-.45 2.11L8 9.88a16 16 0 0 0 6.12 6.12l1.33-1.25a2 2 0 0 1 2.11-.45c.88.3 1.79.51 2.72.63A2 2 0 0 1 22 16.92Z" />
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
  icon: ReactNode;
  children: ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border-main bg-surface shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-surface ${accentColor}`}>
          {icon}
        </div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
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
      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
interface BranchProfileProps {
  branch: {
    id: string;
    branchId: string;
    name: string;
    location: string;
    contactNumber: string;
    status: string;
    createdAt?: string;
  };
}

type TabType = "staff" | "inventory" | "transactions" | "logs";

export function BranchProfile({ branch }: BranchProfileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const usersPath = pathname.startsWith("/admin") ? "/admin/users" : "/users";
  const [activeTab, setActiveTab] = useState<TabType>("staff");
  const tabOrder: TabType[] = ["staff", "inventory", "transactions", "logs"];
  const activeIndex = tabOrder.indexOf(activeTab);
  const [branchUsers, setBranchUsers] = useState<BranchUserApiRecord[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");

  // Inventory State
  const [invStats, setInvStats] = useState({
    totalItems: 0,
    totalValue: "₱0",
    pawnedItems: 0,
    forSaleItems: 0,
  });
  const [invCategories, setInvCategories] = useState<{name: string, count: number, color: string}[]>([]);
  const [invAlerts, setInvAlerts] = useState<{text: string, type: "warning"|"info"}[]>([]);
  const [invActivity, setInvActivity] = useState<{action: string, item: string, time: string}[]>([]);

  // Finance/Transactions State
  const [financeSummary, setFinanceSummary] = useState({
    activePawnTickets: 0,
    redeemedToday: 0,
    overdue: 0,
    totalLoanReleased: "₱0",
    totalCollected: "₱0",
    estimatedProfit: "₱0",
  });
  const [recentTransactions, setRecentTransactions] = useState<{type: string, item: string, amount: string}[]>([]);
  const [financeWarnings, setFinanceWarnings] = useState<string[]>([]);

  // Logs State
  const [activityLogs, setActivityLogs] = useState<{text: string, time: string, icon: string}[]>([]);

  // Helper to format money
  const fmt = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : val;
    return `₱${(num || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCategoryColor = (index: number) => {
    const colors = ["bg-amber-500", "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500", "bg-cyan-500"];
    return colors[index % colors.length];
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const ms = Date.now() - date.getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes || 1} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return `yesterday`;
    return `${days} days ago`;
  };

  const formatLogEntry = (action: string, detailsStr: string) => {
    let detailsObj: any = null;
    let isJson = false;
    
    if (detailsStr) {
      try {
        detailsObj = JSON.parse(detailsStr);
        isJson = true;
      } catch (e) {
        // Not JSON
      }
    }

    let readableAction = action || "Activity";
    // If action is an API route (e.g. PATCH /api/...), simplify it
    if (readableAction.includes("/") && (readableAction.startsWith("GET") || readableAction.startsWith("POST") || readableAction.startsWith("PATCH") || readableAction.startsWith("DELETE") || readableAction.startsWith("PUT"))) {
       const parts = readableAction.split("/");
       const endpoint = parts.length > 2 ? parts[2] : "system";
       readableAction = `System Update (${endpoint.replace(/-/g, ' ')})`;
    } else {
       // Convert SCREAMING_SNAKE_CASE to Title Case
       readableAction = readableAction
         .replace(/_/g, ' ')
         .toLowerCase()
         .replace(/\b\w/g, c => c.toUpperCase());
    }

    if (isJson && detailsObj) {
      if (detailsObj.itemName) {
        return `${readableAction}: ${detailsObj.itemName}`;
      }
      if (detailsObj.message) {
        return `${readableAction}: ${detailsObj.message}`;
      }
      if (detailsObj.reason) {
        return `${readableAction} - Reason: ${detailsObj.reason}`;
      }
      if (detailsObj.targetRole) {
        return `${readableAction} for ${detailsObj.targetRole}`;
      }
      if (detailsObj.url) {
        return `API Request: ${detailsObj.method} ${detailsObj.url}`;
      }
      return readableAction; // fallback
    }
    
    return detailsStr ? `${readableAction} - ${detailsStr}` : readableAction;
  };

  useEffect(() => {
    async function loadStaff() {
      setIsLoadingStaff(true);
      setStaffError("");
      try {
        const users = await api.get<BranchUserApiRecord[]>("/users");
        // Don't filter by branch - show all staff for admin/super admin
        setBranchUsers(users || []);
      } catch (error) {
        setStaffError(
          error instanceof Error ? error.message : "Failed to load assigned users.",
        );
      } finally {
        setIsLoadingStaff(false);
      }
    }

    void loadStaff();
  }, [branch.id]);

  useEffect(() => {
    async function loadData() {
      if (activeTab === "inventory") {
        try {
          // Stats
          const overviewRes = await api.get<Record<string, { pawnedItems: number; forSaleItems: number; totalValue: number }>>("/branches/overview-stats");
          const stats = overviewRes[branch.id] || { pawnedItems: 0, forSaleItems: 0, totalValue: 0 };
          setInvStats({
            totalItems: stats.pawnedItems + stats.forSaleItems,
            totalValue: fmt(stats.totalValue),
            pawnedItems: stats.pawnedItems,
            forSaleItems: stats.forSaleItems,
          });

          // Categories
          const pCats = await api.get<{category: string, count: number}[]>(`/inventory/pawned-categories?branch=${branch.id}`).catch(() => []);
          const mappedCats = pCats.slice(0, 5).map((c, i) => ({
            name: c.category || "Unknown",
            count: c.count,
            color: getCategoryColor(i)
          }));
          setInvCategories(mappedCats);

          // Alerts
          const alertsArr = [];
          const nearingExpRes = await api.get<{total: number}>(`/inventory/pawned?branch=${branch.id}&status=Nearing_Expiration&limit=1`).catch(() => ({total: 0}));
          if (nearingExpRes.total > 0) {
            alertsArr.push({ text: `${nearingExpRes.total} items nearing expiration`, type: "warning" as const });
          }
          const overdueRes = await api.get<{total: number}>(`/inventory/pawned?branch=${branch.id}&status=Overdue&limit=1`).catch(() => ({total: 0}));
          if (overdueRes.total > 0) {
            alertsArr.push({ text: `${overdueRes.total} overdue pawn tickets`, type: "info" as const });
          }
          setInvAlerts(alertsArr);
          
          // Activity (from logs)
          const logs = await api.get<any[]>(`/activity-logs?branchId=${branch.id}`).catch(() => []);
          const invLogs = logs.filter(l => l.module === 'Inventory' || (l.action && l.action.toLowerCase().includes('item'))).slice(0, 4);
          setInvActivity(invLogs.map(l => {
            const parsed = formatLogEntry(l.action, l.details);
            const split = parsed.split(": ");
            const actionText = split[0];
            const itemText = split.length > 1 ? split.slice(1).join(": ") : "Inventory update";

            return {
              action: actionText,
              item: itemText,
              time: timeAgo(l.created_at)
            };
          }));

        } catch (e) {
          console.error(e);
        }
      } else if (activeTab === "transactions") {
        try {
          // Finance Summary
          const finRes = await api.get<any[]>(`/branch-finance/summary?branch=${branch.id}`);
          const summary = finRes.find((s) => s.branchId === branch.id);
          
          // Ledger
          const ledgerRes = await api.get<{entries: any[]}>(`/branch-finance/ledger?branch=${branch.id}&limit=5`).catch(() => ({entries: []}));
          
          if (summary) {
            setFinanceSummary(prev => ({
              ...prev,
              totalLoanReleased: fmt(summary.breakdown.pawnOut),
              totalCollected: fmt(summary.breakdown.redeemIn + summary.breakdown.renewalIn),
              estimatedProfit: "₱0.00", // Ready for future calculations
            }));
          }

          // Active tickets from overview
          const overviewRes = await api.get<Record<string, { pawnedItems: number }>>("/branches/overview-stats").catch(() => ({} as Record<string, { pawnedItems: number }>));
          const overdueRes = await api.get<{total: number}>(`/inventory/pawned?branch=${branch.id}&status=Overdue&limit=1`).catch(() => ({total: 0}));
          
          let redeemedCount = 0;
          const today = new Date().toISOString().split('T')[0];
          ledgerRes.entries.forEach(e => {
            if (e.type === 'redeem' && e.date === today) redeemedCount++;
          });

          setFinanceSummary(prev => ({
            ...prev,
            activePawnTickets: overviewRes[branch.id]?.pawnedItems || 0,
            redeemedToday: redeemedCount,
            overdue: overdueRes.total,
          }));

          setRecentTransactions(ledgerRes.entries.map(e => {
            // Simplify descriptions for transactions
            let itemDesc = e.itemName || e.description || "Transaction";
            if (itemDesc.includes(" - ")) {
              itemDesc = itemDesc.split(" - ")[0];
            } else if (itemDesc.includes(" | ")) {
              itemDesc = itemDesc.split(" | ")[0];
            }

            let typeLabel = "Transaction";
            if (e.type === 'pawn') typeLabel = "Pawn";
            else if (e.type === 'redeem') typeLabel = "Redeem";
            else if (e.type === 'fund_transfer_in') typeLabel = "Fund In";
            else if (e.type === 'fund_transfer_out') typeLabel = "Fund Out";

            return {
              type: typeLabel,
              item: itemDesc,
              amount: fmt(e.cashIn > 0 ? e.cashIn : e.cashOut)
            };
          }));

          const warningsArr = [];
          if (overdueRes.total > 0) warningsArr.push(`${overdueRes.total} overdue tickets detected.`);
          setFinanceWarnings(warningsArr);

        } catch (e) {
          console.error(e);
        }
      } else if (activeTab === "logs") {
        try {
          const logs = await api.get<any[]>(`/activity-logs?branchId=${branch.id}`).catch(() => []);
          setActivityLogs(logs.slice(0, 10).map(l => {
            const actionLower = (l.action || "").toLowerCase();
            let icon = "check";
            if (actionLower.includes("pawn") || actionLower.includes("ticket")) icon = "ticket";
            else if (actionLower.includes("transfer") || actionLower.includes("move")) icon = "transfer";
            
            return {
              text: formatLogEntry(l.action, l.details),
              time: timeAgo(l.created_at),
              icon
            };
          }));
        } catch (e) {
          console.error(e);
        }
      }
    }
    
    void loadData();
  }, [activeTab, branch.id]);

  const managers = useMemo(
    () =>
      branchUsers.filter((u) => {
        const role = u.role?.toLowerCase();
        return role === "admin";
      }),
    [branchUsers],
  );

  const employees = useMemo(
    () =>
      branchUsers.filter((u) => {
        const role = u.role?.toLowerCase();
        return role === "employee" || role === "branch";
      }),
    [branchUsers],
  );

  function fullName(user: BranchUserApiRecord): string {
    return user.fullName ?? user.full_name ?? user.email;
  }

  function toUiRole(role: BranchUserApiRecord["role"]): string {
    const normalized = role.toLowerCase();
    if (normalized === "admin") return "Manager";
    if (normalized === "employee" || normalized === "branch") return "Employee";
    return "Staff";
  }

  function goToUsers(userId?: string) {
    const params = new URLSearchParams();
    if (userId) {
      params.set("transferUserId", userId);
      params.set("highlightTransfer", "true");
    }
    router.push(`${usersPath}${params.toString() ? "?" + params.toString() : ""}`);
  }

  return (
    <>
      <div className="space-y-6 pb-8">
        {/* ═══════════════════════════════════════════════════════
            BRANCH OVERVIEW HEADER (Always visible)
           ═══════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-border-main bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-pawn-gold backdrop-blur-sm">
                <IconBuilding />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{branch.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StatusBadge
                    label={branch.status}
                    variant={statusVariantMap[branch.status] || "black"}
                  />
                  <span className="flex items-center gap-1.5 text-sm text-emerald-300">
                    <span className="font-mono font-bold">ID: {branch.branchId}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconMapPin /></span>
              <div>
                <p className="text-xs font-medium uppercase text-emerald-400/70">Location</p>
                <p className="text-sm font-semibold text-white">{branch.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconPhone /></span>
              <div>
                <p className="text-xs font-medium uppercase text-emerald-400/70">Contact</p>
                <p className="text-sm font-semibold text-white">{branch.contactNumber || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconCalendar /></span>
              <div>
                <p className="text-xs font-medium uppercase text-emerald-400/70">Created</p>
                <p className="text-sm font-semibold text-white">
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
                <p className="text-xs font-medium uppercase text-emerald-400/70">Last Activity</p>
                <p className="text-sm font-semibold text-white">10 mins ago</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="text-emerald-400"><IconUsers /></span>
              <div>
                <p className="text-xs font-medium uppercase text-emerald-400/70">Staff</p>
                <p className="text-sm font-semibold text-white">{branchUsers.length} members</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB NAVIGATION
           ═══════════════════════════════════════════════════════ */}
        <div className="relative flex border-b border-border-main bg-surface">
          {[
            { id: "staff" as TabType, label: "Employees" },
            { id: "inventory" as TabType, label: "Inventory" },
            { id: "transactions" as TabType, label: "Transactions" },
            { id: "logs" as TabType, label: "Logs & Actions" },
          ].map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all text-center ${
                activeTab === tab.id
                  ? "text-emerald-text"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
          {/* Sliding tab indicator */}
          <div
            className="absolute bottom-0 h-1 bg-emerald-text transition-all duration-300 ease-in-out"
            style={{
              width: `${100 / 4}%`,
              left: `${(tabOrder.indexOf(activeTab) * 100) / 4}%`,
            }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB CONTENT
           ═══════════════════════════════════════════════════════ */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              width: `${tabOrder.length * 100}%`,
              transform: `translateX(-${activeIndex * (100 / tabOrder.length)}%)`,
            }}
          >
            {/* ── EMPLOYEES TAB ── */}
            <div className="w-full min-w-0 shrink-0" style={{ flex: `0 0 ${100 / tabOrder.length}%` }}>
            <ProfileSection title="Employees" icon={<IconUsers />}>
              {/* Admin */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                  Branch Admin
                </p>
                {managers.length > 0 ? (
                  <div className="space-y-2">
                    {managers.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pawn-gold text-xs font-bold text-zinc-900">
                            {fullName(admin).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-base font-semibold text-text-primary">{fullName(admin)}</p>
                            <p className="text-xs text-text-muted">Admin</p>
                          </div>
                        </div>
                        {!pathname.startsWith("/admin") ? (
                          <button
                            onClick={() => goToUsers(admin.id)}
                            className="rounded-lg border border-border-main bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600"
                          >
                            Transfer
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
                    <p className="text-sm text-text-muted">No admin assigned</p>
                  </div>
                )}
              </div>

              {/* Employees */}
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                Employees
              </p>
              {staffError && (
                <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {staffError}
                </div>
              )}
              {isLoadingStaff && (
                <div className="mb-2 rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-tertiary">
                  <LoadingSpinnerLabel text="Loading assigned users..." className="justify-center text-sm text-text-secondary" />
                </div>
              )}
              <div className="space-y-2">
                {employees.map((emp) => (
                  <div
                    key={emp.id ?? emp.email}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary p-3.5 transition-colors hover:border-emerald-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pawn-gold text-xs font-bold text-zinc-900">
                        {fullName(emp).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-text-primary">{fullName(emp)}</p>
                        <p className="text-xs text-text-muted">{toUiRole(emp.role)}</p>
                      </div>
                    </div>
                    {!pathname.startsWith("/admin") && (
                      <button
                        onClick={() => goToUsers(emp.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600"
                      >
                        <IconShuffle />
                        Transfer
                      </button>
                    )}
                  </div>
                ))}
                {!isLoadingStaff && employees.length === 0 && (
                  <div className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-tertiary">
                    No employees currently assigned to this branch.
                  </div>
                )}
              </div>


            </ProfileSection>
            </div>

            {/* ── INVENTORY TAB ── */}
            <div className="w-full min-w-0 shrink-0" style={{ flex: `0 0 ${100 / tabOrder.length}%` }}>
            <ProfileSection title="Inventory Snapshot" icon={<IconPackage />}>
              {/* Summary stats */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Total Items" value={invStats.totalItems} accent="text-text-primary" />
                <MiniStat label="Total Value" value={invStats.totalValue} accent="text-emerald-text" />
                <MiniStat label="Pawned Items" value={invStats.pawnedItems} accent="text-amber-500" />
                <MiniStat label="Items for Sale" value={invStats.forSaleItems} accent="text-blue-500" />
              </div>

              {/* Category Breakdown */}
              <div className="mb-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
                  Category Breakdown
                </p>
                {invCategories.length === 0 ? (
                   <p className="text-sm text-text-muted italic py-2">No category data available.</p>
                ) : (
                  <div className="space-y-2.5">
                    {invCategories.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="flex w-24 items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                          <span className="truncate text-sm font-medium text-text-secondary">{cat.name}</span>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                            <div
                              className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                              style={{ width: `${invStats.totalItems > 0 ? (cat.count / invStats.totalItems) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="min-w-[2rem] text-right text-sm font-bold text-text-primary">
                          {cat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerts */}
              {invAlerts.length > 0 && (
                <div className="mb-5 space-y-2">
                  {invAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 ${
                        alert.type === "warning"
                          ? "border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                          : "border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      <IconAlertTriangle />
                      <span className="text-sm font-medium">{alert.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Activity */}
              <div className="mb-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
                  Recent Activity
                </p>
                {invActivity.length === 0 ? (
                  <p className="text-sm text-text-muted italic py-2">No recent inventory activity found.</p>
                ) : (
                  <div className="space-y-2">
                    {invActivity.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              act.action === "Added" ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                          />
                          <span className="truncate text-sm text-text-secondary">
                            <span className="font-semibold text-text-primary">{act.action}:</span>{" "}
                            {act.item}
                          </span>
                        </div>
                        <span className="whitespace-nowrap text-xs text-text-muted ml-2">{act.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-border bg-emerald-surface py-3 text-sm font-bold text-emerald-text transition-colors hover:bg-emerald-border/20">
                View Full Inventory
                <IconArrowRight />
              </button>
            </ProfileSection>
            </div>

            {/* ── TRANSACTIONS TAB ── */}
            <div className="w-full min-w-0 shrink-0" style={{ flex: `0 0 ${100 / tabOrder.length}%` }}>
            <ProfileSection title="Transaction Snapshot" icon={<IconDollar />}>
              {/* Summary */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <MiniStat label="Active Pawn Tickets" value={financeSummary.activePawnTickets} />
                <MiniStat label="Redeemed Today" value={financeSummary.redeemedToday} accent="text-emerald-text" />
                <MiniStat label="Overdue" value={financeSummary.overdue} accent="text-red-500" />
              </div>

              {/* Financial Overview */}
              <div className="mb-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
                  Financial Overview
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
                    <p className="text-xs font-medium text-text-muted">Total Loan Released</p>
                    <p className="mt-1 text-base font-bold text-text-primary">{financeSummary.totalLoanReleased}</p>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3.5">
                    <p className="text-xs font-medium text-text-muted">Total Collected</p>
                    <p className="mt-1 text-base font-bold text-emerald-text">{financeSummary.totalCollected}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-border bg-emerald-surface p-3.5">
                    <p className="text-xs font-medium text-emerald-text">Estimated Profit</p>
                    <p className="mt-1 text-base font-bold text-emerald-text">{financeSummary.estimatedProfit}</p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mb-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
                  Recent Transactions
                </p>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-text-muted italic py-2">No recent transactions found.</p>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.map((txn, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                              txn.type === "Pawn"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-emerald-500/10 text-emerald-500"
                            }`}
                          >
                            {txn.type.charAt(0)}
                          </div>
                          <span className="truncate text-sm text-text-secondary">
                            <span className="font-semibold text-text-primary">{txn.type}:</span>{" "}
                            {txn.item}
                          </span>
                        </div>
                        <span className="whitespace-nowrap ml-2 text-sm font-bold text-text-primary">{txn.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warnings */}
              {financeWarnings.length > 0 && (
                <div className="mb-4 space-y-2">
                  {financeWarnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-red-500"
                    >
                      <IconAlertTriangle />
                      <span className="text-sm font-medium">{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-border bg-emerald-surface py-3 text-sm font-bold text-emerald-text transition-colors hover:bg-emerald-border/20">
                View Full Transactions
                <IconArrowRight />
              </button>
            </ProfileSection>
            </div>

            {/* ── LOGS & ACTIONS TAB ── */}
            <div className="w-full min-w-0 shrink-0" style={{ flex: `0 0 ${100 / tabOrder.length}%` }}>
            <div className="space-y-4">
              {/* Activity Logs */}
              <ProfileSection title="Activity Logs" icon={<IconActivity />}>
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-text-muted italic py-2">No activity logs recorded yet.</p>
                ) : (
                  <div className="relative space-y-0">
                    {activityLogs.map((log, i) => (
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
                          {i < activityLogs.length - 1 && (
                            <div className="h-8 w-px bg-border-subtle" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex flex-1 items-center justify-between pb-4">
                          <p className="truncate text-sm font-medium text-text-secondary pr-4" title={log.text}>{log.text}</p>
                          <span className="whitespace-nowrap text-xs text-text-muted">{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border-main bg-surface-secondary py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover">
                  View Full Logs
                  <IconArrowRight />
                </button>
              </ProfileSection>

              {/* Quick Actions */}
              <ProfileSection title="Quick Actions" icon={<IconSettings />}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-5 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
                    <IconPackage />
                    View Inventory
                  </button>
                  <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-5 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
                    <IconDollar />
                    View Transactions
                  </button>
                  <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-5 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Branch Info
                  </button>
                  {!pathname.startsWith("/admin") && (
                    <button
                      onClick={() => goToUsers()}
                      className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-4 py-3 text-xs font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text"
                    >
                      <IconShuffle />
                      Transfer Staff
                    </button>
                  )}
                  <button className="flex items-center gap-2.5 rounded-lg border border-border-main bg-surface-secondary px-5 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-emerald-border hover:bg-emerald-surface hover:text-emerald-text">
                    <IconActivity />
                    View Logs
                  </button>
                  <button className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-3.5 text-sm font-semibold text-red-500 transition-all hover:border-red-500 hover:bg-red-500/10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Deactivate Branch
                  </button>
                </div>
              </ProfileSection>
            </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
