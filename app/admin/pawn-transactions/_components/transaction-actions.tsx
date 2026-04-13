import type { ComponentProps } from "react";
import { ActionButton } from "@/components/shared/action-button";

type ActionVariant = NonNullable<ComponentProps<typeof ActionButton>["variant"]>;

const downloadIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const printerIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const filters = ["Renew", "Redeem", "New Pawn", "Sales / Transfer", "Buy Back"] as const;
type FilterButton = (typeof filters)[number];
type FilterType = "All" | FilterButton;

interface TransactionActionsProps {
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
  onExportCSV?: () => void;
  onPrintReport?: () => void;
}

const filterVariantMap: Record<FilterButton, ActionVariant> = {
  Renew: "renew",
  Redeem: "redeem",
  "New Pawn": "pawn",
  "Sales / Transfer": "sales",
  "Buy Back": "buyback",
};

export function TransactionActions({ activeFilter = "All", onFilterChange, onExportCSV, onPrintReport }: TransactionActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <ActionButton
            key={f}
            variant={filterVariantMap[f]}
            className={activeFilter === f ? "ring-2 ring-offset-1 ring-emerald-600 opacity-100" : "opacity-70 hover:opacity-100"}
            onClick={() => onFilterChange?.(activeFilter === f ? "All" : f)}
          >
            {f}
          </ActionButton>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ActionButton variant="outline" onClick={onExportCSV}>
          <span className="flex items-center gap-1.5">
            {downloadIcon}
            Export CSV
          </span>
        </ActionButton>
        <ActionButton variant="primary" className="bg-emerald-700 border-pawn-gold text-pawn-gold" onClick={onPrintReport}>
          <span className="flex items-center gap-1.5">
            {printerIcon}
            Print Report
          </span>
        </ActionButton>
      </div>
    </div>
  );
}

