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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPeso(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function printHtmlDocument(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 500);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.onafterprint = cleanup;
    frameWindow.focus();
    window.setTimeout(() => frameWindow.print(), 250);
  };

  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    cleanup();
    throw new Error("Unable to create print document.");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
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
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("period", activePeriod.toLowerCase());
        const data = await api.get<ReportData>(`/reports/system?${params}`);
        setReportData(data);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [selectedBranch.id, isAllBranches, activePeriod]);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
        ["Total Expenses", formatPeso(reportData.dailyReport.totalExpenses)],
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

      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>System Performance Report</title>
            <style>
              body { font-family: Arial, sans-serif; color: #111; margin: 36px 44px; }
              .topline { text-align: center; font-size: 12px; margin-bottom: 36px; }
              h1 { margin: 0 0 12px; font-size: 26px; font-weight: 700; }
              .meta p { margin: 0 0 8px; font-size: 12px; }
              .divider { border-top: 2px solid #111; margin: 18px 0 28px; }
              h2 { margin: 0 0 14px; font-size: 16px; font-weight: 700; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 26px; }
              .card { border: 1px solid #222; min-height: 78px; padding: 14px; box-sizing: border-box; }
              .label { font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
              .value { font-size: 20px; font-weight: 700; }
              .summary { margin-bottom: 20px; }
              .summary p { margin: 0 0 6px; font-size: 12px; }
              .section { margin-top: 22px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border-bottom: 1px solid #cbd5e1; padding: 10px 8px; font-size: 12px; text-align: left; }
              thead th { border-top: 2px solid #111; border-bottom: 2px solid #111; font-weight: 700; }
              .num { text-align: right; }
              .empty { color: #64748b; font-style: italic; text-align: center; }
              .footer { margin-top: 28px; font-size: 11px; color: #666; text-align: center; }
              @media print {
                body { margin: 16px; }
              }
            </style>
          </head>
          <body>
            <div class="topline">Pawnshop Management System</div>
            <h1>System Performance Report</h1>
            <div class="meta">
              <p><strong>Generated for:</strong> ${escapeHtml(branchLabel)}</p>
              <p><strong>Period:</strong> ${escapeHtml(activePeriod)}</p>
              <p><strong>Date:</strong> ${escapeHtml(todayFormatted)}</p>
              <p><strong>Generated:</strong> ${escapeHtml(
                new Date().toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
              )}</p>
            </div>
            <div class="divider"></div>

            <h2>Executive Summary</h2>
            <div class="grid">
              <div class="card"><div class="label">Total Sales Today</div><div class="value">${escapeHtml(formatPeso(stats.totalSalesToday))}</div></div>
              <div class="card"><div class="label">Total Transactions</div><div class="value">${stats.totalTransactions}</div></div>
              <div class="card"><div class="label">Avg. Per Branch</div><div class="value">${escapeHtml(formatPeso(stats.avgPerBranch))}</div></div>
              <div class="card"><div class="label">Active Branches</div><div class="value">${stats.activeBranches} / ${stats.totalBranches}</div></div>
            </div>

            <div class="section summary">
              <h2>Historical Sales Trend Summary</h2>
              <p><strong>14-day Average:</strong> ${escapeHtml(formatPeso(reportData.trendSummary.average))}</p>
              <p><strong>Peak Date:</strong> ${escapeHtml(reportData.trendSummary.peakDate)}</p>
              <p><strong>Peak Sales:</strong> ${escapeHtml(formatPeso(reportData.trendSummary.peakSales))}</p>
            </div>

            <div class="section">
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

            <div class="section">
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

            <div class="footer">Pawnshop Management System</div>
          </body>
        </html>
      `;

      printHtmlDocument(html);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("Failed to generate PDF. Please check console for details.");
    }
  };

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
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
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
            <div id="sales-trend-chart">
              <SalesTrendChart
                data={reportData?.salesTrend}
                summary={reportData?.trendSummary}
                todaySales={reportData?.stats?.totalSalesToday ?? 0}
              />
            </div>
          </div>

          <DailyReportSection data={reportData?.dailyReport} date={todayFormatted} />
        </>
      )}
    </div>
  );
}
