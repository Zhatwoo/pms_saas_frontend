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

// ─── Renewal Details ──────────────────────────────────────────
function RenewalDetails({ renewals }: { renewals: Renewal[] }) {
  if (renewals.length === 0) return <span className="text-text-muted text-[10px]">No renewals yet</span>;
  return (
    <div className="space-y-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
            Renew {i + 1}
          </span>
          <span className="text-[10px] text-text-tertiary">{r.date}</span>
          <span className="text-[10px] font-bold text-text-secondary">₱{r.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────
function ViewModal({ item, onClose, onSaveRemarks, userRole }: {
  item: PawnedItem;
  onClose: () => void;
  onSaveRemarks: (id: string, remarks: string) => void;
  userRole: string;
}) {
  const [editRemarks, setEditRemarks] = useState(item.remarks || "");
  const canEdit = userRole === "super_admin" || userRole === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-surface shadow-2xl border border-border-main overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Item #{item.itemId}</p>
            <h2 className="text-white text-lg font-bold">{item.itemName}</h2>
          </div>
          <StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} />
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[10px] uppercase text-text-muted font-bold">Category</p><p className="text-sm text-text-primary">{item.category}</p></div>
            <div><p className="text-[10px] uppercase text-text-muted font-bold">Branch</p><p className="text-sm text-text-primary">{item.branch}</p></div>
            <div><p className="text-[10px] uppercase text-text-muted font-bold">Pawn Date</p><p className="text-sm text-text-primary">{item.pawnDate}</p></div>
            <div><p className="text-[10px] uppercase text-text-muted font-bold">Renewal Count</p><p className="text-sm text-text-primary font-bold">{item.renewalCount}x</p></div>
          </div>
          {item.status === "Expired" && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase text-red-600 tracking-wider">Expired Item — QR Security Info</p>
              {item.originalPhoto && <div><p className="text-[10px] text-text-tertiary">Original Photo:</p><p className="text-xs text-text-secondary">{item.originalPhoto}</p></div>}
              {item.conditionReport && <div><p className="text-[10px] text-text-tertiary">Condition Report:</p><p className="text-xs text-text-secondary">{item.conditionReport}</p></div>}
              {item.qrCode && <div><p className="text-[10px] text-text-tertiary">QR Code:</p><p className="text-xs font-mono text-text-secondary">{item.qrCode}</p></div>}
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase text-text-muted font-bold mb-2">Renewal History</p>
            <RenewalDetails renewals={item.renewals} />
          </div>
          <div>
            <p className="text-[10px] uppercase text-text-muted font-bold mb-1">Remarks / Notes</p>
            {canEdit ? (
              <textarea
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                rows={3}
                placeholder="Add remarks about item condition, defects, investigations..."
                className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-xs text-text-primary outline-none focus:border-emerald-500 resize-none"
              />
            ) : (
              <p className="text-xs text-text-secondary bg-surface-secondary rounded-md p-2 border border-border-subtle">{item.remarks || "No remarks"}</p>
            )}
          </div>
        </div>
        <div className="border-t border-border-main px-6 py-3 flex justify-end gap-2 bg-surface-secondary">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover">Close</button>
          {canEdit && (
            <button
              onClick={() => { onSaveRemarks(item.id, editRemarks); onClose(); }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-md hover:bg-emerald-800"
            >
              Save Remarks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAWNED ITEMS PAGE (Under Inventory)
// ═══════════════════════════════════════════════════════════════
export default function PawnedItemsPage() {
  const userRole = "super_admin";
  const isSuperAdmin = userRole === "super_admin";
  const canEdit = userRole === "super_admin" || userRole === "admin";

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

  const handleMarkExpired = useCallback(async (itemId: string) => {
    if (!confirm("Mark this item as Expired? It will be auto-transferred to Items For Sale.")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/pawned/${itemId}/expire`, {
        method: "POST",
      });
      setPawnedItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: "Expired" as PawnedStatus } : i)));
    } catch (err) {
      console.error("Failed to expire item:", err);
    }
  }, []);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this pawned item? This cannot be undone.")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/pawned/${itemId}`, {
        method: "DELETE",
      });
      setPawnedItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  }, []);

  const handleQRScan = useCallback(() => {
    alert("QR Scanner will open here. Scan all items in the vault to tally physical count vs system inventory.");
  }, []);

  return (
    <div className="space-y-3 pb-4">
      {/* Filters and Controls */}
      <div className="flex flex-wrap items-end justify-between gap-3 bg-surface p-3 rounded-lg border border-border-main transition-colors duration-300">
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
              className="h-9 rounded-md border border-input-border bg-input-bg px-3 text-xs text-text-primary outline-none focus:border-emerald-500 w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleQRScan} className="flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            QR Scan
          </button>
          <div className="flex rounded-md border border-border-main overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              List
            </button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              Calendar
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400">
                  {["ID", "Item Name", "Category", "Branch", "Pawn Date", "Status", "Renewals", "Remarks", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="py-8 text-center text-sm text-zinc-400">Loading...</td></tr>
                ) : pawnedItems.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-sm text-zinc-400">No pawned items found</td></tr>
                ) : (
                  pawnedItems.map((item, idx) => (
                    <>
                      <tr key={item.itemId} className={`border-t border-border-subtle ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"} hover:bg-surface-hover transition-colors`}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-800">{item.itemId}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">{item.itemName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.branch}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-text-tertiary">{item.pawnDate}</td>
                        <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2">
                          <button onClick={() => setExpandedRow(expandedRow === item.itemId ? null : item.itemId)} className="text-[10px] font-bold text-emerald-700 hover:underline">
                            {item.renewalCount}x ▾
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs text-text-tertiary max-w-[120px] truncate" title={item.remarks}>{item.remarks || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => setViewingItem(item)} className="rounded px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                              View
                            </button>
                            {canEdit && (
                              <>
                                <button className="rounded px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100">
                                  Edit
                                </button>
                                {item.status === "Active" && (
                                  <button onClick={() => handleMarkExpired(item.id)} className="rounded px-2 py-1 text-[10px] font-bold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100">
                                    Expire
                                  </button>
                                )}
                                <button onClick={() => handleDelete(item.id)} className="rounded px-2 py-1 text-[10px] font-bold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === item.itemId && (
                        <tr key={`${item.itemId}-exp`} className="bg-amber-50/50">
                          <td colSpan={9} className="px-6 py-3 border-t border-amber-100">
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
        <div className="flex items-center justify-center rounded-lg border border-border-main bg-surface py-16 transition-colors duration-300">
          <div className="text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-zinc-300">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-sm text-zinc-400">Calendar view — browse pawned items by pawn date or expiry.</p>
            <p className="text-xs text-zinc-300 mt-1">Coming soon in next sprint.</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {viewingItem && <ViewModal item={viewingItem} onClose={() => setViewingItem(null)} onSaveRemarks={handleSaveRemarks} userRole={userRole} />}
    </div>
  );
}
