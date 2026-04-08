"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";

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

const branches = ["All Branches", "Makati Main Branch", "Taguig Branch", "Cebu Branch"];

// Map filter tab names to transaction purpose values
const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Redeem": "Buy Back",   // Redeem maps to Buy Back purpose
  "New Pawn": "Pawn",
  "Sales / Transfer": "Sold Item",
  "Buy Back": "Buy Back",
};

export default function PawnTransactionsPage() {
  // TODO: Get user role from auth context (e.g., useAuth())
  const userRole = "super_admin"; // "super_admin" | "admin" | "employee"
  const isSuperAdmin = userRole === "super_admin";

  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
    startingBalance: 0, endingBalance: 0,
  });
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from NestJS backend
  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/transactions?branch=${encodeURIComponent(selectedBranch)}`);
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

  // Filter transactions by active tab
  const filteredTransactions = useMemo(() => {
    if (activeFilter === "All") return allTransactions;
    const targetPurpose = filterToPurpose[activeFilter];
    if (!targetPurpose) return allTransactions;
    return allTransactions.filter((t) => t.purpose === targetPurpose);
  }, [allTransactions, activeFilter]);

  // Export CSV
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
    link.download = `transactions_${selectedBranch.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions, selectedBranch]);

  // Print Report
  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-text leading-tight">Transactions</h1>
          <p className="text-xs font-medium text-text-tertiary mt-0.5">Manage and monitor daily pawn operations.</p>
        </div>

        {/* Branch Selector — Only visible for Super Admin */}
        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <div className="bg-surface border border-border-main text-xs text-text-primary rounded-md overflow-hidden flex items-center h-8 px-2 cursor-pointer shadow-sm">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none outline-none appearance-none pr-5 cursor-pointer font-medium"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="pointer-events-none -ml-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
      />
      <TransactionStats data={currentStats} />
      <TransactionTable data={filteredTransactions} />
    </div>
  );
}
