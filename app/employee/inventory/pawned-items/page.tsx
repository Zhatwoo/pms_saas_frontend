"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { useBranch } from "@/contexts/branch-context";
import { PawnedItemDetailsModal } from "@/components/shared/pawned-item-details-modal";

type PawnedStatus = "Active" | "Redeemed" | "Expired";
type ViewMode = "list" | "calendar";

interface Renewal {
  date: string;
  amount: number;
}

const getRenewalLabel = (count: number) => {
  if (count === 0) return "Original";
  if (count === 1) return "Renew 1";
  if (count === 2) return "Renew 2";
  if (count === 3) return "Renew 3";
  return `Renew ${count}`;
};

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
  amount: number;
}

const categoryOptions = [
  { value: "all", label: "All" },
  { value: "electronics", label: "Electronics" },
  { value: "jewellery", label: "Jewellery" },
  { value: "gadgets", label: "Gadgets" },
  { value: "vehicles", label: "Vehicles" },
];

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

function RenewalDetails({ renewals }: { renewals: Renewal[] }) {
  if (renewals.length === 0) return <span className="text-[10px] text-text-muted">No renewals yet</span>;
  return (
    <div className="space-y-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            Renew {i + 1}
          </span>
          <span className="text-[10px] text-text-secondary">{r.date}</span>
          <span className="text-[10px] font-bold text-text-primary">₱{r.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}


export default function EmployeePawnedItemsPage() {
  const searchParams = useSearchParams();
  const { selectedBranch } = useBranch();
  const branchIdent = selectedBranch.id;
  const highlightedItemId = searchParams.get("itemId")?.trim() || "";
  const hasHighlightedItem = Boolean(highlightedItemId);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // 1st of Month Logic
  useEffect(() => {
    const today = new Date();
    if (today.getDate() === 1) {
      setStatus("Active");
    }
  }, []);

  const [pawnedItems, setPawnedItems] = useState<PawnedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedItemId) {
      setViewMode("list");
    }
  }, [highlightedItemId]);

  useEffect(() => {
    if (!highlightedItemId || isLoading) return;

    const highlightedRow = document.getElementById(`pawned-item-${highlightedItemId}`);
    if (highlightedRow) {
      highlightedRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedItemId, isLoading, pawnedItems]);

  useEffect(() => { setCurrentPage(1); }, [category, status, searchQuery]);

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
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));

        const data = await api.get<{ items: PawnedItem[]; total: number }>(`/inventory/pawned?${params}`);
        setPawnedItems(data.items || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [branchIdent, category, status, searchQuery, currentPage]);

  const handleSaveRemarks = useCallback(async (itemId: string, remarks: string) => {
    try {
      await api.post(`/inventory/pawned/${itemId}/remarks`, { remark: remarks });
      setPawnedItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, remarks } : i)));
    } catch (err) {
      console.error("Failed to save remarks:", err);
    }
  }, []);



  return (
    <div className="space-y-4 pb-4 text-text-primary">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-border-main bg-surface-secondary/85 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Status" options={pawnedStatusOptions} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="h-9 w-44 rounded-md border border-input-border bg-input-bg px-3 text-xs text-text-primary outline-none transition-colors focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border-main bg-surface">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              List
            </button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              Calendar
            </button>
          </div>
        </div>
      </div>

      {hasHighlightedItem && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 shadow-sm shadow-black/10">
          Highlighted item from customer transaction history. The full list remains visible.
        </div>
      )}

      {viewMode === "list" && (
        <div className="overflow-hidden rounded-3xl border border-border-main bg-surface shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white">
                  {["Item ID", "Item Name", "Category", "Amount", "Date/Time", "Status", "Renewals", "Remarks/Notes", ""].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-text-muted">Loading branch inventory...</td></tr>
                ) : pawnedItems.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-text-muted">No pawned items found for this branch</td></tr>
                ) : (
                  pawnedItems.map((item, idx) => (
                    <Fragment key={item.id}>
                      <tr
                        id={`pawned-item-${item.itemId}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedItemId(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedItemId(item.id);
                          }
                        }}
                        className={`cursor-pointer border-t border-border-subtle transition-colors ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary/40"} ${highlightedItemId === item.itemId ? "bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)]" : "hover:bg-surface-hover"} ${hasHighlightedItem && highlightedItemId === item.itemId ? "scroll-mt-24" : ""}`}
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.itemId}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-text-primary">{item.itemName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-text-primary text-right">₱{(item.amount || 0).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-text-secondary">
                          <div className="font-bold">{item.pawnDate}</div>
                          <div className="opacity-50">10:30 AM</div> {/* Real time would come from API */}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${item.renewalCount > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                            {getRenewalLabel(item.renewalCount)}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-[10px] font-bold text-text-secondary" title={item.remarks}>{item.remarks || "No description provided"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button onClick={(event) => { event.stopPropagation(); setSelectedItemId(item.id); }} className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20">
                            View Details
                          </button>
                        </td>
                      </tr>
                      {expandedRow === item.itemId && (
                        <tr className="bg-amber-400/5">
                          <td colSpan={8} className="px-6 py-3 border-t border-amber-100">
                            <RenewalDetails renewals={item.renewals} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "calendar" && (
        <InventoryCalendar items={pawnedItems} />
      )}

      <div className="overflow-hidden rounded-3xl border border-border-main bg-surface shadow-lg shadow-black/20">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <PawnedItemDetailsModal 
        isOpen={Boolean(selectedItemId)} 
        itemId={selectedItemId} 
        onClose={() => setSelectedItemId(null)} 
        onSaveRemarks={handleSaveRemarks}
        userRole="employee"
      />
    </div>
  );
}
