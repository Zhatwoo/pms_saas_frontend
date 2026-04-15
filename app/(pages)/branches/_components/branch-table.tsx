"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";

const statusVariantMap: Record<string, "green" | "black" | "red" | "orange"> = {
  Active: "green",
  Inactive: "black",
  Terminated: "red",
  Process: "orange",
};

export interface BranchRow {
  id?: string;
  branchId: string;
  name: string;
  location: string;
  createdAt?: string;
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

function ActionsButtons({
  branchId,
  onView,
  onEdit,
  onTerminate,
}: {
  branchId: string;
  onView: () => void;
  onEdit: () => void;
  onTerminate: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => {
          console.log("[ActionsButtons] View clicked");
          onView();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-hover hover:text-emerald-600"
        title={`View details for ${branchId}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <button
        onClick={() => {
          console.log("[ActionsButtons] Edit clicked");
          onEdit();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-hover hover:text-blue-600"
        title={`Edit ${branchId}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        onClick={() => {
          console.log("[ActionsButtons] Terminate clicked");
          onTerminate();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600"
        title={`Terminate ${branchId}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 4 21 4 23 6 23 20a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <line x1="5" y1="4" x2="5" y2="2" />
          <line x1="19" y1="4" x2="19" y2="2" />
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
      <span className="text-sm font-semibold text-text-primary">
        {pawnedItems + forSaleItems} items
      </span>
      <span className="text-xs text-text-muted">{totalValue}</span>
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
      <p className="mt-4 text-base font-semibold text-text-primary">
        No branches found
      </p>
      <p className="mt-1 text-sm text-text-muted">
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
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-base">
            <thead>
              <tr className="bg-emerald-900 text-amber-400">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Branch ID
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Branch Name
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Location
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                  Inventory
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((branch, index) => (
                <tr
                  key={`${branch.id}-${branch.branchId}`}
                  onClick={() => onBranchClick(branch)}
                  className="group cursor-pointer border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-text-primary">
                    {branch.branchId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-sm font-semibold text-emerald-text transition-colors group-hover:opacity-80 group-hover:underline">
                      {branch.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                    {branch.location}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge
                      label={branch.status}
                      variant={statusVariantMap[branch.status] || "black"}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <InventorySummaryBadge
                      pawnedItems={branch.pawnedItems}
                      forSaleItems={branch.forSaleItems}
                      totalValue={branch.totalValue}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <ActionsButtons
                      branchId={branch.branchId}
                      onView={() => onBranchClick(branch)}
                      onEdit={() => onEditBranch(branch)}
                      onTerminate={() => onTerminateBranch(branch)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
