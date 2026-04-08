"use client";

import { useState } from "react";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";

// --- Icons ---
const activityIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const transactionIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);
const transferIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const itemIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

// --- Data ---
const auditLogs = [
  {
    dateTime: "2026-03-30 08:15:47",
    user: { name: "Maria Santos", role: "Cashier", initials: "MS", color: "bg-blue-600" },
    branch: "Main Branch",
    logType: "Transaction",
    action: "CREATE",
    details: "New pawn — Gold Ring 18K",
    reference: "PT-2026-0312 • ₱8,500",
    status: "Success"
  },
  {
    dateTime: "2026-03-30 08:34:22",
    user: { name: "Pedro Reyes", role: "Appraiser", initials: "PR", color: "bg-emerald-600" },
    branch: "North Branch",
    logType: "Item Transfer",
    action: "TRANSFER",
    details: "Canon EOS R5: North → Main",
    reference: "TR-2026-0041 • C-2234",
    status: "Success"
  },
  {
    dateTime: "2026-03-30 08:51:09",
    user: { name: "Ana Lim", role: "Manager", initials: "AL", color: "bg-purple-600" },
    branch: "South Branch",
    logType: "Fund Transfer",
    action: "TRANSFER",
    details: "Cash float → South vault",
    reference: "FT-2026-0041 • ₱50,000",
    status: "Success"
  },
  {
    dateTime: "2026-03-30 09:03:55",
    user: { name: "Carlo Dizon", role: "Cashier", initials: "CD", color: "bg-orange-600" },
    branch: "East Branch",
    logType: "Transaction",
    action: "FAILED",
    details: "Login failed — wrong password (2/3)",
    reference: "SYS-AUTH • 203.0.113.45",
    status: "Failed"
  },
  {
    dateTime: "2026-03-30 09:11:30",
    user: { name: "Maria Santos", role: "Cashier", initials: "MS", color: "bg-blue-600" },
    branch: "Main Branch",
    logType: "Transaction",
    action: "REDEEM",
    details: "Contract redeemed — EOS R5",
    reference: "PT-2026-0285 • ₱6,800",
    status: "Success"
  },
  {
    dateTime: "2026-03-30 09:28:44",
    user: { name: "Pedro Reyes", role: "Appraiser", initials: "PR", color: "bg-emerald-600" },
    branch: "North Branch",
    logType: "Fund Transfer",
    action: "TRANSFER",
    details: "GCash disbursement to customer",
    reference: "FT-2026-0042 • ₱12,200",
    status: "Pending"
  }
];

export default function EmployeeAuditLogsPage() {
  const [activeTab, setActiveTab] = useState("All Logs");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter((log) => {
    // Tab filter
    const matchesTab = 
      activeTab === "All Logs" || 
      (activeTab === "Transaction Logs" && log.logType === "Transaction") ||
      (activeTab === "Fund Transfer" && log.logType === "Fund Transfer") ||
      (activeTab === "Item Transfer" && log.logType === "Item Transfer");

    // Action filter
    const matchesAction = 
      actionFilter === "All Actions" || 
      log.action === actionFilter;

    // Status filter
    const matchesStatus = 
      statusFilter === "All Status" || 
      log.status === statusFilter;

    // Search query
    const matchesSearch = 
      searchQuery === "" || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesAction && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 leading-tight">Audit Logs</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Complete system activity tracking — transactions, fund transfers, item transfers & login attempts
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="ALL ACTIVITY" 
          value={auditLogs.length} 
          subtitle="All log types" 
          icon={activityIcon} 
          borderColor={activeTab === "All Logs" ? "bg-emerald-600 scale-105" : "bg-emerald-200"} 
          className={activeTab === "All Logs" ? "ring-2 ring-emerald-500/20" : ""}
          onClick={() => setActiveTab("All Logs")}
        />
        <StatCard 
          label="TRANSACTIONS" 
          value={auditLogs.filter(l => l.logType === "Transaction").length} 
          subtitle="Pawn-redeem-renew" 
          icon={transactionIcon} 
          borderColor={activeTab === "Transaction Logs" ? "bg-blue-600 scale-105" : "bg-blue-200"} 
          className={activeTab === "Transaction Logs" ? "ring-2 ring-blue-500/20" : ""}
          onClick={() => setActiveTab("Transaction Logs")}
        />
        <StatCard 
          label="FUND TRANSFERS" 
          value={auditLogs.filter(l => l.logType === "Fund Transfer").length} 
          subtitle="Cash moves" 
          icon={transferIcon} 
          borderColor={activeTab === "Fund Transfer" ? "bg-amber-500 scale-105" : "bg-amber-200"} 
          className={activeTab === "Fund Transfer" ? "ring-2 ring-amber-500/20" : ""}
          onClick={() => setActiveTab("Fund Transfer")}
        />
        <StatCard 
          label="ITEM TRANSFERS" 
          value={auditLogs.filter(l => l.logType === "Item Transfer").length} 
          subtitle="Branch to Branch" 
          icon={itemIcon} 
          borderColor={activeTab === "Item Transfer" ? "bg-rose-500 scale-105" : "bg-rose-200"} 
          className={activeTab === "Item Transfer" ? "ring-2 ring-rose-500/20" : ""}
          onClick={() => setActiveTab("Item Transfer")}
        />
      </div>

      {/* Main Content Area */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-zinc-100 flex items-center px-4 overflow-x-auto">
          {["All Logs", "Transaction Logs", "Fund Transfer", "Item Transfer"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {tab}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                {tab === "All Logs" ? auditLogs.length : auditLogs.filter(l => 
                  (tab === "Transaction Logs" && l.logType === "Transaction") ||
                  (tab === "Fund Transfer" && l.logType === "Fund Transfer") ||
                  (tab === "Item Transfer" && l.logType === "Item Transfer")
                ).length}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 bg-zinc-50/50 border-b border-zinc-100 flex flex-wrap items-center gap-3">
          <input 
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 w-full sm:w-64" 
            placeholder="Search logs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 text-zinc-600 font-bold"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option>All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="FAILED">FAILED</option>
            <option value="REDEEM">REDEEM</option>
          </select>
          <select 
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 text-zinc-600 font-bold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[10px] outline-none" defaultValue="2026-03-01" />
            <span className="text-zinc-400">→</span>
            <input type="date" className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[10px] outline-none" defaultValue="2026-03-30" />
          </div>
          <span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{filteredLogs.length} records</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-900/5 text-zinc-400">
                {["Date & Time", "User", "Log Type", "Action", "Details / Reference", "Status"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-bold text-zinc-800">{log.dateTime.split(" ")[0]}</p>
                      <p className="text-[10px] text-zinc-400">{log.dateTime.split(" ")[1]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${log.user.color}`}>
                          {log.user.initials}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-zinc-800">{log.user.name}</p>
                          <p className="text-[10px] text-zinc-400">{log.user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                        log.logType === 'Transaction' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        log.logType === 'Item Transfer' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {log.logType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                        log.action === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                        log.action === 'CREATE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        log.action === 'TRANSFER' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-violet-50 text-violet-700 border border-violet-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-bold text-zinc-800">{log.details}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{log.reference}</p>
                    </td>
                    <td className="px-4 py-3">
                       <StatusBadge label={log.status} variant={log.status === 'Success' ? 'green' : log.status === 'Failed' ? 'red' : 'orange'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    No matching logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
           <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
             Showing {filteredLogs.length > 0 ? 1 : 0}-{filteredLogs.length} of {filteredLogs.length} records
           </p>
           <Pagination currentPage={1} totalPages={1} totalItems={filteredLogs.length} itemsPerPage={8} onPageChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
