"use client";

import { useState, useEffect, type ReactNode } from "react";
import { DataTable } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
import type { Column } from "@/components/shared/data-table";

export interface FinanceTransaction {
  id: string;
  date: string;
  branch: string;
  branchId: string;
  type: "ADD_FUNDS" | "TRANSFER_IN" | "TRANSFER_OUT";
  amount: number;
  balanceAfter: number | null;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy: string | null;
  approvalDate: string | null;
  notes: string;
}

const columns: Column[] = [
  { key: "date", label: "Date" },
  { key: "branch", label: "Branch" },
  { key: "type", label: "Type" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "balanceAfter", label: "Balance After", align: "right" },
  { key: "status", label: "Status", align: "center" },
  { key: "approvedBy", label: "Approved By" },
  { key: "approvalDate", label: "Approval Date" },
  { key: "notes", label: "Notes" },
];

const typeConfig = {
  ADD_FUNDS: { label: "Add Funds", bgClass: "bg-emerald-surface text-emerald-text", dotClass: "bg-brand-green" },
  TRANSFER_IN: { label: "Transfer In", bgClass: "bg-blue-100 text-blue-700", dotClass: "bg-blue-500" },
  TRANSFER_OUT: { label: "Transfer Out", bgClass: "bg-red-100 text-red-600", dotClass: "bg-red-500" },
};

const statusConfig = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
};

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface TransactionTableProps {
  transactions: FinanceTransaction[];
  searchQuery: string;
  branchFilter: string;
  dateFilter: string;
}

const ITEMS_PER_PAGE = 10;

export function TransactionTable({
  transactions,
  searchQuery,
  branchFilter,
  dateFilter,
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.branch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = branchFilter === "all" || t.branchId === branchFilter;

    const matchesDate = !dateFilter || t.date.startsWith(dateFilter);

    return matchesSearch && matchesBranch && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, branchFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={paginated}
        renderCell={(key, rawValue, row) => {
          const value = rawValue as string | number | null | undefined;
          if (key === "date") {
            return <span className="text-sm text-text-secondary">{fmtDate(value as string | null)}</span>;
          }
          if (key === "type") {
            const cfg = typeConfig[value as keyof typeof typeConfig];
            return (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bgClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
                {cfg.label}
              </span>
            );
          }
          if (key === "amount") {
            const txType = row.type as string;
            const color =
              txType === "TRANSFER_OUT"
                ? "text-red-600"
                : txType === "TRANSFER_IN"
                  ? "text-blue-600"
                  : "text-emerald-text";
            const prefix = txType === "TRANSFER_OUT" ? "-" : "+";
            return (
              <span className={`text-sm font-bold ${color}`}>
                {prefix}{fmt(value as number)}
              </span>
            );
          }
          if (key === "balanceAfter") {
            return (
              <span className="text-sm font-semibold text-text-primary">
                {typeof value === "number" ? fmt(value) : "-"}
              </span>
            );
          }
          if (key === "status") {
            const cls = statusConfig[value as keyof typeof statusConfig] || "";
            return (
              <span className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${cls}`}>
                {value}
              </span>
            );
          }
          if (key === "approvedBy") {
            return (
              <span className="text-sm text-text-secondary">
                {value || <span className="text-text-muted">—</span>}
              </span>
            );
          }
          if (key === "approvalDate") {
            return <span className="text-sm text-text-secondary">{fmtDate(value as string | null)}</span>;
          }
          if (key === "notes") {
            return (
              <span className="max-w-[140px] truncate text-sm text-text-muted" title={value as string | undefined}>
                {value || "—"}
              </span>
            );
          }
          return value as ReactNode;
        }}
      />

      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          className="border-t-0"
        />
      </div>
    </div>
  );
}
