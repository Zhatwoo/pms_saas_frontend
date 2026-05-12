"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

interface AuditLogToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activePeriod: string;
  periods: string[];
  onPeriodChange: (value: string) => void;
  onDateRangeChange: (start: string | null, end: string | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const PH_TIME_ZONE = "Asia/Manila";

function getPhDateParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

function getPhTodayString() {
  const { year, month, day } = getPhDateParts();
  return `${year}-${month}-${day}`;
}

function getPhCurrentMonthString() {
  const { year, month } = getPhDateParts();
  return `${year}-${month}`;
}

function addCalendarDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function getMonthEnd(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const end = new Date(Date.UTC(year, month, 0));
  return `${year}-${String(month).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
}

export function AuditLogToolbar({
  searchQuery,
  onSearchQueryChange,
  activePeriod,
  periods,
  onPeriodChange,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
}: AuditLogToolbarProps) {
  const today = useMemo(() => getPhTodayString(), []);
  const currentMonth = useMemo(() => getPhCurrentMonthString(), []);
  const currentYear = useMemo(() => getPhDateParts().year, []);
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(currentMonth);
  const [yearlyYear, setYearlyYear] = useState(currentYear);
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => String(Number(currentYear) - index)),
    [currentYear],
  );

  useEffect(() => {
    if (activePeriod === "Daily") {
      onDateRangeChange(dailyDate, dailyDate);
      return;
    }

    if (activePeriod === "Weekly") {
      onDateRangeChange(addCalendarDays(today, -6), today);
      return;
    }

    if (activePeriod === "Monthly") {
      onDateRangeChange(`${monthlyDate}-01`, getMonthEnd(monthlyDate));
      return;
    }

    if (activePeriod === "Yearly") {
      onDateRangeChange(`${yearlyYear}-01-01`, `${yearlyYear}-12-31`);
      return;
    }

    onDateRangeChange(null, null);
  }, [activePeriod, dailyDate, monthlyDate, onDateRangeChange, today, yearlyYear]);

  return (
    <div className="flex flex-col gap-4 border-b border-border-subtle bg-surface-secondary/40 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search your logs..."
          className="h-10 w-full rounded border border-border-main bg-surface pl-9 pr-3 text-sm text-text-primary outline-none transition focus:border-pawn-gold focus:ring-1 focus:ring-pawn-gold"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {activePeriod === "Daily" && (
            <input
              type="date"
              max={today}
              value={dailyDate}
              onChange={(event) => setDailyDate(event.target.value)}
              className="h-10 rounded border border-border-main bg-surface px-3 text-sm text-text-primary outline-none focus:border-pawn-gold focus:ring-1 focus:ring-pawn-gold"
            />
          )}
          {activePeriod === "Monthly" && (
            <input
              type="month"
              max={currentMonth}
              value={monthlyDate}
              onChange={(event) => setMonthlyDate(event.target.value)}
              className="h-10 rounded border border-border-main bg-surface px-3 text-sm text-text-primary outline-none focus:border-pawn-gold focus:ring-1 focus:ring-pawn-gold"
            />
          )}
          {activePeriod === "Yearly" && (
            <select
              value={yearlyYear}
              onChange={(event) => setYearlyYear(event.target.value)}
              className="h-10 rounded border border-border-main bg-surface px-3 text-sm text-text-primary outline-none focus:border-pawn-gold focus:ring-1 focus:ring-pawn-gold"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-wrap gap-1 rounded border border-border-main bg-surface p-1">
            {periods.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => onPeriodChange(period)}
                className={`h-8 rounded px-3 text-xs font-bold uppercase tracking-wide transition ${
                  activePeriod === period
                    ? "bg-emerald-700 text-white"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh logs"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border-main bg-surface text-text-secondary transition hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
