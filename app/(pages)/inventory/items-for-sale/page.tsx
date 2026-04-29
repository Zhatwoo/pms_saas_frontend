"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { AddItemModal } from "./_components/add-item-modal";

type ViewMode = "list" | "calendar";

interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  availableDate: string;
  price: number;
  status: "Available" | "Reserved" | "Sold";
  originalPawnId?: string;
}

interface SaleStats {
  totalAvailable: number;
  totalSold: number;
  unpricedCount: number;
  soldThisMonth: number;
  revenueThisMonth: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface CalendarDayData {
  available?: number;
  sold?: number;
}

const saleStatusOptions = [
  { value: "all", label: "All" },
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "Sold", label: "Sold" },
];

const statusVariant: Record<string, "green" | "orange" | "blue"> = {
  Available: "green",
  Reserved: "blue",
  Sold: "orange",
};

function saleStatusLabel(status: SaleItem["status"]) {
  if (status === "Available") return "Active";
  if (status === "Reserved") return "Reserved";
  return "Sold";
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Stats Bar ────────────────────────────────────────────────
function StatsBar({ stats }: { stats: SaleStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="rounded-lg border border-border-main bg-surface px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Available</p>
        <p className="text-2xl font-black text-emerald-600 mt-0.5">{stats.totalAvailable}</p>
      </div>
      <div className="rounded-lg border border-border-main bg-surface px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Sold (All Time)</p>
        <p className="text-2xl font-black text-amber-500 mt-0.5">{stats.totalSold}</p>
      </div>
      <div className={`rounded-lg border px-4 py-3 ${stats.unpricedCount > 0 ? "border-orange-400/40 bg-orange-500/5" : "border-border-main bg-surface"}`}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Not Yet Priced</p>
        <p className={`text-2xl font-black mt-0.5 ${stats.unpricedCount > 0 ? "text-orange-500" : "text-text-primary"}`}>
          {stats.unpricedCount}
        </p>
      </div>
      <div className="rounded-lg border border-border-main bg-surface px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Sold This Month</p>
        <p className="text-2xl font-black text-blue-500 mt-0.5">{stats.soldThisMonth}</p>
      </div>
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Revenue This Month</p>
        <p className="text-2xl font-black text-emerald-600 mt-0.5">₱{stats.revenueThisMonth.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ─── Category Tabs ────────────────────────────────────────────
function CategoryTabs({ categories, totalCount, selected, onChange }: {
  categories: CategoryCount[];
  totalCount: number;
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange("all")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${selected === "all" ? "bg-emerald-700 text-white" : "bg-surface-secondary text-text-secondary border border-border-main hover:bg-surface-hover"
          }`}
      >
        All <span className="opacity-70">({totalCount})</span>
      </button>
      {categories.map((c) => (
        <button
          key={c.category}
          onClick={() => onChange(c.category)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${selected === c.category ? "bg-emerald-700 text-white" : "bg-surface-secondary text-text-secondary border border-border-main hover:bg-surface-hover"
            }`}
        >
          {c.category} <span className="opacity-70">({c.count})</span>
        </button>
      ))}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────
function SaleCalendar({ calendarData, selectedDate, onSelectDate, calendarYear, calendarMonth, onChangeMonth }: {
  calendarData: Record<string, CalendarDayData>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  calendarYear: number;
  calendarMonth: number;
  onChangeMonth: (year: number, month: number) => void;
}) {
  const today = new Date();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-border-main bg-surface overflow-hidden shadow-sm">
      <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-emerald-950 to-emerald-900 px-5 py-4">
        <button
          onClick={() => calendarMonth === 0 ? onChangeMonth(calendarYear - 1, 11) : onChangeMonth(calendarYear, calendarMonth - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="text-center min-w-[140px]">
          <p className="text-white font-bold text-lg leading-tight">{MONTH_NAMES[calendarMonth]}</p>
          <p className="text-emerald-300 text-xs font-semibold">{calendarYear}</p>
        </div>
        <button
          onClick={() => calendarMonth === 11 ? onChangeMonth(calendarYear + 1, 0) : onChangeMonth(calendarYear, calendarMonth + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-secondary">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="border-b border-r border-border-subtle/40 bg-surface-secondary/20 h-16" />;
          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const data = calendarData[dateStr];
          const available = data?.available || 0;
          const sold = data?.sold || 0;
          const hasActivity = available > 0 || sold > 0;
          const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative h-16 border-b border-r border-border-subtle/40 p-1.5 text-left transition-all hover:bg-emerald-50/10 ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10" : ""} ${isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
            >
              <span className={`text-xs font-bold leading-none ${isSelected ? "text-emerald-400" : isToday ? "text-amber-400" : hasActivity ? "text-text-primary" : "text-text-muted"}`}>
                {day}
              </span>
              {hasActivity && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-0.5">
                  {available > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-1 flex-1 rounded-full bg-emerald-500/60" />
                      <span className="text-[9px] font-black text-emerald-400 leading-none">{available}</span>
                    </div>
                  )}
                  {sold > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-1 flex-1 rounded-full bg-amber-500/60" />
                      <span className="text-[9px] font-black text-amber-400 leading-none">{sold}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle bg-surface-secondary/60 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/50" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-amber-500/50" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Sold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm ring-1 ring-amber-400" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Today</span>
          </div>
        </div>
        {selectedDate && (
          <button onClick={() => onSelectDate(null)} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wide">
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ITEMS FOR SALE PAGE
// ═══════════════════════════════════════════════════════════════
export default function ItemsForSalePage() {
  const { user } = useAuth();
  const { selectedBranch, branches, setSelectedBranch, isAllBranches } = useBranch();
  const today = new Date();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarCategory, setCalendarCategory] = useState("all");
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [allDayItems, setAllDayItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDayData>>({});
  const [categoryList, setCategoryList] = useState<CategoryCount[]>([]);
  const [categoryTotal, setCategoryTotal] = useState(0);

  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const handleBranchChange = useCallback(
    (value: string) => {
      const found = branches.find((branch) => branch.id === value);
      if (found) {
        setSelectedBranch(found);
      }
    },
    [branches, setSelectedBranch],
  );

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch.id, viewMode, category, calendarCategory, status, searchQuery, selectedDate]);

  useEffect(() => {
    setCalendarCategory("all");
  }, [selectedDate]);

  // Fetch sale items
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);

        if (viewMode === "list") {
          if (category !== "all") params.set("category", category);
          if (status !== "all") params.set("status", status);
          if (searchQuery) params.set("search", searchQuery);
          if (selectedDate) params.set("date", selectedDate);
          params.set("page", String(currentPage));
          params.set("limit", String(itemsPerPage));

          const data = await api.get<{ items: SaleItem[]; total: number }>(`/inventory/for-sale?${params}`);
          setSaleItems(data.items || []);
          setTotalItems(data.total || 0);
        } else {
          if (!selectedDate) {
            setSaleItems([]);
            setAllDayItems([]);
            setTotalItems(0);
            setIsLoading(false);
            return;
          }
          params.set("date", selectedDate);
          params.set("page", "1");
          params.set("limit", "500");

          const allData = await api.get<{ items: SaleItem[]; total: number }>(`/inventory/for-sale?${params}`);
          const all = allData.items || [];
          setAllDayItems(all);
          const filtered = calendarCategory === "all" ? all : all.filter((i) => i.category === calendarCategory);
          setSaleItems(filtered);
          setTotalItems(filtered.length);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [selectedBranch.id, isAllBranches, viewMode, category, calendarCategory, status, searchQuery, selectedDate, currentPage]);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        const data = await api.get<SaleStats>(`/inventory/for-sale-stats?${params}`);
        setStats(data);
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch.id, isAllBranches]);

  // Fetch category counts
  useEffect(() => {
    async function fetchCategories() {
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        const data = await api.get<CategoryCount[]>(`/inventory/for-sale-categories?${params}`);
        setCategoryList(data || []);
        setCategoryTotal((data || []).reduce((s, c) => s + c.count, 0));
        setCategory((prev) => {
          if (prev === "all") return prev;
          return (data || []).some((c) => c.category === prev) ? prev : "all";
        });
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch.id, isAllBranches]);

  // Fetch calendar data
  useEffect(() => {
    async function fetchCalendar() {
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("month", `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`);
        const data = await api.get<Record<string, CalendarDayData>>(`/inventory/for-sale-calendar?${params}`);
        setCalendarData(data || {});
      } catch (err) {
        console.error("Calendar fetch error:", err);
      }
    }
    fetchCalendar();
  }, [selectedBranch.id, isAllBranches, calendarYear, calendarMonth]);

  // Derive calendar day categories from allDayItems
  const calendarCategoryList: CategoryCount[] = (() => {
    if (viewMode !== "calendar" || !selectedDate) return [];
    const counts: Record<string, number> = {};
    for (const item of allDayItems) {
      const cat = (item.category || "Uncategorized").trim();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  })();
  const calendarCategoryTotal = calendarCategoryList.reduce((s, c) => s + c.count, 0);

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-3 pb-4">
      {/* ── Stats Bar ────────────────────────────────────────── */}
      {stats && <StatsBar stats={stats} />}

      {/* ── Unpriced alert ───────────────────────────────────── */}
      {stats && stats.unpricedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-400/30 bg-orange-500/5 px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-sm text-orange-600 dark:text-orange-400">
            <span className="font-bold">{stats.unpricedCount} item{stats.unpricedCount !== 1 ? "s" : ""}</span> transferred from expired pawns but not yet priced by branch admin.
          </span>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 bg-surface p-3 rounded-lg border border-border-main">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Branch" options={branchOptions} value={selectedBranch.id} onChange={handleBranchChange} />
          {viewMode === "list" && (
            <>
              <FilterSelect label="Status" options={saleStatusOptions} value={status} onChange={setStatus} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Date</label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate || ""}
                    onChange={(e) => setSelectedDate(e.target.value || null)}
                    className="h-10 rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none focus:border-emerald-500 pr-8"
                  />
                  {selectedDate && (
                    <button onClick={() => setSelectedDate(null)} className="absolute right-2 text-text-muted hover:text-text-primary">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
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
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user?.role === "super_admin" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors"
            >
              + Add Item For Sale
            </button>
          )}
          <div className="flex rounded-md border border-border-main overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* ── Items For Sale Table ────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-900 text-amber-400">
                {["ID", "Item Name", "Category", "Branch", "Date Expired", "Price", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide ${h === "Price" ? "text-right" : "text-left"
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
                  <td colSpan={8} className="py-8 text-center text-base text-zinc-400">
                    <div className="flex items-center justify-center">
                      <LoadingSpinnerLabel text="Loading..." className="text-base text-zinc-400" />
                    </div>
                  </td>
                </tr>
              ) : saleItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-base text-zinc-400">
                    {viewMode === "calendar" && selectedDate
                      ? "No items on this day"
                      : "No items for sale found"}
                  </td>
                </tr>
              ) : (
                saleItems.map((item, idx) => (
                  <tr
                    key={item.id || item.itemId}
                    className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60 cursor-pointer"
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
                      <StatusBadge label={saleStatusLabel(item.status)} variant={statusVariant[item.status] || "green"} />
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

      {/* ── Calendar view ────────────────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="space-y-3">
          <SaleCalendar
            calendarData={calendarData}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            onChangeMonth={(y, m) => { setCalendarYear(y); setCalendarMonth(m); }}
          />

          {selectedDate && (
            <div className="rounded-lg border border-border-main bg-surface overflow-hidden">
              <div className="flex items-center justify-between bg-emerald-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-sm font-bold text-white">
                    Items on <span className="text-amber-400">{selectedDateLabel}</span>
                  </span>
                </div>
                <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-bold text-white">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </div>

              {calendarCategoryList.length > 0 && (
                <div className="border-b border-border-subtle bg-surface-secondary/50 px-4 py-2">
                  <CategoryTabs
                    categories={calendarCategoryList}
                    totalCount={calendarCategoryTotal}
                    selected={calendarCategory}
                    onChange={setCalendarCategory}
                  />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-secondary">
                      {["ID", "Item Name", "Category", "Branch", "Price", "Status"].map((h) => (
                        <th key={h} className={`whitespace-nowrap px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-left text-text-muted ${h === "Price" ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-zinc-400">
                          <div className="flex items-center justify-center">
                            <LoadingSpinnerLabel text="Loading..." className="text-sm text-zinc-400" />
                          </div>
                        </td>
                      </tr>
                    ) : saleItems.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-sm text-zinc-400">No items on this day</td></tr>
                    ) : (
                      saleItems.map((item) => (
                        <tr key={item.id} className="border-t border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors">
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-400">{item.itemId}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-secondary">
                            <div className="flex items-center gap-2">
                              {item.itemName}
                              {item.price === 0 && item.status === "Available" && (
                                <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-300/50 px-1.5 py-0.5 text-[9px] font-black uppercase text-orange-600 dark:text-orange-400">
                                  Unpriced
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-tertiary">{item.category}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-tertiary">{item.branch}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-right font-medium">
                            {item.price === 0 ? <span className="text-orange-500">—</span> : <span className="text-emerald-700">₱{item.price.toLocaleString()}</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <StatusBadge label={saleStatusLabel(item.status)} variant={statusVariant[item.status] || "green"} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          className="border-t-0"
        />
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Trigger a re-fetch by toggling the selected branch (or you can manage a refresh state)
          // For simplicity, we can do a hard reload or add a refresh state
          window.location.reload();
        }}
      />
    </div>
  );
}
