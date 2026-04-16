import { StatusBadge } from "@/components/shared/status-badge";
import { formatTimeWithAmPm } from "@/lib/time";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn" | "Fund Transfer" | "Cash Transfer";

interface TransactionRow {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
  details: string;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
}

const columns = [
  { key: "transactionNo", label: "Transaction #" },
  { key: "branch", label: "Branch" },
  { key: "purpose", label: "Purpose" },
  { key: "details", label: "Details" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "cashIn", label: "Cash In", align: "right" as const },
  { key: "cashOut", label: "Cash Out", align: "right" as const },
  { key: "returnVal", label: "Return", align: "right" as const },
  { key: "unit", label: "Unit" },
  { key: "unitCode", label: "Unit Code" },
  { key: "pawn", label: "Pawn", align: "right" as const },
  { key: "storage", label: "Storage", align: "right" as const },
];

function isHighlightedPawn(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

function isHighlightedStorage(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

const purposeVariant: Record<PurposeType, "blue" | "green" | "orange" | "purple" | "black"> = {
  Start: "black",
  "Buy Back": "blue",
  Renew: "green",
  "Sold Item": "orange",
  Pawn: "purple",
  "Fund Transfer": "blue",
  "Cash Transfer": "blue",
};

interface TransactionTableProps {
  data?: TransactionRow[];
  onViewDetails?: (transaction: TransactionRow) => void;
}



export function TransactionTable({ data = [], onViewDetails }: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between bg-surface px-4 py-3">
        <h3 className="text-base font-bold text-text-primary">Daily Transactions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="bg-emerald-900 text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide ${
                    col.align === "right" ? "text-right" : "text-left"
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
                <td colSpan={columns.length} className="py-4 text-center text-base text-text-tertiary">
                  No transactions found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const isStartRow = row.purpose === "Start";
                const rowKey = `${row.transactionNo || "transaction"}-${idx}`;

              return (
                <tr
                  key={rowKey}
                  onClick={() => onViewDetails?.(row)}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer border-t border-border-subtle transition-colors bg-surface-secondary hover:bg-emerald-surface/60 ${
                    isStartRow
                      ? "border-l-4 border-l-emerald-700 !bg-emerald-surface"
                      : ""
                  }`}
                >
                  {/* Transaction # */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text-secondary">
                    {row.transactionNo}
                  </td>

                  {/* Branch */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                    {row.branch || "—"}
                  </td>

                  {/* Purpose */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge
                      label={row.purpose}
                      variant={purposeVariant[row.purpose]}
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                    {row.details || "—"}
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                    {row.date}
                  </td>

                  {/* Time */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                    {formatTimeWithAmPm(row.time)}
                  </td>

                  {/* Cash In */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-text-secondary">
                    {row.cashIn}
                  </td>

                  {/* Cash Out */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-text-secondary">
                    {row.cashOut}
                  </td>

                  {/* Return */}
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-secondary">
                    {row.returnVal}
                  </td>

                  {/* Unit */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                    {row.unit}
                  </td>

                  {/* Unit Code */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-tertiary">
                    {row.unitCode}
                  </td>

                  {/* Pawn */}
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {isHighlightedPawn(row.pawn) ? (
                      <span className="font-bold text-purple-700">{row.pawn}</span>
                    ) : (
                      <span className="text-text-secondary">{row.pawn}</span>
                    )}
                  </td>

                  {/* Storage */}
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {isHighlightedStorage(row.storage) ? (
                      <span className="font-bold text-purple-700">{row.storage}</span>
                    ) : (
                      <span className="text-text-secondary">{row.storage}</span>
                    )}
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
