"use client";

interface PeriodTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PeriodTabs({ tabs, activeTab, onTabChange }: PeriodTabsProps) {
  return (
    <div className="inline-flex min-w-0 max-w-full overflow-x-auto rounded-lg border border-border-main bg-surface">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`h-11 shrink-0 whitespace-nowrap px-4 text-sm font-medium transition-colors sm:px-5 sm:text-base ${
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
