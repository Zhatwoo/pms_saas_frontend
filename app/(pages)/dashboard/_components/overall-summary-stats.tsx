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
    <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 10h0.01M18 14h0.01" />
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
  loading?: boolean;
}

export function OverallSummaryStats({ data, loading }: OverallSummaryStatsProps) {
  const allBranchSales = data?.allBranchSales;
  const branchSales = data?.branchSales;
  const hasBranchComparison =
    branchSales != null && allBranchSales != null && branchSales !== allBranchSales;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
        value={formatPeso(allBranchSales ?? data?.totalOverallSales ?? 0)}
        loading={false}
        icon={<div className="text-pawn-gold">{salesIcon}</div>}
        borderColor="border-[#047857]"
        className="!bg-[#064e3b] !border-[#047857]"
        labelClassName="!text-[#a7f3d0]"
        valueClassName="!text-amber-400"
        subtitle={hasBranchComparison ? `Branch total: ${formatPeso(branchSales)}` : undefined}
      />

    </div>
  );
}
