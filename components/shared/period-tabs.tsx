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
          className={`px-6 py-2.5 text-base font-medium transition-colors ${
            tab === activeTab
              ? "bg-emerald-900/60 text-amber-400 shadow-sm"
              : "text-text-secondary hover:bg-surface-hover"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
