"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { PeriodTabs } from "@/components/shared/period-tabs";
import { ReportStats } from "./_components/report-stats";
import { BranchSalesTable } from "./_components/branch-sales-table";
import { SalesTrendChart } from "./_components/sales-trend-chart";
import { DailyReportSection } from "./_components/daily-report-section";

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

interface ReportData {
  stats: {
    totalSalesToday: number;
    totalTransactions: number;
    avgPerBranch: number;
    activeBranches: number;
    totalBranches: number;
  };
  branchSales: { name: string; txn: number; sales: number; share: number }[];
  salesTrend: { date: string; sales: number; type: string }[];
  trendSummary: {
    average: number;
    peakDate: string;
    peakSales: number;
  };
  dailyReport: {
    date: string;
    openingBalance: number;
    totalSales: number;
    totalExpenses: number;
    netTotal: number;
  };
}

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState("Daily");
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { selectedBranch, isAllBranches } = useBranch();

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true);
      try {
        const branchQuery = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
        const data = await api.get<ReportData>(`/reports/system${branchQuery}`);
        setReportData(data);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [selectedBranch.id, isAllBranches]);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
          <span className="text-sm text-zinc-500">{todayFormatted}</span>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
          {downloadIcon}
          Download PDF
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-text-tertiary">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Loading reports...</span>
          </div>
        </div>
      ) : (
        <>
          <ReportStats data={reportData?.stats} />

          {/* Side by side: branch table + chart */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <BranchSalesTable data={reportData?.branchSales} date={todayFormatted} />
            <SalesTrendChart
              data={reportData?.salesTrend}
              summary={reportData?.trendSummary}
              todaySales={reportData?.stats?.totalSalesToday ?? 0}
            />
          </div>

          <DailyReportSection data={reportData?.dailyReport} date={todayFormatted} />
        </>
      )}
    </div>
  );
}
