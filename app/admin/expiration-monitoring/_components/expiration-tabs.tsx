"use client";

interface ExpirationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: {
    overdue: number;
    threeDays: number;
    sevenDays: number;
    thirtyDays: number;
  };
}

export function ExpirationTabs({ activeTab, onTabChange, counts }: ExpirationTabsProps) {
  const tabs = [
    { key: "overdue", label: "Overdue", count: counts?.overdue ?? 0 },
    { key: "3days", label: "3 Days", count: counts?.threeDays ?? 0 },
    { key: "7days", label: "7 Days", count: counts?.sevenDays ?? 0 },
    { key: "30days", label: "30 Days", count: counts?.thirtyDays ?? 0 },
  ];

  return (
    <div className="inline-flex gap-1 rounded-lg bg-zinc-100 dark:bg-surface-secondary p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab.key === activeTab
              ? "bg-pawn-gold text-white shadow-sm"
              : "text-zinc-600 dark:text-text-secondary hover:bg-zinc-200 dark:hover:bg-surface-hover"
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
