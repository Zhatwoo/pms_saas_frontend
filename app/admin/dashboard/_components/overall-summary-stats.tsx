import { StatCard } from "@/components/shared/stat-card";

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

const alertCircleIcon = (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
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
}

interface OverallSummaryStatsProps {
  data?: OverallSummaryData;
}

export function OverallSummaryStats({ data }: OverallSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        icon={checkIcon}
      />
      <StatCard
        label="Redeemed"
        value={data?.redeemedOverdue || 0}
        icon={<div className="text-red-500">{alertCircleIcon}</div>}
      />
      
      {/* Custom Card for Total Overall Sales */}
      <div className="rounded-xl border border-emerald-900 bg-emerald-900 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-yellow-400">
            {salesIcon}
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-100">
              Total Overall Sales
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-yellow-500">
              {data?.totalOverallSales || "₱ 0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
