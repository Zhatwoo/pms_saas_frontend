import { StatusBadge } from "@/components/shared/status-badge";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import type { TransactionRow, PurposeType } from "./types";
import { useRef, type RefObject } from "react";
import { useAuth } from "@/contexts/auth-context";

const eyeIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const columns = [
  { key: "transactionNo", label: "Transaction #" },
  { key: "branch", label: "Branch" },
  { key: "purpose", label: "Purpose" },
  { key: "customerName", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "buyBack", label: "Buy Back", align: "right" as const },
  { key: "percentage", label: "%", align: "center" as const },
  { key: "buyOut", label: "Buy Out", align: "right" as const },
  { key: "sold", label: "Sold", align: "right" as const },
  { key: "cashIn", label: "Cash In", align: "right" as const },
  { key: "cashOut", label: "Cash Out", align: "right" as const },
  { key: "returnVal", label: "Return", align: "right" as const },
  { key: "unit", label: "Unit" },
  { key: "unitCode", label: "Unit Code" },
  { key: "pawn", label: "Pawn", align: "right" as const },
  { key: "storage", label: "Storage", align: "right" as const },
  { key: "qrCode", label: "QR Code", align: "center" as const },
  { key: "actions", label: "Actions", align: "center" as const },
];

const purposeVariant: Record<
  PurposeType,
  "blue" | "green" | "orange" | "purple" | "black"
> = {
  Start: "black",
  End: "black",
  Pawn: "purple",
  Redeem: "green",
  Renew: "green",
  Reappraise: "green",
  "Buy Back": "blue",
  "Buy Out": "orange",
  "Sold Item": "orange",
  "Reserve / Layaway": "orange",
  "Fund Transfer": "blue",
  "Cash Transfer": "blue",
};

function formatAmount(value: string) {
  return formatPeso(value, { compactZero: true });
}

function isHighlightedValue(value: string) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0;
}

const printerIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

interface TransactionTableProps {
  data?: TransactionRow[];
  isLoading?: boolean;
  onViewDetails?: (transaction: TransactionRow) => void;
  onPrint?: (transaction: TransactionRow) => void;
  highlightTransactionNo?: string | null;
  highlightRowRef?: RefObject<HTMLTableRowElement | null>;
  isToday?: boolean;
}

