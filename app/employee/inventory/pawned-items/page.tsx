"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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
                          <button onClick={() => setSelectedItemId(item.id)} className="rounded px-3 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors">
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
