"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PaginationFooter } from "@/components/shared/pagination";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { AuditLogTable } from "./audit-log-table";
import { AuditLogToolbar } from "./audit-log-toolbar";
import {
  formatActionLabel,
  formatAuditDateTime,
  formatDescription,
  formatReference,
  getStatus,
} from "./audit-log-format";
import type { DisplayEmployeeActivityLog, EmployeeActivityLog } from "./employee-audit-log-types";

const PERIODS = ["Daily", "Weekly", "Monthly", "Yearly", "All Time"];
const ITEMS_PER_PAGE = 15;

function belongsToCurrentEmployee(log: EmployeeActivityLog, userId: string, authId?: string) {
  return log.userId === userId || Boolean(authId && log.userId === authId);
}

export function EmployeeAuditLogsClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [logs, setLogs] = useState<EmployeeActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePeriod, setActivePeriod] = useState("All Time");
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const canLoadLogs = Boolean(user?.id && user.role === "employee");
  const handleDateRangeChange = useCallback((start: string | null, end: string | null) => {
    setDateRange({ start, end });
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!user?.id || !canLoadLogs) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (dateRange.start) queryParams.set("startDate", dateRange.start);
      if (dateRange.end) queryParams.set("endDate", dateRange.end);

      const queryString = queryParams.toString();
      const data = await api.get<EmployeeActivityLog[]>(
        `/activity-logs${queryString ? `?${queryString}` : ""}`,
      );

      setLogs(data.filter((log) => belongsToCurrentEmployee(log, user.id, user.authId)));
    } catch (error) {
      console.error("Failed to load employee audit logs:", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [canLoadLogs, dateRange.end, dateRange.start, user?.authId, user?.id]);

  useEffect(() => {
    if (isAuthLoading) return;

    void fetchLogs();
    const interval = window.setInterval(() => void fetchLogs(), 60_000);
    return () => window.clearInterval(interval);
  }, [fetchLogs, isAuthLoading]);

  const displayLogs = useMemo<DisplayEmployeeActivityLog[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    return logs
      .map((log) => {
        const { dateLabel, timeLabel } = formatAuditDateTime(log.createdAt);
        return {
          ...log,
          dateLabel,
          timeLabel,
          actionLabel: formatActionLabel(log.action, log.details),
          description: formatDescription(log),
          reference: formatReference(log),
          status: getStatus(log.action, log.details),
        };
      })
      .filter((log) => {
        if (!query) return true;
        return [
          log.dateLabel,
          log.timeLabel,
          log.actionLabel,
          log.description,
          log.reference,
          log.status,
          log.branchName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [logs, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activePeriod, dateRange.start, dateRange.end]);

  const totalPages = Math.max(1, Math.ceil(displayLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = displayLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mt-1 text-sm text-text-secondary">
            Personal activity history for {user?.fullName || user?.email || "your account"}.
          </p>
        </div>
        <div className="text-sm font-medium text-text-tertiary">
          {user?.branchName ? `Branch: ${user.branchName}` : "Employee account"}
        </div>
      </div>

      <section className="overflow-hidden rounded border border-border-main bg-surface shadow-sm">
        <AuditLogToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activePeriod={activePeriod}
          periods={PERIODS}
          onPeriodChange={setActivePeriod}
          onDateRangeChange={handleDateRangeChange}
          onRefresh={() => void fetchLogs()}
          isRefreshing={isLoading}
        />
        <AuditLogTable logs={paginatedLogs} isLoading={isLoading || isAuthLoading} />
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayLogs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}
