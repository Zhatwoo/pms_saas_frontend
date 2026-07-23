"use client";

import { useState, useEffect, useMemo } from "react";
import { PeriodTabs } from "./period-tabs";

interface DateFilterSelectorProps {
  periods: string[];
  activePeriod: string;
  onPeriodChange: (period: string) => void;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function toLocalYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function generateRecentWeeks(count = 12) {
  const weeks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentEnd = new Date(today);

  for (let i = 0; i < count; i++) {
    const end = new Date(currentEnd);
    end.setDate(currentEnd.getDate() - i * 7);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startStr = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    
    weeks.push({
      id: `${toLocalYMD(start)}_${toLocalYMD(end)}`,
      label: `${startStr} - ${endStr}`,
      startDate: toLocalYMD(start),
      endDate: toLocalYMD(end),
    });
  }
  return weeks;
}

export function DateFilterSelector({
  periods,
  activePeriod,
  onPeriodChange,
  onDateRangeChange,
}: DateFilterSelectorProps) {
  // State for each picker type so selections are remembered
  const [dailyDate, setDailyDate] = useState(getTodayString());
  const weeks = useMemo(() => generateRecentWeeks(12), []);
  const [weeklyId, setWeeklyId] = useState(weeks[0].id);
  const [isWeeklyOpen, setIsWeeklyOpen] = useState(false);
  const [monthlyDate, setMonthlyDate] = useState(getCurrentMonthString());
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear().toString());

  // Effect to broadcast the correct range whenever activePeriod or the specific picker's value changes
  useEffect(() => {
    switch (activePeriod.toLowerCase()) {
      case "daily":
        if (dailyDate) {
          onDateRangeChange(dailyDate, dailyDate);
        }
        break;
      case "weekly": {
        const week = weeks.find((w) => w.id === weeklyId);
        if (week) {
          onDateRangeChange(week.startDate, week.endDate);
        }
        break;
      }
      case "monthly": {
        if (monthlyDate) {
          const [year, month] = monthlyDate.split("-");
          const start = new Date(parseInt(year), parseInt(month) - 1, 1);
          const end = new Date(parseInt(year), parseInt(month), 0); // Last day of month
          
          // To format nicely as YYYY-MM-DD in local time
          const startStr = `${year}-${month}-01`;
          const endStr = `${year}-${month}-${String(end.getDate()).padStart(2, "0")}`;
          
          onDateRangeChange(startStr, endStr);
        }
        break;
      }
      case "yearly": {
        if (yearlyYear) {
          onDateRangeChange(`${yearlyYear}-01-01`, `${yearlyYear}-12-31`);
        }
        break;
      }
      default:
        // Fallback: let backend handle it via the period string
        onDateRangeChange(null, null);
    }
  }, [activePeriod, dailyDate, weeklyId, monthlyDate, yearlyYear, weeks, onDateRangeChange]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (current - i).toString());
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {/* Dynamic Picker rendering on the left */}
      <div className="flex w-full shrink-0 items-center sm:w-auto">
        {activePeriod.toLowerCase() === "daily" && (
          <input
            type="date"
            max={getTodayString()}
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className="h-11 w-full rounded-lg border border-border-main bg-surface px-3 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold sm:w-[10.5rem]"
          />
        )}
        
        {activePeriod.toLowerCase() === "weekly" && (
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsWeeklyOpen(!isWeeklyOpen)}
              className="flex h-11 w-full min-w-0 items-center justify-between rounded-lg border border-border-main bg-surface px-3 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold sm:min-w-[13.5rem]"
            >
              <span>{weeks.find((w) => w.id === weeklyId)?.label}</span>
              <svg className="ml-2 h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isWeeklyOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsWeeklyOpen(false)} />
                <div className="absolute top-full z-50 mt-1 w-full max-h-[224px] overflow-y-auto rounded-lg border border-border-main bg-surface shadow-lg">
                  {weeks.map((week) => (
                    <button
                      key={week.id}
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover ${
                        weeklyId === week.id ? "bg-brand-green/10 font-medium text-brand-green dark:bg-brand-green/20 dark:text-brand-green" : "text-text-primary"
                      }`}
                      onClick={() => {
                        setWeeklyId(week.id);
                        setIsWeeklyOpen(false);
                      }}
                    >
                      {week.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activePeriod.toLowerCase() === "monthly" && (
          <input
            type="month"
            max={getCurrentMonthString()}
            value={monthlyDate}
            onChange={(e) => setMonthlyDate(e.target.value)}
            className="h-11 w-full rounded-lg border border-border-main bg-surface px-3 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold sm:w-[10.5rem]"
          />
        )}

        {activePeriod.toLowerCase() === "yearly" && (
          <select
            value={yearlyYear}
            onChange={(e) => setYearlyYear(e.target.value)}
            className="h-11 w-full rounded-lg border border-border-main bg-surface px-3 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold sm:w-[10.5rem]"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      <PeriodTabs
        tabs={periods}
        activeTab={activePeriod}
        onTabChange={onPeriodChange}
      />
    </div>
  );
}
