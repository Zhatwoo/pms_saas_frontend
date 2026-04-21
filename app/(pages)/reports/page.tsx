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

  const handleDownloadPDF = async () => {
    if (!reportData) return;

    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Currency formatter for PDF (using 'P' to avoid font encoding issues)
      const fP = (num: number) => `P ${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

      // Report Header
      doc.setFontSize(22);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text("System Performance Report", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const branchLabel = isAllBranches ? "All Branches" : selectedBranch.name;
      doc.text(`Generated for: ${branchLabel}`, 14, 28);
      doc.text(`Period: ${activePeriod}`, 14, 33);
      doc.text(`Date: ${todayFormatted}`, 14, 38);

      // 1. Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Executive Summary", 14, 50);
      
      const stats = reportData.stats;
      const summaryData = [
        ["Total Sales Today", fP(stats.totalSalesToday)],
        ["Total Transactions", stats.totalTransactions.toString()],
        ["Avg. Sale per Branch", fP(stats.avgPerBranch)],
        ["Active Branches", `${stats.activeBranches} / ${stats.totalBranches}`],
      ];

      autoTable(doc, {
        startY: 55,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [6, 78, 59] }, // emerald-900
      });

      // 2. Sales Trend Chart (Capture from DOM)
      const currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Historical Sales Trend", 14, currentY + 5);

      const chartElement = document.getElementById("sales-trend-chart");
      if (chartElement) {
        try {
          const { domToPng } = await import("modern-screenshot");
          const imgData = await domToPng(chartElement, {
            scale: 2,
            backgroundColor: "#ffffff",
          });
          doc.addImage(imgData, "PNG", 14, currentY + 10, 180, 80);
        } catch (chartErr) {
          console.warn("Could not capture chart image, skipping:", chartErr);
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text("(Chart could not be rendered in PDF - see web dashboard for visualization)", 14, currentY + 20);
          doc.setTextColor(0);
        }
      }

      // 3. Branch Breakdown (New Page if needed)
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Branch Breakdown", 14, 20);

      const branchRows = reportData.branchSales.map(b => [
        b.name,
        b.txn.toString(),
        fP(b.sales),
        `${b.share}%`
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["Branch", "Transactions", "Total Sales", "Share"]],
        body: branchRows,
        theme: "grid",
        headStyles: { fillColor: [4, 120, 87] }, // emerald-700
      });

      // 4. Daily Sales Report (DSR) Summary
      const dsrY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Daily Sales Report (DSR) Summary", 14, dsrY);

      const dsr = reportData.dailyReport;
      const dsrData = [
        ["Opening Balance", fP(dsr.openingBalance)],
        ["Total Sales", fP(dsr.totalSales)],
        ["Total Expenses", fP(dsr.totalExpenses)],
        ["Net Total", fP(dsr.netTotal)],
      ];

      autoTable(doc, {
        startY: dsrY + 5,
        body: dsrData,
        theme: "plain",
        styles: { fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 50 }, 1: { halign: "left" } }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount} - Pawnshop Management System`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`Report_${branchLabel.replace(/\s+/g, "_")}_${activePeriod}.pdf`);
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
          onClick={() => window.print()}
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
