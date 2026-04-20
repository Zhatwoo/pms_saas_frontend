"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { useBranch } from "@/contexts/branch-context";

const statusVariantMap: Record<string, "green" | "black" | "red" | "orange"> = {
  Active: "green",
  Inactive: "black",
  Terminated: "red",
  Process: "orange",
};

interface BranchDetail {
  id?: string;
  branchId: string;
  name: string;
  location: string;
  contactNumber: string;
  status: string;
  pawnedItems: number;
  forSaleItems: number;
  totalValue: string;
}

interface BranchDetailDrawerProps {
  branch: BranchDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BranchDetailDrawer({
  branch,
  isOpen,
  onClose,
}: BranchDetailDrawerProps) {
  const router = useRouter();
  const { branches, setSelectedBranch, canSwitchBranch } = useBranch();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l border-border-main bg-surface shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Branch Details
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {branch?.name || "—"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {branch && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Branch Info */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border-subtle bg-surface-secondary p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Branch ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {branch.branchId}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Status
                    </p>
                    <div className="mt-1">
                      <StatusBadge
                        label={branch.status}
                        variant={statusVariantMap[branch.status] || "black"}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Location
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {branch.location}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Contact Number
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {branch.contactNumber || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inventory Breakdown */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Inventory Breakdown
                </h3>
                <div className="space-y-3">
                  {/* Pawned Items */}
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">Pawned Items</p>
                        <p className="text-[10px] text-text-muted">Currently held</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-text-primary">
                      {branch.pawnedItems}
                    </span>
                  </div>

                  {/* Items for Sale */}
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">Items for Sale</p>
                        <p className="text-[10px] text-text-muted">Available in store</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-text-primary">
                      {branch.forSaleItems}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Value */}
              <div className="rounded-lg border border-emerald-border bg-emerald-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Total Inventory Value
                    </p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">
                      {branch.totalValue}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Daily Balance Section */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Daily Balance
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Starting Balance */}
                  <div className="rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Starting Balance
                    </p>
                    <p className="mt-2 text-lg font-bold text-amber-600">
                      ₱0.00
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">Today</p>
                  </div>

                  {/* Ending Balance */}
                  <div className="rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Ending Balance
                    </p>
                    <p className="mt-2 text-lg font-bold text-green-600">
                      ₱0.00
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">Today</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (branch && branch.id) {
                          const selectedBranchInList = branches.find((b) => b.id === branch.id);
                          if (selectedBranchInList && canSwitchBranch) {
                            setSelectedBranch(selectedBranchInList);
                          }
                        }
                        onClose();
                        router.push(`/admin/inventory`);
                      }}
                      className="rounded-lg border border-border-main bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-pawn-sidebar hover:bg-emerald-surface hover:text-emerald-text"
                    >
                      View Inventory
                    </button>
                    <button
                      onClick={() => {
                        if (branch && branch.id) {
                          const selectedBranchInList = branches.find((b) => b.id === branch.id);
                          if (selectedBranchInList && canSwitchBranch) {
                            setSelectedBranch(selectedBranchInList);
                          }
                        }
                        onClose();
                        router.push(`/admin/pawn-transactions`);
                      }}
                      className="rounded-lg border border-border-main bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-pawn-sidebar hover:bg-emerald-surface hover:text-emerald-text"
                    >
                      View Transactions
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (branch && branch.id) {
                        const selectedBranchInList = branches.find((b) => b.id === branch.id);
                        if (selectedBranchInList && canSwitchBranch) {
                          setSelectedBranch(selectedBranchInList);
                        }
                      }
                      onClose();
                      router.push(`/admin/users`);
                    }}
                    className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-pawn-sidebar hover:bg-emerald-surface hover:text-emerald-text"
                  >
                    View Employees
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="rounded-lg border border-border-main bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-pawn-sidebar hover:bg-emerald-surface hover:text-emerald-text">
                      Edit Branch
                    </button>
                    <button className="rounded-lg border border-border-main bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-600">
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
