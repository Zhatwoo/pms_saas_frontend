"use client";

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  branchFilter: string;
  onBranchFilterChange: (b: string) => void;
  dateFrom: string;
  onDateFromChange: (d: string) => void;
  dateTo: string;
  onDateToChange: (d: string) => void;
  branches: { branchId: string; name: string }[];
  onClearFilters: () => void;
}

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  branchFilter,
  onBranchFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  branches,
  onClearFilters,
}: TransactionFiltersProps) {
  const hasFilters = searchQuery || branchFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
      {/* Search */}
      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
          Search
        </label>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-input-border bg-input-bg py-2 pl-8 pr-3 text-xs text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Branch */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
          Branch
        </label>
        <select
          value={branchFilter}
          onChange={(e) => onBranchFilterChange(e.target.value)}
          className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-emerald-400"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.branchId} value={b.branchId}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date From */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
          From
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-emerald-400"
        />
      </div>

      {/* Date To */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
          To
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-emerald-400"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Clear
        </button>
      )}
    </div>
  );
}
