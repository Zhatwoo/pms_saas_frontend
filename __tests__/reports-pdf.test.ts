import { buildReportsPdfFilename } from "@/lib/reports-pdf-filename";
import { downloadReportsPdf, type ReportsPdfData } from "@/lib/reports-pdf";

jest.mock("jspdf", () => {
  const saveMock = jest.fn();
  const textMock = jest.fn();
  const setFontMock = jest.fn();
  const setFontSizeMock = jest.fn();
  const setTextColorMock = jest.fn();

  return jest.fn().mockImplementation(() => ({
    save: saveMock,
    text: textMock,
    setFont: setFontMock,
    setFontSize: setFontSizeMock,
    setTextColor: setTextColorMock,
  }));
});

jest.mock("jspdf-autotable", () => jest.fn());

describe("reports-pdf", () => {
  const mockReportData: ReportsPdfData = {
    stats: {
      totalSalesToday: 15000,
      totalTransactions: 25,
      avgPerBranch: 5000,
      activeBranches: 3,
      totalBranches: 4,
    },
    branchSales: [
      { name: "Branch A", txn: 10, sales: 6000, share: 40 },
      { name: "Branch B", txn: 15, sales: 9000, share: 60 },
    ],
    salesTrend: [{ date: "2026-08-20", sales: 15000, type: "Daily" }],
    dailyReport: {
      openingBalance: 50000,
      closingBalance: 65000,
      periodNetChange: 15000,
      totalSales: 20000,
      totalCashOut: 5000,
      netTotal: 15000,
      isRange: false,
    },
  };

  test("buildReportsPdfFilename formats correct filename for all branches", () => {
    const fixedDate = new Date("2026-08-20T12:00:00Z");
    const filename = buildReportsPdfFilename({
      isAllBranches: true,
      branchName: "All Branches",
      period: "Daily",
      generatedAt: fixedDate,
    });
    expect(filename).toBe("system_report_all_branches_daily_2026-08-20.pdf");
  });

  test("buildReportsPdfFilename formats correct filename for single branch", () => {
    const fixedDate = new Date("2026-08-20T12:00:00Z");
    const filename = buildReportsPdfFilename({
      isAllBranches: false,
      branchName: "Makati Branch",
      period: "Monthly",
      generatedAt: fixedDate,
    });
    expect(filename).toBe("system_report_makati_branch_monthly_2026-08-20.pdf");
  });

  test("downloadReportsPdf calls doc.save and does not trigger window.print", () => {
    const printSpy = jest.spyOn(window, "print").mockImplementation(() => {});
    const fixedDate = new Date("2026-08-20T12:00:00Z");

    const savedFile = downloadReportsPdf({
      reportData: mockReportData,
      isAllBranches: true,
      branchName: "All Branches",
      period: "Daily",
      selectionLabel: "August 20, 2026",
      generatedAt: fixedDate,
    });

    expect(savedFile).toBe("system_report_all_branches_daily_2026-08-20.pdf");
    expect(printSpy).not.toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
