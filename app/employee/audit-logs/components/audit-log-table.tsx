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

/* ── Mobile / tablet portrait card ── */
function LogCard({ log }: { log: DisplayEmployeeActivityLog }) {
  return (
    <div className="border-b border-border-subtle bg-surface p-4 transition-colors hover:bg-surface-hover last:border-b-0 md:grid md:grid-cols-[8.75rem_minmax(0,1fr)_5.75rem] md:gap-x-4 md:px-5">
      {/* Top row: date + status */}
      <div className="flex items-start justify-between gap-3 md:contents">
        <div className="flex flex-col md:col-start-1 md:row-start-1">
          <span className="text-sm font-bold text-text-primary">{log.dateLabel}</span>
          <span className="mt-0.5 text-xs font-medium text-text-tertiary">{log.timeLabel}</span>
        </div>
        <span className={`shrink-0 inline-flex rounded px-2.5 py-1 text-xs font-bold md:col-start-3 md:row-start-1 md:justify-self-end ${statusClass(log.status)}`}>
          {log.status}
        </span>
      </div>

      {/* Activity badge */}
      <div className="mt-3 md:col-start-2 md:row-start-1 md:mt-0">
        <span className="inline-flex rounded bg-surface-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-text-secondary">
          {log.actionLabel}
        </span>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-text-primary md:col-start-2 md:row-start-2">
        {log.description}
      </p>

      {/* Reference */}
      {log.reference && (
        <p className="mt-1.5 text-xs text-text-secondary md:col-start-2 md:row-start-3">{log.reference}</p>
      )}
    </div>
  );
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  /* Loading / empty shared between both views */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinnerLabel text="Loading your audit trail..." className="text-base font-medium text-text-tertiary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-medium text-text-tertiary">
        No personal audit logs found.
      </div>
    );
  }

  return (
    <>
      {/* ── Card view for narrow / tablet portrait (<1024px) ── */}
      <div className="block lg:hidden">
        {logs.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}
      </div>

      {/* ── Table view for tablet landscape + desktop (≥1024px) ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border-subtle bg-surface-secondary/60">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary xl:px-6">Date</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary xl:px-6">Activity</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary xl:px-6">Description</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary xl:px-6">Reference</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-tertiary xl:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {logs.map((log) => (
              <tr key={log.id} className="bg-surface transition-colors hover:bg-surface-hover">
                <td className="whitespace-nowrap px-4 py-4 xl:px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">{log.dateLabel}</span>
                    <span className="mt-0.5 text-xs font-medium text-text-tertiary">{log.timeLabel}</span>
                  </div>
                </td>
                <td className="px-4 py-4 xl:px-6">
                  <span className="inline-flex rounded bg-surface-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-text-secondary">
                    {log.actionLabel}
                  </span>
                </td>
                <td className="min-w-[220px] px-4 py-4 text-sm text-text-primary xl:min-w-[280px] xl:px-6">
                  {log.description}
                </td>
                <td className="px-4 py-4 text-sm text-text-secondary xl:px-6">
                  {log.reference}
                </td>
                <td className="whitespace-nowrap px-4 py-4 xl:px-6">
                  <span className={`inline-flex rounded px-2.5 py-1 text-xs font-bold ${statusClass(log.status)}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
