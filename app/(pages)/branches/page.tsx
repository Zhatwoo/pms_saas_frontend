"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { formatPeso } from "@/lib/currency";
import { toast } from "sonner";
import { BranchStats } from "./_components/branch-stats";
import { BranchFilters } from "./_components/branch-filters";
import { BranchTable } from "./_components/branch-table";
import { BranchModal } from "./_components/branch-modal";
import { BranchDetailDrawer } from "./_components/branch-detail-drawer";
import { ActionButton } from "@/components/shared/action-button";
import type { BranchRow } from "./_components/branch-table";

interface BranchApiItem {
  id: string;
  branch_code: string;
  name: string;
  location: string;
  contact_number?: string | null;
  status: string;
}

type BranchFormData = {
  id?: string;
  branchId: string;
  name: string;
  location: string;
  contactNumber: string;
  status: string;
};

type OverviewStats = Record<string, { pawnedItems: number; forSaleItems: number; totalValue: number }>;

function toBranchRow(branch: BranchApiItem, stats?: OverviewStats): BranchRow {
  const s = stats?.[branch.id];
  return {
    id: branch.id,
    branchId: branch.branch_code,
    name: branch.name,
    location: branch.location,
    contactNumber: branch.contact_number ?? "",
    status: branch.status,
    pawnedItems: s?.pawnedItems ?? 0,
    forSaleItems: s?.forSaleItems ?? 0,
    totalValue: s ? `₱${s.totalValue.toLocaleString("en-PH", { minimumFractionDigits: 0 })}` : "₱0",
  };
}

function getNextBranchCode(branches: BranchRow[]) {
  const maxCode = branches.reduce((max, branch) => {
    const parsed = Number.parseInt(branch.branchId, 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);

  return String(maxCode + 1).padStart(3, "0");
}

export default function BranchesPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { selectedBranch, isAllBranches, canSwitchBranch, refreshBranches } =
    useBranch();
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingBranch, setEditingBranch] = useState<BranchFormData | null>(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBranchRow, setSelectedBranchRow] = useState<BranchRow | null>(
    null,
  );
  const canCreateBranch = user?.role === "super_admin";

  const loadBranches = useCallback(async () => {
    try {
      const [data, stats] = await Promise.all([
        api.get<BranchApiItem[]>("/branches"),
        api.get<OverviewStats>("/branches/overview-stats").catch(() => ({} as OverviewStats)),
      ]);
      setBranches((data || []).map((b) => toBranchRow(b, stats)));
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load branches";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    const branchId = searchParams.get("branchId");
    if (!branchId || branches.length === 0) return;

    const target = branches.find(
      (branch) => branch.id === branchId || branch.branchId === branchId,
    );
    if (target) {
      setSelectedBranchRow(target);
      setDrawerOpen(true);
    }
  }, [branches, searchParams]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadBranches(), 60_000);
    return () => window.clearInterval(interval);
  }, [loadBranches]);

  // Filter branches by global branch selector
  const branchScopedData = useMemo(() => {
    if (isAllBranches || canSwitchBranch === false) {
      // Super admin viewing "All" → show everything
      // Non-superadmins: context returns only their branch, but on this
      // management page they see all if role allows
      if (canSwitchBranch && isAllBranches) return branches;
      if (!canSwitchBranch) {
        // Non-superadmins see only their own branch
        const own = branches.filter(
          (b) => b.branchId === user?.branchId,
        );
        return own.length > 0 ? own : branches;
      }
      return branches;
    }
    // Super admin selected a specific branch
    return branches.filter(
      (b) => b.branchId === selectedBranch.id,
    );
  }, [branches, selectedBranch, isAllBranches, canSwitchBranch, user?.branchId]);

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
  const formattedTotal = formatPeso(totalValue.toLocaleString());

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
      id: branch.id,
      branchId: branch.branchId,
      name: branch.name,
      location: branch.location,
      contactNumber: branch.contactNumber || "+63",
      status: branch.status,
    });
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleCreateBranch() {
    if (!canCreateBranch) {
      setErrorMessage("Only super admins can create branches.");
      return;
    }
    setEditingBranch(null);
    setModalMode("create");
    setModalOpen(true);
  }

  async function handleTerminateBranch(branch: BranchRow) {
    console.log("[handleTerminateBranch] Terminating branch:", branch);
    
    if (!branch.id) {
      const msg = "Unable to terminate branch: missing branch ID";
      console.error("[handleTerminateBranch]", msg);
      setErrorMessage(msg);
      return;
    }

    try {
      console.log(`[handleTerminateBranch] Sending PATCH to /branches/${branch.id}`);
      const result = await api.fetch<BranchApiItem>(`/branches/${branch.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Terminated",
        }),
      });
      
      console.log("[handleTerminateBranch] API response:", result);

      await loadBranches();
      await refreshBranches();
      toast.success("Branch has been terminated successfully!");
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to terminate branch";
      console.error("[handleTerminateBranch] Error:", error, "Message:", message);
      setErrorMessage(`Terminate failed: ${message}. Check that you have admin/superadmin role.`);
    }
  }

  async function handleModalSubmit(data: BranchFormData) {
    try {
      if (modalMode === "create") {
        await api.post<BranchApiItem>("/branches", {
          branch_code: data.branchId,
          name: data.name,
          location: data.location,
          contact_number: data.contactNumber,
          status: data.status,
        });

        // Force immediate refresh after add.
        await loadBranches();
        await refreshBranches();
        toast.success("Your new branch has been created successfully!");
      } else if (data.id) {
        await api.fetch<BranchApiItem>(`/branches/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            location: data.location,
            contact_number: data.contactNumber,
            status: data.status,
          }),
        });

        await loadBranches();
        await refreshBranches();
        toast.success("Branch details updated successfully!");
      }
      setErrorMessage(null);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to ${modalMode} branch`;
      setErrorMessage(message);
      return false;
    }
  }

  const nextBranchCode = useMemo(() => getNextBranchCode(branches), [branches]);

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
        {canCreateBranch && (
          <ActionButton
            variant="warning"
            onClick={handleCreateBranch}
            size="md"
            className="text-xs"
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
          </ActionButton>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

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
          className="text-emerald-text"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-xs text-emerald-text">
          Viewing:{" "}
          <span className="font-bold">{viewingLabel}</span>
          {!isAllBranches && canSwitchBranch && (
            <span className="ml-2 text-emerald-text/70">
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
        isLoading={isLoading}
        branches={branchScopedData}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onBranchClick={handleBranchClick}
        onEditBranch={handleEditBranch}
        onTerminateBranch={handleTerminateBranch}
      />

      {/* Create/Edit Modal */}
      <BranchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingBranch}
        mode={modalMode}
        nextBranchCode={nextBranchCode}
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

