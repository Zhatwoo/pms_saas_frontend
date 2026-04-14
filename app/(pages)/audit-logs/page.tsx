"use client";

import { useState, useEffect, useMemo } from "react";
import { Pagination } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";

interface ActivityLog {
  id: string;
  userId: string;
  branchId: string | null;
  action: string;
  details: string | null;
  createdAt: string;
  userFullName: string;
  userRole: string;
  branchName: string;
}

const branchOptions = [
  { value: "all", label: "All Branches" },
  { value: "taguig", label: "Taguig" },
  { value: "makati", label: "Makati" },
  { value: "pasay", label: "Pasay" },
];

function getInitials(name: string) {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600", "bg-indigo-600"];
function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Helper to guess log type based on action/details text
function guessLogType(action: string, details: string) {
  const text = (action + " " + (details || "")).toLowerCase();
  if (text.includes("pawn") || text.includes("redeem") || text.includes("renew")) return "TRANSACTION";
  if (text.includes("fund") || text.includes("cash") || text.includes("wallet")) return "FUND TRANSFER";
  if (text.includes("item transfer") || text.includes("move") || text.includes("vault")) return "ITEM TRANSFER";
  if (text.includes("login") || text.includes("auth")) return "AUTH TRACE";
  return "SYSTEM LOG";
}

// Helper to guess action verb if action field is long
function getBadgeAction(action: string) {
  const a = action.toLowerCase();
  if (a.includes("create") || a.includes("new")) return "CREATE";
  if (a.includes("update") || a.includes("edit") || a.includes("patch")) return "UPDATE";
  if (a.includes("delete") || a.includes("remove")) return "DELETE";
  if (a.includes("transfer")) return "TRANSFER";
  if (a.includes("redeem")) return "REDEEM";
  if (a.includes("fail")) return "FAILED";
  return "EXECUTE";
}

// Helper to guess status
function getGuessStatus(action: string, details: string) {
  const text = (action + " " + (details || "")).toLowerCase();
  if (text.includes("fail") || text.includes("error") || text.includes("wrong")) return "Failed";
  if (text.includes("pending")) return "Pending";
  return "Success";
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;
  const isSuperAdmin = userRole === "super_admin";

  const [branch, setBranch] = useState("all");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All Logs");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    async function fetchLogs() {
      if (!userId) return;
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (isSuperAdmin && branch !== "all") {
          // Send branch filtering logic
        }
        const data = await api.get<ActivityLog[]>(`/activity-logs?${queryParams}`);
        setLogs(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, [userId, branch, isSuperAdmin]);

  // Derive synthetic data fields for UI matching
  const enrichedLogs = useMemo(() => {
    return logs.map(l => ({
      ...l,
      logType: guessLogType(l.action, l.details || ""),
      actionBadge: getBadgeAction(l.action),
      statusGuess: getGuessStatus(l.action, l.details || "")
    }));
  }, [logs]);

  // Statistics
  const totalLogs = enrichedLogs.length;
  const totalTransactions = enrichedLogs.filter(l => l.logType === "TRANSACTION").length;
  const totalFundTransfers = enrichedLogs.filter(l => l.logType === "FUND TRANSFER").length;
  const totalItemTransfers = enrichedLogs.filter(l => l.logType === "ITEM TRANSFER").length;

  // Tabs
  const TABS = ["All Logs", "Transaction Logs", "Fund Transfer", "Item Transfer"];

  const filteredLogs = useMemo(() => {
    let result = enrichedLogs;
    if (isSuperAdmin && branch !== "all") {
      result = result.filter(l => l.branchName?.toLowerCase().includes(branch.toLowerCase()));
    }
    if (filterType !== "All Logs") {
      if (filterType === "Transaction Logs") result = result.filter(l => l.logType === "TRANSACTION");
      if (filterType === "Fund Transfer") result = result.filter(l => l.logType === "FUND TRANSFER");
      if (filterType === "Item Transfer") result = result.filter(l => l.logType === "ITEM TRANSFER");
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.userFullName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }
    return result;
  }, [enrichedLogs, branch, searchQuery, isSuperAdmin, filterType]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, branch]);

  const totalItems = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">

          {user?.branchId && !isSuperAdmin && (
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
              BRANCH: {user.branchId.split('-')[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "ALL ACTIVITY", count: totalLogs, sub: "All log types", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "TRANSACTIONS", count: totalTransactions, sub: "Pawn, redeem, renew", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "FUND TRANSFERS", count: totalFundTransfers, sub: "Cash moves", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
          { label: "ITEM TRANSFERS", count: totalItemTransfers, sub: "Branch to Branch", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }
        ].map((card, i) => (
          <div key={i} className="flex flex-col justify-between rounded-xl bg-white dark:bg-[#1a1f24] p-5 border border-zinc-200 dark:border-[#2d333b] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">{card.label}</span>
              <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
            </div>
            <div className="mt-4 z-10">
              <span className="text-4xl font-black text-zinc-900 dark:text-white">{isLoading ? "-" : card.count}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{card.sub}</span>
            </div>
            {/* Hover dash effect */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/10 transition-all duration-500"></div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="rounded-xl border border-border-main bg-surface shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex px-2 pt-2 border-b border-border-subtle overflow-x-auto hide-scrollbar">
          {TABS.map(tab => {
            const isActive = filterType === tab;
            let count = totalLogs;
            if (tab === "Transaction Logs") count = totalTransactions;
            if (tab === "Fund Transfer") count = totalFundTransfers;
            if (tab === "Item Transfer") count = totalItemTransfers;

            return (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${isActive ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-transparent text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary rounded-t-lg"
                  }`}
              >
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[9px] ${isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-surface-secondary text-text-tertiary"}`}>
                  {isLoading ? "-" : count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border-b border-border-subtle">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative max-w-sm w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg pl-9 pr-4 py-2 text-xs text-text-primary outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {isSuperAdmin && (
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs font-medium text-text-primary outline-none hover:border-text-tertiary focus:border-emerald-500"
              >
                {branchOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}

            <button className="rounded-lg border border-input-border bg-input-bg px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2">
              All Actions
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>

          <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            {totalItems} RECORDS
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-secondary/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Log Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary w-[30%]">Details / Reference</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm font-medium text-text-tertiary">Loading audit trail...</td></tr>
              ) : paginatedLogs.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm font-medium text-text-tertiary">No logs found matching your criteria.</td></tr>
              ) : (
                paginatedLogs.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  const dString = dateObj.toISOString().split('T')[0];
                  const tString = dateObj.toTimeString().split(' ')[0];

                  return (
                    <tr key={log.id} className="bg-surface hover:bg-surface-hover transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary">{dString}</span>
                          <span className="text-[10px] font-medium text-text-tertiary mt-0.5">{tString}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${getAvatarColor(log.userFullName)}`}>
                            {getInitials(log.userFullName)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-primary">{log.userFullName}</span>
                            <span className="text-[10px] font-medium text-text-tertiary capitalize mt-0.5">{log.userRole.replace('_', ' ')} • {log.branchName || "All"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase border ${log.logType === 'TRANSACTION' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                          log.logType === 'ITEM TRANSFER' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                            log.logType === 'FUND TRANSFER' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                          }`}>
                          {log.logType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-black tracking-widest uppercase ${log.actionBadge === 'FAILED' || log.actionBadge === 'DELETE' ? 'text-rose-600 dark:text-rose-400' :
                          log.actionBadge === 'CREATE' ? 'text-blue-600 dark:text-blue-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                          {log.actionBadge}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-sm">
                          <span className="text-xs font-bold text-text-primary truncate" title={log.action}>{log.action}</span>
                          <span className="text-[10px] text-text-tertiary mt-1 line-clamp-2" title={log.details || ""}>
                            {log.details || "System automatic trigger without details"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end">
                          {log.statusGuess === "Success" && (
                            <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-[10px] font-bold">Success</span>
                          )}
                          {log.statusGuess === "Failed" && (
                            <span className="inline-flex px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 text-[10px] font-bold">Failed</span>
                          )}
                          {log.statusGuess === "Pending" && (
                            <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 text-[10px] font-bold">Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-border-subtle bg-surface-secondary/50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-tertiary tracking-widest uppercase">
            SHOWING {totalItems === 0 ? "0" : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} OF {totalItems} RECORDS
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
