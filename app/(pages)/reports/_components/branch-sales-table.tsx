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
  return `\u20B1 ${amount.toLocaleString("en-PH")}`;
}

export function BranchSalesTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {/* Header */}
      <div className="bg-emerald-900 px-4 py-3">
        <h3 className="text-sm font-bold text-pawn-gold">
          Per-Branch Sales &mdash; April 1, 2026
        </h3>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Date
            </th>
            <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              TXN
            </th>
            <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Total Sales
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch, idx) => (
            <tr
              key={branch.name}
              className={`border-t border-zinc-100 ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50"}`}
            >
              <td className="px-4 py-2 text-xs text-zinc-700">
                {branch.name}
              </td>
              <td className="px-4 py-2 text-center text-xs text-zinc-700">
                {branch.txn}
              </td>
              <td className="px-4 py-2 text-right text-xs font-semibold text-zinc-800">
                {formatPeso(branch.sales)}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${barColors[idx]}`}
                      style={{ width: `${branch.share}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] font-medium text-zinc-500">
                    {branch.share}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300 bg-zinc-50">
            <td className="px-4 py-2.5 text-xs font-bold text-zinc-800">
              Monthly Total
            </td>
            <td className="px-4 py-2.5 text-center text-xs font-bold text-zinc-800">
              OVERALL TOTAL
            </td>
            <td className="px-4 py-2.5 text-right text-xs font-bold text-emerald-700">
              {formatPeso(1284500)}
            </td>
            <td className="px-4 py-2.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
