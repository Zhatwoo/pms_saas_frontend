import {
  getTodayListingDate,
  resolveDefaultListingDate,
} from "@/app/(pages)/inventory/items-for-sale/_components/add-item-listing-date";

describe("add item listing date helpers", () => {
  const referenceDate = new Date(2026, 7, 20);

  it("builds a local YYYY-MM-DD date string", () => {
    expect(getTodayListingDate(referenceDate)).toBe("2026-08-20");
  });

  it("prefers a valid past calendar date", () => {
    expect(resolveDefaultListingDate("2026-07-10", "2026-08-20")).toBe(
      "2026-07-10",
    );
  });

  it("falls back to today for future or invalid values", () => {
    expect(resolveDefaultListingDate("2026-09-01", "2026-08-20")).toBe(
      "2026-08-20",
    );
    expect(resolveDefaultListingDate("invalid", "2026-08-20")).toBe(
      "2026-08-20",
    );
    expect(resolveDefaultListingDate(null, "2026-08-20")).toBe("2026-08-20");
  });
});
