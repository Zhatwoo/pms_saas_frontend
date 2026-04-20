import { DataTable } from "@/components/shared/data-table";
import type { Column } from "@/components/shared/data-table";

const columns: Column[] = [
  { key: "ticketNo", label: "Ticket No." },
  { key: "customer", label: "Customer" },
  { key: "item", label: "Item" },
  { key: "principal", label: "Principal", align: "right" },
  { key: "totalDue", label: "Total Due", align: "right" },
  { key: "maturityDate", label: "Maturity Date" },
  { key: "daysRemaining", label: "Days Remaining", align: "center" },
  { key: "actions", label: "Actions", align: "center" },
];

interface ExpirationItemRow {
  id: string;
  ticketNo: string;
  customer: string;
  item: string;
  principal: number;
  totalDue: number;
  maturityDate: string;
  daysRemaining: number;
}

function formatPeso(amount: number): string {
  return `\u20B1${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function DaysRemainingBadge({ days }: { days: number }) {
  let bgColor = "bg-green-100 text-green-700";
  if (days <= 0) {
    bgColor = "bg-red-100 text-red-600";
  } else if (days <= 3) {
    bgColor = "bg-red-100 text-red-600";
  } else if (days <= 7) {
    bgColor = "bg-orange-100 text-orange-600";
  } else if (days <= 14) {
    bgColor = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${bgColor}`}
    >
      {days <= 0 ? "Overdue" : `${days} days`}
    </span>
  );
}

const bellIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

interface ExpirationTableProps {
  data?: ExpirationItemRow[];
  isLoading?: boolean;
}

export function ExpirationTable({ data = [], isLoading }: ExpirationTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border-main bg-surface p-8 text-center">
        <div className="flex items-center justify-center gap-3 text-text-tertiary">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Loading expiration data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border-main bg-surface p-8 text-center">
        <p className="text-sm text-text-tertiary">No items found in this category</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      renderCell={(key, value, row) => {
        if (key === "principal" || key === "totalDue") {
          return (
            <span className="font-semibold text-emerald-700">
              {formatPeso(value)}
            </span>
          );
        }
        if (key === "maturityDate") {
          return <span>{formatDate(value)}</span>;
        }
        if (key === "daysRemaining") {
          return <DaysRemainingBadge days={value} />;
        }
        if (key === "actions") {
          return (
            <div className="flex items-center justify-center gap-2">
              <button className="rounded-md bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90">
                Renew
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                title={`Notify ${row.customer}`}
              >
                {bellIcon}
              </button>
            </div>
          );
        }
        return value;
      }}
    />
  );
}
