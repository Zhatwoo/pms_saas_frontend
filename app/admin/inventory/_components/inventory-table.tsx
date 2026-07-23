"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

interface InventoryItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  pawnDate: string;
  status: string;
}

export function InventoryTable() {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const canEdit = user?.role === "super_admin" || user?.role === "admin";
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));
        const data = await api.get<{ items: InventoryItem[]; total: number }>(`/inventory/pawned?${params}`);
        setItems(data.items || []);
        setTotalItems(data.total || 0);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, [currentPage, selectedBranch.id, isAllBranches]);

  const statusVariant: Record<string, "green" | "blue" | "red" | "orange" | "yellow"> = {
    Active: "green",
    Redeemed: "blue",
    Expired: "red",
    Pawned: "yellow",
  };

  const deleteIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-green text-pawn-gold">
                {["ID", "Item Name", "Category", "Branch", "Pawn Date", "Status", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-text-tertiary">
                  <div className="flex items-center justify-center">
                    <LoadingSpinnerLabel text="Loading..." className="text-sm text-text-tertiary" />
                  </div>
                </td>
              </tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-text-tertiary">No items found</td></tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className={`border-t border-border-subtle ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"} hover:bg-surface-hover transition-colors`}>
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-brand-green">{item.itemId}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">{item.itemName}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.category}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.branch}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.pawnDate}</td>
                    <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "yellow"} /></td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      {canEdit && (
                        <button 
                          type="button" 
                          onClick={() => setDeleteConfirmId(item.id)} 
                          title="Delete Item"
                          className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100"
                        >
                          {deleteIcon}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationFooter
        currentPage={currentPage}
        totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      <ConfirmActionModal
        isOpen={deleteConfirmId !== null}
        title="Delete pawned item?"
        message="This cannot be undone. The pawned record will be removed from inventory."
        confirmLabel="Yes, delete"
        variant="danger"
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={async () => {
          if (!deleteConfirmId) return;
          try {
            await api.delete(`/inventory/pawned/${deleteConfirmId}`);
            setItems((prev) => prev.filter((i) => i.id !== deleteConfirmId));
            toast.success("Item deleted.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete item.");
            throw err;
          }
        }}
      />
    </div>
  );
}
