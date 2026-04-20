"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import {
  TransactionDetailsModal,
  type TransactionDetailsData,
} from "@/components/shared/transaction-details-modal";
import {
  ManualTransactionModal,
  type ManualTransactionPayload,
} from "./_components/manual-transaction-modal";

type PurposeType =
  | "Start"
  | "Buy Back"
  | "Renew"
  | "Sold Item"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer";

interface TransactionRow {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
  buyBack: string;
  percentage: string;
  buyOut: string;
  sold: string;
  details: string;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  qrCode?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
}

interface TransactionTableRow {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
  details: string;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  qrCode?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
}

interface ApiTransaction {
  transaction_no: string;
  branch: string | null;
  purpose: string;
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
}

interface TransactionsResponse {
  stats?: typeof DEFAULT_STATS;
  transactions: ApiTransaction[];
}

const DEFAULT_STATS = {
  pawnedToday: 0,
  buyBack: 0,
  renewed: 0,
  soldItem: 0,
  startingBalance: 0,
  endingBalance: 0,
};

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  const purpose = transaction.purpose as PurposeType;
  const isBuyBackAction = transaction.purpose === "Buy Back";
  const isPawnAction = transaction.purpose === "Pawn";
  return {
    transactionNo: transaction.transaction_no,
    branch: transaction.branch ?? "",
    purpose,
    buyBack: isBuyBackAction ? String(transaction.cash_in ?? 0) : "0",
    percentage: "0",
    buyOut: transaction.purpose === "Buy Out" ? String(transaction.cash_out ?? 0) : "0",
    sold: transaction.purpose === "Sold Item" || transaction.purpose === "Sale" ? String(transaction.cash_in ?? 0) : "0",
    details: transaction.details ?? "",
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    cashIn: String(transaction.cash_in ?? 0),
    cashOut: String(transaction.cash_out ?? 0),
    returnVal: String(transaction.return_amount ?? 0),
    unit: transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: String(transaction.pawn_amount ?? 0),
    storage: String(transaction.storage_fee ?? 0),
    qrCode: undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
  };
}

function toTransactionDetailsData(transaction: TransactionTableRow): TransactionDetailsData {
  return {
    transactionNo: transaction.transactionNo,
    purpose: transaction.purpose,
    buyBack: transaction.purpose === "Buy Back" ? transaction.cashIn : "0",
    buyOut: "0",
    sold: transaction.purpose === "Sold Item" ? transaction.cashIn : "0",
    date: transaction.date,
    time: transaction.time,
    cashIn: transaction.cashIn,
    cashOut: transaction.cashOut,
    returnVal: transaction.returnVal,
    unit: transaction.unit,
    unitCode: transaction.unitCode,
    pawn: transaction.pawn,
    storage: transaction.storage,
    qrCode: transaction.qrCode,
    relatedPawnedItemId: transaction.relatedPawnedItemId,
    relatedSaleItemId: transaction.relatedSaleItemId,
  };
}

export default function PawnTransactionsPage() {
  const { selectedBranch, isAllBranches, branches } = useBranch();

  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
    startingBalance: 0, endingBalance: 0,
  });
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetailsData | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
        const data = await api.get<TransactionsResponse>(`/transactions${query}`);
        if (data) {
          setCurrentStats(data.stats || DEFAULT_STATS);
          setAllTransactions((data.transactions || []).map(toTransactionRow));
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [selectedBranch.id, isAllBranches]);

  const handleExportCSV = useCallback(() => {
    if (allTransactions.length === 0) return;
    const headers = ["Transaction #", "Branch", "Purpose", "Details", "Date", "Time", "Cash In", "Cash Out", "Return", "Unit", "Unit Code", "Pawn", "Storage"];
    const rows = allTransactions.map((r) =>
      [r.transactionNo, r.branch, r.purpose, r.details, r.date, r.time, r.cashIn, r.cashOut, r.returnVal, r.unit, r.unitCode, r.pawn, r.storage].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${selectedBranch.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [allTransactions, selectedBranch.name]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const handleManualSubmit = (data: ManualTransactionPayload) => {
    const newTransaction: TransactionRow = {
      transactionNo: data.transactionNo,
      branch: selectedBranch.name,
      purpose: "Start",
      buyBack: "0",
      percentage: "0",
      buyOut: "0",
      sold: "0",
      details: "Manual Entry",
      date: data.date,
      time: data.time,
      cashIn: data.type === "Cash In" ? data.amount.toString() : "0",
      cashOut: data.type === "Cash Transfer" ? data.amount.toString() : "0",
      returnVal: "0",
      unit: "Manual Entry",
      unitCode: data.type,
      pawn: "0",
      storage: "0",
      qrCode: undefined,
    };
    setAllTransactions(prev => [newTransaction, ...prev]);
  };

  // Build branch name list for the manual modal
  const branchNames = branches.map((b) => b.name);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 dark:text-text-primary leading-tight">Transactions</h1>
          <p className="text-sm font-medium text-text-tertiary mt-0.5">Manage and monitor daily pawn operations.</p>
        </div>

        <TransactionActions
          onExportCSV={handleExportCSV}
          onPrintReport={handlePrintReport}
          onManualInput={() => setIsManualModalOpen(true)}
        />
      </div>
      <TransactionStats data={currentStats} />
      <TransactionTable
        data={allTransactions}
        onViewDetails={(transaction) =>
          setSelectedTransaction(toTransactionDetailsData(transaction))
        }
      />

      <TransactionDetailsModal
        isOpen={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <ManualTransactionModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        onSubmit={handleManualSubmit}
        branches={branchNames}
        currentBranch={selectedBranch.name}
      />
    </div>
  );
}
