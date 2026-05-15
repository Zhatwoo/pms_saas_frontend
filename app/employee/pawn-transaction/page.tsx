"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { TransactionActions, type FilterType, type ViewMode } from "./_components/transaction-actions";
import { api } from "@/lib/api";
import { PaginationFooter } from "@/components/shared/pagination";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable, type TransactionRow, type PurposeType } from "./_components/transaction-table";
import { RenewModal } from "./_components/renew-modal";
import { NewPawnModal } from "./_components/new-pawn-modal";
import { RedeemModal } from "./_components/redeem-modal";
import { BuyBackModal } from "./_components/buy-back-modal";
import { SellsTransferModal } from "./_components/sells-transfer-modal";
import { ReserveLayawayModal } from "./_components/reserve-layaway-modal";
import { MoaModal } from "./_components/moa-modal";
import { ActionButton } from "@/components/shared/action-button";
import { TransactionDetailsModal } from "@/components/shared/transaction-details-modal";
import { QRReplacementRequestModal } from "@/components/shared/qr-replacement-request-modal";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";
import { QrScanner } from "@/components/shared/qr-scanner";
import { Role } from "@/types";
import { calculateGadgetInterest } from "@/lib/interest";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { formatPeso } from "@/lib/currency";
import { operationalCashTotalsForPawnEnding } from "@/lib/ledger-operational-totals";
import { BranchDaySessionToolbar } from "@/components/shared/branch-day-session-toolbar";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";

// Use shared `PurposeType` and `FilterType` imported from components
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Sells / Transfer": "Sold Item",
  "Redeem": "Redeem",
  "Buy Back": "Buy Back",
  "Reserve / Layaway": "Reserve / Layaway",
  "Pawn": "Pawn",
  "Start": "Start",
  "Buy Out": "Buy Out",
  "Sold Item": "Sold Item",
};

const downloadIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const printerIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatSelectedDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildCalendarCells(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function TransactionsCalendar({
  calendarData,
  selectedDate,
  onSelectDate,
  calendarYear,
  calendarMonth,
  onChangeMonth,
}: {
  calendarData: Record<string, number>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  calendarYear: number;
  calendarMonth: number;
  onChangeMonth: (year: number, month: number) => void;
}) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isNextDisabled =
    calendarYear > today.getFullYear() ||
    (calendarYear === today.getFullYear() && calendarMonth >= today.getMonth());
  const cells = buildCalendarCells(calendarYear, calendarMonth);

  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 to-emerald-900 px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => (calendarMonth === 0 ? onChangeMonth(calendarYear - 1, 11) : onChangeMonth(calendarYear, calendarMonth - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:bg-white/10"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div className="min-w-[140px] text-center">
          <p className="text-lg font-bold leading-tight text-white">{MONTH_NAMES[calendarMonth]}</p>
          <p className="text-xs font-semibold text-emerald-300">{calendarYear}</p>
        </div>

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => {
            if (isNextDisabled) return;
            calendarMonth === 11 ? onChangeMonth(calendarYear + 1, 0) : onChangeMonth(calendarYear, calendarMonth + 1);
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors ${isNextDisabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/10"}`}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-secondary">
        {DAY_NAMES.map((dayName) => (
          <div key={dayName} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-16 border-b border-r border-border-subtle/40 bg-surface-secondary/20" />;
          }

          const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = calendarData[dateString] ?? 0;
          const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
          const isSelected = selectedDate === dateString;
          const isFuture = dateString > todayString;

          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => {
                if (isFuture) return;
                onSelectDate(dateString);
              }}
              className={`relative h-16 border-b border-r border-border-subtle/40 p-1.5 text-left transition-all ${isFuture ? "cursor-not-allowed opacity-40" : "hover:bg-emerald-50/10"} ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10" : ""} ${isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
            >
              <span className={`text-xs font-bold leading-none ${isSelected ? "text-emerald-400" : isToday ? "text-amber-400" : count > 0 ? "text-text-primary" : "text-text-muted"}`}>
                {day}
              </span>

              {count > 0 && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-emerald-500/60" />
                  <span className="text-[9px] font-black leading-none text-emerald-400">{count}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle bg-surface-secondary/60 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/50" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Has transactions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm ring-1 ring-amber-400" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}



interface ApiTransaction {
  transaction_no: string;
  branch: string | null;
  voided_at?: string | null;
  purpose: string;
  created_at?: string | Date | null;
  details?: string | null;
  transaction_date: string;
  transaction_time: string;
  cash_in: number | string | null;
  cash_out: number | string | null;
  return_amount?: number | string | null;
  unit: string | null;
  unit_code: string | null;
  pawn_amount?: number | string | null;
  storage_fee?: number | string | null;
  qr_code?: string | null;
  related_pawned_item_id?: string | null;
  related_sale_item_id?: string | null;
  pawned_item?: PawnedItemJoin | PawnedItemJoin[] | null;
}

interface TransactionsResponse {
  stats?: typeof DEFAULT_STATS;
  transactions: ApiTransaction[];
}

interface BranchFinanceSummary {
  branchId: string;
  startingBalance: number;
  currentBalance: number;
}

const DEFAULT_STATS = {
  pawnedToday: 0,
  buyBack: 0,
  renewed: 0,
  soldItem: 0,
  redeemed: 0,
  transfer: 0,
  startingBalance: 0,
  endingBalance: 0,
  sessionOpenedAt: null as string | null,
};

function normalizeStats(stats?: Partial<typeof DEFAULT_STATS>) {
  return {
    ...DEFAULT_STATS,
    ...(stats || {}),
  };
}

// Shared logic imported from @/lib/interest.ts

interface PawnedItemJoin {
  qr_code?: string | null;
  serial_number?: string | null;
  items_included?: string | null;
  condition?: string | null;
  category?: string | null;
  memory_storage?: string | null;
  remarks?: string | null;
  id_presented?: string | null;
  customer?: {
    full_name?: string | null;
    address?: string | null;
    barangay?: string | null;
    city?: string | null;
    region?: string | null;
    contact_number?: string | null;
    middle_name?: string | null;
  } | null;
}

function resolvePawnedItem(raw: unknown): PawnedItemJoin | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw as PawnedItemJoin;
}

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  const pawnAmount = Number(transaction.pawn_amount || 0);
  const calculations = calculateGadgetInterest(pawnAmount, transaction.transaction_date);

  const isBuyBackAction = transaction.purpose === "Buy Back";
  const isPawnAction = transaction.purpose === "Pawn";

  const item = resolvePawnedItem(transaction.pawned_item);
  // Support both object and array response for customer
  const customerRaw = item?.customer;
  const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;

  return {
    transactionNo: transaction.transaction_no,
    purpose: transaction.purpose as PurposeType,
    buyBack: isBuyBackAction
      ? String(transaction.cash_in ?? 0)
      : "0",
    percentage: isBuyBackAction || isPawnAction ? String(calculations.percentage) : "0",
    buyOut: "0",
    sold: transaction.purpose === "Sold Item" ? String(transaction.cash_in ?? 0) : "0",
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    cashIn: isPawnAction ? "0" : String(transaction.cash_in ?? 0),
    cashOut: (isBuyBackAction || transaction.purpose === "Sold Item")
      ? "0"
      : String(transaction.cash_out ?? 0),
    returnVal: String(transaction.return_amount ?? 0),
    unit: transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: String(transaction.pawn_amount ?? 0),
    storage: String(transaction.storage_fee ?? 0),
    customerName: customer?.full_name ?? undefined,
    customerAddress: customer?.address ?? undefined,
    customerBarangay: customer?.barangay ?? undefined,
    customerCity: customer?.city ?? undefined,
    customerRegion: customer?.region ?? undefined,
    customerPhone: customer?.contact_number ?? undefined,
    customerMiddleName: customer?.middle_name ?? undefined,
    idPresented: item?.id_presented ?? undefined,
    qrCode: item?.qr_code || transaction.qr_code || undefined,
    serialNumber: item?.serial_number ?? undefined,
    itemsIncluded: item?.items_included ?? undefined,
    condition: item?.condition ?? undefined,
    category: item?.category ?? undefined,
    memoryStorage: item?.memory_storage ?? undefined,
    remarks: item?.remarks ?? undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
    details: transaction.details ?? undefined,
  };
}

export default function EmployeePawnTransactionsPage() {
  const { selectedBranch, branches, canSwitchBranch } = useBranch();
  const { user } = useAuth();
  const { refreshOpeningChecklistFromServer } = useOpeningChecklist();
  const searchParams = useSearchParams();
  const [branchAdminName, setBranchAdminName] = useState("");
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [hideRenewSidebar, setHideRenewSidebar] = useState(false);
  const [isNewPawnModalOpen, setIsNewPawnModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isBuyBackModalOpen, setIsBuyBackModalOpen] = useState(false);
  const [isSalesTransferModalOpen, setIsSalesTransferModalOpen] = useState(false);
  const [isReserveLayawayModalOpen, setIsReserveLayawayModalOpen] = useState(false);
  const [isMoaReprintOpen, setIsMoaReprintOpen] = useState(false);
  const [reprintData, setReprintData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState(() => getPhCalendarDateString());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const [isQRReplacementOpen, setIsQRReplacementOpen] = useState(false);
  const [qrReplacementData, setQrReplacementData] = useState<{ pawnedItemId: string; itemCode: string } | null>(null);
  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0,
    buyBack: 0,
    renewed: 0,
    soldItem: 0,
    redeemed: 0,
    transfer: 0,
    startingBalance: 0,
    endingBalance: 0,
  });
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  /** Rows for `selectedDate` from `/transactions?date=` (same source as stats cards). */
  const [selectedDateLedgerRows, setSelectedDateLedgerRows] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedTransactionNo, setHighlightedTransactionNo] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; onConfirm: () => void }>({
    open: false,
    onConfirm: () => { },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const highlightedTransactionRef = useRef<string | null>(null);

  /**
   * Employees may briefly have `selectedBranch.id === "__all__"` before BranchProvider syncs.
   * Backend already scopes by JWT branch for staff; we still send a stable id: `user.branchId` first.
   */
  const branchIdForApi = useMemo(() => {
    if (canSwitchBranch) return selectedBranch.id;
    const pinned = user?.branchId?.trim();
    if (pinned) return pinned;
    return selectedBranch.id !== "__all__" ? selectedBranch.id : "";
  }, [canSwitchBranch, selectedBranch.id, user?.branchId]);

  const resolvedBranchIdForModals = branchIdForApi || selectedBranch.id;

  const fetchTransactions = useCallback(async () => {
    if (!branchIdForApi) {
      return;
    }

    // Note: We don't set isLoading(true) here anymore because this is now called sequentially by fetchAllData
    try {
      const data = await api.get<TransactionsResponse>(
        `/transactions?branch=${encodeURIComponent(branchIdForApi)}&range=all`
      );
      if (data) {
        setAllTransactions((data.transactions || []).map(toTransactionRow));
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  }, [branchIdForApi]);

  const fetchSelectedDateStats = useCallback(async () => {
    if (!branchIdForApi) {
      setSelectedDateLedgerRows([]);
      return;
    }

    try {
      const branchParam =
        branchIdForApi === "__all__"
          ? ""
          : `branch=${encodeURIComponent(branchIdForApi)}`;

      const txUrl = `/transactions?${branchParam}${branchParam ? "&" : ""}date=${selectedDate}`;
      const summaryUrl = `/branch-finance/summary${branchParam ? `?${branchParam}` : ""}`;

      /** Sequential requests reduce concurrent DB pool usage (Supabase session pool limits). */
      const data = await api.get<TransactionsResponse>(txUrl);
      const financeSummary = await api
        .get<BranchFinanceSummary[]>(summaryUrl)
        .catch(() => [] as BranchFinanceSummary[]);

      setSelectedDateLedgerRows((data.transactions ?? []).map(toTransactionRow));

      const phToday = getPhCalendarDateString();
      const ledger = operationalCashTotalsForPawnEnding(
        data.transactions ?? [],
        data.stats?.sessionOpenedAt ?? null,
      );

      let startingBalance = Number(data.stats?.startingBalance ?? 0);

      if (branchIdForApi === "__all__" && financeSummary.length > 0) {
        startingBalance = financeSummary.reduce(
          (sum, row) => sum + Number(row.startingBalance ?? 0),
          0,
        );
      } else if (
        selectedDate === phToday &&
        financeSummary.length === 1
      ) {
        startingBalance = Number(
          financeSummary[0].startingBalance ?? startingBalance,
        );
      }

      const endingBalance = Number((startingBalance + ledger.net).toFixed(2));

      setCurrentStats({
        ...normalizeStats(data.stats),
        startingBalance,
        endingBalance,
      });
    } catch (error) {
      console.error("Failed to load selected date transaction stats:", error);
      setCurrentStats(normalizeStats());
      setSelectedDateLedgerRows([]);
    }
  }, [branchIdForApi, selectedDate]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Execute sequentially to respect Supabase pool limits (pool_size: 15)
      await fetchTransactions();
      await fetchSelectedDateStats();
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSelectedDateStats]);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!branchIdForApi) return;
      void fetchSelectedDateStats();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchSelectedDateStats, branchIdForApi]);

  const fetchTransactionsRef = useRef(fetchTransactions);
  useEffect(() => {
    fetchTransactionsRef.current = fetchTransactions;
  }, [fetchTransactions]);

  const calendarData = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const transaction of allTransactions) {
      const [yearString, monthString] = transaction.date.split("-");
      const year = Number(yearString);
      const month = Number(monthString) - 1;

      if (year !== calendarYear || month !== calendarMonth) {
        continue;
      }

      counts[transaction.date] = (counts[transaction.date] ?? 0) + 1;
    }

    return counts;
  }, [calendarMonth, calendarYear, allTransactions]);

  const selectedDateTransactions = useMemo(
    () => selectedDateLedgerRows,
    [selectedDateLedgerRows],
  );

  useEffect(() => {
    if (!branchIdForApi || branchIdForApi === "__all__") return;

    const interval = window.setInterval(
      () => void fetchTransactionsRef.current(),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, [branchIdForApi]);

  const filteredTransactions = useMemo(() => {
    let result = selectedDateTransactions;

    if (activeFilter !== "All") {
      const targetPurpose = filterToPurpose[activeFilter];
      if (targetPurpose) {
        result = result.filter((t) => t.purpose === targetPurpose);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.transactionNo.toLowerCase().includes(q) ||
          t.purpose.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.unit?.toLowerCase().includes(q) ||
          t.unitCode?.toLowerCase().includes(q) ||
          t.details?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeFilter, searchQuery, selectedDateTransactions]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    const transactionNo = searchParams.get("transactionNo");

    if (!transactionNo) {
      return;
    }

    const matchingIndex = filteredTransactions.findIndex((transaction) => transaction.transactionNo === transactionNo);
    if (matchingIndex < 0) {
      return;
    }

    const nextPage = Math.floor(matchingIndex / ITEMS_PER_PAGE) + 1;
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, filteredTransactions, searchParams]);

  useEffect(() => {
    const transactionNo = searchParams.get("transactionNo");
    const shouldHighlight = searchParams.get("highlightTransaction") === "true";

    if (!transactionNo) {
      highlightedTransactionRef.current = null;
      setHighlightedTransactionNo(null);
      return;
    }

    const matchingTransaction = allTransactions.find((transaction) => transaction.transactionNo === transactionNo);
    if (!matchingTransaction) {
      return;
    }

    setSelectedTransaction(matchingTransaction);

    if (shouldHighlight && highlightedTransactionRef.current !== transactionNo) {
      highlightedTransactionRef.current = transactionNo;
      setHighlightedTransactionNo(transactionNo);

      const timeout = window.setTimeout(() => {
        setHighlightedTransactionNo(null);
      }, 4000);

      return () => window.clearTimeout(timeout);
    }
  }, [allTransactions, searchParams]);

  useEffect(() => {
    const action = searchParams.get("action");
    const ticketNo = searchParams.get("ticketNo");
    const hideSidebar = searchParams.get("hideSidebar") === "true";
    
    if (action === "renew" && ticketNo) {
      setHideRenewSidebar(hideSidebar);
      setIsRenewModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchBranchAdmin() {
      if (!selectedBranch.id || selectedBranch.id === "__all__") return;
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) return;

      try {
        const data = await api.get<{ users?: { fullName: string; role: string }[]; fullName?: string; role?: string }[]>(
          `/users?branchId=${selectedBranch.id}&role=admin`
        );
        const admins = Array.isArray(data) ? data : [];
        const admin = admins.find((u) => u.role === "admin");
        if (admin?.fullName) setBranchAdminName(admin.fullName);
      } catch {
        // silently fail — admin name stays blank
      }
    }
    void fetchBranchAdmin();
  }, [selectedBranch.id, user]);

  const handleExportCSV = useCallback(() => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Transaction #", "Purpose", "Date", "Time", "Buy Back", "Buy Out", "Sold", "Cash In", "Cash Out", "Return", "Unit", "Unit Code", "Pawn", "Storage"];
    const rows = filteredTransactions.map((r) =>
      [r.transactionNo, r.purpose, r.date, r.time, r.buyBack, r.buyOut, r.sold, r.cashIn, r.cashOut, r.returnVal, r.unit, r.unitCode, r.pawn, r.storage].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${selectedBranch.name.replace(/\s+/g, "_")}_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions, selectedBranch, selectedDate]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, selectedDate, viewMode, calendarMonth, calendarYear]);

  const openNewPawnForm = useCallback(() => {
    setIsNewPawnModalOpen(true);
  }, []);

  const openBuyBackForm = useCallback(() => {
    setIsBuyBackModalOpen(true);
  }, []);

  const handleActionWithPassword = (action: () => void) => {
    setPasswordModal({
      open: true,
      onConfirm: action,
    });
  };

  const handleReprint = useCallback((transactionNo: string) => {
    const tx = allTransactions.find(t => t.transactionNo === transactionNo);
    if (!tx) return;

    const branchInfo = branches.find(b => b.id === selectedBranch.id);
    const fullName = tx.customerName || "WALK-IN CUSTOMER";
    const names = fullName.split(" ");
    const firstName = names[0];
    const middleName = tx.customerMiddleName || (names.length > 2 ? names.slice(1, -1).join(" ") : "");
    const lastName = names.length > 1 ? names[names.length - 1] : "";

    // Join address components for the MOA
    const fullAddress = [
      tx.customerAddress,
      tx.customerBarangay,
      tx.customerCity,
      tx.customerRegion
    ].filter(Boolean).join(", ");

    setReprintData({
      firstName,
      middleName,
      lastName,
      address: fullAddress,
      contactNo: tx.customerPhone || "",
      unitCode: tx.unitCode,
      unitName: tx.unit,
      category: tx.category || "",
      serialNumber: tx.serialNumber || "",
      itemsIncluded: tx.itemsIncluded || "",
      condition: tx.condition || "",
      memory: tx.memoryStorage || "",
      remarks: tx.remarks || "",
      amount: tx.pawn,
      storageFee: tx.storage,
      purchasedDate: tx.date,
      idPresented: tx.idPresented || "",
      branchName: selectedBranch.name,
      branchAddress: branchInfo?.location || "",
      branchPhone: branchInfo?.phone || "",
      processedBy: tx.details?.match(/Processed [bB]y:\s*([A-Za-z\s]+)/)?.[1]?.trim() || user?.fullName || branchAdminName || "AUTHORIZED PERSONNEL"
    });
    setIsMoaReprintOpen(true);
  }, [allTransactions, selectedBranch, branches, user, branchAdminName]);

  const handleTransactionSuccess = useCallback((_transactionNo?: string) => {
    void fetchTransactionsRef.current();
    void fetchSelectedDateStats();
    window.dispatchEvent(new CustomEvent("transaction_created"));
  }, [fetchSelectedDateStats]);

  return (
    <div className="space-y-3 pb-4 printable-area">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: auto; margin: 15mm; }
          body { background: white !important; color: black !important; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { 
            position: relative !important; 
            display: block !important; 
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .header-print { 
            background: #064e3b !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            color: white !important; 
            padding: 20px !important; 
            text-align: center !important; 
            margin-bottom: 20px !important; 
            border-bottom: 4px solid #f59e0b !important;
            border-radius: 8px;
          }
          .header-print h1 { margin: 0 !important; font-size: 24px !important; font-weight: 900 !important; color: white !important; }
          .header-print p { margin: 5px 0 0 !important; font-size: 12px !important; color: white !important; opacity: 0.8; }
          table { page-break-inside: auto; width: 100% !important; border-collapse: collapse !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .print-hide { display: none !important; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* ── Print-only layout ─────────────────────────────── */}
      <div className="hidden print:block">
        <div className="header-print">
          <h1>JCLB Buy Back Shop</h1>
          <p>Pawn Transactions Report - {selectedBranch.name}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-3 border-b-2 border-emerald-800 pb-1">
            Executive Summary
          </h2>
          <table className="w-full border-collapse border border-emerald-800/20 text-sm">
            <thead>
              <tr className="bg-emerald-50">
                <th className="border border-emerald-800/20 p-2 text-left text-emerald-900">Metric</th>
                <th className="border border-emerald-800/20 p-2 text-right text-emerald-900">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-emerald-800/20 p-2">Pawned Today</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{currentStats.pawnedToday}</td>
              </tr>
              <tr>
                <td className="border border-emerald-800/20 p-2">Buy Back</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{currentStats.buyBack}</td>
              </tr>
              <tr>
                <td className="border border-emerald-800/20 p-2">Renewed</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{currentStats.renewed}</td>
              </tr>
              <tr>
                <td className="border border-emerald-800/20 p-2">Sold Item</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{currentStats.soldItem}</td>
              </tr>
              <tr className="bg-amber-500/5 dark:bg-amber-500/10">
                <td className="border border-emerald-800/20 p-2 font-bold text-emerald-900">Live Total Balance</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold text-emerald-900">
                  {formatPeso(currentStats.endingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-3 border-b-2 border-emerald-800 pb-1">
            Detailed Transactions
          </h2>
          <table className="w-full border-collapse border border-emerald-800/20 text-[10px]">
            <thead>
              <tr className="bg-emerald-50">
                <th className="border border-emerald-800/10 p-1 text-left">Txn #</th>
                <th className="border border-emerald-800/10 p-1 text-left">Purpose</th>
                <th className="border border-emerald-800/10 p-1 text-left">Customer</th>
                <th className="border border-emerald-800/10 p-1 text-right">Cash In</th>
                <th className="border border-emerald-800/10 p-1 text-right">Cash Out</th>
                <th className="border border-emerald-800/10 p-1 text-right">Pawn</th>
                <th className="border border-emerald-800/10 p-1 text-right">Storage</th>
                <th className="border border-emerald-800/10 p-1 text-left">Unit</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.transactionNo}>
                  <td className="border border-emerald-800/10 p-1">{tx.transactionNo}</td>
                  <td className="border border-emerald-800/10 p-1 font-bold">{tx.purpose}</td>
                  <td className="border border-emerald-800/10 p-1">{tx.customerName || "Walk-in"}</td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.cashIn !== "0" ? formatPeso(Number(tx.cashIn).toLocaleString()) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.cashOut !== "0" ? formatPeso(Number(tx.cashOut).toLocaleString()) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.pawn !== "0" ? formatPeso(Number(tx.pawn).toLocaleString()) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.storage !== "0" ? formatPeso(Number(tx.storage).toLocaleString()) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1">{tx.unitCode || tx.unit || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── End print layout ──────────────────────────────── */}

      <div className="print-hide">
        <p className="text-sm text-emerald-900/60 dark:text-zinc-400">
          Live transaction records across all branches with employee-style QR and print access.
        </p>
      </div>

      <div className="print-hide flex flex-col gap-4">
      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onRenewClick={() => handleActionWithPassword(() => setIsRenewModalOpen(true))}
        onRedeem={() => handleActionWithPassword(() => setIsRedeemModalOpen(true))}
        onBuyBack={() => handleActionWithPassword(() => setIsBuyBackModalOpen(true))}
        onReserveLayaway={() => handleActionWithPassword(() => {
          setActiveFilter("Reserve / Layaway");
          setIsReserveLayawayModalOpen(true);
        })}
        onSalesTransfer={() => handleActionWithPassword(() => setIsSalesTransferModalOpen(true))}
        onNewPawn={() => handleActionWithPassword(openNewPawnForm)}
      />

      <BranchDaySessionToolbar
        branchId={branchIdForApi}
        logoutAfterEndDay
        syncOpeningChecklist={refreshOpeningChecklistFromServer}
        onSessionChanged={() => {
          void fetchSelectedDateStats();
          void fetchTransactions();
        }}
      />

      <TransactionStats data={currentStats} />

      <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
        <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
            Search Transactions
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction no, purpose, customer, item, or details"
            className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
          />
        </div>

        <div className="w-48">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
            Purpose Filter
          </label>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as FilterType);
              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
          >
            <option value="All">All Purposes</option>
            <option value="Renew">Renew</option>
            <option value="Sells / Transfer">Sells / Transfer</option>
            <option value="Redeem">Redeem</option>
            <option value="Buy Back">Buy Back</option>
            <option value="Reserve / Layaway">Reserve / Layaway</option>
            <option value="Pawn">Pawn</option>
            <option value="Start">Start</option>
            <option value="Buy Out">Buy Out</option>
            <option value="Sold Item">Sold Item</option>
          </select>
        </div>
          <div className="flex items-center gap-2">
            <ActionButton variant="outline" onClick={handleExportCSV}>
              <span className="flex items-center gap-1.5">
                {downloadIcon}
                Export CSV
              </span>
            </ActionButton>
            <ActionButton
              variant="primary"
              className="border-emerald-700 bg-emerald-700 text-amber-400"
              onClick={handlePrintReport}
            >
              <span className="flex items-center gap-1.5">
                {printerIcon}
                Print Report
              </span>
            </ActionButton>
            <div className="inline-flex items-center rounded-xl border border-border-main bg-surface-secondary p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${viewMode === "list" ? "bg-emerald-700 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${viewMode === "calendar" ? "bg-emerald-700 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "calendar" && (
        <TransactionsCalendar
          calendarData={calendarData}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          onChangeMonth={(year, month) => {
            setCalendarYear(year);
            setCalendarMonth(month);
            setSelectedDate(`${year}-${String(month + 1).padStart(2, "0")}-01`);
          }}
        />
      )}

      <TransactionTable
        isLoading={isLoading}
        data={paginatedTransactions}
        onReprint={handleReprint}
        onViewDetails={setSelectedTransaction}
        highlightedTransactionNo={highlightedTransactionNo}
        title={`Transactions for ${formatSelectedDateLabel(selectedDate)}`}
      />

      <div>
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
      </div>{/* end print-hide */}

      <TransactionDetailsModal
        isOpen={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onRequestQRReplacement={(pawnedItemId, itemCode) => {
          setQrReplacementData({ pawnedItemId, itemCode });
          setIsQRReplacementOpen(true);
        }}
      />

      <QRReplacementRequestModal
        isOpen={isQRReplacementOpen}
        pawnedItemId={qrReplacementData?.pawnedItemId || ""}
        itemCode={qrReplacementData?.itemCode}
        onClose={() => {
          setIsQRReplacementOpen(false);
          setQrReplacementData(null);
        }}
        onSuccess={() => {
          setSelectedTransaction(null);
        }}
      />

      <ConfirmPasswordModal
        isOpen={passwordModal.open}
        onClose={() => setPasswordModal((p) => ({ ...p, open: false }))}
        onConfirm={async (password) => {
          try {
            await api.post("/auth/verify-password", { password });
            passwordModal.onConfirm();
            return true;
          } catch (err) {
            return false;
          }
        }}
      />

      <RenewModal
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setHideRenewSidebar(false);
        }}
        onSuccess={handleTransactionSuccess}
        branchName={selectedBranch.name}
        branchId={resolvedBranchIdForModals}
        initialSearchCode={searchParams.get("action") === "renew" ? searchParams.get("ticketNo") || undefined : undefined}
        hideSidebar={hideRenewSidebar}
      />

      <NewPawnModal
        isOpen={isNewPawnModalOpen}
        onClose={() => setIsNewPawnModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={resolvedBranchIdForModals}
        branchName={selectedBranch.name}
        branchAddress={selectedBranch.location}
        branchPhone={selectedBranch.phone}
        branchAdminName={branchAdminName}
        loggedInUserName={user?.fullName}
      />

      <RedeemModal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={resolvedBranchIdForModals}
        branchName={selectedBranch.name}
      />

      {/* Buy Back Modal will handle Expired/For-Sale items */}
      <BuyBackModal
        isOpen={isBuyBackModalOpen}
        onClose={() => setIsBuyBackModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={resolvedBranchIdForModals}
        branchName={selectedBranch.name}
      />

      <SellsTransferModal
        isOpen={isSalesTransferModalOpen}
        onClose={() => setIsSalesTransferModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchName={selectedBranch.name}
      />

      <ReserveLayawayModal
        isOpen={isReserveLayawayModalOpen}
        onClose={() => setIsReserveLayawayModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={resolvedBranchIdForModals}
        branchName={selectedBranch.name}
      />

      {reprintData && (
        <MoaModal
          isOpen={isMoaReprintOpen}
          onClose={() => setIsMoaReprintOpen(false)}
          onConfirm={() => setIsMoaReprintOpen(false)}
          data={reprintData}
          isLoading={false}
          autoPrint={true}
        />
      )}

    </div>
  );
}
