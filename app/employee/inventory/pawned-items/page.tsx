"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { FilterSelect } from "@/components/shared/filter-select";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
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
  qr_code?: string;
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
  if (renewals.length === 0) return <span className="text-[10px] text-text-tertiary dark:text-zinc-400">No renewals yet</span>;
  return (
    <div className="space-y-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Renew {i + 1}
          </span>
          <span className="text-[10px] text-text-tertiary dark:text-zinc-400">{r.date}</span>
          <span className="text-[10px] font-bold text-text-secondary dark:text-zinc-300">{formatPeso(r.amount.toLocaleString())}</span>
        </div>
      ))}
    </div>
  );
}


export default function EmployeePawnedItemsPage() {
  const searchParams = useSearchParams();
  const { selectedBranch } = useBranch();
  const { user } = useAuth();
  const { currentStep, isComplete, completeInventoryAudit } = useOpeningChecklist();
  const branchIdent = selectedBranch.id;
  const highlightedItemId = searchParams.get("itemId")?.trim() || "";
  const isAdminOrSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const hasHighlightedItem = Boolean(highlightedItemId);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [qrSize, setQrSize] = useState<"small" | "large">("small");

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
        <p className="text-sm text-emerald-900/60 dark:text-zinc-300">
          Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.
        </p>
      </div>

      {!isComplete && currentStep === "INVENTORY_AUDIT" && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-100">Branch opening — inventory review</p>
            <p className="mt-1 text-xs text-zinc-300">
              Complete the branch inventory scan with your team; any employee can confirm here once the branch vault matches records.
            </p>
          </div>
          <button
            type="button"
            disabled={isCompletingOpening}
            onClick={() => void handleCompleteOpeningChecklist()}
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-emerald-950 shadow transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {isCompletingOpening ? "Saving…" : "Confirm branch inventory complete"}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border-main bg-surface-secondary/85 dark:bg-zinc-800/40 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="Category" options={categoryOptions} value={category} onChange={setCategory} />
            <FilterSelect label="Status" options={pawnedStatusOptions} value={status} onChange={setStatus} />
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted dark:text-zinc-400">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="h-9 rounded-md border border-input-border bg-input-bg dark:bg-zinc-700 dark:border-zinc-600 px-3 text-xs text-text-primary dark:text-zinc-100 outline-none transition-colors focus:border-emerald-500 dark:focus:border-emerald-400 w-44"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border-main bg-surface dark:bg-zinc-800">
              <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white dark:bg-emerald-600" : "bg-surface dark:bg-zinc-800 text-text-secondary dark:text-zinc-300 hover:bg-surface-hover dark:hover:bg-zinc-700"}`}>
                List
              </button>
              <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white dark:bg-emerald-600" : "bg-surface dark:bg-zinc-800 text-text-secondary dark:text-zinc-300 hover:bg-surface-hover dark:hover:bg-zinc-700"}`}>
                Calendar
              </button>
            </div>
            {isAdminOrSuperAdmin && (
              <div className="flex items-center gap-1.5">
                <select 
                  value={qrSize} 
                  onChange={(e) => setQrSize(e.target.value as "small" | "large")}
                  className="h-8 rounded border border-border-main bg-surface dark:bg-zinc-800 px-2 text-[10px] font-bold uppercase text-text-secondary dark:text-zinc-300 outline-none transition-colors focus:border-emerald-500 dark:focus:border-emerald-400"
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
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded border border-emerald-700 shadow-md whitespace-nowrap dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:border-emerald-600"
                >
                  PRINT QR
                </button>
              </div>
            )}
          </div>
        </div>


      {hasHighlightedItem && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 shadow-sm shadow-black/10 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
          Highlighted item from customer transaction history. The full list remains visible.
        </div>
      )}

      {viewMode === "list" && (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface dark:bg-zinc-900 shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-amber-400 dark:bg-emerald-950 dark:text-amber-300">
                  {["Item ID", "Item Name", "Category", "Amount", "Date/Time", "Status", "Renewals", "Remarks/Notes", isAdminOrSuperAdmin ? "QR" : null, ""]
                    .filter((h): h is string => h !== null)
                    .map((h) => (
                      <th key={h} className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-left dark:text-inherit ${h === "Amount" ? "text-right" : h === "QR" || h === "" ? "text-center" : ""}`}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="bg-surface dark:bg-zinc-900">
                    <td colSpan={9} className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                      <div className="flex items-center justify-center">
                        <LoadingSpinnerLabel text="Loading pawned items..." className="text-base font-medium text-text-tertiary" />
                      </div>
                    </td>
                  </tr>
                ) : pawnedItems.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500 bg-surface dark:bg-zinc-900">No pawned items found for this branch</td></tr>
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
                        className={`cursor-pointer border-t border-border-subtle transition-colors ${idx % 2 === 0 ? "bg-surface dark:bg-zinc-900" : "bg-surface-secondary/40 dark:bg-zinc-800"} ${highlightedItemId === item.itemId ? "bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)] dark:bg-amber-500/10 dark:ring-amber-500/40" : ""} ${hasHighlightedItem && highlightedItemId === item.itemId ? "scroll-mt-24" : ""}`}
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.itemId}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-text-primary dark:text-zinc-100">{item.itemName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary dark:text-zinc-400">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-text-primary text-right dark:text-zinc-100">{formatPeso((item.amount || 0).toLocaleString())}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-text-secondary dark:text-zinc-400">
                          <div className="font-bold">{item.pawnDate}</div>
                          <div className="opacity-50">10:30 AM</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2">
                          <button onClick={(event) => { event.stopPropagation(); setExpandedRow(expandedRow === item.itemId ? null : item.itemId); }} className={`text-[10px] font-bold text-emerald-700 hover:underline dark:text-emerald-400`}>
                            {item.renewalCount}x ▾
                          </button>
                        </td>
                        <td className="px-3 py-2 text-[10px] font-bold text-text-tertiary max-w-[200px] truncate dark:text-zinc-400" title={item.remarks}>{item.remarks || "No description provided"}</td>
                        {isAdminOrSuperAdmin && (
                          <td className="px-3 py-2 text-center">
                            {(item.qrCode || item.qr_code) ? (
                              <div className="flex justify-center">
                                <img
                                  src={item.qrCode || item.qr_code}
                                  alt={`${item.itemName} QR`}
                                  className="h-8 w-8 rounded border border-border-main bg-white p-0.5 object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button 
                            onClick={(event) => { event.stopPropagation(); setSelectedItemId(item.id); }} 
                            title="View Details"
                            className="inline-flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          >
                            {eyeIcon}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === item.itemId && (
                        <tr className="bg-amber-50/50 dark:bg-amber-900/20">
                          <td colSpan={isAdminOrSuperAdmin ? 10 : 9} className="px-6 py-3 border-t border-amber-100 dark:border-amber-800/30">
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

      <div className="overflow-hidden rounded-lg border border-border-main bg-surface dark:bg-zinc-900 shadow-lg shadow-black/20 mt-4">
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
        userRole={user?.role}
      />
    </div>
  );
}
