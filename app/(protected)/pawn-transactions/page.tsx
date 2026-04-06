"use client";

import { TransactionActions } from "@/components/transactions/transaction-actions";
import { TransactionStats } from "@/components/transactions/transaction-stats";
import { TransactionTable } from "@/components/transactions/transaction-table";

export default function PawnTransactionsPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-zinc-500">Taguig Branch</p>

      <TransactionActions />
      <TransactionStats />
      <TransactionTable />
    </div>
  );
}
