"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import type { Column } from "@/components/shared/data-table";

export type LedgerEntryType =
  | "pawn"
  | "buy_back"
  | "renewal"
  | "sale"
  | "fund_transfer_in"
  | "fund_transfer_out"
  | "start"
  | "other";

export interface LedgerEntry {
  id: string;
  date: string;
  time: string | null;
  type: LedgerEntryType;
  description: string;
  cashIn: number;
  cashOut: number;
  branchId: string;
  branchName: string | null;
  reference: string | null;
}

export interface FinanceSummaryBreakdown {
  pawnOut: number;
  buyBackIn: number;
  renewalIn: number;
  saleIn: number;
  fundTransferIn: number;
  fundTransferOut: number;
  startBalance: number;
  other: number;
}

const TYPE_CONFIG: Record<
  LedgerEntryType,
  { label: string; bgClass: string; dotClass: string }
> = {
  pawn: { label: "Pawn", bgClass: "bg-orange-100 text-orange-700", dotClass: "bg-orange-500" },
  buy_back: { label: "Buy Back", bgClass: "bg-blue-100 text-blue-700", dotClass: "bg-blue-500" },
  renewal: { label: "Renewal", bgClass: "bg-teal-100 text-teal-700", dotClass: "bg-teal-500" },
  sale: { label: "Sale", bgClass: "bg-purple-100 text-purple-700", dotClass: "bg-purple-500" },
  fund_transfer_in: { label: "Fund In", bgClass: "bg-emerald-100 text-emerald-700", dotClass: "bg-emerald-500" },
  fund_transfer_out: { label: "Fund Out", bgClass: "bg-red-100 text-red-600", dotClass: "bg-red-500" },
  start: { label: "Opening", bgClass: "bg-indigo-100 text-indigo-700", dotClass: "bg-indigo-500" },
  other: { label: "Other", bgClass: "bg-zinc-100 text-zinc-600", dotClass: "bg-zinc-400" },
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

const ITEMS_PER_PAGE = 15;

interface FinanceLedgerTableProps {
  entries: LedgerEntry[];
  isLoading?: boolean;
  showBranchColumn?: boolean;
  searchQuery?: string;
  typeFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function FinanceLedgerTable({
  entries,
  isLoading,
  showBranchColumn = false,
  searchQuery = "",
  typeFilter = "all",
  dateFrom = "",
  dateTo = "",
}: FinanceLedgerTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const columns: Column[] = useMemo(() => {
    const cols: Column[] = [
      { key: "date", label: "Date" },
    ];
    if (showBranchColumn) {
      cols.push({ key: "branchName", label: "Branch" });
    }
    cols.push(
      { key: "type", label: "Type" },
      { key: "description", label: "Description" },
      { key: "cashIn", label: "Cash In", align: "right" },
      { key: "cashOut", label: "Cash Out", align: "right" },
      { key: "reference", label: "Reference" },
    );
    return cols;
  }, [showBranchColumn]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          (e.description ?? "").toLowerCase().includes(q) ||
          (e.branchName ?? "").toLowerCase().includes(q) ||
          (e.reference ?? "").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (typeFilter && typeFilter !== "all" && e.type !== typeFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [entries, searchQuery, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-main bg-surface px-5 py-10 text-center text-sm text-text-tertiary">
        Loading financial activity...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={paginated}
        emptyMessage="No financial activity found for the selected filters."
        renderCell={(key, value, row) => {
          if (key === "date") {
            return (
              <div>
                <span className="text-sm text-text-secondary">{fmtDate(value)}</span>
                {row.time ? (
                  <span className="ml-1.5 text-xs text-text-muted">{row.time}</span>
                ) : null}
              </div>
            );
          }
          if (key === "type") {
            const cfg = TYPE_CONFIG[value as LedgerEntryType] ?? TYPE_CONFIG.other;
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bgClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
                {cfg.label}
              </span>
            );
          }
          if (key === "description") {
            return (
              <span
                className="block max-w-[260px] truncate text-sm text-text-secondary"
                title={value}
              >
                {value || "—"}
              </span>
            );
          }
          if (key === "cashIn") {
            return (
              <span className={`text-sm font-bold ${value > 0 ? "text-emerald-600" : "text-text-muted"}`}>
                {value > 0 ? `+${fmt(value)}` : "—"}
              </span>
            );
          }
          if (key === "cashOut") {
            return (
              <span className={`text-sm font-bold ${value > 0 ? "text-red-600" : "text-text-muted"}`}>
                {value > 0 ? `-${fmt(value)}` : "—"}
              </span>
            );
          }
          if (key === "branchName") {
            return (
              <span className="text-sm font-medium text-text-secondary">
                {value || "—"}
              </span>
            );
          }
          if (key === "reference") {
            return (
              <span className="text-xs font-mono text-text-muted">{value || "—"}</span>
            );
          }
          return value;
        }}
      />

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="rounded-lg border border-border-main bg-surface">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

/* ── Summary Cards ──────────────────────────────── */

interface FinanceSummaryCardsProps {
  breakdown: FinanceSummaryBreakdown;
  todayCashIn?: number;
  todayCashOut?: number;
}

const BREAKDOWN_ITEMS: {
  key: keyof FinanceSummaryBreakdown;
  label: string;
  color: string;
  direction: "in" | "out" | "neutral";
}[] = [
  { key: "pawnOut", label: "Pawn Out", color: "text-orange-600", direction: "out" },
  { key: "buyBackIn", label: "Buy Back", color: "text-blue-600", direction: "in" },
  { key: "renewalIn", label: "Renewals", color: "text-teal-600", direction: "in" },
  { key: "saleIn", label: "Sales", color: "text-purple-600", direction: "in" },
  { key: "fundTransferIn", label: "Fund In", color: "text-emerald-600", direction: "in" },
  { key: "fundTransferOut", label: "Fund Out", color: "text-red-600", direction: "out" },
];

export function FinanceSummaryCards({ breakdown, todayCashIn, todayCashOut }: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {todayCashIn != null && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Today In</p>
          <p className="mt-0.5 text-sm font-extrabold text-emerald-700">{fmt(todayCashIn)}</p>
        </div>
      )}
      {todayCashOut != null && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Today Out</p>
          <p className="mt-0.5 text-sm font-extrabold text-red-700">{fmt(todayCashOut)}</p>
        </div>
      )}
      {BREAKDOWN_ITEMS.map((item) => {
        const val = breakdown[item.key];
        if (val === 0) return null;
        return (
          <div key={item.key} className="rounded-lg border border-border-main bg-surface px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{item.label}</p>
            <p className={`mt-0.5 text-sm font-extrabold ${item.color}`}>
              {item.direction === "out" ? "-" : "+"}{fmt(val)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Type filter ─────────────────────────────────── */

interface LedgerTypeFilterProps {
  value: string;
  onChange: (v: string) => void;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "pawn", label: "Pawn" },
  { value: "buy_back", label: "Buy Back" },
  { value: "renewal", label: "Renewal" },
  { value: "sale", label: "Sale" },
  { value: "fund_transfer_in", label: "Fund Transfer In" },
  { value: "fund_transfer_out", label: "Fund Transfer Out" },
  { value: "start", label: "Opening Balance" },
  { value: "other", label: "Other" },
];

export function LedgerTypeFilter({ value, onChange }: LedgerTypeFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
    >
      {TYPE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
