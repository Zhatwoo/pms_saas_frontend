"use client";

interface PeriodTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PeriodTabs({ tabs, activeTab, onTabChange }: PeriodTabsProps) {
  return (
    <div className="flex w-full min-w-0 overflow-x-auto rounded-lg border border-border-main bg-surface scrollbar-hide sm:inline-flex sm:w-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`h-11 shrink-0 whitespace-nowrap px-3 text-[11px] font-medium transition-colors sm:px-5 sm:text-sm md:text-base ${
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
