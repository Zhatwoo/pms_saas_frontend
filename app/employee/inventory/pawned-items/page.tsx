"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { useBranch } from "@/contexts/branch-context";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { PawnedItemDetailsModal } from "@/components/shared/pawned-item-details-modal";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { formatPeso } from "@/lib/currency";

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

const eyeIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function RenewalDetails({ renewals }: { renewals: Renewal[] }) {
  if (renewals.length === 0) return <span className="text-[10px] text-zinc-400">No renewals yet</span>;
  return (
    <div className="space-y-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            Renew {i + 1}
          </span>
          <span className="text-[10px] text-zinc-500">{r.date}</span>
          <span className="text-[10px] font-bold text-zinc-700">{formatPeso(r.amount.toLocaleString())}</span>
        </div>
      ))}
    </div>
  );
}


export default function EmployeePawnedItemsPage() {
  const searchParams = useSearchParams();
  const { selectedBranch } = useBranch();
  const { currentStep, isComplete, completeInventoryAudit } = useOpeningChecklist();
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

  const [isCompletingOpening, setIsCompletingOpening] = useState(false);

  const handleCompleteOpeningChecklist = useCallback(async () => {
    setIsCompletingOpening(true);
    try {
      await completeInventoryAudit();
    } catch (e) {
      console.error("Failed to complete opening checklist:", e);
    } finally {
      setIsCompletingOpening(false);
    }
  }, [completeInventoryAudit]);

  return (
    <div className="space-y-3 pb-4 text-text-primary -mt-2">
      <div>
        <p className="text-sm text-emerald-900/60 dark:text-zinc-400">
          Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.
        </p>
      </div>

      {!isComplete && currentStep === "INVENTORY_AUDIT" && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-100">Opening checklist — inventory review</p>
            <p className="mt-1 text-xs text-zinc-300">
              After reviewing pawned inventory for your branch, confirm here to finish opening and unlock the rest of the app.
            </p>
          </div>
          <button
            type="button"
            disabled={isCompletingOpening}
            onClick={() => void handleCompleteOpeningChecklist()}
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-emerald-950 shadow transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {isCompletingOpening ? "Saving…" : "Confirm inventory review complete"}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border-main bg-surface-secondary/85 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Status" options={pawnedStatusOptions} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="h-9 rounded-md border border-zinc-300 px-3 text-xs outline-none transition-colors focus:border-emerald-500 w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-zinc-200 overflow-hidden bg-surface">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
              List
            </button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
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
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400">
                  {["Item ID", "Item Name", "Category", "Amount", "Date/Time", "Status", "Renewals", "Remarks/Notes", ""].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-zinc-400">
                      <div className="flex items-center justify-center">
                        <LoadingSpinnerLabel text="Loading pawned items..." className="text-base font-medium text-text-tertiary" />
                      </div>
                    </td>
                  </tr>
                ) : pawnedItems.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-sm text-zinc-400">No pawned items found for this branch</td></tr>
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
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-text-primary text-right">{formatPeso((item.amount || 0).toLocaleString())}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-text-secondary">
                          <div className="font-bold">{item.pawnDate}</div>
                          <div className="opacity-50">10:30 AM</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${item.renewalCount > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                            {getRenewalLabel(item.renewalCount)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[10px] font-bold text-zinc-600 max-w-[200px] truncate" title={item.remarks}>{item.remarks || "No description provided"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button 
                            onClick={(event) => { event.stopPropagation(); setSelectedItemId(item.id); }} 
                            title="View Details"
                            className="inline-flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                          >
                            {eyeIcon}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === item.itemId && (
                        <tr className="bg-amber-50/50">
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

      <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20 mt-4">
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
