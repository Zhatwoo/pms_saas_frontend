import { ActionButton } from "@/components/shared/action-button";
import {
  PURPOSE_OPTIONS,
  type TransactionPurposeFilter,
} from "./types";

export type ViewMode = "list" | "calendar";

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

const plusIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface TransactionActionsProps {
  search: string;
  purposeFilter: TransactionPurposeFilter;
  selectedBranchLabel: string;
  onSearchChange: (value: string) => void;
  onPurposeFilterChange: (value: TransactionPurposeFilter) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  dateFilter?: string;
  onDateFilterChange?: (value: string) => void;
  onAddTransaction?: () => void;
  onExportCSV?: () => void;
  onPrintReport?: () => void;
}

export function TransactionActions({
  search,
  purposeFilter,
  onSearchChange,
  onPurposeFilterChange,
  viewMode = "list",
  onViewModeChange,
  dateFilter = "",
  onDateFilterChange,
  onAddTransaction,
  onExportCSV,
  onPrintReport,
}: TransactionActionsProps) {
  return (
    <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        {/* Search — full width on mobile */}
        <div className="w-full space-y-1.5 sm:w-48">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
            Search
          </label>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Txn no, customer, item…"
            className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
          />
        </div>

        {/* Transaction Type */}
        <div className="w-full space-y-1.5 sm:w-44">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
            Transaction Type
          </label>
          <select
            value={purposeFilter}
            onChange={(event) =>
              onPurposeFilterChange(event.target.value as TransactionPurposeFilter)
            }
            className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
          >
            <option value="All">All Purposes</option>
            {PURPOSE_OPTIONS.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </div>

        {/* Date — list mode only */}
        {viewMode === "list" && (
          <div className="w-full space-y-1.5 sm:w-40">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Date
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => onDateFilterChange?.(e.target.value)}
                className="w-full h-[42px] rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 pr-7"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => onDateFilterChange?.("")}
                  className="absolute right-2 text-text-muted hover:text-text-primary"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ActionButton
            variant="outline"
            onClick={onExportCSV}
            className="h-11 border-emerald-600 bg-emerald-50 text-emerald-700"
          >
            <span className="flex items-center gap-1.5">
              {downloadIcon}
              Export CSV
            </span>
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={onPrintReport}
            className="h-11 border-emerald-700 dark:border-emerald-400/80 bg-emerald-700 text-amber-400"
          >
            <span className="flex items-center gap-1.5">
              {printerIcon}
              Print Report
            </span>
          </ActionButton>
          <div className="flex rounded-md border border-border-main overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange?.("list")}
              className={`h-11 px-4 py-2 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.("calendar")}
              className={`h-11 px-4 py-2 text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
            >
              Calendar
            </button>
          </div>
          {onAddTransaction ? (
            <ActionButton variant="primary" onClick={onAddTransaction} className="h-11">
              <span className="flex items-center gap-1.5">
                {plusIcon}
                Add Transaction
              </span>
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
