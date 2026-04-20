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

interface BranchSale {
  name: string;
  txn: number;
  sales: number;
  share: number;
}

interface BranchSalesTableProps {
  data?: BranchSale[];
  date?: string;
}

export function BranchSalesTable({ data = [], date }: BranchSalesTableProps) {
  const totalSales = data.reduce((sum, b) => sum + b.sales, 0);
  const totalTxn = data.reduce((sum, b) => sum + b.txn, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      {/* Header */}
      <div className="bg-emerald-900 px-4 py-3">
        <h3 className="text-base font-bold text-pawn-gold">
          Per-Branch Sales &mdash; {date || "Today"}
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-border-main bg-surface-secondary">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Branch
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
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-tertiary">
                No branch sales data available
              </td>
            </tr>
          ) : (
            data.map((branch, idx) => (
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
                        className={`h-full rounded-full ${barColors[idx % barColors.length]}`}
                        style={{ width: `${branch.share}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-text-tertiary">
                      {branch.share}%
                    </span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-border-main bg-surface-secondary">
              <td className="px-4 py-3 text-sm font-bold text-text-primary">
                Total
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-text-primary">
                {totalTxn}
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
                {formatPeso(totalSales)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
