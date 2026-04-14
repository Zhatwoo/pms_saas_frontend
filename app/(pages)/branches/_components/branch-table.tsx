"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import type { Column } from "@/components/shared/data-table";

const statusVariantMap: Record<string, "green" | "black" | "red" | "orange"> = {
  Active: "green",
  Inactive: "black",
  Terminated: "red",
  Process: "orange",
};

const columns: Column[] = [
  { key: "branchId", label: "Branch ID" },
  { key: "name", label: "Branch Name" },
  { key: "location", label: "Location" },
  { key: "createdAt", label: "Date Created" },
  { key: "status", label: "Status" },
  { key: "inventorySummary", label: "Inventory", align: "center" },
  { key: "actions", label: "Actions", align: "center" },
];

export interface BranchRow {
  id?: string;
  branchId: string;
  name: string;
  location: string;
  createdAt: string;
  status: string;
  pawnedItems: number;
  forSaleItems: number;
  totalValue: string;
}

interface BranchTableProps {
  branches: BranchRow[];
  searchQuery: string;
  statusFilter: string;
  onBranchClick: (branch: BranchRow) => void;
  onEditBranch: (branch: BranchRow) => void;
  onTerminateBranch: (branch: BranchRow) => void;
}

function InlineActions({
  onView,
  onEdit,
  onTerminate,
}: {
  onView: () => void;
  onEdit: () => void;
  onTerminate: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      {/* View */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50"
        title="View"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      {/* Edit */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-50"
        title="Edit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      {/* Terminate */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTerminate();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
        title="Terminate"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </button>
    </div>
  );
}

function InventorySummaryBadge({
  pawnedItems,
  forSaleItems,
  totalValue,
}: {
  pawnedItems: number;
  forSaleItems: number;
  totalValue: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs font-semibold text-text-primary">
        {pawnedItems + forSaleItems} items
      </span>
      <span className="text-[10px] text-text-muted">{totalValue}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-main bg-surface py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-text-primary">
        No branches found
      </p>
      <p className="mt-1 text-xs text-text-muted">
        Try adjusting your search or filters, or create a new branch.
      </p>
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

export function BranchTable({
  branches,
  searchQuery,
  statusFilter,
  onBranchClick,
  onEditBranch,
  onTerminateBranch,
}: BranchTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter branches
  const filtered = branches.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (filtered.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={paginated}
        onRowClick={(row) => onBranchClick(row as unknown as BranchRow)}
        renderCell={(key, value, row) => {
          if (key === "name") {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBranchClick(row as unknown as BranchRow);
                }}
                className="text-left text-xs font-semibold text-emerald-text transition-colors hover:opacity-80 hover:underline"
              >
                {value}
              </button>
            );
          }
          if (key === "createdAt") {
            const raw = row.createdAt as string;
            if (!raw) return <span className="text-text-muted">—</span>;
            const date = new Date(raw);
            return (
              <span className="text-xs text-text-secondary">
                {date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            );
          }
          if (key === "status") {
            return (
              <StatusBadge
                label={value}
                variant={statusVariantMap[value] || "black"}
              />
            );
          }
          if (key === "inventorySummary") {
            return (
              <InventorySummaryBadge
                pawnedItems={row.pawnedItems}
                forSaleItems={row.forSaleItems}
                totalValue={row.totalValue}
              />
            );
          }
          if (key === "actions") {
            return (
              <InlineActions
                onView={() => onBranchClick(row as unknown as BranchRow)}
                onEdit={() => onEditBranch(row as unknown as BranchRow)}
                onTerminate={() => onTerminateBranch(row as unknown as BranchRow)}
              />
            );
          }
          return value;
        }}
      />

      {/* Pagination */}
      <div className="rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
