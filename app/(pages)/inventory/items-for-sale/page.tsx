"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";

type SaleViewMode = "current" | "history";

interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  availableDate: string;
  price: number;
  status: "Available" | "Sold";
  stockLevel: number;
  originalPawnId?: string;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
        Out of Stock
      </span>
    );
  if (stock <= 3)
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 border border-orange-200">
        Low Stock: {stock}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
      In Stock: {stock}
    </span>
  );
}

const branchOptions = [
  { value: "all", label: "All Branches" },
  { value: "taguig", label: "Taguig" },
  { value: "makati", label: "Makati" },
  { value: "pasay", label: "Pasay" },
];

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

function SaleItemModal({ item, onClose }: { item: SaleItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-surface shadow-2xl border border-border-main overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">For Sale Item #{item.itemId}</p>
            <h2 className="text-white text-xl font-bold">{item.itemName}</h2>
          </div>
          <StatusBadge label={item.status === "Available" ? "Active" : "Sold"} variant={statusVariant[item.status]} />
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-base">
            <div><p className="text-xs font-bold text-text-muted uppercase">Category</p><p>{item.category}</p></div>
            <div><p className="text-xs font-bold text-text-muted uppercase">Price</p><p className="font-bold text-emerald-700">₱{item.price.toLocaleString()}</p></div>
            <div><p className="text-xs font-bold text-text-muted uppercase">Date Expired</p><p>{item.availableDate}</p></div>
            <div><p className="text-xs font-bold text-text-muted uppercase">Origin Pawn ID</p><p>{item.originalPawnId || "Manual Entry"}</p></div>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <p className="text-xs font-bold text-text-muted uppercase mb-1">Item Description / Pictures</p>
            <div className="rounded-lg bg-surface-secondary p-4 border border-border-subtle">
              <p className="text-sm text-text-secondary leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. This item was transferred from an expired pawn contract. Condition is verified.
              </p>
              {/* Image Placeholder */}
              <div className="mt-3 aspect-video rounded-md bg-zinc-200 flex items-center justify-center text-xs text-zinc-500 font-bold uppercase">
                Item Photo (High Res)
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border-main px-6 py-3 flex justify-end bg-surface-secondary">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover">Close</button>
        </div>
      </div>
    </div>
  );
}

// ===============================================================
// ITEMS FOR SALE PAGE (Under Inventory)
// ===============================================================
export default function ItemsForSalePage() {
  const userRole = "super_admin";
  const isSuperAdmin = userRole === "super_admin";
  const canEdit = userRole === "super_admin" || userRole === "admin";

  const [saleViewMode, setSaleViewMode] = useState<SaleViewMode>("current");
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const itemsPerPage = 10;

  // Low stock banner: items Available with stockLevel <= 3
  const lowStockCount = saleItems.filter(
    (i) => i.status === "Available" && i.stockLevel <= 3
  ).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [branch, category, status, searchQuery, saleViewMode]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (branch !== "all") params.set("branch", branch);
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        if (searchQuery) params.set("search", searchQuery);
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
  }, [branch, category, status, searchQuery, saleViewMode, currentPage]);

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this sale item? This cannot be undone.")) return;
    try {
      await api.delete(`/inventory/for-sale/${itemId}`);
      setSaleItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  return (
    <div className="space-y-3 pb-4">
      {/* ── Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 bg-surface p-3 rounded-lg border border-border-main transition-colors duration-300">
        <div className="flex flex-wrap items-end gap-3">
          {isSuperAdmin && (
            <FilterSelect label="Branch" options={branchOptions} value={branch} onChange={setBranch} />
          )}
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Status" options={saleStatusOptions} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="h-10 rounded-md border border-input-border bg-input-bg px-4 text-sm text-text-primary outline-none focus:border-emerald-500 w-48"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border-main overflow-hidden">
            <button
              onClick={() => setSaleViewMode("current")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                saleViewMode === "current" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setSaleViewMode("history")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                saleViewMode === "history" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* ── Low Stock Alert Banner ──────────────────────────── */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-orange-800">Low Stock Alert</p>
              <p className="text-xs text-orange-600 font-medium">
                You have {lowStockCount} item(s) running low on stock (&le; 3).
              </p>
            </div>
          </div>
          <button className="text-xs font-bold text-orange-700 hover:text-orange-900 border border-orange-300 rounded px-4 py-2 transition-colors bg-surface">
            Review Items
          </button>
        </div>
      )}

      {/* ── Items For Sale Table ────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-900 text-amber-400">
                {["ID", "Item Name", "Category", "Branch", "Date Expired", "Price", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide ${
                      h === "Price" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-base text-zinc-400">
                    Loading...
                  </td>
                </tr>
              ) : saleItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-base text-zinc-400">
                    {saleViewMode === "history" ? "No sold items in history" : "No items for sale found"}
                  </td>
                </tr>
              ) : (
                saleItems.map((item, idx) => (
                  <tr
                    key={item.id || item.itemId}
                    className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-400">{item.itemId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary font-medium">{item.itemName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">{item.category}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">{item.branch}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">{item.availableDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-medium text-emerald-700">
                      &#8369;{item.price.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge label={item.status === "Available" ? "Active" : "Sold"} variant={statusVariant[item.status] || "green"} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="rounded px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedItem && <SaleItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {saleViewMode === "current" && (
        <div className="rounded-lg border border-border-main bg-surface p-4 mt-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-text-muted uppercase mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-1 auto-rows-[80px]">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 3;
              const isCurrentMonth = day > 0 && day <= 30;
              return (
                <div key={i} className={`border rounded p-1 ${isCurrentMonth ? "border-border-subtle" : "border-transparent text-transparent"}`}>
                  <div className="text-xs font-bold text-text-tertiary">{day}</div>
                  {day === 12 && <div className="mt-1 flex items-center gap-1 rounded bg-orange-100 px-1 py-0.5 text-[9px] font-bold text-orange-700 truncate">Expired: 3</div>}
                  {day === 15 && <div className="mt-1 flex items-center gap-1 rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-700 truncate">Sold: ₱5k</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          className="border-t-0"
        />
      </div>
    </div>
  );
}
