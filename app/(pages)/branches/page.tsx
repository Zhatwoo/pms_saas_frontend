"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient, getTokenFromCookie } from "@/lib/supabase-browser";
import { BranchStats } from "./_components/branch-stats";
import { BranchFilters } from "./_components/branch-filters";
import { BranchTable } from "./_components/branch-table";
import { BranchModal } from "./_components/branch-modal";
import { BranchDetailDrawer } from "./_components/branch-detail-drawer";
import { TerminateConfirmModal } from "./_components/terminate-confirm-modal";
import type { BranchRow } from "./_components/branch-table";

interface BranchApiItem {
  id: string;
  branch_code: string;
  name: string;
  location: string;
  status: string;
}

type BranchFormData = {
  id?: string;
  branchId: string;
  name: string;
  location: string;
  status: string;
};

function toBranchRow(branch: BranchApiItem): BranchRow {
  return {
    id: branch.id,
    branchId: branch.branch_code,
    name: branch.name,
    location: branch.location,
    status: branch.status,
    pawnedItems: 0,
    forSaleItems: 0,
    totalValue: "₱0",
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
  const { user } = useAuth();
  const { selectedBranch, isAllBranches, canSwitchBranch, refreshBranches } =
    useBranch();
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Terminate
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [terminatingBranch, setTerminatingBranch] = useState<BranchRow | null>(null);

  const loadBranches = useCallback(async () => {
    try {
      const data = await api.get<BranchApiItem[]>("/branches");
      setBranches((data || []).map(toBranchRow));
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
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const token = getTokenFromCookie();
    if (token) {
      void supabase.realtime.setAuth(token);
    }

    const channel = supabase
      .channel("branches-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branches" },
        () => {
          void loadBranches();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
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
  const formattedTotal = `₱${totalValue.toLocaleString()}`;


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

  async function handleModalSubmit(data: BranchFormData) {
    try {
      if (modalMode === "create") {
        await api.post<BranchApiItem>("/branches", {
          branch_code: data.branchId,
          name: data.name,
          location: data.location,
          status: data.status,
        });

        // Force immediate refresh after add.
        await loadBranches();
        await refreshBranches();
        setSuccessMessage("Your new branch has been created successfully!");
      } else if (data.id) {
        await api.fetch<BranchApiItem>(`/branches/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            location: data.location,
            status: data.status,
          }),
        });

        await loadBranches();
        await refreshBranches();
        setSuccessMessage("Branch details updated successfully!");
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

  function handleTerminateBranch(branch: BranchRow) {
    setTerminatingBranch(branch);
    setTerminateModalOpen(true);
  }

  async function handleConfirmTerminate() {
    if (!terminatingBranch?.id) return;
    try {
      await api.fetch<BranchApiItem>(`/branches/${terminatingBranch.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Terminated" }),
      });
      await loadBranches();
      await refreshBranches();
      setTerminateModalOpen(false);
      setTerminatingBranch(null);
      setSuccessMessage("Branch has been terminated successfully.");
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to terminate branch";
      setErrorMessage(message);
    }
  }

  const nextBranchCode = useMemo(() => getNextBranchCode(branches), [branches]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 1500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border-main bg-surface px-4 py-8 text-center text-sm text-text-secondary">
        Loading branches...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {successMessage && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-300/70 bg-emerald-100/70 px-5 py-3 shadow-xl backdrop-blur-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-emerald-900">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-400"></p>
          <p className="mt-1 text-sm text-text-tertiary">
            Create, edit, and manage all pawnshop branches.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Stats */}
      <BranchStats
        totalBranches={branchScopedData.length}
        activeBranches={activeBranches}
        totalInventoryValue={formattedTotal}
        maintenanceBranches={maintenanceBranches}
      />

      {/* Filters + Create — filters only when viewing all branches, button always */}
      {isAllBranches ? (
        <BranchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onCreateBranch={handleCreateBranch}
        />
      ) : (
        <div>
          <button
            onClick={handleCreateBranch}
            className="flex items-center gap-2 rounded-lg border border-emerald-700 bg-pawn-sidebar px-5 py-2.5 text-sm font-bold text-pawn-gold transition-opacity hover:opacity-90"
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
      )}

      {/* Table */}
      <BranchTable
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

      {/* Terminate Confirmation Modal */}
      <TerminateConfirmModal
        isOpen={terminateModalOpen}
        branchName={terminatingBranch?.name ?? ""}
        onClose={() => {
          setTerminateModalOpen(false);
          setTerminatingBranch(null);
        }}
        onConfirm={handleConfirmTerminate}
      />
    </div>
  );
}

