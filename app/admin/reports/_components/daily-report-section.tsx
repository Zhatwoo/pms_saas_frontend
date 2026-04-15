function formatPeso(amount: number): string {
  return `\u20B1 ${amount.toLocaleString("en-PH")}`;
}

const downloadIcon = (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function DailyReportSection() {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-border-main px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Daily Sales Report (DSR) &mdash; April 1, 2026
        </h3>
        <p className="mt-1 text-[11px] text-zinc-400">
          Generated: 11:59 PM &middot; Period: 12:00 AM &ndash; 11:59 PM
          &middot; Currency: PHP
        </p>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-2 gap-px bg-border-subtle lg:grid-cols-4">
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Opening Balance
          </p>
          <p className="mt-1.5 text-xl font-bold text-text-primary">
            {formatPeso(8420000)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Total Sales
          </p>
          <p className="mt-1.5 text-xl font-bold text-emerald-700">
            {formatPeso(1284500)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Total Expenses
          </p>
          <p className="mt-1.5 text-xl font-bold text-red-500">
            {formatPeso(342180)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            Net Total
          </p>
          <p className="mt-1.5 text-xl font-bold text-text-primary">
            {formatPeso(942320)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-start border-t border-border-main px-5 py-3">
        <p className="text-[11px] text-text-muted">
          This report is auto-generated.
        </p>
      </div>
    </div>
  );
}