export function TransactionTable({
  data = [],
  isLoading = false,
  onViewDetails,
  onPrint,
  highlightTransactionNo,
  highlightRowRef,
  isToday = true,
}: TransactionTableProps) {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user?.role?.toLowerCase().includes("admin");
  console.log("TransactionTable Auth:", { role: user?.role, isAdminOrSuperAdmin });

  // Filter columns based on user role - remove QR Code column for non-admins
  const visibleColumns = isAdminOrSuperAdmin 
    ? columns 
    : columns.filter(col => col.key !== "qrCode");

  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-text-primary">
            Daily Transactions
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-sm">
          <thead>
            <tr className="bg-emerald-900 text-amber-400">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="py-12 text-center text-base font-medium text-text-tertiary"
                >
                  <div className="flex items-center justify-center">
                    <LoadingSpinnerLabel 
                      text="Loading pawn transactions..." 
                      className="text-base font-medium text-text-tertiary" 
                    />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="py-8 text-center text-base text-text-tertiary"
                >
                  {isToday ? "No transactions found for today" : "No transactions found"}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isStartRow = row.purpose === "Start";
                const isHighlighted =
                  highlightTransactionNo &&
                  row.transactionNo === highlightTransactionNo;

                return (
                  <tr
                    key={row.id}
                    ref={isHighlighted ? (highlightRowRef as RefObject<HTMLTableRowElement>) : undefined}
                    onClick={() => onViewDetails?.(row)}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer border-t border-border-subtle transition-colors hover:bg-emerald-surface/60 ${
                      isHighlighted
                        ? "animate-highlight-blink"
                        : isStartRow
                        ? "border-l-4 border-l-emerald-700 bg-emerald-surface"
                        : "bg-surface-secondary"
                    }`}
                  >
                    {visibleColumns.map((col) => {
                      if (col.key === "transactionNo") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text-secondary">
                            {row.transactionNo}
                          </td>
                        );
                      }
                      if (col.key === "branch") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                            {row.branch}
                          </td>
                        );
                      }
                      if (col.key === "purpose") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3">
                            <StatusBadge
                              label={row.purpose}
                              variant={purposeVariant[row.purpose]}
                            />
                          </td>
                        );
                      }
                      if (col.key === "customerName") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                            {row.customerName || "Walk-in Customer"}
                          </td>
                        );
                      }
                      if (col.key === "date") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                            {row.date}
                          </td>
                        );
                      }
                      if (col.key === "time") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                            {formatTimeWithAmPm(row.time)}
                          </td>
                        );
                      }
                      if (col.key === "buyBack") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-blue-700">
                            {formatAmount(row.buyBack)}
                          </td>
                        );
                      }
                      if (col.key === "percentage") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-center text-sm font-semibold text-text-secondary">
                            {row.percentage !== "0" ? `${row.percentage}%` : "-"}
                          </td>
                        );
                      }
                      if (col.key === "buyOut") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-orange-700">
                            {formatAmount(row.buyOut)}
                          </td>
                        );
                      }
                      if (col.key === "sold") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-emerald-700">
                            {formatAmount(row.sold)}
                          </td>
                        );
                      }
                      if (col.key === "cashIn") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm text-emerald-700">
                            {formatAmount(row.cashIn)}
                          </td>
                        );
                      }
                      if (col.key === "cashOut") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm text-red-600">
                            {formatAmount(row.cashOut)}
                          </td>
                        );
                      }
                      if (col.key === "returnVal") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-secondary">
                            {formatAmount(row.returnVal)}
                          </td>
                        );
                      }
                      if (col.key === "unit") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                            {row.unit || "N/A"}
                          </td>
                        );
                      }
                      if (col.key === "unitCode") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">
                            {row.unitCode || "N/A"}
                          </td>
                        );
                      }
                      if (col.key === "pawn") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm">
                            {isHighlightedValue(row.pawn) ? (
                              <span className="font-bold text-purple-700">
                                {formatAmount(row.pawn)}
                              </span>
                            ) : (
                              <span className="text-text-secondary">
                                {formatAmount(row.pawn)}
                              </span>
                            )}
                          </td>
                        );
                      }
                      if (col.key === "storage") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-sm">
                            {isHighlightedValue(row.storage) ? (
                              <span className="font-bold text-purple-700">
                                {formatAmount(row.storage)}
                              </span>
                            ) : (
                              <span className="text-text-secondary">
                                {formatAmount(row.storage)}
                              </span>
                            )}
                          </td>
                        );
                      }
                      if (col.key === "qrCode") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-center">
                            {(row.qrCode || row.qr_code) ? (
                              <div className="flex justify-center">
                                  <img
                                    src={row.qrCode || row.qr_code}
                                    alt={`${row.unit || row.transactionNo} QR code`}
                                    className="h-10 w-10 rounded-md border border-border-main bg-white p-0.5 object-contain"
                                    onError={(e) => console.warn("QR Image failed to load:", (row.qrCode || row.qr_code))}
                                  />
                              </div>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                        );
                      }
                      if (col.key === "actions") {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-center">
                            <div
                              className="flex items-center justify-center gap-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {onViewDetails ? (
                                <button
                                  type="button"
                                  onClick={() => onViewDetails(row)}
                                  title="View details"
                                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  {eyeIcon}
                                </button>
                              ) : null}
                              {row.purpose === "Pawn" ? (
                                <button
                                  type="button"
                                  onClick={() => onPrint?.(row)}
                                  title="Print MOA slip"
                                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  {printerIcon}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        );
                      }
                      return null;
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
