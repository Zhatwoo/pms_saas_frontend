"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
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
  itemName: string | null;
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
  branchName?: string | null;
  branchCode?: string | null;
}

export function FinanceLedgerTable({
  entries,
  isLoading,
  showBranchColumn = false,
  searchQuery = "",
  typeFilter = "all",
  dateFrom = "",
  dateTo = "",
  branchName,
  branchCode,
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
      { key: "itemName", label: "Item Name" },
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
          (e.itemName ?? "").toLowerCase().includes(q) ||
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
    <div className="space-y-3 relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-ledger-section, #print-ledger-section * {
            visibility: visible;
          }
          #print-ledger-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      `}} />

      <div className="flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          Print Ledger
        </button>
      </div>

      <div id="print-ledger-section" className="hidden print:block mb-8">
        <h1 className="text-xl font-bold text-black border-b border-black pb-2 mb-4">
          Financial Ledger Report
        </h1>
        <div className="mb-4 text-sm text-black space-y-1">
          {showBranchColumn ? (
            <p><strong>Scope:</strong> All Branches</p>
          ) : (
            <>
              <p><strong>Branch:</strong> {branchName || entries[0]?.branchName || "Unknown"}</p>
              <p><strong>Branch Code:</strong> {branchCode || "N/A"}</p>
            </>
          )}
          <p><strong>Date Generated:</strong> {new Date().toLocaleString()}</p>
          {dateFrom && <p><strong>From:</strong> {dateFrom}</p>}
          {dateTo && <p><strong>To:</strong> {dateTo}</p>}
        </div>
        <table className="w-full text-left text-sm border-collapse text-black print:text-[11px]">
          <thead>
            <tr className="bg-gray-100 border-y border-black">
              <th className="p-2 font-bold whitespace-nowrap">Date</th>
              {showBranchColumn && <th className="p-2 font-bold">Branch</th>}
              <th className="p-2 font-bold whitespace-nowrap">Type</th>
              <th className="p-2 font-bold">Item Name</th>
              <th className="p-2 font-bold">Description</th>
              <th className="p-2 font-bold text-right whitespace-nowrap">Cash In</th>
              <th className="p-2 font-bold text-right whitespace-nowrap">Cash Out</th>
              <th className="p-2 font-bold">Ref No.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="p-2 whitespace-nowrap">{fmtDate(e.date)} {e.time || ""}</td>
                {showBranchColumn && <td className="p-2 truncate max-w-[150px]">{e.branchName || "—"}</td>}
                <td className="p-2 whitespace-nowrap">{(TYPE_CONFIG[e.type] || TYPE_CONFIG.other).label}</td>
                <td className="p-2 truncate max-w-[200px]">{e.itemName || "—"}</td>
                <td className="p-2 truncate max-w-[250px]">{e.description || "—"}</td>
                <td className="p-2 text-right font-mono">{e.cashIn > 0 ? fmt(e.cashIn) : ""}</td>
                <td className="p-2 text-right font-mono text-red-600">{e.cashOut > 0 ? fmt(e.cashOut) : ""}</td>
                <td className="p-2 font-mono text-[10px] truncate max-w-[120px] text-gray-700">{e.reference || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showBranchColumn ? 8 : 7} className="p-4 text-center italic text-gray-500 border-b border-black">
                  No financial activity found for the selected view.
                </td>
              </tr>
            )}
            {filtered.length > 0 && (
              <tr className="border-b-2 border-black bg-gray-50 uppercase">
                <td colSpan={showBranchColumn ? 5 : 4} className="p-2 font-bold text-right">Total:</td>
                <td className="p-2 text-right font-bold font-mono">
                  {fmt(filtered.reduce((sum, e) => sum + (e.cashIn || 0), 0))}
                </td>
                <td className="p-2 text-right font-bold font-mono text-red-600">
                  {fmt(filtered.reduce((sum, e) => sum + (e.cashOut || 0), 0))}
                </td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="print:hidden">
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
            if (key === "itemName") {
              return (
                <span
                  className="block max-w-[180px] truncate text-sm font-medium text-text-primary"
                  title={value || ""}
                >
                  {value || "—"}
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
      </div>

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="overflow-hidden rounded-lg border border-border-main bg-surface print:hidden">
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            className="border-t-0"
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
