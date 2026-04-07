"use client";

import { TransactionActions } from "./_components/transaction-actions";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";

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
