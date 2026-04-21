"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { calculateGadgetInterest } from "@/lib/interest";
import { PaginationFooter } from "@/components/shared/pagination";
import { MoaModal } from "@/app/employee/pawn-transaction/_components/moa-modal";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import { TransactionViewModal } from "./_components/transaction-view-modal";
import type {
  TransactionPurposeFilter,
  TransactionRow,
  TransactionStatsData,
} from "./_components/types";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

type ApiPurpose =
  | "Start"
  | "Buy Back"
  | "Buy Out"
  | "Renew"
  | "Sold Item"
  | "Sale"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer";

interface ApiTransaction {
  id?: string;
  transaction_no: string;
  branch_id?: string | null;
  branch: string | null;
  purpose: ApiPurpose;
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
  related_pawned_item_id?: string | null;
  related_sale_item_id?: string | null;
  pawned_item?: {
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
    } | null;
  } | null;
}

interface TransactionsResponse {
  stats?: Partial<TransactionStatsData>;
  transactions: ApiTransaction[];
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
  const isBuyBackAction = transaction.purpose === "Buy Back";
  const isPawnAction = transaction.purpose === "Pawn";
  const calculations = calculateGadgetInterest(
    pawnAmount,
    transaction.transaction_date,
  );

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
    customerName: transaction.pawned_item?.customer?.full_name ?? "",
    customerAddress: transaction.pawned_item?.customer?.address ?? "",
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    buyBack: isBuyBackAction ? toAmountString(transaction.cash_in) : "0",
    percentage:
      isBuyBackAction || isPawnAction ? String(calculations.percentage) : "0",
    buyOut:
      transaction.purpose === "Buy Out"
        ? toAmountString(transaction.cash_out)
        : "0",
    sold:
      transaction.purpose === "Sold Item" || transaction.purpose === "Sale"
        ? toAmountString(transaction.cash_in)
        : "0",
    cashIn: isPawnAction ? "0" : toAmountString(transaction.cash_in),
    cashOut:
      isBuyBackAction ||
      transaction.purpose === "Sold Item" ||
      transaction.purpose === "Sale"
        ? "0"
        : toAmountString(transaction.cash_out),
    returnVal: toAmountString(transaction.return_amount),
    unit: transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: toAmountString(transaction.pawn_amount),
    storage: toAmountString(transaction.storage_fee),
    notes: transaction.pawned_item?.remarks ?? transaction.details ?? "",
    qrCode: transaction.pawned_item?.qr_code ?? undefined,
    serialNumber: transaction.pawned_item?.serial_number ?? undefined,
    itemsIncluded: transaction.pawned_item?.items_included ?? undefined,
    condition: transaction.pawned_item?.condition ?? undefined,
    category: transaction.pawned_item?.category ?? undefined,
    memoryStorage: transaction.pawned_item?.memory_storage ?? undefined,
    remarks: transaction.pawned_item?.remarks ?? undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
  };
}

const ITEMS_PER_PAGE = 10;

export default function PawnTransactionsPage() {
  const { selectedBranch, branches } = useBranch();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<TransactionPurposeFilter>("All");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
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
    remarks: string;
    amount: string;
    storageFee: string;
    purchasedDate: string;
    idPresented: string;
    branchName: string;
    branchAddress?: string;
    branchPhone?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchTransactions() {
      setIsLoading(true);

      try {
        const dateQuery = dateFilter ? `&date=${dateFilter}` : "&range=all";
        const data = await api.get<TransactionsResponse>(
          `/transactions?branch=${encodeURIComponent(selectedBranch.id)}${dateQuery}`,
        );

        if (!active) {
          return;
        }

        setTransactions((data.transactions || []).map(toTransactionRow));
        setStats({
          ...EMPTY_STATS,
          ...(data.stats || {}),
        });
      } catch (error) {
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
  }, [selectedBranch.id, dateFilter]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesPurpose = purposeFilter === "All" || transaction.purpose === purposeFilter;
    const matchesDate = !dateFilter || transaction.date === dateFilter;
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
        amount: transaction.pawn,
        storageFee: transaction.storage,
        purchasedDate: transaction.date,
        idPresented: "---",
        branchName: branchInfo?.name || transaction.branch,
        branchAddress: branchInfo?.location || "",
        branchPhone: branchInfo?.phone || "",
      });
      setIsMoaReprintOpen(true);
    },
    [branches, selectedBranch],
  );

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-emerald-900 dark:text-text-primary">
            Pawn Transactions
          </h1>
          <p className="mt-0.5 text-sm font-medium text-text-tertiary">
            Live transaction records across all branches with employee-style QR and print access.
          </p>
        </div>
      </div>

      <TransactionStats data={stats} />

      <TransactionActions
        search={search}
        purposeFilter={purposeFilter}
        dateFilter={dateFilter}
        selectedBranchLabel={selectedBranch.name}
        onSearchChange={setSearch}
        onPurposeFilterChange={setPurposeFilter}
        onDateFilterChange={setDateFilter}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
      />

      <TransactionTable
        data={paginatedTransactions}
        isLoading={isLoading}
        onViewDetails={setViewingTransaction}
        onPrint={handlePrintSlip}
      />

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTransactions.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

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
        />
      ) : null}
    </div>
  );
}
