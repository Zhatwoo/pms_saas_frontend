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

function getCurrentMonthString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function generateRecentWeeks(count = 12) {
  const weeks = [];
  const today = new Date();
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() - i * 7);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const startStr = monday.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const endStr = sunday.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    
    weeks.push({
      id: `${monday.toISOString().split("T")[0]}_${sunday.toISOString().split("T")[0]}`,
      label: `${startStr} - ${endStr}`,
      startDate: monday.toISOString().split("T")[0],
      endDate: sunday.toISOString().split("T")[0],
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
    <div className="flex items-center gap-4">
      {/* Dynamic Picker rendering on the left */}
      <div className="flex items-center">
        {activePeriod.toLowerCase() === "daily" && (
          <input
            type="date"
            max={getTodayString()}
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className="rounded-lg border border-border-main bg-surface px-4 py-2 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold"
          />
        )}
        
        {activePeriod.toLowerCase() === "weekly" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWeeklyOpen(!isWeeklyOpen)}
              className="flex min-w-[200px] items-center justify-between rounded-lg border border-border-main bg-surface px-4 py-2 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold"
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
                        weeklyId === week.id ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-text-primary"
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
            className="rounded-lg border border-border-main bg-surface px-4 py-2 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold"
          />
        )}

        {activePeriod.toLowerCase() === "yearly" && (
          <select
            value={yearlyYear}
            onChange={(e) => setYearlyYear(e.target.value)}
            className="rounded-lg border border-border-main bg-surface px-4 py-2 text-sm text-text-primary focus:border-pawn-gold focus:outline-none focus:ring-1 focus:ring-pawn-gold"
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
