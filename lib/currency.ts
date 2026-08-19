export function formatPeso(
  value: number | string | null | undefined,
  options?: {
    fallback?: string;
    compactZero?: boolean;
  },
) {
  const raw =
    typeof value === "string"
      ? value.replace(/[^0-9.-]+/g, "").trim()
      : value;
  const amount = Number(raw ?? 0);

  if (!Number.isFinite(amount)) {
    return options?.fallback ?? "₱0.00";
  }

  if (options?.compactZero && amount === 0) {
    return "₱0.00";
  }

  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function sanitizeAmountInput(value: string): string {
  let cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");

  if (dotIndex !== -1) {
    const before = cleaned.slice(0, dotIndex);
    const after = cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
    cleaned = `${before}.${after}`;
  }

  return cleaned;
}

export function formatAmountInput(value: string): string {
  const sanitized = sanitizeAmountInput(value);
  if (!sanitized) return "";

  const hasTrailingDot = sanitized.endsWith(".");
  const [intPart = "", decPart] = sanitized.split(".");

  if (!intPart && decPart === undefined) {
    return hasTrailingDot ? "0." : "";
  }

  const formattedInt = intPart
    ? Number(intPart).toLocaleString("en-PH")
    : "0";

  if (decPart !== undefined) {
    if (hasTrailingDot && decPart === "") {
      return `${formattedInt}.`;
    }
    return decPart !== "" ? `${formattedInt}.${decPart}` : formattedInt;
  }

  return formattedInt;
}

export function parseAmountInput(value: string): number | null {
  const sanitized = sanitizeAmountInput(value);
  if (!sanitized || sanitized === ".") return null;
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatAmountForInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
