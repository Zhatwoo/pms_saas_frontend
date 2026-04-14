"use client";

import { useState, useEffect } from "react";
import { Pagination } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

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

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "superadmin";

  const [branch, setBranch] = useState("all");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination for frontend
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    async function fetchLogs() {
      if (!user) return;
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (isSuperAdmin && branch !== "all") {
          // You could optionally send the actual branch UUID if you have that mapping from branchOptions
          // Assume the API might accept branch IDs or we just fetch all and filter in frontend for simplicity
          // However, for this implementation let's fetch all (or pass branchId if known)
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
  }, [user, branch, isSuperAdmin]);

  useEffect(() => {
    // Filter by branch name conceptually if super admin selected a specific branch
    let result = logs;
    
    if (isSuperAdmin && branch !== "all") {
      result = result.filter((l) => l.branchName?.toLowerCase().includes(branch.toLowerCase()));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.userFullName.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [logs, branch, searchQuery, isSuperAdmin]);

  const totalItems = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col mb-4">
        <h1 className="text-xl font-bold text-text-primary">
          {isSuperAdmin ? "Multi-Branch Activity Logs" : "Branch Activity Logs"}
        </h1>
        <p className="text-sm text-zinc-500">
          Comprehensive audit trail of all system actions.
        </p>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 bg-surface p-3 rounded-lg border border-border-main transition-colors duration-300">
        <div className="flex flex-wrap items-end gap-3">
          {isSuperAdmin && (
            <FilterSelect label="Branch" options={branchOptions} value={branch} onChange={setBranch} />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Search Activity</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user or action..."
              className="h-9 rounded-md border border-input-border bg-input-bg px-3 text-xs text-text-primary outline-none focus:border-emerald-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* ── Activity Logs Table ────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-900 border-b border-emerald-800 text-amber-400">
                {["Timestamp", "Branch", "Account Name", "Role", "Action/Event", "Details"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm font-medium text-zinc-500">
                    Loading activity logs...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm font-medium text-zinc-500">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="bg-surface-secondary transition-colors hover:bg-emerald-surface/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-text-secondary font-medium">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                         year: 'numeric', month: 'short', day: 'numeric',
                         hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-text-secondary">
                      {log.branchName || "System / All"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-emerald-800">
                      {log.userFullName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 uppercase tracking-widest">
                         {log.userRole}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-text-primary">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-text-tertiary max-w-xs truncate" title={log.details || ""}>
                      {log.details ? (log.details.length > 50 ? log.details.substring(0, 50) + "..." : log.details) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="rounded-lg border border-border-main bg-surface transition-colors duration-300">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
