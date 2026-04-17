"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { useBranch } from "@/contexts/branch-context";

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
  if (renewals.length === 0) return <span className="text-zinc-400 text-[10px]">No renewals yet</span>;
  return (
    <div className="space-y-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
            Renew {i + 1}
          </span>
          <span className="text-[10px] text-zinc-500">{r.date}</span>
          <span className="text-[10px] font-bold text-zinc-700">₱{r.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function ViewModal({ item, onClose, onSaveRemarks }: {
  item: PawnedItem;
  onClose: () => void;
  onSaveRemarks: (id: string, remarks: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-pawn-gold/20 scale-in-center" onClick={(e) => e.stopPropagation()}>
        <div className="bg-emerald-900 px-8 py-6 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="rounded-full bg-pawn-gold/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-pawn-gold border border-pawn-gold/30">
              Item #{item.itemId}
            </span>
            <StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} />
          </div>
          <h2 className="text-2xl font-black text-white">{item.itemName}</h2>
          <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-100">
          <div className="flex-1 p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Category</p>
                <p className="text-sm font-bold text-zinc-800">{item.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Branch Location</p>
                <p className="text-sm font-bold text-zinc-800">{item.branch}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Pawn Date</p>
                <p className="text-xs font-bold text-zinc-800">{item.pawnDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Renewal Cycle</p>
                <p className="text-xs font-black text-amber-600 uppercase italic underline decoration-amber-200 decoration-2">{getRenewalLabel(item.renewalCount)}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-50">
              <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 mb-2">Item Description / Remarks</p>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 min-h-[100px]">
                <p className="text-sm font-medium text-zinc-700 leading-relaxed italic">
                  "{item.remarks || "No additional notes or description provided for this item."}"
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 mb-3">Renewal History</p>
              <div className="rounded-xl border border-zinc-100 p-2">
                <RenewalDetails renewals={item.renewals} />
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 bg-zinc-50 p-8 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Security QR Code</p>
            <div className="relative mb-6">
              <div className="h-40 w-40 rounded-2xl bg-white p-3 shadow-xl shadow-zinc-200 border border-zinc-100 flex items-center justify-center">
                {/* Simulated QR Code */}
                <div className="grid grid-cols-5 grid-rows-5 gap-1 w-full h-full opacity-80">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? "bg-emerald-900" : "bg-transparent"}`} />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-emerald-700 p-2 text-white shadow-lg border-2 border-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 max-w-[120px]">
              Scan to verify physical item and prevent switching.
            </p>
            <div className="mt-8 h-24 w-full rounded-xl border border-dashed border-zinc-300 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-white/50">
              <div className="text-center">
                <svg className="mx-auto mb-2 opacity-50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Picture Placeholder
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50/50 px-8 py-4 flex justify-between items-center">
          <p className="text-[10px] font-bold text-zinc-400 italic">Created on: 2026-04-13</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-xs font-black text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95 shadow-sm">
              Back to List
            </button>
            <button className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95">
              Print QR Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeePawnedItemsPage() {
  const { selectedBranch } = useBranch();
  const branchIdent = selectedBranch.id;

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
  const [viewingItem, setViewingItem] = useState<PawnedItem | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
    <div className="space-y-3 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200">
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
              className="h-9 rounded-md border border-zinc-300 px-3 text-xs outline-none focus:border-emerald-500 w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-zinc-200 overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
              List
            </button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}>
              Calendar
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-white">
                  {["Item ID", "Item Name", "Category", "Amount", "Date/Time", "Status", "Renewals", "Remarks/Notes", ""].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-zinc-400">Loading branch inventory...</td></tr>
                ) : pawnedItems.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-zinc-400">No pawned items found for this branch</td></tr>
                ) : (
                  pawnedItems.map((item, idx) => (
                    <Fragment key={item.id}>
                      <tr className={`border-t border-zinc-100 ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50"} hover:bg-emerald-50/30 transition-colors`}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-800">{item.itemId}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-700 font-medium">{item.itemName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-zinc-800 text-right">₱{(item.amount || 0).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-zinc-500">
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
                        <td className="px-3 py-2 text-[10px] font-bold text-zinc-600 max-w-[200px] truncate" title={item.remarks}>{item.remarks || "No description provided"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button onClick={() => setViewingItem(item)} className="rounded px-3 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                            View Details
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

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {viewingItem && <ViewModal item={viewingItem} onClose={() => setViewingItem(null)} onSaveRemarks={handleSaveRemarks} />}
    </div>
  );
}
