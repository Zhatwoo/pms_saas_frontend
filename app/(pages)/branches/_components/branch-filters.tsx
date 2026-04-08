"use client";

import { FilterSelect } from "@/components/shared/filter-select";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Process", label: "Process" },
  { value: "Terminated", label: "Terminated" },
];

interface BranchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function BranchFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: BranchFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <FilterSelect
        label="Status"
        options={statusOptions}
        value={statusFilter}
        onChange={onStatusChange}
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-tertiary">Search</label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="14"
            height="14"
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
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 rounded-lg border border-input-border bg-input-bg py-2 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted transition-colors duration-200 focus:border-pawn-sidebar"
          />
        </div>
      </div>
    </div>
  );
}
