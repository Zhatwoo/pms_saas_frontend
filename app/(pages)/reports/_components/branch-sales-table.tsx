const branches = [
  { name: "Lorem Ipsum Branch A", txn: 156, sales: 245800, share: 19.1 },
  { name: "Lorem Ipsum Branch B", txn: 143, sales: 218400, share: 17.0 },
  { name: "Lorem Ipsum Branch C", txn: 132, sales: 198600, share: 15.5 },
  { name: "Lorem Ipsum Branch D", txn: 121, sales: 185200, share: 14.4 },
  { name: "Lorem Ipsum Branch E", txn: 108, sales: 168300, share: 13.1 },
  { name: "Lorem Ipsum Branch F", txn: 98, sales: 148200, share: 11.5 },
  { name: "Lorem Ipsum Branch G", txn: 89, sales: 120000, share: 9.4 },
];

const barColors = [
  "bg-emerald-600",
  "bg-emerald-500",
  "bg-pawn-gold",
  "bg-yellow-500",
  "bg-orange-400",
  "bg-orange-300",
  "bg-zinc-400",
];

function formatPeso(amount: number): string {
  return `\u20B1 ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BranchSalesTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      {/* Header */}
      <div className="bg-emerald-900 px-4 py-3">
        <h3 className="text-base font-bold text-pawn-gold">
          Per-Branch Sales &mdash; April 1, 2026
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-border-main bg-surface-secondary">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Date
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-text-tertiary">
              TXN
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Total Sales
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch, idx) => (
            <tr
              key={branch.name}
              className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60"
            >
              <td className="px-4 py-3 text-sm text-text-secondary">
                {branch.name}
              </td>
              <td className="px-4 py-3 text-center text-sm text-text-secondary">
                {branch.txn}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                {formatPeso(branch.sales)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className={`h-full rounded-full ${barColors[idx]}`}
                      style={{ width: `${branch.share}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-text-tertiary">
                    {branch.share}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border-main bg-surface-secondary">
            <td className="px-4 py-3 text-sm font-bold text-text-primary">
              Monthly Total
            </td>
            <td className="px-4 py-3 text-center text-sm font-bold text-text-primary">
              OVERALL TOTAL
            </td>
            <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
              {formatPeso(1284500)}
            </td>
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
