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
  profilePhoto?: string;
  idPhoto?: string;
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
  { key: "profilePhoto", label: "Profile" },
  { key: "idPhoto", label: "ID Photo" },
  { key: "actions", label: "Actions", align: "center" as const },
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
  onReprint?: (transactionNo: string) => void;
  onViewDetails?: (transaction: TransactionRow) => void;
}

export function TransactionTable({ data = [], onReprint, onViewDetails }: TransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between bg-white px-4 py-3">
        <h3 className="text-sm font-bold text-zinc-800">Daily Transactions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-900 text-white">
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
                <td colSpan={columns.length} className="py-4 text-center text-sm text-zinc-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const isStartRow = row.purpose === "Start";

              return (
                <tr
                  key={row.transactionNo}
                  onClick={() => onViewDetails?.(row)}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer border-t border-zinc-100 ${
                    isStartRow
                      ? "border-l-4 border-l-emerald-700 bg-emerald-50/60"
                      : idx % 2 === 0
                        ? "bg-white"
                        : "bg-zinc-50"
                  }`}
                >
                  {/* Transaction # */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-zinc-700">
                    {row.transactionNo}
                  </td>

                  {/* Branch */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                    {formatTimeWithAmPm(row.time)}
                  </td>

                  {/* Purpose */}
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusBadge
                      label={row.purpose}
                      variant={purposeVariant[row.purpose]}
                    />
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-700">
                    {row.details || "—"}
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                    {row.date}
                  </td>

                  {/* Time */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                    {formatTimeWithAmPm(row.time)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-text-secondary">
                    {row.cashIn}
                  </td>

                  {/* Cash Out */}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm text-text-secondary">
                    {row.cashOut}
                  </td>

                  {/* Return */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-zinc-700">
                    {row.returnVal}
                  </td>

                  {/* Unit */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-700">
                    {row.unit}
                  </td>

                  {/* Unit Code */}
                  <td className="whitespace-nowrap px-3 py-1.5 text-xs text-zinc-500">
                    {row.unitCode}
                  </td>

                  {/* Pawn */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                    {isHighlightedPawn(row.pawn) ? (
                      <span className="font-bold text-purple-700">{row.pawn}</span>
                    ) : (
                      <span className="text-zinc-700">{row.pawn}</span>
                    )}
                  </td>

                  {/* Storage */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                    {isHighlightedStorage(row.storage) ? (
                      <span className="font-bold text-purple-700">{row.storage}</span>
                    ) : (
                      <span className="text-zinc-700">{row.storage}</span>
                    )}
                  </td>

                  {/* Profile Photo */}
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.profilePhoto ? (
                      <img 
                        src={row.profilePhoto} 
                        alt="Profile" 
                        className="w-10 h-10 object-cover rounded-md border border-zinc-200" 
                      />
                    ) : "-"}
                  </td>

                  {/* ID Photo */}
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.idPhoto ? (
                      <img 
                        src={row.idPhoto} 
                        alt="ID" 
                        className="w-10 h-10 object-cover rounded-md border border-zinc-200" 
                      />
                    ) : "-"}
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {row.purpose === "Pawn" && (
                        <button 
                              onClick={(event) => {
                                event.stopPropagation();
                                onReprint?.(row.transactionNo);
                              }}
                          title="Reprint MOA Slip"
                          className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
                          </svg>
                        </button>
                      )}
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
