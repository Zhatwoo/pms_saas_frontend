"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { FilterType, ViewMode } from "@/app/employee/pawn-transaction/_components/transaction-actions";
import { api } from "@/lib/api";
import { PaginationFooter } from "@/components/shared/pagination";
import { TransactionStats } from "@/app/employee/pawn-transaction/_components/transaction-stats";
import { TransactionTable, type TransactionRow, type PurposeType } from "@/app/employee/pawn-transaction/_components/transaction-table";
import { RenewModal } from "@/app/employee/pawn-transaction/_components/renew-modal";
import { NewPawnModal } from "@/app/employee/pawn-transaction/_components/new-pawn-modal";
import { RedeemModal } from "@/app/employee/pawn-transaction/_components/redeem-modal";
import { BuyBackModal } from "@/app/employee/pawn-transaction/_components/buy-back-modal";
import { SellsTransferModal } from "@/app/employee/pawn-transaction/_components/sells-transfer-modal";
import { ReserveLayawayModal } from "@/app/employee/pawn-transaction/_components/reserve-layaway-modal";
import { MoaModal } from "@/app/employee/pawn-transaction/_components/moa-modal";
import { ActionButton } from "@/components/shared/action-button";
import { TransactionDetailsModal } from "@/components/shared/transaction-details-modal";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";
import { QrScanner } from "@/components/shared/qr-scanner";
import { Role } from "@/types";
import { calculateGadgetInterest } from "@/lib/interest";
import { formatDateToYMD } from "@/lib/time";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { operationalCashTotalsForPawnEnding, operationalCashTotals } from "@/lib/ledger-operational-totals";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { BranchDaySessionToolbar } from "@/components/shared/branch-day-session-toolbar";
import { formatPeso } from "@/lib/currency";
import { subscribeToPawnTransactionNotifications } from "@/lib/notification-stream";

