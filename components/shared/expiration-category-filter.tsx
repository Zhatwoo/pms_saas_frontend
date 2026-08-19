"use client";

export type ExpirationCategoryKey = "overdue" | "3days" | "7days" | "30days";

export interface ExpirationCategoryCounts {
  overdue: number;
  threeDays: number;
  sevenDays: number;
  thirtyDays: number;
}

interface ExpirationCategoryFilterProps {
  value: ExpirationCategoryKey | string;
  onChange: (value: ExpirationCategoryKey) => void;
  counts: ExpirationCategoryCounts;
}

const CATEGORY_OPTIONS: Array<{
  value: ExpirationCategoryKey;
  label: string;
  countKey: keyof ExpirationCategoryCounts;
}> = [
  { value: "overdue", label: "Overdue", countKey: "overdue" },
  { value: "3days", label: "3 Days", countKey: "threeDays" },
  { value: "7days", label: "7 Days", countKey: "sevenDays" },
  { value: "30days", label: "30 Days", countKey: "thirtyDays" },
];

export function ExpirationCategoryFilter({
  value,
  onChange,
  counts,
}: ExpirationCategoryFilterProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:min-w-[220px]">
        <label
          htmlFor="expiration-category-filter"
          className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary"
        >
          Categories
        </label>
        <select
          id="expiration-category-filter"
          value={value}
          onChange={(e) => onChange(e.target.value as ExpirationCategoryKey)}
          className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({counts[option.countKey]})
            </option>
          ))}
        </select>
      </div>
  );
}
