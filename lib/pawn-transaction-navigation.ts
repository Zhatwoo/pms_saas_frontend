const SUPERADMIN_PAWN_TRANSACTION_ROUTE = "/pawn-transactions";
const EMPLOYEE_PAWN_TRANSACTION_ROUTE = "/employee/pawn-transaction";

export function extractTransactionNoFromText(text?: string | null): string | null {
  const normalized = text?.trim();
  if (!normalized) return null;

  // Match patterns like "PAWN-1776...", "PAWN-177...", "BU-...", etc.
  const match = normalized.match(/([A-Z]{2,4}-\d{10,})/);
  if (match) return match[1];

  // Fallback: split by " - " and take last part
  const parts = normalized.split(" - ");
  if (parts.length < 2) return null;
  const transactionNo = parts[parts.length - 1]?.trim();
  return transactionNo || null;
}

export function buildPawnTransactionHighlightHref(
  transactionNo: string,
  role: "super_admin" | "employee" = "employee",
): string {
  const route =
    role === "super_admin"
      ? SUPERADMIN_PAWN_TRANSACTION_ROUTE
      : EMPLOYEE_PAWN_TRANSACTION_ROUTE;

  const searchParams = new URLSearchParams({
    transactionNo,
    highlightTransaction: "true",
  });

  return `${route}?${searchParams.toString()}`;
}
