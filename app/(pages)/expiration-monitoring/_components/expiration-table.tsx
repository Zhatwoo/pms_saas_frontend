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

const expirationData = [
  {
    ticketNo: "PT-2026-001",
    customer: "Juan Dela Cruz",
    item: "21K Gold Necklace",
    principal: 35000,
    totalDue: 36225,
    maturityDate: "Mar 17, 2026",
    daysRemaining: 14,
  },
  {
    ticketNo: "PT-2026-002",
    customer: "Maria Santos",
    item: "Apple MacBook Pro M3",
    principal: 85000,
    totalDue: 87975,
    maturityDate: "Mar 22, 2026",
    daysRemaining: 19,
  },
  {
    ticketNo: "PT-2026-004",
    customer: "Juan Dela Cruz",
    item: "Samsung Galaxy S24 Ultra",
    principal: 48000,
    totalDue: 49680,
    maturityDate: "Apr 01, 2026",
    daysRemaining: 29,
  },
  {
    ticketNo: "PT-2026-005",
    customer: "Maria Santos",
    item: "Rolex Submariner",
    principal: 500000,
    totalDue: 517500,
    maturityDate: "Mar 27, 2026",
    daysRemaining: 24,
  },
];

function formatPeso(amount: number): string {
  return `\u20B1${amount.toLocaleString("en-PH")}`;
}

function DaysRemainingBadge({ days }: { days: number }) {
  let bgColor = "bg-green-100 text-green-700";
  if (days <= 7) {
    bgColor = "bg-red-100 text-red-600";
  } else if (days <= 14) {
    bgColor = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${bgColor}`}
    >
      {days} days
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

export function ExpirationTable() {
  return (
    <DataTable
      columns={columns}
      data={expirationData}
      renderCell={(key, value, row) => {
        if (key === "principal" || key === "totalDue") {
          return (
            <span className="font-semibold text-emerald-700">
              {formatPeso(value)}
            </span>
          );
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
