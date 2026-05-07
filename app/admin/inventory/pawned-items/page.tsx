"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatPeso } from "@/lib/currency";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { PawnedItemDetailsModal } from "@/components/shared/pawned-item-details-modal";
import { InventoryAuditModal } from "@/components/shared/inventory-audit-modal";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

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

const eyeIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const editIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const deleteIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const expireIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

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
          <span className="text-[10px] font-bold text-text-secondary">{formatPeso(r.amount.toLocaleString())}</span>
        </div>
      ))}
    </div>
  );
}

function EditPawnedItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: PawnedItem;
  onClose: () => void;
  onSaved: (updated: Partial<PawnedItem> & { id: string }) => void;
}) {
  const [itemName, setItemName] = useState(item.itemName);
  const [category, setCategory] = useState(item.category);
  const [remarks, setRemarks] = useState(item.remarks || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch(`/inventory/pawned/${item.id}`, {
        item_name: itemName,
        category,
        remarks,
      });
      onSaved({ id: item.id, itemName, category, remarks });
      toast.success("Item updated successfully.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-surface border border-border-main shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-900 px-6 py-4">
          <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Edit Pawned Item</p>
          <h2 className="text-white text-lg font-bold">{item.itemId}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Item Name</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500"
            >
              {categoryOptions.filter((o) => o.value !== "all").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>
        <div className="border-t border-border-main px-6 py-3 flex justify-end gap-2 bg-surface-secondary">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PawnedItemsPage({ viewOnly = false }: { viewOnly?: boolean } = {}) {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const userRole = user?.role || "employee";
  const canEdit = !viewOnly && (userRole === "super_admin" || userRole === "admin");

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [pawnedItems, setPawnedItems] = useState<PawnedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PawnedItem | null>(null);
  const [isQrScanOpen, setIsQrScanOpen] = useState(false);
  const [confirmIntent, setConfirmIntent] = useState<null | { type: "expire" | "delete"; itemId: string }>(null);
  const [qrSize, setQrSize] = useState<"small" | "large">("small");

  useEffect(() => { setCurrentPage(1); }, [category, status, searchQuery, selectedBranch.id]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        if (searchQuery) params.set("search", searchQuery);
        if (!isAllBranches) params.set("branch", selectedBranch.id);
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
  }, [category, status, searchQuery, currentPage, selectedBranch.id, isAllBranches]);

  const handleSaveRemarks = useCallback(async (itemId: string, remarks: string) => {
    try {
      await api.post(`/inventory/pawned/${itemId}/remarks`, { remark: remarks });
      setPawnedItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, remarks } : i)));
      toast.success("Remarks saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save remarks.");
      throw err;
    }
  }, []);

  const handleEditSaved = useCallback((updated: Partial<PawnedItem> & { id: string }) => {
    setPawnedItems((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)),
    );
  }, []);

  return (
    <div className="space-y-3 pb-4 text-text-primary -mt-2">
      <div>
        <p className="text-sm text-emerald-900/60 dark:text-zinc-400">
          Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.
        </p>
      </div>
      <div className={viewOnly ? "flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border-main bg-surface-secondary/85 p-5 shadow-lg shadow-black/20 backdrop-blur-sm" : "flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border-main bg-surface-secondary/85 p-4 shadow-lg shadow-black/20 backdrop-blur-sm"}>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <FilterSelect label="Status" options={pawnedStatusOptions} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-1">
            <label className={viewOnly ? "text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500" : "text-[10px] font-bold uppercase tracking-wide text-zinc-500"}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className={viewOnly ? "h-10 w-56 rounded-md border border-zinc-300 px-4 text-sm outline-none transition-colors focus:border-emerald-500" : "h-9 w-44 rounded-md border border-zinc-300 px-3 text-xs outline-none transition-colors focus:border-emerald-500"}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!viewOnly && (
            <button onClick={() => setIsQrScanOpen(true)} className="flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              QR Scan
            </button>
          )}
          <div className="flex overflow-hidden rounded-md border border-border-main bg-surface-secondary dark:border-slate-700 dark:bg-slate-900">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
              List
            </button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
              Calendar
            </button>
          </div>
          {userRole === "super_admin" && (
            <div className="flex items-center gap-1.5">
              <select 
                value={qrSize} 
                onChange={(e) => setQrSize(e.target.value as "small" | "large")}
                className="h-8 rounded border border-emerald-200 bg-white px-2 text-[10px] font-bold uppercase text-emerald-800 outline-none transition-colors focus:border-emerald-500"
              >
                <option value="small">Small</option>
                <option value="large">Large</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const sizeCm = qrSize === "small" ? "2cm" : "3cm";
                  const fontSize = qrSize === "small" ? "8px" : "10px";
                  
                  const qrHtml = pawnedItems.map(item => {
                    let qrUrl = "";
                    if (item.qrCode?.startsWith('http') || item.qrCode?.startsWith('data:')) {
                      qrUrl = item.qrCode;
                    } else {
                      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                      const publicViewUrl = `${baseUrl}/view-ticket/${encodeURIComponent(item.itemId)}`;
                      const encoded = encodeURIComponent(publicViewUrl);
                      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=250x250&color=065f46&bgcolor=f0fdf4&margin=2`;
                    }
                    
                    return `
                      <div style="display:inline-flex; flex-direction:column; align-items:center; margin:3mm; vertical-align:top;">
                        <img src="${qrUrl}" style="width:${sizeCm}; height:${sizeCm}; display:block;" />
                        <p style="font-family:sans-serif; font-size:${fontSize}; font-weight:bold; margin-top:1mm; color:#333;">${item.itemId}</p>
                      </div>
                    `;
                  }).join('');

                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  document.body.appendChild(iframe);
                  
                  const html = `<!DOCTYPE html>
                    <html>
                    <head>
                    <meta charset="utf-8">
                    <style>
                      * { margin: 0; padding: 0; }
                      @page { size: A4; margin: 5mm; }
                      body { display: flex; flex-wrap: wrap; padding: 5mm; }
                    </style>
                    </head>
                    <body>
                    ${qrHtml}
                    </body>
                    </html>`;

                  iframe.contentDocument?.open();
                  iframe.contentDocument?.write(html);
                  iframe.contentDocument?.close();

                  iframe.onload = () => {
                    setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => document.body.removeChild(iframe), 1000);
                    }, 500);
                  };
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded border border-emerald-700 shadow-md whitespace-nowrap transition-colors"
              >
                PRINT QR
              </button>
            </div>
          )}
        </div>
      </div>


      {viewMode === "list" && (
        <div className={viewOnly ? "overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300" : "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"}>
          <div className="overflow-x-auto">
            <table className={viewOnly ? "min-w-[1320px] w-full text-sm" : "w-full text-sm"}>
              <thead>
                <tr className={viewOnly ? "bg-emerald-900 text-amber-400" : "bg-gradient-to-r from-emerald-950 to-emerald-900 text-white"}>
                  {["ID", "Item Name", "Category", "Branch", "Pawn Date", "Status", "Renewals", "Remarks", "Actions"].map((h) => (
                    <th key={h} className={viewOnly ? `whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] ${h === "Actions" ? "text-center" : "text-left"}` : `whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
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
                  <tr><td colSpan={9} className="py-8 text-center text-sm text-zinc-400">No pawned items found</td></tr>
                ) : (
                  pawnedItems.map((item, idx) => (
                    <Fragment key={item.id}>
                      <tr onClick={viewOnly ? () => setSelectedItemId(item.id) : undefined} className={`border-t border-border-subtle transition-colors ${viewOnly ? "cursor-pointer bg-surface-secondary hover:bg-emerald-surface/60" : `${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary/40"} hover:bg-surface-hover`}`}>
                        <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm font-bold text-emerald-700" : "whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400"}>{item.itemId}</td>
                        <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-secondary" : "whitespace-nowrap px-3 py-2 text-xs text-text-secondary"}>{item.itemName}</td>
                        <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-tertiary" : "whitespace-nowrap px-3 py-2 text-xs text-text-tertiary"}>{item.category}</td>
                        <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-tertiary" : "whitespace-nowrap px-3 py-2 text-xs text-text-tertiary"}>{item.branch}</td>
                        <td className={viewOnly ? "whitespace-nowrap px-5 py-4 text-sm text-text-tertiary" : "whitespace-nowrap px-3 py-2 text-xs text-text-tertiary"}>{item.pawnDate}</td>
                        <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2">
                          <button onClick={(event) => { event.stopPropagation(); setExpandedRow(expandedRow === item.itemId ? null : item.itemId); }} className={viewOnly ? "text-sm font-bold text-emerald-700 hover:underline" : "text-[10px] font-bold text-emerald-700 hover:underline"}>
                            {item.renewalCount}x ▾
                          </button>
                        </td>
                        <td className={viewOnly ? "px-5 py-4 text-sm text-text-tertiary max-w-[180px] truncate" : "px-3 py-2 text-xs text-text-tertiary max-w-[120px] truncate"} title={item.remarks}>{item.remarks || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={(event) => { event.stopPropagation(); setSelectedItemId(item.id); }} 
                              title="View Details"
                              className="inline-flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                              {eyeIcon}
                            </button>
                            {canEdit && (
                              <>
                                <button 
                                  onClick={(event) => { event.stopPropagation(); setEditingItem(item); }} 
                                  title="Edit Item"
                                  className="inline-flex items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                  {editIcon}
                                </button>
                                {item.status === "Active" && (
                                  <button
                                    type="button"
                                    title="Mark as Expired"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmIntent({ type: "expire", itemId: item.id });
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-orange-600 transition-colors hover:bg-orange-100"
                                  >
                                    {expireIcon}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  title="Delete Item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmIntent({ type: "delete", itemId: item.id });
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100"
                                >
                                  {deleteIcon}
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

      {viewOnly ? (
        <div className="overflow-hidden rounded-2xl border border-border-main bg-surface-secondary/50 shadow-sm">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-3xl border border-border-main bg-surface shadow-lg shadow-black/20">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}


      <PawnedItemDetailsModal 
        isOpen={Boolean(selectedItemId)} 
        itemId={selectedItemId} 
        onClose={() => setSelectedItemId(null)} 
        onSaveRemarks={handleSaveRemarks}
        userRole={userRole}
      />

      {!viewOnly && editingItem && (
        <EditPawnedItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={handleEditSaved}
        />
      )}

      {!viewOnly && isQrScanOpen && (
        <InventoryAuditModal
          isOpen={isQrScanOpen}
          onClose={() => setIsQrScanOpen(false)}
          onConfirm={() => setIsQrScanOpen(false)}
        />
      )}

      {!viewOnly && (
        <ConfirmActionModal
          isOpen={confirmIntent !== null}
          title={confirmIntent?.type === "expire" ? "Mark as expired?" : "Delete pawned item?"}
          message={
            confirmIntent?.type === "expire"
              ? "This item will be marked expired and auto-transferred to Items For Sale."
              : "This cannot be undone. The pawned record will be removed from inventory."
          }
          confirmLabel={confirmIntent?.type === "expire" ? "Yes, mark expired" : "Yes, delete"}
          variant={confirmIntent?.type === "delete" ? "danger" : "warning"}
          onClose={() => setConfirmIntent(null)}
          onConfirm={async () => {
            if (!confirmIntent) return;
            const { type, itemId } = confirmIntent;
            try {
              if (type === "expire") {
                await api.post(`/inventory/pawned/${itemId}/expire`, {});
                setPawnedItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: "Expired" as PawnedStatus } : i)));
                toast.success("Item marked as expired.");
              } else {
                await api.delete(`/inventory/pawned/${itemId}`);
                setPawnedItems((prev) => prev.filter((i) => i.id !== itemId));
                toast.success("Item deleted.");
              }
            } catch (err) {
              toast.error(err instanceof Error ? err.message : type === "expire" ? "Failed to expire item." : "Failed to delete item.");
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