// Use shared `PurposeType` and `FilterType` imported from components
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
          onClick={() => (calendarMonth === 11 ? onChangeMonth(calendarYear + 1, 0) : onChangeMonth(calendarYear, calendarMonth + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:bg-white/10"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-surface-secondary dark:border-border-subtle">
        {DAY_NAMES.map((dayName) => (
          <div key={dayName} className="border-r border-zinc-200/80 py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted last:border-r-0 dark:border-border-subtle">
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-16 border-b border-r border-zinc-200/80 bg-surface-secondary/20 dark:border-border-subtle" />;
          }

          const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = calendarData[dateString] ?? 0;
          const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
          const isSelected = selectedDate === dateString;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(dateString)}
              className={`relative h-16 border-b border-r border-zinc-200/80 p-1.5 text-left transition-all dark:border-border-subtle hover:bg-emerald-50/10 ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10" : ""} ${isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
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

      <div className="flex items-center justify-between border-t border-zinc-200/80 bg-surface-secondary/60 px-4 py-2.5 dark:border-border-subtle">
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
  id_photo?: string | null;
  related_pawned_item_id?: string | null;
  related_sale_item_id?: string | null;
  pawned_item?: PawnedItemJoin | PawnedItemJoin[] | null;
  customer?: {
    full_name?: string | null;
    address?: string | null;
    barangay?: string | null;
    city?: string | null;
    region?: string | null;
    contact_number?: string | null;
    middle_name?: string | null;
    id_presented?: string | null;
  } | null;
  created_by_user?: {
    full_name?: string | null;
    role?: string | null;
  } | null;
}

interface PawnedItemJoin {
  id: string;
  description?: string | null;
  qr_code?: string | null;
  serial_number?: string | null;
  items_included?: string | null;
  condition?: string | null;
  category?: string | null;
  memory_storage?: string | null;
  remarks?: string | null;
  customer?: {
    full_name?: string | null;
    address?: string | null;
    barangay?: string | null;
    city?: string | null;
    region?: string | null;
    contact_number?: string | null;
    middle_name?: string | null;
    id_presented?: string | null;
  } | null;
}

interface TransactionsResponse {
  transactions?: ApiTransaction[];
  stats?: TransactionStatsResponse;
}

interface TransactionStatsResponse {
  pawnedToday?: number;
  buyBack?: number;
  renewed?: number;
  soldItem?: number;
  redeemed?: number;
  transfer?: number;
  startingBalance?: number;
  endingBalance?: number;
  sessionOpenedAt?: string | null;
}

interface ReprintMoaData {
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
  parkingFee: string;
  purchasedDate: string;
  idPresented: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  processedBy: string;
}

interface BranchFinanceSummary {
  branch: string;
  startingBalance: number;
  currentBalance: number;
}

function normalizeStats(stats?: TransactionStatsResponse) {
  return {
    pawnedToday: Number(stats?.pawnedToday ?? 0),
    buyBack: Number(stats?.buyBack ?? 0),
    renewed: Number(stats?.renewed ?? 0),
    soldItem: Number(stats?.soldItem ?? 0),
    redeemed: Number(stats?.redeemed ?? 0),
    transfer: Number(stats?.transfer ?? 0),
    startingBalance: Number(stats?.startingBalance ?? 0),
    endingBalance: Number(stats?.endingBalance ?? 0),
  };
}

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  const item =
    Array.isArray(transaction.pawned_item)
      ? transaction.pawned_item[0]
      : transaction.pawned_item;

  // Robustly extract QR code from nested item or root
  const qrCode = item?.qr_code || transaction.qr_code || undefined;
  const customer = item?.customer ?? transaction.customer;

  return {
    transactionNo: transaction.transaction_no,
    purpose: (transaction.purpose ?? "") as PurposeType,
    buyBack: String(transaction.cash_out ?? 0),
    percentage: "0",
    buyOut: String(transaction.cash_out ?? 0),
    sold: String(transaction.cash_out ?? 0),
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    cashIn: String(transaction.cash_in ?? 0),
    cashOut: String(transaction.cash_out ?? 0),
    returnVal: String(transaction.return_amount ?? 0),
    unit: item?.description ?? transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: String(transaction.pawn_amount ?? 0),
    storage: String(transaction.storage_fee ?? 0),
    customerName: customer?.full_name ?? undefined,
    createdByName: transaction.created_by_user?.full_name ?? undefined,
    createdByRole: transaction.created_by_user?.role ?? undefined,
    customerAddress: customer?.address ?? undefined,
    customerBarangay: customer?.barangay ?? undefined,
    customerCity: customer?.city ?? undefined,
    customerRegion: customer?.region ?? undefined,
    customerPhone: customer?.contact_number ?? undefined,
    customerMiddleName: customer?.middle_name ?? undefined,
    idPresented: customer?.id_presented ?? undefined,
    qrCode: qrCode,
    serialNumber: item?.serial_number ?? undefined,
    itemsIncluded: item?.items_included ?? undefined,
    condition: item?.condition ?? undefined,
    category: item?.category ?? undefined,
    memoryStorage: item?.memory_storage ?? undefined,
    remarks: item?.remarks ?? undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
    details: transaction.details ?? undefined,
    idPhoto: transaction.id_photo ?? undefined,
  };
}

export default function SuperAdminPawnTransactionsPage() {
  const { selectedBranch } = useBranch();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isNewPawnModalOpen, setIsNewPawnModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isBuyBackModalOpen, setIsBuyBackModalOpen] = useState(false);
  const [isSalesTransferModalOpen, setIsSalesTransferModalOpen] = useState(false);
  const [isReserveLayawayModalOpen, setIsReserveLayawayModalOpen] = useState(false);
  const [isMoaReprintOpen, setIsMoaReprintOpen] = useState(false);
  const [reprintData, setReprintData] = useState<ReprintMoaData | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState(formatDateToYMD());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
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
  /** Same calendar date as stats — full ledger from `/transactions?date=`, not `range=all` slice + smartphone filter. */
  const [selectedDateLedgerRows, setSelectedDateLedgerRows] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedTransactionNo, setHighlightedTransactionNo] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; onConfirm: () => void }>({
    open: false,
    onConfirm: () => { },
  });
  const [isMainScannerOpen, setIsMainScannerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const highlightedTransactionRef = useRef<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    // Note: We don't set isLoading(true) here anymore because this is now called sequentially by fetchAllData
    try {
      const data = await api.get<TransactionsResponse>(
        `/transactions?branch=${encodeURIComponent(selectedBranch.id)}&range=all`
      );
      if (data) {
        setAllTransactions((data.transactions || []).map(toTransactionRow));
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  }, [selectedBranch.id]);

  const fetchSelectedDateStats = useCallback(async () => {
    try {
      const branchParam =
        selectedBranch.id === "__all__"
          ? ""
          : `branch=${encodeURIComponent(selectedBranch.id)}`;

      const txUrl = `/transactions?${branchParam}${branchParam ? "&" : ""}date=${selectedDate}`;
      const summaryUrl = `/branch-finance/summary${branchParam ? `?${branchParam}` : ""}`;

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

      if (selectedBranch.id === "__all__" && financeSummary.length > 0) {
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

      const endingBalance = (() => {
        const serverEnding =
          data.stats?.endingBalance != null
            ? Number(data.stats.endingBalance)
            : null;
        const clientEnding = Number(
          (
            startingBalance +
            Math.max(ledger.net, operationalCashTotals(data.transactions ?? []).net)
          ).toFixed(2),
        );
        return serverEnding != null
          ? Math.max(serverEnding, clientEnding)
          : clientEnding;
      })();

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
  }, [selectedBranch.id, selectedDate]);

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
    return subscribeToPawnTransactionNotifications(() => {
      void fetchAllData();
    });
  }, [fetchAllData]);

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
    const interval = window.setInterval(
      () => void fetchTransactionsRef.current(),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, [selectedBranch.id]);

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

  const handleActionWithPassword = (action: () => void) => {
    setPasswordModal({
      open: true,
      onConfirm: action,
    });
  };

  const handleReprint = useCallback(async (transactionNo: string) => {
    const tx = allTransactions.find(t => t.transactionNo === transactionNo);
    if (!tx) return;

    const hasMissingField = (value?: string | null) => !value || value.trim() === "" || value.trim() === "---";
    const needsEnrichment =
      hasMissingField(tx.serialNumber) ||
      hasMissingField(tx.itemsIncluded) ||
      hasMissingField(tx.condition) ||
      hasMissingField(tx.memoryStorage) ||
      hasMissingField(tx.customerAddress) ||
      hasMissingField(tx.customerName) ||
      hasMissingField(tx.createdByName);

    let enriched: any = null;
    let pawnSource: any = null;
    if (tx.relatedPawnedItemId && needsEnrichment) {
      try {
        enriched = await api.get<any>(`/inventory/pawned/${tx.relatedPawnedItemId}`);
      } catch {
        enriched = null;
      }
    }
    if (!enriched && tx.unitCode && needsEnrichment) {
      try {
        enriched = await api.get<any>(`/inventory/item/${encodeURIComponent(tx.unitCode)}`);
      } catch {
        enriched = null;
      }
    }
    if (needsEnrichment) {
      const params = tx.relatedPawnedItemId
        ? `relatedPawnedItemId=${encodeURIComponent(tx.relatedPawnedItemId)}`
        : tx.unitCode
          ? `unitCode=${encodeURIComponent(tx.unitCode)}`
          : "";
      if (params) {
        try {
          pawnSource = await api.get<any>(`/transactions/pawn-source?${params}`);
        } catch {
          pawnSource = null;
        }
      }
    }

    const resolvedCustomerName = tx.customerName || enriched?.customerName || "WALK-IN CUSTOMER";
    const names = resolvedCustomerName.split(" ");
    const firstName = names[0] || "WALK-IN";
    const middleName = tx.customerMiddleName || (names.length > 2 ? names.slice(1, -1).join(" ") : "");
    const lastName = names.length > 1 ? names[names.length - 1] : "";

    // Join address components for the MOA
    const fullAddress = [
      tx.customerAddress || enriched?.customerAddress,
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
      unitName: tx.unit || enriched?.itemName || "",
      category: tx.category || "",
      serialNumber: tx.serialNumber || enriched?.serialNumber || pawnSource?.pawned_item?.serial_number || "",
      itemsIncluded: tx.itemsIncluded || enriched?.itemsIncluded || pawnSource?.pawned_item?.items_included || "",
      condition: tx.condition || enriched?.condition || pawnSource?.pawned_item?.condition || "",
      remarks: tx.remarks || "",
      memory: tx.memoryStorage || enriched?.memoryStorage || pawnSource?.pawned_item?.memory_storage || "",
      amount: String(tx.pawn ?? "0"),
      storageFee: String(tx.storage ?? "0"),
      parkingFee: "0",
      purchasedDate: tx.date,
      idPresented: tx.idPresented || enriched?.customerIdPresented || "",
      branchName: selectedBranch.name,
      branchAddress: selectedBranch.location || "",
      branchPhone: selectedBranch.phone || "",
      processedBy:
        tx.createdByName ||
        enriched?.created_by_user?.full_name ||
        pawnSource?.created_by_user?.full_name ||
        tx.details?.match(/Processed [bB]y:\s*([A-Za-z\s]+)/)?.[1]?.trim() ||
        user?.fullName ||
        "AUTHORIZED PERSONNEL"
    });
    setIsMoaReprintOpen(true);
  }, [allTransactions, selectedBranch, user?.fullName]);

  const handleTransactionSuccess = useCallback((_transactionNo?: string) => {
    void fetchTransactionsRef.current();
    void fetchSelectedDateStats();
    window.dispatchEvent(new CustomEvent("transaction_created"));
  }, [fetchSelectedDateStats]);

  const printLedgerTotals = useMemo(() => {
    const cashIn = filteredTransactions.reduce(
      (sum, tx) => sum + (Number(tx.cashIn) || 0),
      0,
    );
    const cashOut = filteredTransactions.reduce(
      (sum, tx) => sum + (Number(tx.cashOut) || 0),
      0,
    );
    return { cashIn, cashOut, net: cashIn - cashOut };
  }, [filteredTransactions]);

  return (
    <div className="space-y-5 pb-6 printable-area">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: auto; margin: 12mm; }
          body:not(.printing-moa-active) * { visibility: hidden; }
          body:not(.printing-moa-active) .printable-area,
          body:not(.printing-moa-active) .printable-area * {
            visibility: visible !important;
          }
          .printable-area {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .print-hide { display: none !important; }
        }
      `}} />

      <div id="print-ledger-section" className="hidden print:block mb-8">
        <h1 className="text-xl font-bold text-black border-b border-black pb-2 mb-4">
          Branch Financial Ledger
        </h1>
        <div className="text-sm text-black space-y-1 mb-4">
          <p><strong>Branch:</strong> {selectedBranch.name}</p>
          <p><strong>Date Generated:</strong> {new Date().toLocaleString()}</p>
          <p><strong>From:</strong> {selectedDate}</p>
          <p><strong>To:</strong> {selectedDate}</p>
        </div>

        <table className="w-full text-left text-sm border-collapse text-black print:text-[11px]">
          <thead>
            <tr className="bg-gray-100 border-y border-black">
              <th className="p-2 font-bold whitespace-nowrap">Date</th>
              <th className="p-2 font-bold whitespace-nowrap">Source</th>
              <th className="p-2 font-bold">Item Name</th>
              <th className="p-2 font-bold">Description</th>
              <th className="p-2 font-bold text-right whitespace-nowrap">Cash In</th>
              <th className="p-2 font-bold text-right whitespace-nowrap">Cash Out</th>
              <th className="p-2 font-bold">Ref No.</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center italic text-gray-500 border-b border-black">
                  No records found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.transactionNo} className="border-b border-gray-300">
                  <td className="p-2 whitespace-nowrap">{tx.date} {tx.time || ""}</td>
                  <td className="p-2 whitespace-nowrap">TXN</td>
                  <td className="p-2 truncate max-w-[200px]">{tx.unitCode || tx.unit || "—"}</td>
                  <td className="p-2 truncate max-w-[250px]">{tx.details || tx.purpose || "—"}</td>
                  <td className="p-2 text-right font-mono">
                    {(Number(tx.cashIn) || 0) > 0
                      ? `+${formatPeso(Number(tx.cashIn))}`
                      : ""}
                  </td>
                  <td className="p-2 text-right font-mono text-red-600">
                    {(Number(tx.cashOut) || 0) > 0
                      ? `-${formatPeso(Number(tx.cashOut))}`
                      : ""}
                  </td>
                  <td className="p-2 font-mono text-[10px] truncate max-w-[120px] text-gray-700">{tx.transactionNo}</td>
                </tr>
              ))
            )}
            {filteredTransactions.length > 0 && (
              <>
                <tr className="border-b-2 border-black bg-gray-50 uppercase">
                  <td colSpan={4} className="p-2 font-bold text-right">
                    Total:
                  </td>
                  <td className="p-2 text-right font-bold font-mono">{formatPeso(printLedgerTotals.cashIn)}</td>
                  <td className="p-2 text-right font-bold font-mono text-red-600">
                    {printLedgerTotals.cashOut > 0
                      ? `-${formatPeso(printLedgerTotals.cashOut)}`
                      : formatPeso(0)}
                  </td>
                  <td />
                </tr>
                <tr className="border-b-2 border-black bg-white">
                  <td colSpan={4} className="p-2 font-bold text-right normal-case">
                    Net income (cash in − cash out):
                  </td>
                  <td
                    colSpan={3}
                    className={`p-2 text-right font-black font-mono normal-case ${
                      printLedgerTotals.net >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatPeso(printLedgerTotals.net)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="print-hide space-y-5">
      <div className="rounded-xl border border-border-main bg-surface px-4 py-3 shadow-sm transition-colors duration-300">
        <p className="text-sm text-emerald-900/60 dark:text-zinc-400">
          Branch transactions for the selected calendar date — list and calendar views (calendar counts reflect loaded history).
        </p>
      </div>

      <BranchDaySessionToolbar
        branchId={selectedBranch.id === "__all__" ? null : selectedBranch.id}
        onSessionChanged={() => {
          void fetchSelectedDateStats();
          void fetchTransactions();
        }}
      />

      <TransactionStats data={currentStats} />

      <div className="rounded-xl border border-border-main bg-surface p-5 shadow-sm transition-colors duration-300">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-end">
          <div className="min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
              Search Transactions
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction no, purpose, item, or details"
              className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          <div className="w-full xl:w-56">
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

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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

      <div className="mt-5">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
      </div>

      <TransactionDetailsModal
        isOpen={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <ConfirmPasswordModal
        isOpen={passwordModal.open}
        onClose={() => setPasswordModal({ open: false, onConfirm: () => {} })}
        onConfirm={async (password) => {
          try {
            await api.post("/auth/verify-password", { password });
            passwordModal.onConfirm();
            return true;
          } catch (err) {
            console.error("Failed to verify password:", err);
            return false;
          }
        }}
      />

      <QrScanner
        isOpen={isMainScannerOpen}
        onClose={() => setIsMainScannerOpen(false)}
        onScan={(text) => {
          const codeMatch = text.match(/Code:\s*([^|]+)/i);
          if (codeMatch) {
            setSearchQuery(codeMatch[1].trim());
            setCurrentPage(1);
            return;
          }

          const urlMatch = text.match(/\/view-ticket\/([^/?#\s]+)/i);
          if (urlMatch) {
            setSearchQuery(urlMatch[1].trim());
            setCurrentPage(1);
            return;
          }

          setSearchQuery(text.trim());
          setCurrentPage(1);
        }}
      />

      <RenewModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchName={selectedBranch.name}
        branchId={selectedBranch.id}
      />

      <NewPawnModal
        isOpen={isNewPawnModalOpen}
        onClose={() => setIsNewPawnModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={selectedBranch.id}
        branchName={selectedBranch.name}
        branchAddress={selectedBranch.location}
        branchPhone={selectedBranch.phone}
        loggedInUserName={user?.fullName}
      />

      <RedeemModal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={selectedBranch.id}
        branchName={selectedBranch.name}
      />

      <BuyBackModal
        isOpen={isBuyBackModalOpen}
        onClose={() => setIsBuyBackModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={selectedBranch.id}
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
        branchId={selectedBranch.id}
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
