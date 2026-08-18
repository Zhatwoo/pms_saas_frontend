import {
  buildMonthlyDate,
  clampMonthlyDate,
  generateRecentYears,
  getAvailableMonthsForYear,
  monthlyDateToRange,
  parseMonthlyDate,
} from "@/lib/date-filter";

describe("date filter helpers", () => {
  const referenceDate = new Date(2026, 7, 18);

  it("parses and builds monthly dates", () => {
    expect(parseMonthlyDate("2026-03")).toEqual({ year: "2026", month: "03" });
    expect(buildMonthlyDate("2025", "11")).toBe("2025-11");
  });

  it("generates recent years from a reference date", () => {
    expect(generateRecentYears(5, referenceDate)).toEqual([
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
    ]);
  });

  it("limits months to the current month for the current year", () => {
    expect(getAvailableMonthsForYear("2026", "2026-08")).toHaveLength(8);
    expect(getAvailableMonthsForYear("2025", "2026-08")).toHaveLength(12);
  });

  it("clamps future months when switching to the current year", () => {
    expect(clampMonthlyDate("2025-12", "2026-08")).toBe("2025-12");
    expect(clampMonthlyDate("2026-12", "2026-08")).toBe("2026-08");
  });

  it("converts a monthly date into an inclusive date range", () => {
    expect(monthlyDateToRange("2026-02")).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
  });
});
