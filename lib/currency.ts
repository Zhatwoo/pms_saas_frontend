export function formatPeso(
  value: number | string | null | undefined,
  options?: {
    fallback?: string;
    compactZero?: boolean;
  },
) {
  const amount = Number(value ?? 0);

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
