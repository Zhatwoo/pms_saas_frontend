import { ActionButton } from "@/components/shared/action-button";
import {
  PURPOSE_OPTIONS,
  type TransactionPurposeFilter,
} from "./types";

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
  dateFilter,
  onDateFilterChange,
  onAddTransaction,
  onExportCSV,
  onPrintReport,
}: TransactionActionsProps) {
  return (
    <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_220px_180px]">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Search Transactions
            </label>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by transaction no, customer, item, or branch"
              className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Purpose Filter
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

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Date Filter
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => onDateFilterChange?.(event.target.value)}
              className="w-full h-[42px] px-3 text-sm text-text-primary rounded-lg border border-border-main bg-surface-secondary outline-none transition-colors focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <ActionButton
            variant="outline"
            onClick={onExportCSV}
            className="border-emerald-600 bg-emerald-50 text-emerald-700"
          >
            <span className="flex items-center gap-1.5">
              {downloadIcon}
              Export CSV
            </span>
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={onPrintReport}
            className="border-emerald-700 dark:border-emerald-400/80 bg-emerald-700 text-amber-400"
          >
            <span className="flex items-center gap-1.5">
              {printerIcon}
              Print Report
            </span>
          </ActionButton>
          {onAddTransaction ? (
            <ActionButton variant="primary" onClick={onAddTransaction}>
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
