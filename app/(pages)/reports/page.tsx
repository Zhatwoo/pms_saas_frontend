"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { DateFilterSelector } from "@/components/shared/date-filter-selector";
import { ReportStats } from "./_components/report-stats";
import { BranchSalesTable } from "./_components/branch-sales-table";
import { SalesTrendChart } from "./_components/sales-trend-chart";
import { DailyReportSection } from "./_components/daily-report-section";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { ActionButton } from "@/components/shared/action-button";
import {
  buildPmsPrintDocument,
  escapeHtml,
  printHtmlDocument,
} from "@/lib/print-templates";
const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

const downloadIcon = (
  <svg
    width="16"
    height="16"
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

function formatPeso(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
    totalCashOut: number;
    netTotal: number;
  };
}

/** API may still send legacy `totalExpenses`; normalize to `totalCashOut` for UI / PDF. */
function normalizeReportPayload(raw: unknown): ReportData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const dr = r.dailyReport as Record<string, unknown> | undefined | null;
  const dailyReport: ReportData["dailyReport"] = dr
    ? {
        date: String(dr.date ?? ""),
        openingBalance: Number(dr.openingBalance ?? 0),
        totalSales: Number(dr.totalSales ?? 0),
        netTotal: Number(dr.netTotal ?? 0),
        totalCashOut: Number(
          dr.totalCashOut ??
            dr.totalExpenses ??
            0,
        ),
      }
    : {
        date: "",
        openingBalance: 0,
        totalSales: 0,
        totalCashOut: 0,
        netTotal: 0,
      };

  return {
    ...(r as unknown as ReportData),
    dailyReport,
  };
}

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState("Daily");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { selectedBranch, isAllBranches } = useBranch();

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("period", activePeriod.toLowerCase());
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const data = await api.get<unknown>(`/reports/system?${params}`);
        setReportData(normalizeReportPayload(data));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load reports.";
        console.error("Failed to load reports:", err);
        setError(msg);
      } finally {
        setIsLoading(false);
        setHasLoadedData(true);
      }
    }
    fetchReport();
  }, [selectedBranch.id, isAllBranches, activePeriod, startDate, endDate]);

  const getSelectionLabel = () => {
    if (activePeriod.toLowerCase() === "daily" && startDate) {
      return new Date(startDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (startDate && endDate) {
      const formatDateStr = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-");
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      };

      const startLabel = formatDateStr(startDate);
      const endLabel = formatDateStr(endDate);
      const endYear = endDate.split("-")[0];

      // Check if it's a full month
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start.getDate() === 1 && end.getDate() >= 28 && start.getMonth() === end.getMonth()) {
         return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }

      return `${startLabel} - ${endLabel}, ${endYear}`;
    }
    return activePeriod;
  };

  const selectionLabel = getSelectionLabel();
  const branchSalesTitle = isAllBranches ? "Per-Branch Sales" : `${selectedBranch.name} Sales`;

  const handleDownloadPDF = async () => {
    if (!reportData) return;

    try {
      const branchLabel = isAllBranches ? "All Branches" : selectedBranch.name;
      const stats = reportData.stats;
      const branchRows = reportData.branchSales
        .map(
          (branch) => `
            <tr>
              <td>${escapeHtml(branch.name)}</td>
              <td class="num">${branch.txn}</td>
              <td class="num">${escapeHtml(formatPeso(branch.sales))}</td>
              <td class="num">${branch.share}%</td>
            </tr>`,
        )
        .join("");

      const dailyRows = [
        ["Opening Balance", formatPeso(reportData.dailyReport.openingBalance)],
        ["Total Sales", formatPeso(reportData.dailyReport.totalSales)],
        ["Total Cash Out", formatPeso(reportData.dailyReport.totalCashOut)],
        ["Net Total", formatPeso(reportData.dailyReport.netTotal)],
      ]
        .map(
          ([label, value]) => `
            <tr>
              <td>${escapeHtml(label)}</td>
              <td class="num">${escapeHtml(value)}</td>
            </tr>`,
        )
        .join("");
      const generatedAt = escapeHtml(
        new Date().toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      );
      const metaHtml = `
        <p><strong>Generated for:</strong> ${escapeHtml(branchLabel)}</p>
        <p><strong>Period:</strong> ${escapeHtml(activePeriod)}</p>
        <p><strong>Date:</strong> ${escapeHtml(selectionLabel)}</p>
        <p><strong>Generated:</strong> ${generatedAt}</p>`;

      const headerSubtitle = `System Performance Report — ${branchLabel}`;

      let bodyHtml: string;
      if (isAllBranches) {
        bodyHtml = `
            <div class="pms-print-section">
              <h2>Executive Summary</h2>
              <div class="pms-summary-grid">
                <div class="pms-summary-item">
                  <span class="pms-summary-label">Total Sales Today</span>
                  <span class="pms-summary-value">${escapeHtml(formatPeso(stats.totalSalesToday))}</span>
                </div>
                <div class="pms-summary-item">
                  <span class="pms-summary-label">Total Transactions</span>
                  <span class="pms-summary-value">${stats.totalTransactions}</span>
                </div>
                <div class="pms-summary-item">
                  <span class="pms-summary-label">Avg. Per Branch</span>
                  <span class="pms-summary-value">${escapeHtml(formatPeso(stats.avgPerBranch))}</span>
                </div>
                <div class="pms-summary-item">
                  <span class="pms-summary-label">Active Branches</span>
                  <span class="pms-summary-value">${stats.activeBranches} / ${stats.totalBranches}</span>
                </div>
              </div>
            </div>

            <div class="pms-print-section">
              <h2>Branch Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th class="num">Transactions</th>
                    <th class="num">Total Sales</th>
                    <th class="num">Share</th>
                  </tr>
                </thead>
                <tbody>${branchRows || '<tr><td colspan="4" class="empty">No branch sales data available.</td></tr>'}</tbody>
              </table>
            </div>

            <div class="pms-print-section">
              <h2>Daily Sales Report (DSR)</h2>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th class="num">Value</th>
                  </tr>
                </thead>
                <tbody>${dailyRows}</tbody>
              </table>
            </div>`;
      } else {
        const trendRows = reportData.salesTrend
          .map(
            (t) =>
              `<tr><td>${escapeHtml(t.date)}</td><td class="num">${escapeHtml(formatPeso(t.sales))}</td></tr>`,
          )
          .join("");

        bodyHtml = `
            <div class="pms-print-section">
              <h2>Daily Sales Report (DSR)</h2>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th class="num">Value</th>
                  </tr>
                </thead>
                <tbody>${dailyRows}</tbody>
              </table>
            </div>

            <div class="pms-print-section">
              <h2>Sales Trend</h2>
              <table>
                <thead>
                  <tr><th>Date</th><th class="num">Sales</th></tr>
                </thead>
                <tbody>${trendRows || '<tr><td colspan="2" class="empty">No trend data</td></tr>'}</tbody>
              </table>
            </div>`;
      }

      const html = buildPmsPrintDocument({
        documentTitle: isAllBranches ? "System Performance Report" : "Branch Performance Report",
        headerSubtitle,
        metaHtml,
        bodyHtml,
      });

      printHtmlDocument(html);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("Failed to generate PDF. Please check console for details.");
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-5">
      {/* Header row */}
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="w-full min-w-0 sm:flex-1">
          <DateFilterSelector
            periods={periods}
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
            onDateRangeChange={useCallback((start: string | null, end: string | null) => {
              setStartDate(start);
              setEndDate(end);
            }, [])}
          />
        </div>
        <ActionButton 
          onClick={handleDownloadPDF}
          variant="success"
          leftIcon={downloadIcon}
          className="w-full shrink-0 sm:w-auto"
        >
          Download PDF
        </ActionButton>
      </div>

      {isLoading && !hasLoadedData ? (
        <div className="flex items-center justify-center rounded-xl border border-border-main bg-surface px-5 py-16 text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Loading reports..." className="text-base font-medium text-text-tertiary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button onClick={() => setActivePeriod(activePeriod)} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-md hover:bg-emerald-800">
            Retry
          </button>
        </div>
      ) : (
        <>
          <ReportStats data={reportData?.stats} showBranchStats={isAllBranches} />

          {/* Side by side: branch table + chart */}
          <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <BranchSalesTable data={reportData?.branchSales} date={selectionLabel} title={branchSalesTitle} />
            </div>
            <div id="sales-trend-chart" className="min-w-0 w-full">
              <SalesTrendChart
                data={reportData?.salesTrend}
                summary={reportData?.trendSummary}
                todaySales={reportData?.stats?.totalSalesToday ?? 0}
                activePeriod={activePeriod}
                selectionLabel={selectionLabel}
              />
            </div>
          </div>

          <DailyReportSection data={reportData?.dailyReport} date={selectionLabel} />
        </>
      )}
    </div>
  );
}
