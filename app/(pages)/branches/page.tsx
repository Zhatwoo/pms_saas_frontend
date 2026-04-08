"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { BranchStats } from "./_components/branch-stats";
import { BranchFilters } from "./_components/branch-filters";
import { BranchTable } from "./_components/branch-table";
import { BranchModal } from "./_components/branch-modal";
import { BranchDetailDrawer } from "./_components/branch-detail-drawer";
import type { BranchRow } from "./_components/branch-table";

const mockBranches: BranchRow[] = [
  {
    branchId: "001",
    name: "Head Office – Makati",
    location: "Makati City, Metro Manila",
    status: "Active",
    pawnedItems: 142,
    forSaleItems: 58,
    totalValue: "₱2,450,000",
  },
  {
    branchId: "002",
    name: "BGC Branch",
    location: "Bonifacio Global City, Taguig",
    status: "Active",
    pawnedItems: 98,
    forSaleItems: 34,
    totalValue: "₱1,780,000",
  },
  {
    branchId: "003",
    name: "Cebu City Branch",
    location: "Cebu City, Cebu",
    status: "Active",
    pawnedItems: 76,
    forSaleItems: 22,
    totalValue: "₱1,120,000",
  },
  {
    branchId: "004",
    name: "Davao Branch",
    location: "Davao City, Davao del Sur",
    status: "Process",
    pawnedItems: 54,
    forSaleItems: 18,
    totalValue: "₱890,000",
  },
  {
    branchId: "005",
    name: "Quezon City Branch",
    location: "Quezon City, Metro Manila",
    status: "Active",
    pawnedItems: 110,
    forSaleItems: 42,
    totalValue: "₱1,950,000",
  },
  {
    branchId: "006",
    name: "Iloilo Branch",
    location: "Iloilo City, Western Visayas",
    status: "Active",
    pawnedItems: 62,
    forSaleItems: 28,
    totalValue: "₱980,000",
  },
  {
    branchId: "007",
    name: "Calamba Branch",
    location: "Calamba City, Laguna",
    status: "Terminated",
    pawnedItems: 0,
    forSaleItems: 0,
    totalValue: "₱0",
  },
];

export default function BranchesPage() {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches, canSwitchBranch } = useBranch();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingBranch, setEditingBranch] = useState<{
    branchId: string;
    name: string;
    location: string;
    status: string;
  } | null>(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBranchRow, setSelectedBranchRow] = useState<BranchRow | null>(
    null,
  );

  // Filter branches by global branch selector
  const branchScopedData = useMemo(() => {
    if (isAllBranches || canSwitchBranch === false) {
      // Super admin viewing "All" → show everything
      // Non-superadmins: context returns only their branch, but on this
      // management page they see all if role allows
      if (canSwitchBranch && isAllBranches) return mockBranches;
      if (!canSwitchBranch) {
        // Non-superadmins see only their own branch
        const own = mockBranches.filter(
          (b) => b.branchId === user?.branchId,
        );
        return own.length > 0 ? own : mockBranches;
      }
      return mockBranches;
    }
    // Super admin selected a specific branch
    return mockBranches.filter(
      (b) => b.branchId === selectedBranch.id,
    );
  }, [selectedBranch, isAllBranches, canSwitchBranch, user?.branchId]);

  // Stats — computed from scoped data
  const activeBranches = branchScopedData.filter(
    (b) => b.status === "Active",
  ).length;
  const maintenanceBranches = branchScopedData.filter(
    (b) => b.status === "Process",
  ).length;

  const totalValue = branchScopedData.reduce((acc, b) => {
    const num = Number(b.totalValue.replace(/[₱,]/g, "")) || 0;
    return acc + num;
  }, 0);
  const formattedTotal = `₱${totalValue.toLocaleString()}`;

  // Viewing context label
  const viewingLabel = isAllBranches
    ? "All Branches"
    : selectedBranch.name;

  function handleBranchClick(branch: BranchRow) {
    setSelectedBranchRow(branch);
    setDrawerOpen(true);
  }

  function handleEditBranch(branch: BranchRow) {
    setEditingBranch({
      branchId: branch.branchId,
      name: branch.name,
      location: branch.location,
      status: branch.status,
    });
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleCreateBranch() {
    setEditingBranch(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function handleModalSubmit(data: {
    branchId: string;
    name: string;
    location: string;
    status: string;
  }) {
    // TODO: Integrate with API
    console.log(`${modalMode} branch:`, data);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-400"></p>
          <p className="mt-1 text-sm text-text-tertiary">
            Create, edit, and manage all pawnshop branches.
          </p>
        </div>
        <button
          onClick={handleCreateBranch}
          className="flex items-center gap-2 rounded-lg border border-emerald-700 bg-pawn-sidebar px-4 py-2 text-xs font-bold text-pawn-gold transition-opacity hover:opacity-90"
        >
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
          Create Branch
        </button>
      </div>

      {/* Branch Context Indicator */}
      <div className="flex items-center gap-2 rounded-lg border border-emerald-border bg-emerald-surface px-4 py-2.5 transition-colors duration-300">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-600"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-xs text-emerald-text">
          Viewing:{" "}
          <span className="font-bold">{viewingLabel}</span>
          {!isAllBranches && canSwitchBranch && (
            <span className="ml-2 text-emerald-500">
              — Filtered from header selector
            </span>
          )}
        </span>
      </div>

      {/* Stats */}
      <BranchStats
        totalBranches={branchScopedData.length}
        activeBranches={activeBranches}
        totalInventoryValue={formattedTotal}
        maintenanceBranches={maintenanceBranches}
      />

      {/* Filters */}
      <BranchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Table */}
      <BranchTable
        branches={branchScopedData}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onBranchClick={handleBranchClick}
        onEditBranch={handleEditBranch}
      />

      {/* Create/Edit Modal */}
      <BranchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingBranch}
        mode={modalMode}
        existingCount={mockBranches.length}
      />

      {/* Detail Drawer */}
      <BranchDetailDrawer
        branch={selectedBranchRow}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

