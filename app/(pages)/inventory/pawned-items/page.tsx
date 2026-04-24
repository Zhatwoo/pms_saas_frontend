"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryAuditModal } from "@/components/shared/inventory-audit-modal";
import { useBranch } from "@/contexts/branch-context";

type PawnedStatus = "Active" | "Redeemed" | "Expired";
type ViewMode = "list" | "calendar";

interface Renewal {
  date: string;
  amount: number;
}

interface PawnedItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  pawnDate: string;
  status: PawnedStatus;
  renewalCount: number;
  renewals: Renewal[];
  remarks: string;
  qrCode?: string;
  originalPhoto?: string;
  conditionReport?: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

const pawnedStatusOptions = [
  { value: "all", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Redeemed", label: "Redeemed" },
  { value: "Expired", label: "Expired" },
];

const statusVariant: Record<string, "green" | "blue" | "red" | "orange"> = {
  Active: "green",
  Redeemed: "blue",
  Expired: "red",
};

// ─── Renewal Details ──────────────────────────────────────────
function RenewalDetails({ renewals }: { renewals: Renewal[] }) {
  if (renewals.length === 0)
    return <span className="text-text-muted text-xs">No renewals yet</span>;
  return (
    <div className="space-y-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            Renew {i + 1}
          </span>
          <span className="text-xs text-text-tertiary">{r.date}</span>
          <span className="text-xs font-bold text-text-secondary">
            ₱{r.amount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────
function ViewModal({
  item,
  onClose,
  onSaveRemarks,
  userRole,
}: {
  item: PawnedItem;
  onClose: () => void;
  onSaveRemarks: (id: string, remarks: string) => void;
  userRole: string;
}) {
  const [editRemarks, setEditRemarks] = useState(item.remarks || "");
  const canEdit = userRole === "super_admin" || userRole === "admin";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface shadow-2xl border border-border-main overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Item #{item.itemId}
            </p>
            <h2 className="text-white text-xl font-bold">{item.itemName}</h2>
          </div>
          <StatusBadge
            label={item.status}
            variant={statusVariant[item.status] || "green"}
          />
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase text-text-muted font-bold">Category</p>
              <p className="text-base text-text-primary">{item.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-text-muted font-bold">Branch</p>
              <p className="text-base text-text-primary">{item.branch}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-text-muted font-bold">Pawn Date</p>
              <p className="text-base text-text-primary">{item.pawnDate}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-text-muted font-bold">Renewal Count</p>
              <p className="text-base text-text-primary font-bold">{item.renewalCount}x</p>
            </div>
          </div>
          {item.status === "Expired" && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
              <p className="text-xs font-bold uppercase text-red-600 tracking-wider">
                Expired Item — QR Security Info
              </p>
              {item.originalPhoto && (
                <div>
                  <p className="text-xs text-text-tertiary">Original Photo:</p>
                  <p className="text-sm text-text-secondary">{item.originalPhoto}</p>
                </div>
              )}
              {item.conditionReport && (
                <div>
                  <p className="text-xs text-text-tertiary">Condition Report:</p>
                  <p className="text-sm text-text-secondary">{item.conditionReport}</p>
                </div>
              )}
              {item.qrCode && (
                <div>
                  <p className="text-xs text-text-tertiary">QR Code:</p>
                  <p className="text-sm font-mono text-text-secondary">{item.qrCode}</p>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-text-muted font-bold mb-2">
              Renewal History
            </p>
            <RenewalDetails renewals={item.renewals} />
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted font-bold mb-1">
              Remarks / Notes
            </p>
            {canEdit ? (
              <textarea
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                rows={3}
                placeholder="Add remarks about item condition, defects, investigations..."
                className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500 resize-none"
              />
            ) : (
              <p className="text-sm text-text-secondary bg-surface-secondary rounded-md p-2 border border-border-subtle">
                {item.remarks || "No remarks"}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-border-main px-6 py-3 flex justify-end gap-2 bg-surface-secondary">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover"
          >
            Close
          </button>
          {canEdit && (
            <button
              onClick={() => {
                onSaveRemarks(item.id, editRemarks);
                onClose();
              }}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 rounded-md hover:bg-emerald-800"
            >
              Save Remarks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category Filter Tabs ─────────────────────────────────────
function CategoryTabs({
  categories,
  totalCount,
  selected,
  onChange,
}: {
  categories: CategoryCount[];
  totalCount: number;
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange("all")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${selected === "all"
            ? "bg-emerald-700 text-white"
            : "bg-surface-secondary text-text-secondary border border-border-main hover:bg-surface-hover"
          }`}
      >
        All <span className="opacity-70">({totalCount})</span>
      </button>
      {categories.map((c) => (
        <button
          key={c.category}
          onClick={() => onChange(c.category)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${selected === c.category
              ? "bg-emerald-700 text-white"
              : "bg-surface-secondary text-text-secondary border border-border-main hover:bg-surface-hover"
            }`}
        >
          {c.category} <span className="opacity-70">({c.count})</span>
        </button>
      ))}
    </div>
  );
}

// ─── Redesigned Calendar ──────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PawnedCalendar({
  calendarData,
  selectedDate,
  onSelectDate,
  calendarYear,
  calendarMonth,
  onChangeMonth,
}: {
  calendarData: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  calendarYear: number;
  calendarMonth: number;
  onChangeMonth: (year: number, month: number) => void;
}) {
  const today = new Date();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const maxCount = Math.max(1, ...Object.values(calendarData));

  function goToPrev() {
    if (calendarMonth === 0) onChangeMonth(calendarYear - 1, 11);
    else onChangeMonth(calendarYear, calendarMonth - 1);
  }
  function goToNext() {
    if (calendarMonth === 11) onChangeMonth(calendarYear + 1, 0);
    else onChangeMonth(calendarYear, calendarMonth + 1);
  }

  return (
    <div className="rounded-2xl border border-border-main bg-surface overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-emerald-950 to-emerald-900 px-5 py-4">
        <button
          onClick={goToPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="text-center min-w-[140px]">
          <p className="text-white font-bold text-lg leading-tight">
            {MONTH_NAMES[calendarMonth]}
          </p>
          <p className="text-emerald-300 text-xs font-semibold">{calendarYear}</p>
        </div>
        <button
          onClick={goToNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-secondary">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="border-b border-r border-border-subtle/40 bg-surface-secondary/20 h-16"
              />
            );
          }

          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = calendarData[dateStr] || 0;
          const isToday =
            today.getFullYear() === calendarYear &&
            today.getMonth() === calendarMonth &&
            today.getDate() === day;
          const isSelected = selectedDate === dateStr;
          const intensity = count > 0 ? Math.ceil((count / maxCount) * 4) : 0;

          const bgIntensity = [
            "",
            "bg-emerald-500/10",
            "bg-emerald-500/20",
            "bg-emerald-500/35",
            "bg-emerald-500/50",
          ][intensity];

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative h-16 border-b border-r border-border-subtle/40 p-1.5 text-left transition-all hover:bg-emerald-50/10 ${bgIntensity} ${isSelected
                  ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/20"
                  : ""
                } ${isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
            >
              <span
                className={`text-xs font-bold leading-none ${isSelected
                    ? "text-emerald-400"
                    : isToday
                      ? "text-amber-400"
                      : count > 0
                        ? "text-text-primary"
                        : "text-text-muted"
                  }`}
              >
                {day}
              </span>
              {count > 0 && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="flex items-center gap-1">
                    <div className="h-1 flex-1 rounded-full bg-emerald-500/60" />
                    <span className="text-[9px] font-black text-emerald-400 leading-none">
                      {count}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between border-t border-border-subtle bg-surface-secondary/60 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/50" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Items pawned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm ring-1 ring-amber-400" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Today</span>
          </div>
        </div>
        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wide"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAWNED ITEMS PAGE
// ═══════════════════════════════════════════════════════════════
export default function PawnedItemsPage() {
  const userRole = "super_admin";
  const isSuperAdmin = userRole === "super_admin";
  const canEdit = userRole === "super_admin" || userRole === "admin";

  // Branch from global context — synced with header
  const { selectedBranch, branches, setSelectedBranch, isAllBranches } = useBranch();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("Active");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [pawnedItems, setPawnedItems] = useState<PawnedItem[]>([]);
  const [allDayItems, setAllDayItems] = useState<PawnedItem[]>([]); // unfiltered day items for category counts
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Category counts (list mode)
  const [categoryList, setCategoryList] = useState<CategoryCount[]>([]);
  const [categoryTotal, setCategoryTotal] = useState(0);

  // Calendar day-panel category filter — derived from fetched items (no extra API call)
  const [calendarCategory, setCalendarCategory] = useState("all");

  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "";

  const viewingItem =
    pawnedItems.find((item) => item.id === selectedItemId) ||
    allDayItems.find((item) => item.id === selectedItemId) ||
    null;

  // Compute calendar categories from ALL items on the selected day (unfiltered)
  const calendarCategoryList: CategoryCount[] = (() => {
    if (viewMode !== "calendar" || !selectedDate) return [];
    const counts: Record<string, number> = {};
    for (const item of allDayItems) {
      const cat = (item.category || "Uncategorized").trim();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  })();
  const calendarCategoryTotal = calendarCategoryList.reduce((s, c) => s + c.count, 0);

  // Calendar data
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});

  // Branch options for in-page filter (mirrors header)
  const branchOptions = branches.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const handleBranchChange = useCallback(
    (value: string) => {
      const found = branches.find((b) => b.id === value);
      if (found) setSelectedBranch(found);
    },
    [branches, setSelectedBranch]
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch.id, viewMode, category, status, searchQuery, selectedDate]);

  // Reset calendar category when date changes
  useEffect(() => {
    setCalendarCategory("all");
  }, [selectedDate]);

  // Fetch pawned items
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
          params.set("sort", "datetime_desc");
          params.set("page", String(currentPage));
          params.set("limit", String(itemsPerPage));

          const data = await api.get<{ items: PawnedItem[]; total: number }>(
            `/inventory/pawned?${params}`
          );
          setPawnedItems(data.items || []);
          setTotalItems(data.total || 0);
        } else {
          // Calendar mode — only fetch when a date is selected
          if (!selectedDate) {
            setPawnedItems([]);
            setAllDayItems([]);
            setTotalItems(0);
            setIsLoading(false);
            return;
          }

          // Fetch ALL items for the day (no category filter) for accurate counts
          params.set("date", selectedDate);
          params.set("sort", "datetime_desc");
          params.set("page", "1");
          params.set("limit", "500");

          const allData = await api.get<{ items: PawnedItem[]; total: number }>(
            `/inventory/pawned?${params}`
          );
          const all = allData.items || [];
          setAllDayItems(all);

          // Apply calendarCategory filter client-side
          const filtered = calendarCategory === "all"
            ? all
            : all.filter((i) => i.category === calendarCategory);
          setPawnedItems(filtered);
          setTotalItems(filtered.length);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [
    isAllBranches,
    selectedBranch.id,
    viewMode,
    category,
    status,
    searchQuery,
    selectedDate,
    currentPage,
    itemsPerPage,
    calendarCategory,
  ]);

  const handleSaveRemarks = useCallback(async (itemId: string, remarks: string) => {
    try {
      await api.post(`/inventory/pawned/${itemId}/remarks`, { remark: remarks });
      setPawnedItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, remarks } : i)));
    } catch (err) {
      console.error("Failed to save remarks:", err);
    }
  }, []);

  const [isQrScanOpen, setIsQrScanOpen] = useState(false);

  return (
    <div className="space-y-3 pb-4">
      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 bg-surface p-3 rounded-lg border border-border-main">
        <div className="flex flex-wrap items-end gap-3">
          {/* Branch filter — synced with header */}
          {isSuperAdmin && (
            <FilterSelect
              label="Branch"
              options={branchOptions}
              value={selectedBranch.id}
              onChange={handleBranchChange}
            />
          )}

          {/* Status */}
          <FilterSelect
            label="Status"
            options={pawnedStatusOptions}
            value={status}
            onChange={setStatus}
          />

          {/* Date picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Date
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate || ""}
                onChange={(e) => setSelectedDate(e.target.value || null)}
                className="h-10 rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none focus:border-emerald-500 pr-8"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="absolute right-2 text-text-muted hover:text-text-primary"
                  title="Clear date"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Search
            </label>
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
          <button onClick={() => setIsQrScanOpen(true)} className="flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            QR Scan
          </button>
          <div className="flex rounded-md border border-border-main overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "list"
                  ? "bg-emerald-700 text-white"
                  : "bg-surface text-text-secondary hover:bg-surface-hover"
                }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "calendar"
                  ? "bg-emerald-700 text-white"
                  : "bg-surface text-text-secondary hover:bg-surface-hover"
                }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* ── Category tabs — list mode only ───────────────────── */}
      {viewMode === "list" && categoryList.length > 0 && (
        <div className="bg-surface px-3 py-2.5 rounded-lg border border-border-main">
          <CategoryTabs
            categories={categoryList}
            totalCount={categoryTotal}
            selected={category}
            onChange={setCategory}
          />
        </div>
      )}

      {/* ── Active date filter indicator ─────────────────────── */}
      {selectedDate && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm text-text-secondary">
            Showing items for <span className="font-bold text-emerald-500">{selectedDateLabel}</span>
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="ml-auto text-xs font-bold text-text-muted hover:text-text-primary"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── List view ────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400">
                  {["ID", "Item Name", "Category", "Branch", "Date & Time", "Status", "Renewal", "Note"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-base text-zinc-400">
                      Loading...
                    </td>
                  </tr>
                ) : pawnedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-base text-zinc-400">
                      No pawned items found
                    </td>
                  </tr>
                ) : (
                  pawnedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60 cursor-pointer"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-400">
                        {item.itemId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                        {item.itemName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">
                        {item.category}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">
                        {item.branch}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-tertiary">
                        {item.pawnDate}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge
                          label={item.status}
                          variant={statusVariant[item.status] || "green"}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary font-medium">
                        {item.renewalCount > 0 ? `Renew ${item.renewalCount}` : "—"}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-text-tertiary max-w-[150px] truncate"
                        title={item.remarks || "No description"}
                      >
                        {item.remarks || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Calendar view ────────────────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="space-y-3">
          <PawnedCalendar
            calendarData={calendarData}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            onChangeMonth={(y, m) => {
              setCalendarYear(y);
              setCalendarMonth(m);
            }}
          />

          {/* Items panel for selected day */}
          {selectedDate && (
            <div className="rounded-lg border border-border-main bg-surface overflow-hidden">
              <div className="flex items-center justify-between bg-emerald-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-sm font-bold text-white">
                    Items pawned on{" "}
                    <span className="text-amber-400">{selectedDateLabel}</span>
                  </span>
                </div>
                <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-bold text-white">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Category filter for this day */}
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
                      {["ID", "Item Name", "Category", "Branch", "Status", "Renewal"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-left text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-zinc-400">
                          Loading...
                        </td>
                      </tr>
                    ) : pawnedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-zinc-400">
                          No items pawned on this day
                        </td>
                      </tr>
                    ) : (
                      pawnedItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-border-subtle hover:bg-surface-hover cursor-pointer transition-colors"
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-400">
                            {item.itemId}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-secondary">
                            {item.itemName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-tertiary">
                            {item.category}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-tertiary">
                            {item.branch}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <StatusBadge
                              label={item.status}
                              variant={statusVariant[item.status] || "green"}
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm text-text-secondary">
                            {item.renewalCount > 0 ? `Renew ${item.renewalCount}` : "—"}
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

      {viewingItem && <ViewModal item={viewingItem} onClose={() => setSelectedItemId(null)} onSaveRemarks={handleSaveRemarks} userRole={userRole} />}

      {isQrScanOpen && (
        <InventoryAuditModal
          isOpen={isQrScanOpen}
          onClose={() => setIsQrScanOpen(false)}
          onConfirm={() => setIsQrScanOpen(false)}
        />
      )}
    </div>
  );
}
