"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { toast } from "sonner";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { AddItemModal } from "@/app/(pages)/inventory/items-for-sale/_components/add-item-modal";

type SaleViewMode = "current" | "calendar" | "history";

interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  availableDate: string;
  price: number;
  status: "Available" | "Sold";
  originalPawnId?: string;
}

const categoryOptions = [
  { value: "all", label: "All" },
  { value: "electronics", label: "Electronics" },
  { value: "jewellery", label: "Jewellery" },
  { value: "gadgets", label: "Gadgets" },
  { value: "vehicles", label: "Vehicles" },
];

const saleStatusOptions = [
  { value: "all", label: "All" },
  { value: "Available", label: "Available" },
  { value: "Sold", label: "Sold" },
];

const statusVariant: Record<string, "green" | "orange"> = {
  Available: "green",
  Sold: "orange",
};

// ===============================================================
// ITEMS FOR SALE PAGE (Under Inventory)
// ===============================================================
export default function ItemsForSalePage({ viewOnly = false }: { viewOnly?: boolean } = {}) {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const userRole = user?.role || "employee";
  const isSuperAdmin = userRole === "super_admin";
  const canEdit = !viewOnly && (userRole === "super_admin" || userRole === "admin");

  const [saleViewMode, setSaleViewMode] = useState<SaleViewMode>("current");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;
  const [viewingItem, setViewingItem] = useState<SaleItem | null>(null);
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, status, searchQuery, saleViewMode, selectedBranch.id]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        if (searchQuery) params.set("search", searchQuery);
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("viewMode", saleViewMode);
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));

        const data = await api.get<{ items: SaleItem[]; total: number }>(`/inventory/for-sale?${params}`);
        setSaleItems(data.items || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [category, status, searchQuery, saleViewMode, currentPage, selectedBranch.id, isAllBranches, refreshTick]);

  return (
    <div className={viewOnly ? "space-y-5 pb-4 text-text-primary" : "space-y-4 pb-4 text-text-primary"}>
      {/* ── Filter Bar ─────────────────────────────────────── */}
      <div className={viewOnly ? "flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-border-main bg-surface-secondary/85 p-5 shadow-lg shadow-black/20 backdrop-blur-sm" : "flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-border-main bg-surface-secondary/85 p-4 shadow-lg shadow-black/20 backdrop-blur-sm"}>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Status" options={saleStatusOptions} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-1">
            <label className={viewOnly ? "text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500" : "text-[10px] font-bold uppercase tracking-wide text-zinc-500"}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className={viewOnly ? "h-10 w-56 rounded-md border border-zinc-300 px-4 text-sm outline-none transition-colors focus:border-emerald-500" : "h-9 w-44 rounded-md border border-zinc-300 px-3 text-xs outline-none transition-colors focus:border-emerald-500"}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setAddModalOpen(true)}
              className={viewOnly
                ? "h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                : "h-9 rounded-md bg-emerald-700 px-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-800"}
            >
              Add Item
            </button>
          )}
          <div className="flex overflow-hidden rounded-md border border-border-main bg-surface-secondary dark:border-slate-700 dark:bg-slate-900">
          <button onClick={() => setSaleViewMode("current")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${saleViewMode === "current" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            Current
          </button>
          <button onClick={() => setSaleViewMode("calendar")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${saleViewMode === "calendar" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            Calendar
          </button>
          <button onClick={() => setSaleViewMode("history")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${saleViewMode === "history" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            History
          </button>
          </div>
        </div>
      </div>

      {saleViewMode === "calendar" ? (
        <InventoryCalendar items={saleItems} />
      ) : (
      <div className={viewOnly ? "overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300" : "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"}>
        <div className="overflow-x-auto">
          <table className={viewOnly ? "min-w-[1220px] w-full text-sm" : "w-full text-sm"}>
            <thead>
              <tr className={viewOnly ? "bg-emerald-900 text-amber-400" : "bg-gradient-to-r from-emerald-950 to-emerald-900 text-white"}>
                {["ID", "Item Name", "Category", "Branch", "Available Date", "Price", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-5 py-4 ${viewOnly ? "text-xs font-bold uppercase tracking-[0.16em]" : "text-[10px] font-bold uppercase tracking-wide"} ${h === "Price" ? "text-right" : h === "Actions" ? "text-center" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-zinc-400">
                    <div className="flex items-center justify-center">
                      <LoadingSpinnerLabel text="Loading items for sale..." className="text-base font-medium text-text-tertiary" />
                    </div>
                  </td>
                </tr>
              ) : saleItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-zinc-400">
                    {saleViewMode === "history" ? "No sold items in history" : "No items for sale found"}
                  </td>
                </tr>
              ) : (
                saleItems.map((item, idx) => (
                  <tr
                    key={item.id || item.itemId}
                    onClick={viewOnly ? () => setViewingItem(item) : undefined}
                    className={`border-t border-border-subtle transition-colors ${viewOnly ? "cursor-pointer bg-surface-secondary hover:bg-emerald-surface/60" : `${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary/40"} hover:bg-surface-hover`}`}
                  >
                    <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm font-bold text-emerald-700" : "whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-800"}>{item.itemId}</td>
                    <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-secondary" : "whitespace-nowrap px-3 py-2 text-xs text-text-secondary"}>{item.itemName}</td>
                    <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-tertiary" : "whitespace-nowrap px-3 py-2 text-xs text-text-tertiary"}>{item.category}</td>
                    <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-tertiary" : "whitespace-nowrap px-3 py-2 text-xs text-text-tertiary"}>{item.branch}</td>
                    <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-tertiary" : "whitespace-nowrap px-3 py-2 text-xs text-text-tertiary"}>{item.availableDate}</td>
                    <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-right font-semibold text-text-primary" : "whitespace-nowrap px-3 py-2 text-xs text-right font-medium text-text-primary"}>
                      &#8369;{item.price.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={(event) => { event.stopPropagation(); setViewingItem(item); }} className={viewOnly ? "rounded px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : "rounded px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100"}>
                          View
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={(event) => { event.stopPropagation(); setEditingItem(item); }} className={viewOnly ? "rounded px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100" : "rounded px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100"}>
                              Edit
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); setDeleteConfirmId(item.id); }}
                              className={viewOnly ? "rounded px-3.5 py-1.5 text-xs font-bold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100" : "rounded px-2 py-1 text-[10px] font-bold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100"}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {viewOnly ? (
        <PaginationFooter
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      ) : (
        <div className={viewOnly ? "mt-4 overflow-hidden rounded-2xl border border-border-main bg-surface-secondary/50 shadow-sm" : "mt-4 overflow-hidden rounded-3xl border border-border-main bg-surface shadow-lg shadow-black/20"}>
          <PaginationFooter
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}


      {/* ── View Modal ──────────────────────────────────────── */}
      {viewingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setViewingItem(null)}>
          <div className="w-full max-w-lg rounded-xl bg-surface shadow-2xl border border-border-main overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">For Sale #{viewingItem.itemId}</p>
                <h2 className="text-white text-lg font-bold">{viewingItem.itemName}</h2>
              </div>
              <StatusBadge label={viewingItem.status} variant={statusVariant[viewingItem.status] || "green"} />
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-bold text-text-tertiary uppercase">Category</p><p className="text-sm text-text-primary">{viewingItem.category}</p></div>
                <div><p className="text-[10px] font-bold text-text-tertiary uppercase">Price</p><p className="text-sm font-bold text-emerald-700">₱{viewingItem.price.toLocaleString()}</p></div>
                <div><p className="text-[10px] font-bold text-text-tertiary uppercase">Available Date</p><p className="text-sm text-text-primary">{viewingItem.availableDate}</p></div>
                <div><p className="text-[10px] font-bold text-text-tertiary uppercase">Branch</p><p className="text-sm text-text-primary">{viewingItem.branch}</p></div>
                <div><p className="text-[10px] font-bold text-text-tertiary uppercase">Origin Pawn ID</p><p className="text-sm text-text-primary">{viewingItem.originalPawnId || "Manual Entry"}</p></div>
                <div><p className="text-[10px] font-bold text-text-tertiary uppercase">Status</p><p className="text-sm text-text-primary">{viewingItem.status}</p></div>
              </div>
            </div>
            <div className="border-t border-border-main px-6 py-3 flex justify-end bg-surface-secondary">
              <button onClick={() => setViewingItem(null)} className="px-4 py-2 text-xs font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────── */}
      {!viewOnly && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setEditingItem(null)}>
          <EditSaleItemForm item={editingItem} onClose={() => setEditingItem(null)} onSaved={(updated) => {
            setSaleItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
            setEditingItem(null);
          }} />
        </div>
      )}

      {!viewOnly && (
        <ConfirmActionModal
          isOpen={deleteConfirmId !== null}
          title="Delete sale item?"
          message="This cannot be undone. The item will be removed from inventory for sale."
          confirmLabel="Yes, delete"
          variant="danger"
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={async () => {
            if (!deleteConfirmId) return;
            try {
              await api.delete(`/inventory/for-sale/${deleteConfirmId}`);
              setSaleItems((prev) => prev.filter((i) => i.id !== deleteConfirmId));
              toast.success("Item deleted successfully.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to delete item.");
              throw err;
            }
          }}
        />
      )}

      {!viewOnly && (
        <AddItemModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setCurrentPage(1);
            setRefreshTick((tick) => tick + 1);
          }}
        />
      )}
    </div>
  );
}

function EditSaleItemForm({ item, onClose, onSaved }: { item: SaleItem; onClose: () => void; onSaved: (updated: Partial<SaleItem> & { id: string }) => void }) {
  const [price, setPrice] = useState(String(item.price));
  const [itemName, setItemName] = useState(item.itemName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch(`/inventory/for-sale/${item.id}`, { item_name: itemName, price: Number(price) });
      onSaved({ id: item.id, itemName, price: Number(price) });
      toast.success("Item updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-surface border border-border-main shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="bg-emerald-900 px-6 py-4">
        <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Edit Sale Item</p>
        <h2 className="text-white text-lg font-bold">{item.itemId}</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Item Name</label>
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Price (₱)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500" />
        </div>
      </div>
      <div className="border-t border-border-main px-6 py-3 flex justify-end gap-2 bg-surface-secondary">
        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover">Cancel</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 disabled:opacity-50">{isSaving ? "Saving..." : "Save Changes"}</button>
      </div>
    </form>
  );
}
