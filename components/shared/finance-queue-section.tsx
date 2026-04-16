"use client";

import type { ReactNode } from "react";

type Accent = "blue" | "orange";

interface FinanceQueueSectionProps {
  accent: Accent;
  title: string;
  subtitle: string;
  count: number;
  expanded?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}

const styles: Record<
  Accent,
  {
    wrapper: string;
    headerIcon: string;
    badge: string;
    bodyBorder: string;
    childBorder: string;
  }
> = {
  blue: {
    wrapper:
      "border-blue-300/40 bg-blue-50/60 ring-blue-500/10 hover:border-blue-300 hover:bg-blue-50/70",
    headerIcon: "bg-blue-100 text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    bodyBorder: "border-blue-200",
    childBorder: "border-blue-200",
  },
  orange: {
    wrapper:
      "border-orange-300/40 bg-orange-50/60 ring-orange-500/10 hover:border-orange-300 hover:bg-orange-50/70",
    headerIcon: "bg-orange-100 text-orange-700",
    badge: "bg-orange-100 text-orange-700",
    bodyBorder: "border-orange-200",
    childBorder: "border-orange-200",
  },
};

export function FinanceQueueSection({
  accent,
  title,
  subtitle,
  count,
  expanded = true,
  onToggle,
  children,
}: FinanceQueueSectionProps) {
  const palette = styles[accent];
  const sectionClass = expanded
    ? `${palette.wrapper} ring-4`
    : "border-border-subtle bg-surface";

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 ${sectionClass}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.headerIcon} shadow-inner`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white shadow-sm ${palette.badge}`}>
              {count}
            </span>
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">{subtitle}</p>
          </div>
        </div>

        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${palette.badge} transition-transform duration-300`} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`border-t ${palette.bodyBorder}/20 px-5 pb-5 pt-3`}>
            <div className="space-y-3">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}