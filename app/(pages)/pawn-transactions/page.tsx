"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { formatPeso } from '@/lib/currency';
import { useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { useInterestRates } from "@/contexts/interest-rates-context";
import {
  getTransactionInterestPercentage,
  isLegacyBuyBackRepurchase,
  isLegacyBuyOutTransaction,
  resolvePawnedItemJoin,
} from "@/lib/pawn-transaction-mapper";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { operationalCashTotalsForPawnEnding, operationalCashTotals } from "@/lib/ledger-operational-totals";
import { PaginationFooter } from "@/components/shared/pagination";
import { MoaModal } from "@/app/employee/pawn-transaction/_components/moa-modal";
import { TransactionActions, type ViewMode } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import { TransactionViewModal } from "./_components/transaction-view-modal";
import type {
  TransactionPurposeFilter,
  TransactionRow,
  TransactionStatsData,
} from "./_components/types";
import { BranchDaySessionToolbar } from "@/components/shared/branch-day-session-toolbar";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

type ApiPurpose =
  | "Start"
  | "End"
  | "Buy Back"
  | "Buy Out"
  | "Renew"
  | "Reappraise"
  | "Redeem"
  | "Sold Item"
  | "Sale"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer"
  | "Transfer Item";

interface ApiTransaction {
  id?: string;
  transaction_no: string;
  branch_id?: string | null;
  branch: string | null;
  voided_at?: string | null;
  purpose: ApiPurpose;
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
  buyback_proof?: string | null;
  related_pawned_item_id?: string | null;
  related_sale_item_id?: string | null;
  pawned_item?: {
    qr_code?: string | null;
    serial_number?: string | null;
    items_included?: string | null;
    condition?: string | null;
    category?: string | null;
    pawn_date?: string | null;
    interest_rate_snapshot?: unknown;
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
  } | Array<{
    qr_code?: string | null;
    serial_number?: string | null;
    items_included?: string | null;
    condition?: string | null;
    category?: string | null;
    pawn_date?: string | null;
    interest_rate_snapshot?: unknown;
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
  }> | null;
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

interface TransactionsResponse {
  stats?: Partial<TransactionStatsData> & { sessionOpenedAt?: string | null };
  transactions: ApiTransaction[];
}

interface BranchFinanceSummary {
  branchId: string;
  startingBalance: number;
  currentBalance: number;
}

const EMPTY_STATS: TransactionStatsData = {
  pawnedToday: 0,
  buyBack: 0,
  renewed: 0,
  soldItem: 0,
  startingBalance: 0,
  endingBalance: 0,
};

function toAmountString(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? String(amount) : "0";
}

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  const pawnAmount = Number(transaction.pawn_amount || 0);
  const item = resolvePawnedItemJoin(transaction.pawned_item);
  const isBuyBackRepurchase = isLegacyBuyBackRepurchase(
    transaction.purpose,
    transaction.details,
  );
  const isBuyOutAction = isLegacyBuyOutTransaction(
    transaction.purpose,
    transaction.details,
  );
  const isPawnAction = transaction.purpose === "Pawn";
  const customer = item?.customer ?? transaction.customer;
  const percentage = getTransactionInterestPercentage({
    pawnAmount,
    purpose: transaction.purpose,
    details: transaction.details,
    transactionDate: transaction.transaction_date,
    pawnDate: item?.pawn_date,
    category: item?.category,
    storageFee: transaction.storage_fee,
    interestRateSnapshot: item?.interest_rate_snapshot,
  });

  return {
    id: transaction.id ?? transaction.transaction_no,
    transactionNo: transaction.transaction_no,
    branchId: transaction.branch_id ?? "",
    branch: transaction.branch ?? "Unknown Branch",
    purpose:
      transaction.purpose === "Sale"
        ? "Sold Item"
        : (transaction.purpose as TransactionRow["purpose"]),
    details: transaction.details ?? "",
    customerName: customer?.full_name ?? "",
    createdByName: transaction.created_by_user?.full_name ?? undefined,
    createdByRole: transaction.created_by_user?.role ?? undefined,
    customerAddress: customer?.address ?? "",
    customerBarangay: customer?.barangay ?? undefined,
    customerCity: customer?.city ?? undefined,
    customerRegion: customer?.region ?? undefined,
    customerPhone: customer?.contact_number ?? undefined,
    customerMiddleName: customer?.middle_name ?? undefined,
    idPresented: customer?.id_presented ?? undefined,
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    buyBack: isBuyBackRepurchase ? toAmountString(transaction.cash_in) : "0",
    percentage,
    buyOut: isBuyOutAction ? toAmountString(transaction.cash_in) : "0",
    sold:
      transaction.purpose === "Sold Item" || transaction.purpose === "Sale"
        ? toAmountString(transaction.cash_in)
        : "0",
    cashIn: isPawnAction ? "0" : toAmountString(transaction.cash_in),
    cashOut:
      isBuyOutAction ||
      isBuyBackRepurchase ||
      transaction.purpose === "Sold Item" ||
      transaction.purpose === "Sale"
        ? "0"
        : toAmountString(transaction.cash_out),
    returnVal: toAmountString(transaction.return_amount),
    unit: transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: toAmountString(transaction.pawn_amount),
    storage: toAmountString(transaction.storage_fee),
    notes: item?.remarks ?? transaction.details ?? "",
    qrCode: item?.qr_code || transaction.qr_code || undefined,
    serialNumber: item?.serial_number ?? undefined,
    itemsIncluded: item?.items_included ?? undefined,
    condition: item?.condition ?? undefined,
    category: item?.category ?? undefined,
    memoryStorage: item?.memory_storage ?? undefined,
    remarks: item?.remarks ?? undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
    idPhoto: transaction.id_photo ?? undefined,
    buyback_proof: transaction.buyback_proof ?? undefined,
  };
}

const ITEMS_PER_PAGE = 10;

// ─── Calendar helpers ─────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarCells(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
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
          onClick={() => calendarMonth === 0 ? onChangeMonth(calendarYear - 1, 11) : onChangeMonth(calendarYear, calendarMonth - 1)}
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
            if (calendarMonth === 11) {
              onChangeMonth(calendarYear + 1, 0);
            } else {
              onChangeMonth(calendarYear, calendarMonth + 1);
            }
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors ${isNextDisabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/10"}`}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-surface-secondary dark:border-border-subtle">
        {DAY_NAMES.map((d) => (
          <div key={d} className="border-r border-zinc-200/80 py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted last:border-r-0 dark:border-border-subtle">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-16 border-b border-r border-zinc-200/80 bg-surface-secondary/20 dark:border-border-subtle" />;
          }
          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = calendarData[dateStr] ?? 0;
          const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
          const isSelected = selectedDate === dateStr;
          const isFuture = dateStr > todayString;

          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => {
                if (isFuture) return;
                onSelectDate(dateStr);
              }}
              className={`relative h-16 border-b border-r border-zinc-200/80 p-1.5 text-left transition-all dark:border-border-subtle ${isFuture ? "cursor-not-allowed opacity-40" : "hover:bg-emerald-50/10"} ${isSelected ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10" : ""} ${isToday ? "ring-1 ring-inset ring-amber-400" : ""}`}
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

      <div className="flex items-center gap-4 border-t border-zinc-200/80 bg-surface-secondary/60 px-4 py-2.5 dark:border-border-subtle">
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
  );
}

export default function PawnTransactionsPage() {
  const { selectedBranch, branches, isAllBranches, canSwitchBranch } = useBranch();
  const { isReady: interestRatesReady } = useInterestRates();

  const searchParams = useSearchParams();
  const highlightTransactionNo = searchParams.get("transactionNo");
  const shouldHighlight = searchParams.get("highlightTransaction") === "true";
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  const todayString = getPhCalendarDateString();

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<TransactionPurposeFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState(() => todayString);
  const [listDateFilter, setListDateFilter] = useState(() => todayString);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingTransaction, setViewingTransaction] =
    useState<TransactionRow | null>(null);
  const [stats, setStats] = useState<TransactionStatsData>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoaReprintOpen, setIsMoaReprintOpen] = useState(false);
  const [reprintData, setReprintData] = useState<{
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
    memory: string;
    remarks: string;
    amount: string;
    storageFee: string;
    purchasedDate: string;
    idPresented: string;
    branchName: string;
    branchAddress?: string;
    branchPhone?: string;
    processedBy?: string;
  } | null>(null);

  useEffect(() => {
    if (!interestRatesReady) return;

    let active = true;

    async function fetchTransactions() {


      setIsLoading(true);

      try {
        const dateQuery = `&date=${selectedDate}`;
        const branchParam = isAllBranches
          ? ""
          : `branch=${encodeURIComponent(selectedBranch.id)}`;
        const [data, financeSummary] = await Promise.all([
          api.get<TransactionsResponse>(
            `/transactions?${branchParam}${dateQuery}`,
          ),
          api
            .get<BranchFinanceSummary[]>(
              `/branch-finance/summary?date=${selectedDate}${branchParam ? `&${branchParam}` : ""}`,
            )
            .catch(() => [] as BranchFinanceSummary[]),
        ]);

        const phToday = getPhCalendarDateString();
        const ledger = operationalCashTotalsForPawnEnding(
          data.transactions ?? [],
          data.stats?.sessionOpenedAt ?? null,
        );

        let startingBalance = Number(data.stats?.startingBalance ?? 0);

        if (isAllBranches && financeSummary.length > 0) {
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

        const normalizedStats: TransactionStatsData = {
          ...EMPTY_STATS,
          ...(data.stats || {}),
          startingBalance,
          endingBalance,
        };

        if (!active) {
          return;
        }

        setTransactions((data.transactions || []).map(toTransactionRow));
        setStats(normalizedStats);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.statusCode === 403 &&
          /select a branch|starting balance/i.test(error.message)
        ) {
          if (active) {
            setTransactions([]);
            setStats(EMPTY_STATS);
          }
          return;
        }

        console.error("Failed to load transactions:", error);
        if (active) {
          setTransactions([]);
          setStats(EMPTY_STATS);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void fetchTransactions();

    return () => {
      active = false;
    };
  }, [selectedBranch.id, selectedDate, isAllBranches, interestRatesReady]);

  useEffect(() => {
    if (!interestRatesReady) return;

    let active = true;

    async function fetchCalendarTransactions() {


      try {
        const branchParam = isAllBranches
          ? ""
          : `branch=${encodeURIComponent(selectedBranch.id)}`;
        const query = `${branchParam}${branchParam ? "&" : ""}range=all`;
        const data = await api.get<TransactionsResponse>(`/transactions?${query}`);

        if (active) {
          setAllTransactions((data.transactions || []).map(toTransactionRow));
        }
      } catch (error) {
        console.error("Failed to load transaction calendar data:", error);
        if (active) {
          setAllTransactions([]);
        }
      }
    }

    void fetchCalendarTransactions();

    return () => {
      active = false;
    };
  }, [selectedBranch.id, isAllBranches, interestRatesReady]);

  useEffect(() => {
    if (viewMode === "list") {
      setListDateFilter(selectedDate);
    }
  }, [selectedDate, viewMode]);

  // When navigating from a notification, reset to today so the transaction is visible
  useEffect(() => {
    if (shouldHighlight && highlightTransactionNo) {
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
  }, [shouldHighlight, highlightTransactionNo]);

  // Scroll to and highlight the target transaction row after data loads
  useEffect(() => {
    if (!shouldHighlight || !highlightTransactionNo || isLoading) return;
    const timer = setTimeout(() => {
      if (highlightRowRef.current) {
        highlightRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [shouldHighlight, highlightTransactionNo, isLoading, transactions]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesPurpose = purposeFilter === "All" || transaction.purpose === purposeFilter;
    const matchesDate = viewMode !== "list" || !listDateFilter || transaction.date === listDateFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      transaction.transactionNo.toLowerCase().includes(query) ||
      transaction.branch.toLowerCase().includes(query) ||
      transaction.customerName.toLowerCase().includes(query) ||
      transaction.unit.toLowerCase().includes(query) ||
      transaction.unitCode.toLowerCase().includes(query) ||
      transaction.details.toLowerCase().includes(query);

    return matchesPurpose && matchesDate && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Build calendar data: count transactions per date for the visible month
  const calendarData = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const tx of allTransactions) {
      const [yearStr, monthStr] = tx.date.split("-");
      if (Number(yearStr) === calendarYear && Number(monthStr) - 1 === calendarMonth) {
        counts[tx.date] = (counts[tx.date] ?? 0) + 1;
      }
    }

    return counts;
  }, [allTransactions, calendarMonth, calendarYear]);

  function handleExportCSV() {
    if (filteredTransactions.length === 0) {
      return;
    }

    const headers = [
      "Transaction #",
      "Branch",
      "Purpose",
      "Customer",
      "Date",
      "Time",
      "Buy Back",
      "Interest %",
      "Buy Out",
      "Sold",
      "Cash In",
      "Cash Out",
      "Return",
      "Unit",
      "Unit Code",
      "Pawn",
      "Storage",
      "Notes",
    ];

    const rows = filteredTransactions.map((transaction) =>
      [
        transaction.transactionNo,
        transaction.branch,
        transaction.purpose,
        transaction.customerName,
        transaction.date,
        transaction.time,
        transaction.buyBack,
        transaction.percentage,
        transaction.buyOut,
        transaction.sold,
        transaction.cashIn,
        transaction.cashOut,
        transaction.returnVal,
        transaction.unit,
        transaction.unitCode,
        transaction.pawn,
        transaction.storage,
        transaction.notes,
      ]
        .map(csvCell)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${selectedBranch.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const handlePrintSlip = useCallback(
    (transaction: TransactionRow) => {
      if (transaction.purpose !== "Pawn") {
        return;
      }

      const names = (transaction.customerName || "WALK-IN CUSTOMER").split(" ");
      const branchInfo =
        branches.find((branch) => branch.id === transaction.branchId) ??
        selectedBranch;

      setReprintData({
        firstName: names[0] || "WALK-IN",
        middleName: "",
        lastName: names.length > 1 ? names.slice(1).join(" ") : "---",
        address: transaction.customerAddress || "---",
        contactNo: "---",
        unitCode: transaction.unitCode || "---",
        unitName: transaction.unit || "---",
        category: transaction.category || "---",
        serialNumber: transaction.serialNumber || "---",
        itemsIncluded: transaction.itemsIncluded || "---",
        condition: transaction.condition || "---",
        remarks: transaction.remarks || transaction.notes || "---",
        memory: transaction.memoryStorage || transaction.notes || "---",
        amount: transaction.pawn,
        storageFee: transaction.storage,
        purchasedDate: transaction.date,
        idPresented: "---",
        branchName: branchInfo?.name || transaction.branch,
        branchAddress: branchInfo?.location || "",
        branchPhone: branchInfo?.phone || "",
        processedBy: transaction.createdByName || "AUTHORIZED PERSONNEL",
      });
      setIsMoaReprintOpen(true);
    },
    [branches, selectedBranch],
  );

  return (
    <div className="space-y-4 pb-4 printable-area">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .header-print { background: #064e3b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: white !important; padding: 40px 20px !important; text-align: center !important; margin-bottom: 30px !important; border-bottom: 8px solid #f59e0b !important; }
          .header-print h1 { margin: 0 !important; font-size: 32px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 2px !important; color: white !important; }
          .header-print p { margin: 10px 0 0 !important; font-size: 14px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 4px !important; opacity: 0.9 !important; color: white !important; }
          .print-hide { display: none !important; }
        }
      `}} />

      <div className="hidden print:block">
        <div className="header-print">
          <h1>JCLB Buy Back Shop</h1>
          <p>Pawn Transactions Report - {isAllBranches ? "All Branches" : selectedBranch.name}</p>
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
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{stats.pawnedToday}</td>
              </tr>
              <tr>
                <td className="border border-emerald-800/20 p-2">Buy Back</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{stats.buyBack}</td>
              </tr>
              <tr>
                <td className="border border-emerald-800/20 p-2">Renewed</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{stats.renewed}</td>
              </tr>
              <tr>
                <td className="border border-emerald-800/20 p-2">Sold Item</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold">{stats.soldItem}</td>
              </tr>
              <tr className="bg-emerald-50/50">
                <td className="border border-emerald-800/20 p-2 font-bold text-emerald-900">Live Total Balance</td>
                <td className="border border-emerald-800/20 p-2 text-right font-bold text-emerald-900">
                  {formatPeso(stats.endingBalance)}
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
                <th className="border border-emerald-800/10 p-1 text-left">Branch</th>
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
                <tr key={tx.id}>
                  <td className="border border-emerald-800/10 p-1">{tx.transactionNo}</td>
                  <td className="border border-emerald-800/10 p-1">{tx.branch}</td>
                  <td className="border border-emerald-800/10 p-1 font-bold">{tx.purpose}</td>
                  <td className="border border-emerald-800/10 p-1">{tx.customerName || "Walk-in"}</td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.cashIn !== "0" ? formatPeso(Number(tx.cashIn)) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.cashOut !== "0" ? formatPeso(Number(tx.cashOut)) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.pawn !== "0" ? formatPeso(Number(tx.pawn)) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1 text-right">
                    {tx.storage !== "0" ? formatPeso(Number(tx.storage)) : "-"}
                  </td>
                  <td className="border border-emerald-800/10 p-1">{tx.unitCode || tx.unit || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <div className="print-hide">
        {/* Page Title Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Pawn Transactions</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            View and manage all pawn transaction records
          </p>
        </div>



        <BranchDaySessionToolbar
          branchId={isAllBranches ? null : selectedBranch.id}
          hideActions={canSwitchBranch}
        />
        <TransactionStats data={stats} isLoading={isLoading} selectedDate={selectedDate} />
      </div>

      <div className="print-hide">
        <TransactionActions
          search={search}
          purposeFilter={purposeFilter}
          selectedBranchLabel={selectedBranch.name}
          onSearchChange={setSearch}
          onPurposeFilterChange={setPurposeFilter}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setCurrentPage(1);
          }}
          dateFilter={listDateFilter}
          onDateFilterChange={(val) => {
            if (val && val > todayString) {
              return;
            }
            setListDateFilter(val);
            if (val) {
              setSelectedDate(val);
            }
            setCurrentPage(1);
          }}
          onExportCSV={handleExportCSV}
          onPrintReport={handlePrintReport}
          maxDate={todayString}
        />
      </div>

      {viewMode === "calendar" && (
        <div className="print-hide">
          <TransactionsCalendar
            calendarData={calendarData}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setCurrentPage(1);
            }}
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            onChangeMonth={(year, month) => {
              setCalendarYear(year);
              setCalendarMonth(month);
              setSelectedDate(`${year}-${String(month + 1).padStart(2, "0")}-01`);
            }}
          />
        </div>
      )}

      <div className="print-hide">
        <TransactionTable
          isLoading={isLoading}
          data={paginatedTransactions}
          onViewDetails={setViewingTransaction}
          onPrint={handlePrintSlip}
          highlightTransactionNo={shouldHighlight ? highlightTransactionNo : null}
          highlightRowRef={highlightRowRef}
          isToday={selectedDate === new Date().toISOString().split("T")[0]}
        />
      </div>

      {totalPages > 1 ? (
        <div className="print-hide">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}

      <TransactionViewModal
        isOpen={Boolean(viewingTransaction)}
        transaction={viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        onPrint={handlePrintSlip}
      />

      {reprintData ? (
        <MoaModal
          isOpen={isMoaReprintOpen}
          onClose={() => setIsMoaReprintOpen(false)}
          onConfirm={() => setIsMoaReprintOpen(false)}
          data={reprintData}
          isLoading={false}
          mode="view"
          autoPrint={true}
        />
      ) : null}
    </div>
  );
}
