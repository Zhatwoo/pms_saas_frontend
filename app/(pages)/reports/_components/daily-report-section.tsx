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
  fromDate?: string;
  toDate?: string;
  isRange?: boolean;
  openingBalance: number;
  closingBalance?: number | null;
  periodNetChange?: number | null;
  totalSales: number;
  totalCashOut: number;
  netTotal: number;
}

interface DailyReportSectionProps {
  data?: DailyReportData;
  date?: string;
  period?: string;
}

export function DailyReportSection({ data, date, period }: DailyReportSectionProps) {
  const displayDate = date || new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const isRange = data?.isRange ?? false;
  const periodLabel = period?.toLowerCase() ?? "daily";
  const reportTitle = isRange
    ? `${periodLabel.charAt(0).toUpperCase()}${periodLabel.slice(1)} Sales Report`
    : "Daily Sales Report (DSR)";

  const periodTimeLabel = isRange
    ? `Range: ${displayDate}`
    : "Period: 12:00 AM – 11:59 PM";

  const metrics = isRange
    ? [
        {
          label: "Opening Balance (Period Start)",
          value: data?.openingBalance ?? 0,
          tone: "text-text-primary" as const,
        },
        {
          label: "Total Sales",
          value: data?.totalSales ?? 0,
          tone: "text-emerald-700" as const,
        },
        {
          label: "Total Cash Out",
          value: data?.totalCashOut ?? 0,
          tone: "text-red-500" as const,
        },
        {
          label: "Closing Balance (Period End)",
          value: data?.closingBalance ?? 0,
          tone: "text-text-primary" as const,
        },
        {
          label: "Period Net Change",
          value: data?.periodNetChange ?? 0,
          tone: "text-text-primary" as const,
        },
      ]
    : [
        {
          label: "Opening Balance",
          value: data?.openingBalance ?? 0,
          tone: "text-text-primary" as const,
        },
        {
          label: "Total Sales",
          value: data?.totalSales ?? 0,
          tone: "text-emerald-700" as const,
        },
        {
          label: "Total Cash Out",
          value: data?.totalCashOut ?? 0,
          tone: "text-red-500" as const,
        },
        {
          label: "Net Total",
          value: data?.netTotal ?? 0,
          tone: "text-text-primary" as const,
        },
      ];

  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-border-main px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">
          {reportTitle} &mdash; {displayDate}
        </h3>
        <p className="mt-1 text-[11px] text-zinc-400">
          Generated: {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} &middot; {periodTimeLabel}
          &middot; Currency: \u20B1
        </p>
      </div>

      {/* Metrics grid */}
      <div
        className={`grid grid-cols-2 gap-px bg-border-subtle ${
          isRange ? "lg:grid-cols-5" : "lg:grid-cols-4"
        }`}
      >
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              {metric.label}
            </p>
            <p className={`mt-1.5 text-xl font-bold ${metric.tone}`}>
              {formatPeso(metric.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-border-main px-5 py-3">
        <p className="text-[11px] text-text-muted">
          This report is auto-generated and reflected in the system performance export.
        </p>
      </div>
    </div>
  );
}
