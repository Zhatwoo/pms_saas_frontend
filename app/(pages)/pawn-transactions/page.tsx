"use client";

import { useState, useMemo } from "react";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn";

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

export default function PawnTransactionsPage() {
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  // TODO: Replace with real fetched data
  const currentStats = useMemo(() => {
    return { 
      pawnedToday: 0, 
      buyBack: 0, 
      renewed: 0, 
      soldItem: 0, 
      startingBalance: 0, 
      endingBalance: 0 
    };
  }, [selectedBranch]);

  // TODO: Replace with real fetched data
  const currentTransactions = useMemo(() => {
    return [] as TransactionRow[];
  }, [selectedBranch]);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
           <h1 className="text-xl font-bold text-emerald-900 leading-tight">Transactions</h1>
           <p className="text-xs font-medium text-zinc-500 mt-0.5">Manage and monitor daily pawn operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border text-xs text-zinc-800 rounded-md overflow-hidden flex items-center h-8 px-2 cursor-pointer shadow-sm">
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
      </div>

      <TransactionActions />
      <TransactionStats data={currentStats} />
      <TransactionTable data={currentTransactions} />
    </div>
  );
}
