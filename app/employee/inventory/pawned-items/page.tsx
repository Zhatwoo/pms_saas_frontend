"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";

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

function ViewModal({ item, onClose, onSaveRemarks}: {
  item: PawnedItem;
  onClose: () => void;
  onSaveRemarks: (id: string, remarks: string) => void;
}) {
  const [editRemarks, setEditRemarks] = useState(item.remarks || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-zinc-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white text-[10px] font-bold uppercase tracking-wider opacity-70">Item #{item.itemId}</p>
            <h2 className="text-white text-lg font-bold">{item.itemName}</h2>
          </div>
          <StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} />
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[10px] uppercase text-zinc-400 font-bold">Category</p><p className="text-sm text-zinc-800">{item.category}</p></div>
            <div><p className="text-[10px] uppercase text-zinc-400 font-bold">Branch</p><p className="text-sm text-zinc-800">{item.branch}</p></div>
            <div><p className="text-[10px] uppercase text-zinc-400 font-bold">Pawn Date</p><p className="text-sm text-zinc-800">{item.pawnDate}</p></div>
            <div><p className="text-[10px] uppercase text-zinc-400 font-bold">Renewal Count</p><p className="text-sm text-zinc-800 font-bold">{item.renewalCount}x</p></div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-400 font-bold mb-2">Renewal History</p>
            <RenewalDetails renewals={item.renewals} />
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-400 font-bold mb-1">Remarks / Notes</p>
            <textarea
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              rows={3}
              placeholder="Add remarks..."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>
        <div className="border-t border-zinc-200 px-6 py-3 flex justify-end gap-2 bg-zinc-50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-600 rounded-md border border-zinc-300 hover:bg-zinc-100">Close</button>
          <button
              onClick={() => { onSaveRemarks(item.id, editRemarks); onClose(); }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-md hover:bg-emerald-800"
            >
              Save Remarks
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeePawnedItemsPage() {
  const branchIdent = "makati"; // This would come from user context in production

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [pawnedItems, setPawnedItems] = useState<PawnedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<PawnedItem | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [category, status, searchQuery]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("branch", branchIdent);
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        if (searchQuery) params.set("search", searchQuery);
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/pawned?${params}`);
        const data = await res.json();
        setPawnedItems(data.items || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [category, status, searchQuery, currentPage]);

  const handleSaveRemarks = useCallback(async (itemId: string, remarks: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/pawned/${itemId}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: remarks }),
      });
      setPawnedItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, remarks } : i)));
    } catch (err) {
      console.error("Failed to save remarks:", err);
    }
  }, []);

  const handleQRScan = useCallback(() => {
    alert("Audit Scan: Scan items in vault to tally physical count vs system inventory.");
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
          <button onClick={handleQRScan} className="flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Audit Scan
          </button>
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
                  {["ID", "Item Name", "Category", "Pawn Date", "Status", "Renewals", "Remarks", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left">{h}</th>
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
                    <>
                      <tr key={item.itemId} className={`border-t border-zinc-100 ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50"} hover:bg-emerald-50/30 transition-colors`}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-800">{item.itemId}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-700">{item.itemName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">{item.pawnDate}</td>
                        <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2">
                          <button onClick={() => setExpandedRow(expandedRow === item.itemId ? null : item.itemId)} className="text-[10px] font-bold text-emerald-700 hover:underline">
                            {item.renewalCount}x ▾
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500 max-w-[120px] truncate" title={item.remarks}>{item.remarks || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                            <button onClick={() => setViewingItem(item)} className="rounded px-3 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                                View & Annotate
                            </button>
                        </td>
                      </tr>
                      {expandedRow === item.itemId && (
                        <tr key={`${item.itemId}-exp`} className="bg-amber-50/50">
                          <td colSpan={8} className="px-6 py-3 border-t border-amber-100">
                            <RenewalDetails renewals={item.renewals} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white py-16">
          <div className="text-center text-zinc-400">
            <p className="text-sm">Calendar view coming soon.</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {viewingItem && <ViewModal item={viewingItem} onClose={() => setViewingItem(null)} onSaveRemarks={handleSaveRemarks} />}
    </div>
  );
}
