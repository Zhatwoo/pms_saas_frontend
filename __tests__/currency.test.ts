import {
  formatAmountForInput,
  formatAmountInput,
  parseAmountInput,
  sanitizeAmountInput,
} from "@/lib/currency";

describe("amount input formatting", () => {
  it("formats whole numbers with thousand separators", () => {
    expect(formatAmountInput("13000")).toBe("13,000");
    expect(formatAmountInput("1000000")).toBe("1,000,000");
  });

  it("supports decimal amounts up to two places", () => {
    expect(formatAmountInput("13000.5")).toBe("13,000.5");
    expect(formatAmountInput("13000.50")).toBe("13,000.50");
    expect(formatAmountInput("13000.")).toBe("13,000.");
  });

  it("sanitizes pasted values with commas and symbols", () => {
    expect(sanitizeAmountInput("13,000.25")).toBe("13000.25");
    expect(formatAmountInput("PHP 13,000")).toBe("13,000");
  });

  it("parses formatted values back to numbers", () => {
    expect(parseAmountInput("13,000")).toBe(13000);
    expect(parseAmountInput("13,000.50")).toBe(13000.5);
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput(".")).toBeNull();
  });

  it("formats stored numbers for input display", () => {
    expect(formatAmountForInput(13000)).toBe("13,000");
    expect(formatAmountForInput(4500.5)).toBe("4,500.5");
    expect(formatAmountForInput(null)).toBe("");
  });
});
