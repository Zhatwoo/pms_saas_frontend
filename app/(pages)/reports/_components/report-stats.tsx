import { StatCard } from "@/components/shared/stat-card";

function formatPeso(amount: number): string {
  return `\u20B1 ${amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface ReportStatsProps {
  data?: {
    totalSalesToday: number;
    totalTransactions: number;
    avgPerBranch: number;
    activeBranches: number;
    totalBranches: number;
  };
}

export function ReportStats({ data }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="TOTAL SALES TODAY"
        value={data ? formatPeso(data.totalSalesToday) : "₱ 0"}
        borderColor="border-emerald-700"
      />
      <StatCard
        label="TOTAL TRANSACTIONS"
        value={data ? String(data.totalTransactions) : "0"}
        borderColor="border-zinc-300"
      />
      <StatCard
        label="AVG PER BRANCH"
        value={data ? formatPeso(data.avgPerBranch) : "₱ 0"}
        borderColor="border-zinc-300"
      />
      <StatCard
        label="ACTIVE BRANCHES"
        value={data ? `${data.activeBranches} / ${data.totalBranches}` : "0 / 0"}
        change={data && data.activeBranches === data.totalBranches ? "All Online \u2713" : undefined}
        changeType="positive"
        borderColor="border-zinc-300"
      />
    </div>
  );
}
