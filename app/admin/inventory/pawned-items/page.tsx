"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { fetchCategories } from "@/lib/categories";
import { formatPeso } from "@/lib/currency";
import { buildQrSheetDocument, escapeHtml, printHtmlDocument } from "@/lib/print-templates";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaginationFooter } from "@/components/shared/pagination";
import { InventoryCalendar } from "@/components/shared/inventory-calendar";
import { PawnedItemDetailsModal } from "@/components/shared/pawned-item-details-modal";
import { InventoryAuditModal } from "@/components/shared/inventory-audit-modal";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { MoaModal } from "@/app/employee/pawn-transaction/_components/moa-modal";
import {
  calculatePeriodicStorageFee,
  calculateTransactionGadgetInterest,
} from "@/lib/interest";
import { getContractInterestRateGroup } from "@/lib/pawn-transaction-mapper";

const moaToastClassName =
  "mx-auto flex min-w-[260px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center shadow-xl backdrop-blur-sm sm:min-w-[320px]";

const moaLoadingIcon = (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
);

const moaSuccessIcon = (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);


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
  qr_code?: string; // Snake case fallback
  originalPhoto?: string;
  conditionReport?: string;
  condition?: string;
  items_included?: string;
  serial_number?: string;
  amount: number;
  interestRateSnapshot?: unknown;
  interest_rate_snapshot?: unknown;
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
];

const toolbarLabelClass = "text-[10px] font-bold uppercase tracking-wider text-text-tertiary";
const toolbarFieldClass = "h-10 w-full lg:w-56 rounded-md border border-border-main bg-surface-secondary px-4 text-sm text-text-primary outline-none transition-colors focus:border-brand-green";
const toolbarSelectClass = "h-10 w-full lg:w-56 rounded-md border border-border-main bg-surface-secondary px-4 text-sm text-text-primary outline-none transition-colors focus:border-brand-green";

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

const printerIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const expireIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

function RenewalDetails({ renewals }: { renewals: Renewal[] }) {
  if (renewals.length === 0) return <span className="text-text-muted text-[10px] dark:text-zinc-400">No renewals yet</span>;
  return (
    <div className="flex flex-col items-center gap-1.5">
      {renewals.map((r, i) => (
        <div key={i} className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            Renew {i + 1}
          </span>
          <span className="text-[10px] text-text-tertiary dark:text-zinc-400">{r.date}</span>
          <span className="text-[10px] font-bold text-text-secondary dark:text-zinc-300">{formatPeso(r.amount.toLocaleString())}</span>
        </div>
      ))}
    </div>
  );
}

function getPawnedItemInterestRatePercent(item: PawnedItem) {
  const contractRate = getContractInterestRateGroup(
    item.category,
    item.interestRateSnapshot ?? item.interest_rate_snapshot,
  );
  const interest = calculateTransactionGadgetInterest(item.amount, {
    pawnDate: item.pawnDate,
    category: item.category,
    rateGroup: contractRate,
  });

  return Number.isFinite(interest.percentage) ? interest.percentage : 0;
}

