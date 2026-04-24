import { StatusBadge } from "@/components/shared/status-badge";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";
import type { TransactionRow, PurposeType } from "./types";
import { useRef, type RefObject } from "react";

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
  "Buy Back": "blue",
  "Buy Out": "orange",
  Renew: "green",
  "Sold Item": "orange",
  Pawn: "purple",
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
}

export function TransactionTable({
  data = [],
  isLoading = false,
  onViewDetails,
  onPrint,
  highlightTransactionNo,
  highlightRowRef,
}: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Pawn Transactions
          </h3>
          <p className="text-xs text-text-tertiary">
            View live transaction records across branches.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-sm">
          <thead>
            <tr className="bg-emerald-900 text-amber-400">
              {columns.map((col) => (
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
                  colSpan={columns.length}
                  className="py-8 text-center text-base text-text-tertiary"
                >
                  Loading transactions...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-base text-text-tertiary"
                >
                  No transactions found for the current branch and filters.
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
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text-secondary">
                      {row.transactionNo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {row.branch}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge
                        label={row.purpose}
                        variant={purposeVariant[row.purpose]}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {row.customerName || "Walk-in Customer"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {formatTimeWithAmPm(row.time)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-blue-700">
                      {formatAmount(row.buyBack)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-semibold text-text-secondary">
                      {row.percentage !== "0" ? `${row.percentage}%` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-orange-700">
                      {formatAmount(row.buyOut)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-emerald-700">
                      {formatAmount(row.sold)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-emerald-700">
                      {formatAmount(row.cashIn)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-red-600">
                      {formatAmount(row.cashOut)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-secondary">
                      {formatAmount(row.returnVal)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {row.unit || "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">
                      {row.unitCode || "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
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
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
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
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {row.qrCode ? (
                        <div className="flex justify-center">
                          <img
                            src={row.qrCode}
                            alt={`${row.unit || row.transactionNo} QR code`}
                            className="h-10 w-10 rounded-md border border-border-main bg-white p-0.5 object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <div
                        className="flex items-center justify-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
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
