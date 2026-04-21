import { StatusBadge } from "@/components/shared/status-badge";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";

type PurposeType =
  | "Start"
  | "Buy Back"
  | "Renew"
  | "Sold Item"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer";

interface TransactionRow {
  transactionNo: string;
  purpose: PurposeType;
  buyBack: string;
  percentage: string;
  buyOut: string;
  sold: string;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  qrCode?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
}

const columns = [
  { key: "transactionNo", label: "Transaction #" },
  { key: "purpose", label: "Purpose" },
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
  Renew: "green",
  "Sold Item": "orange",
  Pawn: "purple",
  "Fund Transfer": "blue",
  "Cash Transfer": "blue",
};

function isHighlightedPawn(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

function isHighlightedStorage(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

function formatMoney(value: string) {
  return formatPeso(value, { compactZero: true });
}

interface TransactionTableProps {
  data?: TransactionRow[];
  onReprint?: (transactionNo: string) => void;
  onViewDetails?: (transaction: TransactionRow) => void;
  viewRange: "daily" | "weekly" | "monthly" | "all";
  onRangeChange: (range: "daily" | "weekly" | "monthly" | "all") => void;
}

export function TransactionTable({
  data = [],
  onReprint,
  onViewDetails,
  viewRange,
  onRangeChange,
}: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-text-primary">
            {viewRange === "daily"
              ? "Daily Transactions"
              : viewRange === "weekly"
                ? "Weekly Transactions"
                : viewRange === "monthly"
                  ? "Monthly Transactions"
                  : "All Transactions"}
          </h3>
          <span className="h-4 w-[1px] bg-border-subtle" />
          <select
            value={viewRange}
            onChange={(event) => onRangeChange(event.target.value as never)}
            className="rounded-md border border-border-main bg-surface-secondary px-2 py-1 text-xs font-semibold text-text-primary outline-none transition-colors focus:border-emerald-500"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="all">All Records</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-900 text-amber-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${
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
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-4 text-center text-sm text-text-tertiary"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isStartRow = row.purpose === "Start";

                return (
                  <tr
                    key={row.transactionNo}
                    onClick={() => onViewDetails?.(row)}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer border-t border-border-subtle transition-colors hover:bg-emerald-surface/60 ${
                      isStartRow
                        ? "border-l-4 border-l-emerald-700 bg-emerald-surface"
                        : "bg-surface-secondary"
                    }`}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-text-secondary">
                      {row.transactionNo}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <StatusBadge
                        label={row.purpose}
                        variant={purposeVariant[row.purpose]}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                      {formatTimeWithAmPm(row.time)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-blue-700">
                      {formatMoney(row.buyBack)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-bold text-text-secondary">
                      {row.percentage !== "0" ? `${row.percentage}%` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-orange-700">
                      {formatMoney(row.buyOut)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-emerald-700">
                      {formatMoney(row.sold)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-emerald-700">
                      {formatMoney(row.cashIn)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-red-600">
                      {formatMoney(row.cashOut)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-text-secondary">
                      {formatMoney(row.returnVal)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                      {row.unit}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-xs text-text-tertiary">
                      {row.unitCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                      {isHighlightedPawn(row.pawn) ? (
                        <span className="font-bold text-purple-700">
                          {formatMoney(row.pawn)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">
                          {formatMoney(row.pawn)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                      {isHighlightedStorage(row.storage) ? (
                        <span className="font-bold text-purple-700">
                          {formatMoney(row.storage)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">
                          {formatMoney(row.storage)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      {row.qrCode ? (
                        <div className="flex justify-center">
                          <img
                            src={row.qrCode}
                            alt="QR Code"
                            className="h-10 w-10 rounded-md border border-border-main bg-white p-0.5 object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.purpose === "Pawn" ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onReprint?.(row.transactionNo);
                            }}
                            title="Reprint MOA Slip"
                            className="rounded-lg p-1.5 text-text-muted transition-all hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
                            </svg>
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
