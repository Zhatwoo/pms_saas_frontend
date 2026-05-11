function formatPeso(amount: number): string {
  return `\u20B1 ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const downloadIcon = (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

interface DailyReportData {
  date: string;
  openingBalance: number;
  totalSales: number;
  totalCashOut: number;
  netTotal: number;
}

interface DailyReportSectionProps {
  data?: DailyReportData;
  date?: string;
}

export function DailyReportSection({ data, date }: DailyReportSectionProps) {
  const displayDate = date || new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-border-main px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Daily Sales Report (DSR) &mdash; {displayDate}
        </h3>
        <p className="mt-1 text-[11px] text-zinc-400">
          Generated: {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} &middot; Period: 12:00 AM &ndash; 11:59 PM
          &middot; Currency: \u20B1
        </p>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-2 gap-px bg-border-subtle lg:grid-cols-4">
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Opening Balance
          </p>
          <p className="mt-1.5 text-xl font-bold text-text-primary">
            {formatPeso(data?.openingBalance ?? 0)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Total Sales
          </p>
          <p className="mt-1.5 text-xl font-bold text-emerald-700">
            {formatPeso(data?.totalSales ?? 0)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Total Cash Out
          </p>
          <p className="mt-1.5 text-xl font-bold text-red-500">
            {formatPeso(data?.totalCashOut ?? 0)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Net Total
          </p>
          <p className="mt-1.5 text-xl font-bold text-text-primary">
            {formatPeso(data?.netTotal ?? 0)}
          </p>
        </div>
      </div>

      <div className="border-t border-border-main px-5 py-3">
        <p className="text-[11px] text-text-muted">
          This report is auto-generated and reflected in the system performance export.
        </p>
      </div>
    </div>
  );
}
