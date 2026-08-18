import { StatCard } from "@/components/shared/stat-card";

const warningIcon = (
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
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const boxIcon = (
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
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export type ExpirationFilterKey = "overdue" | "3days" | "7days" | "30days";

interface ExpirationStatsData {
  overdue: number;
  threeDays: number;
  sevenDays: number;
  thirtyDays: number;
}

interface ExpirationStatsProps {
  data?: ExpirationStatsData;
  isLoading?: boolean;
  activeTab?: ExpirationFilterKey;
  onTabChange?: (tab: ExpirationFilterKey) => void;
}

const CATEGORIES: Array<{
  key: ExpirationFilterKey;
  label: string;
  subtitle: string;
  borderColor: string;
  icon: typeof warningIcon;
  countKey: keyof ExpirationStatsData;
}> = [
  {
    key: "overdue",
    label: "Overdue",
    subtitle: "Past maturity date",
    borderColor: "border-red-500",
    icon: warningIcon,
    countKey: "overdue",
  },
  {
    key: "3days",
    label: "3 Days",
    subtitle: "Expiring within 3 Days",
    borderColor: "border-orange-500",
    icon: boxIcon,
    countKey: "threeDays",
  },
  {
    key: "7days",
    label: "7 Days",
    subtitle: "Expiring within 7 Days",
    borderColor: "border-yellow-500",
    icon: boxIcon,
    countKey: "sevenDays",
  },
  {
    key: "30days",
    label: "30 Days",
    subtitle: "Expiring within 30 Days",
    borderColor: "border-brand-green",
    icon: boxIcon,
    countKey: "thirtyDays",
  },
];

export function ExpirationStats({
  data,
  isLoading,
  activeTab,
  onTabChange,
}: ExpirationStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((category) => (
        <StatCard
          key={category.key}
          label={category.label}
          value={isLoading ? "..." : (data?.[category.countKey] ?? 0)}
          subtitle={category.subtitle}
          icon={category.icon}
          borderColor={category.borderColor}
          selected={activeTab === category.key}
          onClick={onTabChange ? () => onTabChange(category.key) : undefined}
        />
      ))}
    </div>
  );
}
