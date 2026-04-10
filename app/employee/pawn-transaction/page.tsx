"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import { RenewModal } from "./_components/renew-modal";
import { NewPawnForm } from "./_components/new-pawn-form";
import { BuyBackForm } from "./_components/buy-back-form";
import { DailyBalanceConfirmation } from "@/components/shared/daily-balance-confirmation";
import { useBranch } from "@/contexts/branch-context";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn";
type FilterType = "All" | "Renew" | "Redeem" | "New Pawn" | "Sales / Transfer" | "Buy Back";
type ActiveForm = "newPawn" | "buyBack" | null;

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

export default function EmployeePawnTransactionsPage() {
  const { selectedBranch } = useBranch();
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
    startingBalance: 0, endingBalance: 0,
  });
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; type: "starting" | "ending" }>({
    open: false,
    type: "starting",
  });

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/transactions?branch=${encodeURIComponent(selectedBranch.name)}`);
        const data = await res.json();
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
  }, [selectedBranch]);

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
  }, [filteredTransactions, selectedBranch]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const openNewPawnForm = useCallback(() => {
    setActiveFilter("All");
    setActiveForm("newPawn");
  }, []);

  const openBuyBackForm = useCallback(() => {
    setActiveFilter("All");
    setActiveForm("buyBack");
  }, []);

  const closeActiveForm = useCallback(() => {
    setActiveForm(null);
  }, []);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-900 leading-tight">Transactions</h1>
        </div>
      </div>

      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onRenewClick={() => setIsRenewModalOpen(true)}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
        onNewPawn={openNewPawnForm}
        onStartDay={() => setBalanceModal({ open: true, type: "starting" })}
        onEndDay={() => setBalanceModal({ open: true, type: "ending" })}
      />

      {activeForm === "newPawn" ? (
        <NewPawnForm onCancel={closeActiveForm} />
      ) : activeForm === "buyBack" ? (
        <BuyBackForm onCancel={closeActiveForm} />
      ) : (
        <>
          <TransactionStats data={currentStats} />
          <TransactionTable data={filteredTransactions} />
        </>
      )}

      <DailyBalanceConfirmation
        isOpen={balanceModal.open}
        type={balanceModal.type}
        currentCash={balanceModal.type === "starting" ? "10000" : "25000"}
        onClose={() => setBalanceModal((p) => ({ ...p, open: false }))}
        onConfirm={(amt) => {
          console.log(`Employee confirmed ${balanceModal.type} cash:`, amt);
          setBalanceModal((p) => ({ ...p, open: false }));
        }}
      />

      <RenewModal 
        isOpen={isRenewModalOpen} 
        onClose={() => setIsRenewModalOpen(false)} 
        branchName={selectedBranch.name}
      />
    </div>
  );
}
