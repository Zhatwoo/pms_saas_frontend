import { StatCard } from "@/components/shared/stat-card";
import { formatPeso } from "@/lib/currency";

const folderIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const checkIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const salesIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

interface OverallSummaryData {
  totalContracts: number | string;
  active: number | string;
  redeemed: number | string;
  redeemedOverdue: number | string;
  totalOverallSales: string;
  branchSales?: number;
  allBranchSales?: number;
}

interface OverallSummaryStatsProps {
  data?: OverallSummaryData;
}

export function OverallSummaryStats({ data }: OverallSummaryStatsProps) {
  const allBranchSales = data?.allBranchSales;
  const branchSales = data?.branchSales;
  const hasBranchComparison =
    branchSales != null && allBranchSales != null && branchSales !== allBranchSales;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Contracts"
        value={data?.totalContracts || 0}
        icon={folderIcon}
      />
      <StatCard
        label="Active"
        value={data?.active || 0}
        icon={<div className="text-emerald-600">{checkIcon}</div>}
      />
      <StatCard
        label="Redeemed"
        value={data?.redeemed || 0}
        icon={<div className="text-emerald-600">{checkIcon}</div>}
      />
      <StatCard
        label="Total Overall Sales"
        value={allBranchSales != null ? formatPeso(allBranchSales) : data?.totalOverallSales || "₱ 0"}
        subtitle={hasBranchComparison ? `Branch total: ${formatPeso(branchSales)}` : undefined}
        icon={<div className="text-emerald-600">{salesIcon}</div>}
        valueClassName="text-amber-400"
      />
    </div>
  );
}
