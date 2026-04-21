import { StatusBadge } from "@/components/shared/status-badge";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn";

interface TransactionRow {
  transactionNo: string;
  purpose: PurposeType;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
}

const columns = [
  { key: "transactionNo", label: "Transaction #" },
  { key: "purpose", label: "Purpose" },
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
};

interface TransactionTableProps {
  data?: TransactionRow[];
}



export function TransactionTable({ data = [] }: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between bg-surface px-4 py-3">
        <h3 className="text-sm font-bold text-text-primary">Daily Transactions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-900 text-amber-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${
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
                <td colSpan={11} className="py-4 text-center text-sm text-text-tertiary">
                  No transactions found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const isStartRow = row.purpose === "Start";

              return (
                <tr
                  key={row.transactionNo}
                  className={`border-t border-border-subtle ${
                    isStartRow
                      ? "border-l-4 border-l-emerald-700 bg-emerald-surface"
                      : idx % 2 === 0
                        ? "bg-surface"
                        : "bg-surface-secondary"
                  }`}
                >
                  {/* Transaction # */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-text-secondary">
                    {row.transactionNo}
                  </td>

                  {/* Purpose */}
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusBadge
                      label={row.purpose}
                      variant={purposeVariant[row.purpose]}
                    />
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                    {row.date}
                  </td>

                  {/* Time */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                    {row.time}
                  </td>

                  {/* Cash In */}
                  <td className="whitespace-nowrap px-3 py-1.5 text-right text-xs text-text-secondary">
                    <input 
                      type="text" 
                      defaultValue={row.cashIn}
                      placeholder="0"
                      className="w-16 ml-auto block text-right border-b border-border-main outline-none focus:border-emerald-500 bg-transparent text-xs py-0.5"
                    />
                  </td>

                  {/* Cash Out */}
                  <td className="whitespace-nowrap px-3 py-1.5 text-right text-xs text-text-secondary">
                    {row.cashOut}
                  </td>

                  {/* Return */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-text-secondary">
                    {row.returnVal}
                  </td>

                  {/* Unit */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                    {row.unit}
                  </td>

                  {/* Unit Code */}
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs text-text-tertiary">
                    {row.unitCode}
                  </td>

                  {/* Pawn */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                    {isHighlightedPawn(row.pawn) ? (
                      <span className="font-bold text-purple-700">{row.pawn}</span>
                    ) : (
                      <span className="text-text-secondary">{row.pawn}</span>
                    )}
                  </td>

                  {/* Storage */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
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
