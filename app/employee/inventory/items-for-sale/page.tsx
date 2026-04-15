"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";

type SaleViewMode = "current" | "calendar" | "history";

interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  category: string;
  branch: string;
  availableDate: string; // Date Expired
  price: number;
  status: "Available" | "Sold";
  stockLevel: number;
  originalPawnId?: string;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">Out of Stock</span>;
  if (stock <= 3)
    return <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">Low Stock: {stock}</span>;
  return <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">In Stock: {stock}</span>;
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

export default function EmployeeItemsForSalePage() {
  const branchIdent = "makati"; // This would come from user context in production

  const [saleViewMode, setSaleViewMode] = useState<SaleViewMode>("current");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<SaleItem | null>(null);
  const itemsPerPage = 10;

  useEffect(() => { setCurrentPage(1); }, [category, status, searchQuery, saleViewMode]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("branch", branchIdent);
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
  }, [category, status, searchQuery, saleViewMode, currentPage]);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Status" options={saleStatusOptions} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="h-9 rounded-md border border-zinc-300 px-3 text-xs outline-none focus:border-emerald-500 w-44"
            />
          </div>
        </div>

        <div className="flex rounded-md border border-zinc-200 overflow-hidden">
          <button onClick={() => setSaleViewMode("current")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${saleViewMode === "current" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>Current</button>
          <button onClick={() => setSaleViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${saleViewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>Calendar</button>
          <button onClick={() => setSaleViewMode("history")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${saleViewMode === "history" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>History</button>
        </div>
      </div>

      {saleViewMode === "calendar" ? (
        <InventoryCalendar items={saleItems} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-white">
                  {["ID", "Item Name", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${h === "Price" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-zinc-400">Loading branch items...</td></tr>
                ) : saleItems.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-zinc-400">No items for sale found</td></tr>
                ) : (
                  saleItems.map((item, idx) => (
                    <tr key={item.id || item.itemId} className={`border-t border-zinc-100 ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50"} hover:bg-emerald-50/30 transition-colors`}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-800">{item.itemId}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="text-xs font-bold text-zinc-900 hover:text-emerald-700 transition-colors hover:underline"
                        >
                          {item.itemName}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">{item.category}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500 font-bold italic">{item.availableDate}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-right font-black text-zinc-800">&#8369;{item.price.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.status === "Available" ? (
                          <button className="rounded-xl bg-emerald-700 px-4 py-1.5 text-[10px] font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95">
                            Sell Item
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400 italic">Sold to Customer</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={() => setViewingItem(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-pawn-gold/20 scale-in-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-emerald-900 px-8 py-6">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-pawn-gold/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-pawn-gold">
                  Item #{viewingItem.itemId}
                </span>
                <StatusBadge label={viewingItem.status} variant={statusVariant[viewingItem.status] || "green"} />
              </div>
              <h2 className="text-2xl font-black text-white">{viewingItem.itemName}</h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Retail Price</p>
                  <p className="text-xl font-black text-emerald-700">&#8369;{viewingItem.price.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Date Expired</p>
                  <p className="text-sm font-bold text-zinc-800">{viewingItem.availableDate}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 mb-2">Detailed Description</p>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-sm font-medium text-zinc-700 leading-relaxed italic">
                    "{viewingItem.description || "Fully authenticated item transitioned from pawn inventory after expiration date."}"
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50/50 px-8 py-4 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="rounded-xl bg-zinc-900 px-8 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:bg-black active:scale-95"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
