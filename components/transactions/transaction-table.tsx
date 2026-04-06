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

const purposeVariant: Record<PurposeType, "blue" | "green" | "orange" | "purple" | "black"> = {
  Start: "black",
  "Buy Back": "blue",
  Renew: "green",
  "Sold Item": "orange",
  Pawn: "purple",
};

const mockData: TransactionRow[] = [
  {
    transactionNo: "SJS007610",
    purpose: "Start",
    date: "4/1/2026",
    time: "8:21 AM",
    cashIn: "28",
    cashOut: "0",
    returnVal: "0",
    unit: "----",
    unitCode: "---",
    pawn: "0",
    storage: "0",
  },
  {
    transactionNo: "SJS007611",
    purpose: "Buy Back",
    date: "4/1/2026",
    time: "9:39 AM",
    cashIn: "",
    cashOut: "0",
    returnVal: "0",
    unit: "IPHONE...",
    unitCode: "10-JCLB-11529",
    pawn: "0",
    storage: "0",
  },
  {
    transactionNo: "SJS007612",
    purpose: "Buy Back",
    date: "4/1/2026",
    time: "10:27 AM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "iPhone 1...",
    unitCode: "10-JCLB-11492",
    pawn: "",
    storage: "",
  },
  {
    transactionNo: "SJS007613",
    purpose: "Renew",
    date: "4/1/2026",
    time: "10:27 AM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "Suzuki U...",
    unitCode: "10-JCLB-11327",
    pawn: "",
    storage: "400",
  },
  {
    transactionNo: "SJS007614",
    purpose: "Sold Item",
    date: "4/1/2026",
    time: "10:44 AM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "Oppo ren...",
    unitCode: "10-JCLB-10582",
    pawn: "",
    storage: "",
  },
  {
    transactionNo: "SJS007615",
    purpose: "Buy Back",
    date: "4/1/2026",
    time: "10:54 AM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "Infinix ho...",
    unitCode: "10-JCLB-11523",
    pawn: "0",
    storage: "0",
  },
  {
    transactionNo: "SJS007616",
    purpose: "Pawn",
    date: "4/1/2026",
    time: "11:36 AM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "RealMe C...",
    unitCode: "10-JCLB-11539",
    pawn: "1000",
    storage: "",
  },
  {
    transactionNo: "SJS007617",
    purpose: "Pawn",
    date: "4/1/2026",
    time: "12:03 PM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "TECNO S...",
    unitCode: "10-JCLB-11540",
    pawn: "1000",
    storage: "",
  },
  {
    transactionNo: "SJS007618",
    purpose: "Buy Back",
    date: "4/1/2026",
    time: "12:14 PM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "Xiaomi R...",
    unitCode: "10-JCLB-11460",
    pawn: "",
    storage: "",
  },
  {
    transactionNo: "SJS007619",
    purpose: "Buy Back",
    date: "4/1/2026",
    time: "1:10 PM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "ITEL A90...",
    unitCode: "10-JCLB-11407",
    pawn: "",
    storage: "",
  },
  {
    transactionNo: "SJS007620",
    purpose: "Renew",
    date: "4/1/2026",
    time: "1:52 PM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "TECNO S...",
    unitCode: "10-JCLB-11425",
    pawn: "",
    storage: "120",
  },
  {
    transactionNo: "SJS007621",
    purpose: "Pawn",
    date: "4/1/2026",
    time: "2:07 PM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "REDMI N...",
    unitCode: "10-JCLB-11541",
    pawn: "1700",
    storage: "",
  },
  {
    transactionNo: "SJS007622",
    purpose: "Buy Back",
    date: "4/1/2026",
    time: "2:27 PM",
    cashIn: "",
    cashOut: "",
    returnVal: "",
    unit: "Samsung...",
    unitCode: "10-JCLB-11369",
    pawn: "",
    storage: "",
  },
];

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

export function TransactionTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between bg-white px-4 py-3">
        <h3 className="text-sm font-bold text-zinc-800">Daily Transactions</h3>
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
            {mockData.map((row, idx) => {
              const isStartRow = row.purpose === "Start";

              return (
                <tr
                  key={row.transactionNo}
                  className={`border-t border-zinc-100 ${
                    isStartRow
                      ? "border-l-4 border-l-amber-400 bg-amber-50/60"
                      : idx % 2 === 0
                        ? "bg-white"
                        : "bg-zinc-50"
                  }`}
                >
                  {/* Transaction # */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-zinc-700">
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
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                    {row.date}
                  </td>

                  {/* Time */}
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                    {row.time}
                  </td>

                  {/* Cash In */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-zinc-700">
                    {isStartRow && row.cashIn ? (
                      <span className="font-bold text-emerald-700">{row.cashIn}</span>
                    ) : (
                      row.cashIn
                    )}
                  </td>

                  {/* Cash Out */}
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-zinc-700">
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
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
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
                      <span className="font-bold text-emerald-600">{row.storage}</span>
                    ) : (
                      <span className="text-zinc-700">{row.storage}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
