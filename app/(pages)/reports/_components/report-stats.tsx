import { StatCard } from "@/components/shared/stat-card";

export function ReportStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="TOTAL SALES TODAY"
        value={"\u20B1 1,284,500"}
        change={"\u2191 8.4%"}
        changeType="positive"
        borderColor="border-emerald-700"
      />
      <StatCard
        label="TOTAL TRANSACTIONS"
        value="847"
        change={"\u2191 5.1%"}
        changeType="positive"
        borderColor="border-zinc-300"
      />
      <StatCard
        label="AVG PER BRANCH"
        value={"\u20B1 183,500"}
        change={"\u2193 1.2%"}
        changeType="negative"
        borderColor="border-zinc-300"
      />
      <StatCard
        label="ACTIVE BRANCHES"
        value="7 / 7"
        change={"All Online \u2713"}
        changeType="positive"
        borderColor="border-zinc-300"
      />
    </div>
  );
}
