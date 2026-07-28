import { DataTable } from "@/components/shared/data-table";
import type { Column } from "@/components/shared/data-table";
import { useEffect, useState, type ReactNode } from "react";

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
  let bgColor = "bg-brand-green/10 text-brand-green";
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

const sendIcon = (
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
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const expireIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

interface ExpirationTableProps {
  data?: ExpirationItemRow[];
  isLoading?: boolean;
  onSendEmail?: (id: string) => void;
  sendingItemId?: string | null;
  onRenew?: (id: string, ticketNo: string) => void;
  renewingItemId?: string | null;
  onExpire?: (id: string) => void;
  expiringItemId?: string | null;
  canRenew?: boolean;
  canExpire?: boolean;
  highlightTicketNo?: string | null;
}

export function ExpirationTable({
  data = [],
  isLoading,
  onSendEmail,
  sendingItemId,
  onRenew,
  renewingItemId,
  onExpire,
  expiringItemId,
  canRenew = true,
  canExpire = false,
  highlightTicketNo,
}: ExpirationTableProps) {
  const [pulsing, setPulsing] = useState(true);

  useEffect(() => {
    if (highlightTicketNo) {
      const timer = setTimeout(() => {
        setPulsing(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightTicketNo]);

  return (
    <DataTable
      isLoading={isLoading}
      loadingMessage="Loading expiration data..."
      emptyMessage="No items found in this category"
      columns={columns}
      data={data}
      rowClassName={(row) => 
        highlightTicketNo === row.ticketNo && pulsing 
          ? "bg-amber-100/50 hover:bg-amber-100 transition-all duration-1000 ring-2 ring-amber-400 z-10 relative shadow-sm" 
          : ""
      }
      renderCell={(key, rawValue, row) => {
        if (key === "principal" || key === "totalDue") {
          return (
            <span className="font-semibold text-brand-green">
              {formatPeso(rawValue as number)}
            </span>
          );
        }
        if (key === "maturityDate") {
          return <span>{formatDate(rawValue as string)}</span>;
        }
        if (key === "daysRemaining") {
          return <DaysRemainingBadge days={rawValue as number} />;
        }
        if (key === "actions") {
          const isOverdue = row.daysRemaining <= 0;
          return (
            <div className="flex items-center justify-center gap-2">
              {!isOverdue && canRenew ? (
                <button
                  type="button"
                  onClick={() => onRenew?.(row.id, row.ticketNo)}
                  disabled={renewingItemId === row.id}
                  className="rounded-md bg-brand-green px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renewingItemId === row.id ? "Renewing..." : "Renew"}
                </button>
              ) : null}
              {isOverdue && canExpire && (
                <button
                  type="button"
                  title="Mark as Expired"
                  onClick={() => onExpire?.(row.id)}
                  disabled={expiringItemId === row.id}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-600 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-500/20 dark:bg-orange-500/5 dark:text-orange-400 dark:hover:bg-orange-500/10"
                >
                  {expiringItemId === row.id ? (
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : expireIcon}
                </button>
              )}
              <button
                type="button"
                onClick={() => onSendEmail?.(row.id)}
                disabled={sendingItemId === row.id}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                title={`Send email to ${row.customer}`}
              >
                {sendingItemId === row.id ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  sendIcon
                )}
              </button>
            </div>
          );
        }
        return rawValue as ReactNode;
      }}
    />
  );
}
