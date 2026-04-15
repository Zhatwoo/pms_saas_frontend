"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import {
  ManualTransactionModal,
  type ManualTransactionPayload,
} from "./_components/manual-transaction-modal";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn";
type FilterType = "All" | "Renew" | "Redeem" | "New Pawn" | "Sales / Transfer" | "Buy Back";

interface TransactionRow {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
}

const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Redeem": "Buy Back",
  "New Pawn": "Pawn",
  "Sales / Transfer": "Sold Item",
  "Buy Back": "Buy Back",
};

export default function PawnTransactionsPage() {
  const { selectedBranch, isAllBranches, branches } = useBranch();

  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
    startingBalance: 0, endingBalance: 0,
  });
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
        const data = await api.get<{ stats: any; transactions: TransactionRow[] }>(`/transactions${query}`);
        if (data) {
          setCurrentStats(data.stats || {
            pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
            startingBalance: 0, endingBalance: 0,
          });
          setAllTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [selectedBranch.id, isAllBranches]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "All") return allTransactions;
    const targetPurpose = filterToPurpose[activeFilter];
    if (!targetPurpose) return allTransactions;
    return allTransactions.filter((t) => t.purpose === targetPurpose);
  }, [allTransactions, activeFilter]);

  const handleExportCSV = useCallback(() => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Transaction #", "Purpose", "Date", "Time", "Cash In", "Cash Out", "Return", "Unit", "Unit Code", "Pawn", "Storage"];
    const rows = filteredTransactions.map((r) =>
      [r.transactionNo, r.purpose, r.date, r.time, r.cashIn, r.cashOut, r.returnVal, r.unit, r.unitCode, r.pawn, r.storage].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${selectedBranch.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions, selectedBranch.name]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const handleManualSubmit = (data: ManualTransactionPayload) => {
    const newTransaction: TransactionRow = {
      transactionNo: data.transactionNo,
      branch: selectedBranch.name,
      purpose: "Start",
      date: data.date,
      time: data.time,
      cashIn: data.type === "Cash In" ? data.amount.toString() : "0",
      cashOut: data.type === "Cash Transfer" ? data.amount.toString() : "0",
      returnVal: "0",
      unit: "Manual Entry",
      unitCode: data.type,
      pawn: "0",
      storage: "0",
    };
    setAllTransactions(prev => [newTransaction, ...prev]);
  };

  // Build branch name list for the manual modal
  const branchNames = branches.map((b) => b.name);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 dark:text-text-primary leading-tight">Transactions</h1>
          <p className="text-sm font-medium text-text-tertiary mt-0.5">Manage and monitor daily pawn operations.</p>
        </div>
      </div>

      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
        onManualInput={() => setIsManualModalOpen(true)}
      />
      <TransactionStats data={currentStats} />
      <TransactionTable data={filteredTransactions} />

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
