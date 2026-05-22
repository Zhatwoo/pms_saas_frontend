"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { SaleCalendar } from "@/app/(pages)/inventory/items-for-sale/_components/sale-calendar";
import { useBranch } from "@/contexts/branch-context";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { SellsTransferModal } from "@/app/employee/pawn-transaction/_components/sells-transfer-modal";

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
  status: "Available" | "Reserved" | "Sold";
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
  { value: "Reserved", label: "Reserved" },
  { value: "Sold", label: "Sold" },
];

const toolbarInputClass = "h-10 w-48 rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500";
const toolbarTabClass = "px-4 py-2 text-sm font-medium transition-colors";

const statusVariant: Record<string, "green" | "orange" | "blue"> = {
  Available: "green",
  Reserved: "blue",
  Sold: "orange",
};

const toolbarLabelClass = "text-[10px] font-bold uppercase tracking-wider text-text-tertiary";

export default function EmployeeItemsForSalePage() {
  const { selectedBranch } = useBranch();
  const branchIdent = selectedBranch.id;

  const [saleViewMode, setSaleViewMode] = useState<SaleViewMode>("current");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  const [viewingItem, setViewingItem] = useState<SaleItem | null>(null);
  const [sellingItem, setSellingItem] = useState<SaleItem | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => { setCurrentPage(1); }, [category, status, searchQuery, saleViewMode]);

  useEffect(() => {
    async function fetchData() {
      if (!branchIdent || branchIdent === "__all__") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("branch", branchIdent);
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        if (searchQuery) params.set("search", searchQuery);
        if (saleViewMode === "calendar") {
          if (status !== "all") params.set("status", status);
          if (searchQuery) params.set("search", searchQuery);
          params.set("page", "1");
          params.set("limit", "500");

          const allData = await api.get<{ items: SaleItem[]; total: number }>(`/inventory/for-sale?${params}`);
          const all = allData.items || [];
          const filtered = category === "all" ? all : all.filter((item) => item.category === category);
          setSaleItems(filtered);
          setTotalItems(filtered.length);
          return;
        } else {
          params.set("viewMode", saleViewMode);
          params.set("page", String(currentPage));
          params.set("limit", String(itemsPerPage));
        }

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
  }, [branchIdent, category, status, searchQuery, saleViewMode, currentPage, refreshTick]);

  useEffect(() => {
    async function fetchCalendar() {
      if (saleViewMode !== "calendar") return;
      try {
        const params = new URLSearchParams();
        params.set("branch", branchIdent);
        params.set("month", `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`);
        const data = await api.get<Record<string, number>>(`/inventory/for-sale-calendar?${params}`);
        setCalendarData(data || {});
      } catch (err) {
        console.error("Calendar fetch error:", err);
      }
    }
    fetchCalendar();
  }, [saleViewMode, branchIdent, calendarYear, calendarMonth]);

  return (
    <div className="space-y-3 pb-4 text-text-primary -mt-2">
      <div>
        <p className="text-sm text-emerald-900/60 dark:text-zinc-400">
          Inventory of expired pawn items and direct purchases currently available for retail sale.
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border-main bg-surface-secondary/85 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} size="lg" />
          <FilterSelect label="Status" options={saleStatusOptions} value={status} onChange={setStatus} size="lg" />
          <div className="flex flex-col gap-1">
            <label className={toolbarLabelClass}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className={toolbarInputClass}
            />
          </div>
          {/* Date filter removed per request */}
        </div>

        <div className="flex overflow-hidden rounded-md border border-border-main bg-surface-secondary dark:border-slate-700 dark:bg-slate-900">
          <button onClick={() => setSaleViewMode("current")} className={`${toolbarTabClass} ${saleViewMode === "current" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>All Records</button>
          <button onClick={() => setSaleViewMode("calendar")} className={`${toolbarTabClass} ${saleViewMode === "calendar" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>Calendar</button>
          <button onClick={() => setSaleViewMode("history")} className={`${toolbarTabClass} ${saleViewMode === "history" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>History</button>
        </div>
      </div>


      {saleViewMode === "calendar" ? (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300 shadow-lg shadow-black/20">
          <div className="border-b border-border-main p-3 sm:p-4">
            <SaleCalendar
              calendarData={calendarData}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              calendarYear={calendarYear}
              calendarMonth={calendarMonth}
              onChangeMonth={(year, month) => {
                setCalendarYear(year);
                setCalendarMonth(month);
              }}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400 dark:bg-emerald-950 dark:text-amber-300">
                  {["ID", "Item Name", "Category", "Date Expired", "Price", "Status", "Actions"].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-xs font-bold uppercase tracking-wide ${h === "Price" ? "text-right" : h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-zinc-400">
                      <div className="flex items-center justify-center">
                        <LoadingSpinnerLabel text="Loading..." className="text-base font-medium text-text-tertiary" />
                      </div>
                    </td>
                  </tr>
                ) : saleItems.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-zinc-400">No items for sale found</td></tr>
                ) : (
                  saleItems.map((item, idx) => (
                    <tr key={item.id || item.itemId} className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60">
                      <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">{item.itemId}</td>
                      <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium text-text-secondary">
                        <button onClick={() => setViewingItem(item)} className="text-text-primary dark:text-zinc-400 transition-colors hover:underline hover:text-emerald-700">
                          {item.itemName}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-tertiary">{item.category}</td>
                      <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold italic text-text-tertiary">{item.availableDate}</td>
                      <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-right font-semibold text-text-primary">&#8369;{item.price.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                        {item.status === "Available" ? (
                          <button onClick={() => setSellingItem(item)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-800">
                            Sell Item
                          </button>
                        ) : item.status === "Reserved" ? (
                          <span className="text-xs font-bold italic text-sky-500">Reserved for Layaway</span>
                        ) : (
                          <span className="text-xs font-bold italic text-zinc-400">Sold to Customer</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400 dark:bg-emerald-950 dark:text-amber-300">
                  {["ID", "Item Name", "Category", "Date Expired", "Price", "Status", "Actions"].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${h === "Price" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-zinc-400">
                      <div className="flex items-center justify-center">
                        <LoadingSpinnerLabel text="Loading..." className="text-base font-medium text-text-tertiary" />
                      </div>
                    </td>
                  </tr>
                ) : saleItems.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-zinc-400">No items for sale found</td></tr>
                ) : (
                  saleItems.map((item, idx) => (
                    <tr key={item.id || item.itemId} className={`border-t border-border-subtle transition-colors ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary/40"} hover:bg-surface-hover`}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.itemId}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="text-xs font-bold text-text-primary dark:text-zinc-400 hover:text-emerald-700 transition-colors hover:underline"
                        >
                          {item.itemName}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">{item.category}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-bold italic text-text-secondary">{item.availableDate}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-black text-text-primary">&#8369;{item.price.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.status === "Available" ? (
                          <button onClick={() => setSellingItem(item)} className="rounded-xl bg-emerald-700 px-4 py-1.5 text-[10px] font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95">
                            Sell Item
                          </button>
                        ) : item.status === "Reserved" ? (
                          <span className="text-[10px] font-bold text-sky-500 italic">Reserved for Layaway</span>
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

      <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {sellingItem && (
        <SellsTransferModal
          isOpen={Boolean(sellingItem)}
          onClose={() => setSellingItem(null)}
          onSuccess={() => {
            setRefreshTick((value) => value + 1);
            setSellingItem(null);
          }}
          branchName={selectedBranch.name}
          initialItem={{
            id: sellingItem.id,
            unitId: sellingItem.itemId,
            unit: sellingItem.itemName,
            srp: String(sellingItem.price),
            serialNumber: sellingItem.originalPawnId || sellingItem.itemId,
            included: sellingItem.description || sellingItem.category,
            condition: sellingItem.status,
            memory: sellingItem.branch,
            barcodeId: sellingItem.itemId,
          }}
        />
      )}


      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={() => setViewingItem(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border-main bg-surface shadow-2xl scale-in-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 px-8 py-6">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-pawn-gold/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-pawn-gold">
                  Item #{viewingItem.itemId}
                </span>
                <StatusBadge label={viewingItem.status} variant={statusVariant[viewingItem.status] || "green"} />
              </div>
              <h2 className="text-2xl font-black text-white">{viewingItem.itemName}</h2>
            </div>

            <div className="space-y-6 p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary">Retail Price</p>
                  <p className="text-xl font-black text-emerald-400">&#8369;{viewingItem.price.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary">Date Expired</p>
                  <p className="text-sm font-bold text-text-primary">{viewingItem.availableDate}</p>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <p className="mb-2 text-[10px] font-black uppercase tracking-tighter text-text-tertiary">Detailed Description</p>
                <div className="rounded-xl border border-border-main bg-surface-secondary/70 p-4">
                  <p className="text-sm font-medium leading-relaxed italic text-text-primary">
                    "{viewingItem.description || "Fully authenticated item transitioned from pawn inventory after expiration date."}"
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50/50/50 px-8 py-4 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="rounded-xl bg-emerald-700 px-8 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95"
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
