"use client";

import { useState } from "react";
import { PeriodTabs } from "@/components/shared/period-tabs";
import { ReportStats } from "@/app/(pages)/reports/_components/report-stats";
import { BranchSalesTable } from "@/app/(pages)/reports/_components/branch-sales-table";
import { SalesTrendChart } from "@/app/(pages)/reports/_components/sales-trend-chart";
import { DailyReportSection } from "@/app/(pages)/reports/_components/daily-report-section";

const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

const downloadIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState("Daily");

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PeriodTabs
            tabs={periods}
            activeTab={activePeriod}
            onTabChange={setActivePeriod}
          />
          <span className="text-sm text-zinc-500">April 1, 2026</span>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
          {downloadIcon}
          Download PDF
        </button>
      </div>

      <ReportStats />

      {/* Side by side: branch table + chart */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BranchSalesTable />
        <SalesTrendChart />
      </div>

      <DailyReportSection />
    </div>
  );
}