function EditPawnedItemModal({
  item,
  onClose,
  onSaved,
  categoriesList,
}: {
  item: PawnedItem;
  onClose: () => void;
  onSaved: (updated: Partial<PawnedItem> & { id: string }) => void;
  categoriesList: string[];
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
        <div className="bg-brand-green px-6 py-4">
          <p className="text-pawn-gold text-[10px] font-bold uppercase tracking-wider">Edit Pawned Item</p>
          <h2 className="text-white text-lg font-bold">{item.itemId}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Item Name</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-green"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-green"
            >
              {categoriesList.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-green resize-none"
            />
          </div>
        </div>
        <div className="border-t border-border-main px-6 py-3 flex justify-end gap-2 bg-surface-secondary">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-text-secondary rounded-md border border-border-main hover:bg-surface-hover">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-xs font-bold text-white bg-brand-green rounded-md hover:brightness-110 disabled:opacity-50">
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
  console.log("Current User Role:", userRole);
  const isAdminOrSuperAdmin = userRole.toLowerCase().includes("admin");
  const isSuperAdmin = userRole === "super_admin";
  const canEdit = !viewOnly && isAdminOrSuperAdmin;
  const tableColumnCount = isSuperAdmin ? 11 : 10;

  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  useEffect(() => {
    async function load() {
      const cats = await fetchCategories();
      setCategoriesList(cats.map((c) => c.name));
    }
    load();
  }, []);

  const categoryOptions = [
    { value: "all", label: "All" },
    ...categoriesList.map((name) => ({ value: name, label: name })),
  ];

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
  const [isPrintQrMenuOpen, setIsPrintQrMenuOpen] = useState(false);
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string | null>(() => todayString);
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});

  const [isMoaModalOpen, setIsMoaModalOpen] = useState(false);
  const [moaLoading, setMoaLoading] = useState(false);
  const [moaReprintData, setMoaReprintData] = useState<{
    firstName: string;
    middleName: string;
    lastName: string;
    address: string;
    contactNo: string;
    unitCode: string;
    unitName: string;
    category: string;
    serialNumber: string;
    itemsIncluded: string;
    condition: string;
    remarks: string;
    memory: string;
    amount: string;
    storageFee: string;
    purchasedDate: string;
    idPresented: string;
    branchName: string;
    branchAddress?: string;
    branchPhone?: string;
    processedBy?: string;
  } | null>(null);

  const handleReprintMoa = async (id: string) => {
    toast.loading("Loading Memorandum of Agreement (MOA)...", {
      id: "fetch-moa",
      icon: moaLoadingIcon,
      className: `${moaToastClassName} border-zinc-300/70 bg-white/90 text-zinc-900`,
    });
    try {
      const sourceItem = pawnedItems.find((item) => item.id === id);
      let itemDetails: any;
      let transactionFallback: any = null;
      try {
        itemDetails = await api.get<any>(`/inventory/pawned/${id}`);
      } catch {
        if (!sourceItem?.itemId) {
          throw new Error("Missing item code for MOA reprint fallback.");
        }
        itemDetails = await api.get<any>(`/inventory/item/${encodeURIComponent(sourceItem.itemId)}`);
      }

      const isMissing = (value?: string | null) => !value || value.trim() === "" || value.trim() === "---";
      if (
        isMissing(itemDetails?.items_included ?? itemDetails?.itemsIncluded) ||
        isMissing(itemDetails?.condition) ||
        isMissing(itemDetails?.memory_storage ?? itemDetails?.memoryStorage) ||
        !itemDetails?.created_by_user?.full_name
      ) {
        const params = id
          ? `relatedPawnedItemId=${encodeURIComponent(id)}`
          : sourceItem?.itemId
            ? `unitCode=${encodeURIComponent(sourceItem.itemId)}`
            : "";
        if (params) {
          try {
            transactionFallback = await api.get<any>(`/transactions/pawn-source?${params}`);
          } catch {
            transactionFallback = null;
          }
        }
      }

      if (!itemDetails) {
        toast.error("Item details not found.", { id: "fetch-moa" });
        return;
      }
      const customerDetails =
        itemDetails.customer ??
        itemDetails.customers ??
        transactionFallback?.pawned_item?.customer ??
        transactionFallback?.customer ??
        null;
      const customerFullName = customerDetails?.full_name || itemDetails.customerName || "WALK-IN CUSTOMER";
      const purchasedDateValue = itemDetails.pawn_date || itemDetails.pawnDate || "";
      const amountValue = Number(itemDetails.amount ?? 0);
      const categoryValue = itemDetails.category || "---";
      const unitCodeValue = itemDetails.item_id || itemDetails.itemId || "---";
      const unitNameValue = itemDetails.item_name || itemDetails.itemName || "---";
      const itemAddress =
        [
          customerDetails?.address ?? itemDetails.customerAddress,
          customerDetails?.barangay,
          customerDetails?.city,
          customerDetails?.province ?? customerDetails?.region
        ]
          .filter(Boolean)
          .join(", ") || "---";


      const fullName = customerFullName;
      const names = fullName.trim().split(" ");
      const firstName = names[0] || "WALK-IN";
      const middleName = customerDetails?.middle_name || (names.length > 2 ? names.slice(1, -1).join(" ") : "");
      const lastName = names.length > 1 ? names[names.length - 1] : "---";

      let branchAddress = "";
      let branchPhone = "";
      try {
        const branchList = await api.get<any[]>("/branches");
        const match = branchList?.find((b: any) => b.name === itemDetails.branch);
        if (match) {
          branchAddress = match.location || "";
          branchPhone = match.contact_number || match.contactNumber || match.phone || "";
        }
      } catch (err) {
        console.warn("Failed to fetch branches details", err);
      }

      setMoaReprintData({
        firstName,
        middleName,
        lastName,
        address: itemAddress,
        contactNo: customerDetails?.contact_number || itemDetails.customerContact || "",
        unitCode: unitCodeValue,
        unitName: unitNameValue,
        category: categoryValue,
        serialNumber: itemDetails.serial_number || itemDetails.serialNumber || "---",
        itemsIncluded:
          itemDetails.items_included ||
          itemDetails.itemsIncluded ||
          transactionFallback?.pawned_item?.items_included ||
          "---",
        condition: itemDetails.condition || transactionFallback?.pawned_item?.condition || "---",
        remarks: itemDetails.remarks || "---",
        memory:
          itemDetails.memory_storage ||
          itemDetails.memoryStorage ||
          transactionFallback?.pawned_item?.memory_storage ||
          "---",
        amount: String(amountValue),
        storageFee: String(calculatePeriodicStorageFee(amountValue, categoryValue)),
        purchasedDate: purchasedDateValue,
        idPresented: customerDetails?.id_presented || itemDetails.customerIdPresented || "---",
        branchName: itemDetails.branch || "",
        branchAddress,
        branchPhone,
        processedBy:
          itemDetails.created_by_user?.full_name ||
          transactionFallback?.created_by_user?.full_name ||
          itemDetails.createdByName ||
          "AUTHORIZED PERSONNEL"
      });
      setIsMoaModalOpen(true);
      toast.success("MOA loaded successfully!", {
        id: "fetch-moa",
        icon: moaSuccessIcon,
        className: `${moaToastClassName} border-emerald-300/70 bg-emerald-100/90 text-emerald-900`,
      });
    } catch (err) {
      console.error("Failed to load MOA reprint data", err);
      toast.error("Failed to load MOA reprint details.", { id: "fetch-moa" });
    }
  };

  const handlePrintQr = useCallback((size: "small" | "large") => {
    const sizeCm = size === "small" ? "2cm" : "3cm";
    const fontSize = size === "small" ? "8px" : "10px";

    const cardsHtml = pawnedItems
      .map((item) => {
        let qrUrl = "";
        const itemQr = item.qrCode || item.qr_code;

        if (itemQr?.startsWith("http") || itemQr?.startsWith("data:")) {
          qrUrl = itemQr;
        } else {
          const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
          const publicViewUrl = `${baseUrl}/view-ticket/${encodeURIComponent(item.itemId)}`;
          const encoded = encodeURIComponent(publicViewUrl);
          qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=250x250&color=0B5D3B&bgcolor=f0fdf4&margin=2`;
        }

        return `
        <div style="display:inline-flex; flex-direction:column; align-items:center; margin:3mm; vertical-align:top;">
          <img src="${qrUrl}" style="width:${sizeCm}; height:${sizeCm}; display:block;" alt="" />
          <p style="font-size:${fontSize}; font-weight:800; margin-top:1mm; color:#18181b;">${escapeHtml(item.itemId)}</p>
        </div>
      `;
      })
      .join("");

    printHtmlDocument(
      buildQrSheetDocument({
        sheetTitle: "Pawned inventory — QR labels",
        cardsHtml,
      }),
      { printDelayMs: 650 },
    );
  }, [pawnedItems]);

  useEffect(() => { setCurrentPage(1); }, [category, status, searchQuery, selectedBranch.id, selectedDate, viewMode]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (status !== "all") params.set("status", status);
        if (searchQuery) params.set("search", searchQuery);
        if (viewMode === "calendar" && selectedDate) params.set("date", selectedDate);
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));

        const data = await api.get<{ items: PawnedItem[]; total: number }>(`/inventory/pawned?${params}`);
        console.log("Pawned Items Data:", data.items);
        setPawnedItems(data.items || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [category, status, searchQuery, selectedDate, currentPage, selectedBranch.id, isAllBranches, viewMode]);

  useEffect(() => {
    async function fetchCalendar() {
      if (viewMode !== "calendar") return;

      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("month", `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`);
        const data = await api.get<Record<string, number>>(`/inventory/pawned-calendar?${params}`);
        setCalendarData(data || {});
      } catch (err) {
        console.error("Calendar fetch error:", err);
        setCalendarData({});
      }
    }

    void fetchCalendar();
  }, [calendarMonth, calendarYear, isAllBranches, selectedBranch.id, viewMode]);

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
        <p className="text-sm text-brand-green/60 dark:text-zinc-300">
          Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.
        </p>
      </div>
      <div className={viewOnly ? "flex flex-col items-start gap-4 rounded-lg border border-border-main bg-surface p-5 shadow-lg shadow-black/20 backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between" : "flex flex-col items-start gap-3 rounded-lg border border-border-main bg-surface p-4 shadow-lg shadow-black/20 backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between"}>
        <div className="grid w-full grid-cols-3 items-end gap-3 lg:flex lg:w-auto lg:flex-wrap">
          <div className="order-1 flex min-w-0 flex-col gap-1 lg:order-2">
            <label className={toolbarLabelClass}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={toolbarSelectClass}>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="order-2 flex min-w-0 flex-col gap-1 lg:order-3">
            <label className={toolbarLabelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={toolbarSelectClass}>
              {pawnedStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="order-3 flex min-w-0 flex-col gap-1 lg:order-1">
            <label className={toolbarLabelClass}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className={viewOnly ? "h-10 w-full rounded-md border border-border-main bg-surface-secondary px-4 text-sm text-text-primary outline-none transition-colors focus:border-brand-green lg:w-56" : toolbarFieldClass}
            />
          </div>
        </div>

        <div className="flex w-full items-center gap-3 lg:w-auto">
          {viewOnly ? (
            <>
              {isSuperAdmin && (
                <div className="relative">
                  <ActionButton
                    variant="primary"
                    className="border-brand-green bg-brand-green text-pawn-gold"
                    onClick={() => setIsPrintQrMenuOpen((prev) => !prev)}
                  >
                    <span className="flex items-center gap-1.5">
                      {printerIcon}
                      Print QR
                    </span>
                  </ActionButton>
                  {isPrintQrMenuOpen && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-32 overflow-hidden rounded-md border border-border-main bg-surface shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPrintQrMenuOpen(false);
                          handlePrintQr("small");
                        }}
                        className="w-full px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
                      >
                        Small
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPrintQrMenuOpen(false);
                          handlePrintQr("large");
                        }}
                        className="w-full border-t border-border-subtle px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
                      >
                        Large
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex overflow-hidden rounded-md border border-border-main bg-surface">
                <button onClick={() => setViewMode("list")} className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-brand-green text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}>
                  List
                </button>
                <button onClick={() => setViewMode("calendar")} className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-brand-green text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}>
                  Calendar
                </button>
              </div>
            </>
          ) : (
            <>
              {!viewOnly && (
                <button onClick={() => setIsQrScanOpen(true)} className="flex items-center gap-1.5 rounded-md border border-brand-green bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green transition-colors hover:bg-brand-green/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                  QR Scan
                </button>
              )}
              <div className="flex overflow-hidden rounded-md border border-border-main bg-surface-secondary dark:border-slate-700 dark:bg-slate-900">
                <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${viewMode === "list" ? "bg-brand-green text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                  List
                </button>
                <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 ${viewOnly ? "text-sm font-semibold" : "text-xs font-medium"} transition-colors ${viewMode === "calendar" ? "bg-brand-green text-white shadow-sm" : "bg-transparent text-text-secondary hover:bg-surface-hover dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                  Calendar
                </button>
              </div>
              {userRole === "super_admin" && (
                <div className="relative">
                  <ActionButton variant="outline" className="!border-brand-green !bg-surface !text-brand-green hover:!opacity-80" onClick={() => setIsPrintQrMenuOpen((prev) => !prev)}>
                    <span className="flex items-center gap-1.5">
                      {printerIcon}
                      Print QR
                    </span>
                  </ActionButton>
                  {isPrintQrMenuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 w-32 overflow-hidden rounded-md border border-border-main bg-surface shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPrintQrMenuOpen(false);
                          handlePrintQr("small");
                        }}
                        className="w-full px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
                      >
                        Small
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPrintQrMenuOpen(false);
                          handlePrintQr("large");
                        }}
                        className="w-full border-t border-border-subtle px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
                      >
                        Large
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {viewMode === "calendar" && (
        <div className="mb-4">
          <InventoryCalendar
            items={pawnedItems}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            calendarData={calendarData}
            onVisibleMonthChange={(year, month) => {
              setCalendarYear(year);
              setCalendarMonth(month);
            }}
          />
        </div>
      )}

      <div className={viewOnly ? "overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300" : "overflow-hidden rounded-lg border border-border-main bg-surface shadow-sm"}>
          <div className="overflow-x-auto">
            <table className={viewOnly ? "min-w-[1420px] w-full text-sm" : "w-full text-sm"}>
              <thead>
                <tr className="bg-brand-green text-pawn-gold">
                  {["ID", "Item Name", "Category", "Branch", "Pawn Date", "Interest Rate %", "Status", "Renewals", "Remarks", isSuperAdmin ? "QR" : null, "Actions"]
                    .filter((h): h is string => h !== null)
                    .map((h) => (
                      <th key={h} className={`whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-xs font-bold uppercase tracking-wide dark:text-inherit ${h === "Interest Rate %" || h === "Renewals" || h === "Actions" || h === "QR" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="bg-surface">
                    <td colSpan={tableColumnCount} className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                      <div className="flex items-center justify-center">
                        <LoadingSpinnerLabel text="Loading pawned items..." className="text-base font-medium text-text-tertiary" />
                      </div>
                    </td>
                  </tr>
                ) : pawnedItems.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount} className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500 bg-surface">
                      {viewMode === "calendar" && selectedDate ? "No items on this day" : "No pawned items found"}
                    </td>
                  </tr>
                ) : (
                  pawnedItems.map((item, idx) => (
                    <Fragment key={item.id}>
                      <tr onClick={viewOnly ? () => setSelectedItemId(item.id) : undefined} className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60">
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-brand-green">{item.itemId}</td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-secondary dark:text-zinc-300">{item.itemName}</td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-tertiary dark:text-zinc-400">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-tertiary dark:text-zinc-400">{item.branch}</td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-tertiary dark:text-zinc-400">{item.pawnDate}</td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-center text-sm font-black text-brand-green">
                          {getPawnedItemInterestRatePercent(item)}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3"><StatusBadge label={item.status} variant={statusVariant[item.status] || "green"} /></td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                          <button onClick={(event) => { event.stopPropagation(); setExpandedRow(expandedRow === item.itemId ? null : item.itemId); }} className={viewOnly ? "mx-auto inline-flex text-sm font-bold text-brand-green hover:underline" : "mx-auto inline-flex text-xs font-bold text-brand-green hover:underline"}>
                            {item.renewalCount}x ▾
                          </button>
                        </td>
                        <td className={viewOnly ? "px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-tertiary max-w-[180px] truncate dark:text-zinc-400" : "px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-tertiary max-w-[180px] truncate dark:text-zinc-400"} title={item.remarks}>{item.remarks || "—"}</td>
                        {isSuperAdmin && (
                          <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                            {(item.qrCode || item.qr_code) ? (
                              <div className="flex justify-center">
                                <img
                                  src={item.qrCode || item.qr_code}
                                  alt={`${item.itemName} QR`}
                                  className="h-8 w-8 rounded border border-border-main bg-surface p-0.5 object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-text-muted dark:text-zinc-500">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(event) => { event.stopPropagation(); setSelectedItemId(item.id); }}
                              title="View Details"
                              className="inline-flex items-center justify-center rounded-lg border border-brand-green/30 bg-brand-green/10 p-2 text-brand-green transition-colors hover:bg-brand-green/20"
                            >
                              {eyeIcon}
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleReprintMoa(item.id);
                              }}
                              title="View/Print MOA Slip"
                              className="inline-flex items-center justify-center rounded-lg border border-brand-green/30 bg-brand-green/10 p-2 text-brand-green transition-colors hover:bg-brand-green/20"
                            >
                              {printerIcon}
                            </button>
                            {canEdit && (
                              <>
                                <button 
                                  onClick={(event) => { event.stopPropagation(); setEditingItem(item); }} 
                                  title="Edit Item"
                                  className="inline-flex items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                >
                                  {editIcon}
                                </button>
                                <button
                                  type="button"
                                  title="Delete Item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmIntent({ type: "delete", itemId: item.id });
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400 dark:hover:bg-red-500/10"
                                >
                                  {deleteIcon}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === item.itemId && (
                        <tr className="bg-amber-50/50 dark:bg-amber-900/20">
                          <td colSpan={tableColumnCount} className="px-6 py-3 border-t border-amber-100 text-center dark:border-amber-800/30">
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

      {viewOnly ? (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface-secondary/50 dark:bg-zinc-800/50 shadow-sm">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-border-main bg-surface dark:bg-zinc-900 shadow-lg shadow-black/20">
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
          categoriesList={categoriesList}
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

      {moaReprintData && (
        <MoaModal
          isOpen={isMoaModalOpen}
          onClose={() => setIsMoaModalOpen(false)}
          onConfirm={() => setIsMoaModalOpen(false)}
          data={moaReprintData}
          isLoading={moaLoading}
          mode="view"
        />
      )}
    </div>
  );
}
