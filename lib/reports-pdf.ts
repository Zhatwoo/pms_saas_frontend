import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { buildReportsPdfFilename } from "@/lib/reports-pdf-filename";

export type ReportsPdfData = {
  stats: {
    totalSalesToday: number;
    totalTransactions: number;
    avgPerBranch: number;
    activeBranches: number;
    totalBranches: number;
  };
  branchSales: { name: string; txn: number; sales: number; share: number }[];
  salesTrend: { date: string; sales: number; type: string }[];
  dailyReport: {
    openingBalance: number;
    closingBalance?: number | null;
    periodNetChange?: number | null;
    totalSales: number;
    totalCashOut: number;
    netTotal: number;
    isRange?: boolean;
  };
};

export type DownloadReportsPdfParams = {
  reportData: ReportsPdfData;
  isAllBranches: boolean;
  branchName: string;
  period: string;
  selectionLabel: string;
  generatedAt?: Date;
};

function formatPeso(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function lastTableY(doc: jsPDF, fallback: number): number {
  return ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback) + 10;
}

export function downloadReportsPdf(params: DownloadReportsPdfParams): string {
  const generatedAt = params.generatedAt ?? new Date();
  const fileName = buildReportsPdfFilename({
    isAllBranches: params.isAllBranches,
    branchName: params.branchName,
    period: params.period,
    generatedAt,
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const title = params.isAllBranches
    ? "System Performance Report"
    : "Branch Performance Report";
  const generatedLabel = generatedAt.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59);
  doc.text(BRAND_CONFIG.companyName, 14, 16);

  doc.setFontSize(12);
  doc.setTextColor(24, 24, 27);
  doc.text(title, 14, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated for: ${params.branchName}`, 14, 32);
  doc.text(`Period: ${params.period}`, 14, 38);
  doc.text(`Date: ${params.selectionLabel}`, 14, 44);
  doc.text(`Generated: ${generatedLabel}`, 14, 50);

  let nextY = 58;
  const { reportData } = params;

  if (params.isAllBranches) {
    autoTable(doc, {
      startY: nextY,
      head: [["Metric", "Value"]],
      body: [
        ["Total Sales Today", formatPeso(reportData.stats.totalSalesToday)],
        ["Total Transactions", String(reportData.stats.totalTransactions)],
        ["Avg. Per Branch", formatPeso(reportData.stats.avgPerBranch)],
        [
          "Active Branches",
          `${reportData.stats.activeBranches} / ${reportData.stats.totalBranches}`,
        ],
      ],
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2.5,
        textColor: [24, 24, 27],
      },
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [251, 191, 36],
        fontStyle: "bold",
      },
      columnStyles: {
        1: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });
    nextY = lastTableY(doc, nextY);

    autoTable(doc, {
      startY: nextY,
      head: [["Branch", "Transactions", "Total Sales", "Share"]],
      body:
        reportData.branchSales.length > 0
          ? reportData.branchSales.map((branch) => [
              branch.name,
              String(branch.txn),
              formatPeso(branch.sales),
              `${branch.share}%`,
            ])
          : [["No branch sales data available.", "", "", ""]],
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2.5,
        textColor: [24, 24, 27],
      },
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [251, 191, 36],
        fontStyle: "bold",
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });
    nextY = lastTableY(doc, nextY);
  }

  const dailyRows = reportData.dailyReport.isRange
    ? [
        ["Opening Balance (Period Start)", formatPeso(reportData.dailyReport.openingBalance)],
        ["Total Sales", formatPeso(reportData.dailyReport.totalSales)],
        ["Total Cash Out", formatPeso(reportData.dailyReport.totalCashOut)],
        ["Closing Balance (Period End)", formatPeso(reportData.dailyReport.closingBalance ?? 0)],
        ["Period Net Change", formatPeso(reportData.dailyReport.periodNetChange ?? 0)],
      ]
    : [
        ["Opening Balance", formatPeso(reportData.dailyReport.openingBalance)],
        ["Total Sales", formatPeso(reportData.dailyReport.totalSales)],
        ["Total Cash Out", formatPeso(reportData.dailyReport.totalCashOut)],
        ["Net Total", formatPeso(reportData.dailyReport.netTotal)],
      ];

  autoTable(doc, {
    startY: nextY,
    head: [["Daily Sales Report (DSR)", "Value"]],
    body: dailyRows,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.5,
      textColor: [24, 24, 27],
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [251, 191, 36],
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });
  nextY = lastTableY(doc, nextY);

  if (!params.isAllBranches) {
    autoTable(doc, {
      startY: nextY,
      head: [["Date", "Sales"]],
      body:
        reportData.salesTrend.length > 0
          ? reportData.salesTrend.map((row) => [row.date, formatPeso(row.sales)])
          : [["No trend data", ""]],
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 2.5,
        textColor: [24, 24, 27],
      },
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [251, 191, 36],
        fontStyle: "bold",
      },
      columnStyles: {
        1: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(fileName);
  return fileName;
}
