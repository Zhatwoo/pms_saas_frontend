"use client";

import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import type { DisplayEmployeeActivityLog } from "./employee-audit-log-types";

interface AuditLogTableProps {
  logs: DisplayEmployeeActivityLog[];
  isLoading: boolean;
}

function statusClass(status: DisplayEmployeeActivityLog["status"]) {
  if (status === "Failed") return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
  if (status === "Pending") return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-border-subtle bg-surface-secondary/60">
          <tr>
            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Date</th>
            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Activity</th>
            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Description</th>
            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Reference</th>
            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="py-12 text-center">
                <div className="flex items-center justify-center">
                  <LoadingSpinnerLabel text="Loading your audit trail..." className="text-base font-medium text-text-tertiary" />
                </div>
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-sm font-medium text-text-tertiary">
                No personal audit logs found.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="bg-surface transition-colors hover:bg-surface-hover">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">{log.dateLabel}</span>
                    <span className="mt-0.5 text-xs font-medium text-text-tertiary">{log.timeLabel}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded bg-surface-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-text-secondary">
                    {log.actionLabel}
                  </span>
                </td>
                <td className="min-w-[280px] px-6 py-4 text-sm text-text-primary">
                  {log.description}
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {log.reference}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded px-2.5 py-1 text-xs font-bold ${statusClass(log.status)}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
