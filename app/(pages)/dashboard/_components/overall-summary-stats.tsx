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
}

export function OverallSummaryStats({ data }: OverallSummaryStatsProps) {
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
        icon={<div className="text-brand-green">{checkIcon}</div>}
      />
      <StatCard
        label="Redeemed"
        value={data?.redeemed || 0}
        icon={<div className="text-brand-green">{checkIcon}</div>}
      />
      <div className="flex items-center gap-4 rounded-lg bg-brand-green p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-pawn-gold">
          {salesIcon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">
            Total Overall Sales
          </p>
          <p className="mt-0.5 text-2xl sm:text-3xl font-bold text-pawn-gold">
            {allBranchSales != null ? formatPeso(allBranchSales) : data?.totalOverallSales || "₱ 0"}
          </p>
          {hasBranchComparison && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              <span className="text-xs text-white/70">Branch total: {formatPeso(branchSales)}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
