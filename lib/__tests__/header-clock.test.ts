import {
  formatHeaderDate,
  formatHeaderDateTime,
  formatHeaderTime,
} from "@/lib/header-clock";

describe("header clock formatting", () => {
  it("uses Asia/Manila calendar date near midnight UTC (regression: UTC date drift)", () => {
    // 2026-08-14 20:30 UTC = 2026-08-15 04:30 in Manila
    const instant = new Date("2026-08-14T20:30:00.000Z");

    expect(formatHeaderDate(instant)).toBe("Aug 15, 2026");
    expect(formatHeaderTime(instant)).toBe("4:30:00 AM");
    expect(formatHeaderDateTime(instant)).toBe("Aug 15, 2026, 4:30:00 AM");
  });

  it("keeps the previous Manila calendar day before midnight PH", () => {
    // 2026-08-14 15:59:59 UTC = 2026-08-14 23:59:59 in Manila
    const instant = new Date("2026-08-14T15:59:59.000Z");

    expect(formatHeaderDate(instant)).toBe("Aug 14, 2026");
    expect(formatHeaderTime(instant)).toBe("11:59:59 PM");
  });

  it("formats afternoon wall-clock time in 12-hour form", () => {
    // 2026-08-14 08:06:02 UTC = 2026-08-14 16:06:02 in Manila
    const instant = new Date("2026-08-14T08:06:02.000Z");

    expect(formatHeaderDate(instant)).toBe("Aug 14, 2026");
    expect(formatHeaderTime(instant)).toBe("4:06:02 PM");
  });

  it("does not depend on the host system timezone", () => {
    const originalTz = process.env.TZ;
    process.env.TZ = "UTC";

    try {
      const instant = new Date("2026-08-14T20:30:00.000Z");
      expect(formatHeaderDate(instant)).toBe("Aug 15, 2026");
      expect(formatHeaderTime(instant)).toBe("4:30:00 AM");
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });
});
