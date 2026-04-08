import { StatCard } from "@/components/shared/stat-card";

const clipboardIcon = (
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
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const clockIcon = (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const cartIcon = (
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
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const dollarIcon = (
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

export interface DashboardStatData {
  activeContracts: number;
  itemsNearExpiration: number;
  itemsReadyForSale: number;
  monthlyRevenue: string;
}

interface DashboardStatsProps {
  data?: DashboardStatData;
}

export function DashboardStats({ data }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active Pawn Contracts"
        value={data?.activeContracts || 0}
        change="0% from last month"
        changeType="positive"
        icon={clipboardIcon}
      />
      <StatCard
        label="Items Near Expiration"
        value={data?.itemsNearExpiration || 0}
        change="0% from last month"
        changeType="positive"
        icon={clockIcon}
      />
      <StatCard
        label="Items Ready for Sale"
        value={data?.itemsReadyForSale || 0}
        subtitle="No change"
        icon={cartIcon}
      />
      <StatCard
        label="Monthly Revenue"
        value={data?.monthlyRevenue || "$ 0"}
        change="0% from last month"
        changeType="positive"
        icon={dollarIcon}
      />
    </div>
  );
}
