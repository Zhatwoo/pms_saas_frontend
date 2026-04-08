"use client";

interface PeriodTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PeriodTabs({ tabs, activeTab, onTabChange }: PeriodTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-border-main bg-surface">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-5 py-2 text-sm font-medium transition-colors ${
            tab === activeTab
              ? "bg-pawn-sidebar text-white"
              : "text-text-secondary hover:bg-surface-hover"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
