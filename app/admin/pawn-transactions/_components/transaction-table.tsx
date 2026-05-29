import { StatusBadge } from "@/components/shared/status-badge";
import { useAuth } from "@/contexts/auth-context";
import { formatTimeWithAmPm } from "@/lib/time";
import { formatPeso } from "@/lib/currency";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Reserve / Layaway" | "Pawn";

interface TransactionRow {
  id: string;
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
  qrCode?: string;
  qr_code?: string;
  idPhoto?: string;
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
  { key: "qrCode", label: "QR Code", align: "center" as const },
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
  "Reserve / Layaway": "orange",
  Pawn: "purple",
};

interface TransactionTableProps {
  data?: TransactionRow[];
}



export function TransactionTable({ data = [] }: TransactionTableProps) {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user?.role === "admin" || user?.role === "super_admin";
  
  const visibleColumns = isAdminOrSuperAdmin 
    ? columns 
    : columns.filter(col => col.key !== "qrCode");

  return (
    <div className="overflow-hidden rounded-2xl border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between bg-surface px-5 py-4">
        <h3 className="text-sm font-bold text-text-primary">Daily Transactions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-900 text-amber-400">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wide ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
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
                <td colSpan={visibleColumns.length} className="py-5 text-center text-sm text-text-tertiary">
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
                  {visibleColumns.map((col) => {
                    if (col.key === "transactionNo") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-xs font-medium text-text-secondary">{row.transactionNo}</td>;
                    if (col.key === "purpose") return <td key={col.key} className="whitespace-nowrap px-4 py-3"><StatusBadge label={row.purpose} variant={purposeVariant[row.purpose]} /></td>;
                    if (col.key === "date") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">{row.date}</td>;
                    if (col.key === "time") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">{formatTimeWithAmPm(row.time)}</td>;
                    if (col.key === "cashIn") return (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-xs text-text-secondary">
                        <input 
                          type="text" 
                          defaultValue={row.cashIn}
                          placeholder="0"
                          className="w-16 ml-auto block text-right border-b border-border-main outline-none focus:border-emerald-500 bg-transparent text-xs py-0.5"
                        />
                      </td>
                    );
                    if (col.key === "cashOut") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-xs text-text-secondary">{row.cashOut}</td>;
                    if (col.key === "returnVal") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-xs text-text-secondary">{row.returnVal}</td>;
                    if (col.key === "unit") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">{row.unit}</td>;
                    if (col.key === "unitCode") return <td key={col.key} className="whitespace-nowrap px-4 py-3 text-xs text-text-tertiary">{row.unitCode}</td>;
                    if (col.key === "pawn") return (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-xs">
                        {isHighlightedPawn(row.pawn) ? <span className="font-bold text-purple-700">{row.pawn}</span> : <span className="text-text-secondary">{row.pawn}</span>}
                      </td>
                    );
                    if (col.key === "storage") return (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-right text-xs">
                        {isHighlightedStorage(row.storage) ? <span className="font-bold text-purple-700">{row.storage}</span> : <span className="text-text-secondary">{row.storage}</span>}
                      </td>
                    );
                    if (col.key === "qrCode") return (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-center">
                        {(row.qrCode || row.qr_code) ? (
                          <div className="flex justify-center">
                            <img src={row.qrCode || row.qr_code} alt={`${row.unit || row.transactionNo} QR`} className="h-8 w-8 rounded border border-border-main bg-white p-0.5 object-contain" />
                          </div>
                        ) : <span className="text-text-muted">-</span>}
                      </td>
                    );
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
