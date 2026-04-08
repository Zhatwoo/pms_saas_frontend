"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
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
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
        Out of Stock
      </span>
    );
  if (stock <= 3)
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
        Low Stock: {stock}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
      In Stock: {stock}
    </span>
  );
}

const branchOptions = [
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

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/for-sale?${params}`
        );
        const data = await res.json();
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
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/for-sale/${itemId}`,
        { method: "DELETE" }
      );
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
            <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="h-9 rounded-md border border-input-border bg-input-bg px-3 text-xs text-text-primary outline-none focus:border-emerald-500 w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border-main overflow-hidden">
            <button
              onClick={() => setSaleViewMode("current")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                saleViewMode === "current" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setSaleViewMode("history")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
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
              <p className="text-sm font-bold text-orange-800">Low Stock Alert</p>
              <p className="text-[10px] text-orange-600 font-medium">
                You have {lowStockCount} item(s) running low on stock (&le; 3).
              </p>
            </div>
          </div>
          <button className="text-[10px] font-bold text-orange-700 hover:text-orange-900 border border-orange-300 rounded px-3 py-1.5 transition-colors bg-surface">
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
                {["ID", "Item Name", "Category", "Branch", "Available Date", "Price", "Stock Level", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${
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
                  <td colSpan={9} className="py-8 text-center text-sm text-zinc-400">
                    Loading...
                  </td>
                </tr>
              ) : saleItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-zinc-400">
                    {saleViewMode === "history" ? "No sold items in history" : "No items for sale found"}
                  </td>
                </tr>
              ) : (
                saleItems.map((item, idx) => (
                  <tr
                    key={item.id || item.itemId}
                    className={`border-t border-border-subtle ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"} hover:bg-surface-hover transition-colors`}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-800">{item.itemId}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">{item.itemName}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.category}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.branch}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.availableDate}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-right font-medium text-text-primary">
                      &#8369;{item.price.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <StockBadge stock={item.stockLevel ?? 1} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button className="rounded px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                          View
                        </button>
                        {canEdit && (
                          <>
                            <button className="rounded px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded px-2 py-1 text-[10px] font-bold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100"
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

      {/* ── Pagination ─────────────────────────────────────── */}
      <div className="rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
