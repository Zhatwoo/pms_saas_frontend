"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { DataTable } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
import type { Column } from "@/components/shared/data-table";
import { buildPmsPrintDocument, escapeHtml, printHtmlDocument } from "@/lib/print-templates";
import { formatTimeWithAmPm } from "@/lib/time";

export type LedgerEntryType =
  | "pawn"
  | "redeem"
  | "buy_back"
  | "renewal"
  | "sale"
  | "fund_transfer_in"
  | "fund_transfer_out"
  | "start"
  | "end"
  | "other";

export interface LedgerEntry {
  id: string;
  date: string;
  time: string | null;
  createdAt?: string | null;
  type: LedgerEntryType;
  description: string;
  itemName: string | null;
  cashIn: number;
  cashOut: number;
  branchId: string | null;
  branchName: string | null;
  reference: string | null;
}

export interface FinanceSummaryBreakdown {
  pawnOut: number;
  redeemIn: number;
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
  pawn: { label: "Pawn", bgClass: "bg-orange-500/15 text-orange-300", dotClass: "bg-orange-400" },
  redeem: { label: "Redeem", bgClass: "bg-cyan-500/15 text-cyan-300", dotClass: "bg-cyan-400" },
  buy_back: { label: "Buy Back", bgClass: "bg-blue-500/15 text-blue-300", dotClass: "bg-blue-400" },
  renewal: { label: "Renewal", bgClass: "bg-teal-500/15 text-teal-300", dotClass: "bg-teal-400" },
  sale: { label: "Sale", bgClass: "bg-purple-500/15 text-purple-300", dotClass: "bg-purple-400" },
  fund_transfer_in: { label: "Fund In", bgClass: "bg-emerald-500/15 text-emerald-300", dotClass: "bg-emerald-400" },
  fund_transfer_out: { label: "Fund Out", bgClass: "bg-red-500/15 text-red-300", dotClass: "bg-red-400" },
  start: { label: "Opening", bgClass: "bg-indigo-500/15 text-indigo-300", dotClass: "bg-indigo-400" },
  end: { label: "Closing", bgClass: "bg-amber-500/15 text-amber-300", dotClass: "bg-amber-400" },
  other: { label: "Other", bgClass: "bg-slate-500/15 text-slate-300", dotClass: "bg-slate-400" },
};

function fmt(n: number | null | undefined) {
  const value = Number(n ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  return `₱${safe.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function normalizeFinanceBreakdown(
  breakdown?: Partial<FinanceSummaryBreakdown> | null,
): FinanceSummaryBreakdown {
  return {
    pawnOut: Number(breakdown?.pawnOut ?? 0) || 0,
    redeemIn: Number(breakdown?.redeemIn ?? 0) || 0,
    buyBackIn: Number(breakdown?.buyBackIn ?? 0) || 0,
    renewalIn: Number(breakdown?.renewalIn ?? 0) || 0,
    saleIn: Number(breakdown?.saleIn ?? 0) || 0,
    fundTransferIn: Number(breakdown?.fundTransferIn ?? 0) || 0,
    fundTransferOut: Number(breakdown?.fundTransferOut ?? 0) || 0,
    startBalance: Number(breakdown?.startBalance ?? 0) || 0,
    other: Number(breakdown?.other ?? 0) || 0,
  };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [year, month, day] = d.split("-");
  if (!year || !month || !day) return d;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function fmtTime(t: string | null) {
  if (!t) return null;
  return formatTimeWithAmPm(t);
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

export function getReadableLedgerDescription(entry: LedgerEntry): string {
  if (entry.type !== "fund_transfer_in" && entry.type !== "fund_transfer_out") {
    return entry.description || "—";
  }

  const existing = entry.description?.trim() ?? "";
  if (/^Cash (received|sent)\b/i.test(existing)) {
    return existing;
  }

  const branch = entry.branchName?.trim() || "this branch";
  return entry.type === "fund_transfer_in"
    ? `Cash received by ${branch}`
    : `Cash sent from ${branch}`;
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
      { key: "reference", label: "Reference Code" },
    );
    return cols;
  }, [showBranchColumn]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          getReadableLedgerDescription(e).toLowerCase().includes(q) ||
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

  if (isLoading && entries.length === 0) {
    return (
      <div className="rounded-xl border border-border-main bg-surface px-5 py-10 text-center text-sm text-text-tertiary">
        Loading financial activity...
      </div>
    );
  }

  const handlePrint = () => {
    const operationalEntries = filtered.filter(e => e.type !== "start" && e.type !== "end");
    const rawCashIn = operationalEntries.reduce((sum, e) => sum + (e.cashIn || 0), 0);
    const rawCashOut = operationalEntries.reduce((sum, e) => sum + (e.cashOut || 0), 0);
    const netBalance = rawCashIn - rawCashOut;

    const totalCashIn = fmt(filtered.reduce((sum, e) => sum + (e.cashIn || 0), 0));
    const totalCashOut = fmt(filtered.reduce((sum, e) => sum + (e.cashOut || 0), 0));
    const formattedNet = fmt(Math.abs(netBalance));
    const netLabel = netBalance >= 0 ? "TOTAL INCOME / NET PROFIT " : "TOTAL LOSS ";
    const netColor = netBalance >= 0 ? "#059669" : "#b91c1c";

    const colCount = showBranchColumn ? 8 : 7;

    const rows = filtered
      .map(
        (e) => `
      <tr>
        <td>${escapeHtml(`${fmtDate(e.date)} ${fmtTime(e.time) || ""}`.trim())}</td>
        ${showBranchColumn ? `<td>${escapeHtml(e.branchName || "—")}</td>` : ""}
        <td>${escapeHtml((TYPE_CONFIG[e.type] || TYPE_CONFIG.other).label)}</td>
        <td>${escapeHtml(e.itemName || "—")}</td>
        <td>${escapeHtml(getReadableLedgerDescription(e))}</td>
        <td class="num">${e.cashIn > 0 ? fmt(e.cashIn) : "—"}</td>
        <td class="num cash-out">${e.cashOut > 0 ? fmt(e.cashOut) : "—"}</td>
        <td style="font-size:10px">${escapeHtml(e.reference || "—")}</td>
      </tr>`,
      )
      .join("");

    const branchMeta = showBranchColumn
      ? `<p><strong>Scope:</strong> All Branches</p>`
      : `<p><strong>Branch:</strong> ${escapeHtml(branchName || entries[0]?.branchName || "Unknown")}</p>
         <p><strong>Branch Code:</strong> ${escapeHtml(branchCode || "N/A")}</p>`;

    const metaHtml = `${branchMeta}
      <p><strong>Printed:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
      ${dateFrom ? `<p><strong>From:</strong> ${escapeHtml(dateFrom)}</p>` : ""}
      ${dateTo ? `<p><strong>To:</strong> ${escapeHtml(dateTo)}</p>` : ""}`;

    const ledgerScopeLabel = showBranchColumn
      ? "All branches"
      : branchName || entries[0]?.branchName || "Branch";

    const bodyHtml = `
    <div class="pms-print-section">
      <h2>Ledger entries</h2>
      <table>
    <thead>
      <tr>
        <th>Date</th>
        ${showBranchColumn ? "<th>Branch</th>" : ""}
        <th>Type</th>
        <th>Item Name</th>
        <th>Description</th>
        <th class="num">Cash In</th>
        <th class="num">Cash Out</th>
        <th>Reference Code</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="${colCount}" class="empty">No transactions found.</td></tr>`}
      ${filtered.length > 0 ? `
      <tr class="total-row">
        <td colspan="${colCount - 2}" style="text-align:right">TOTAL</td>
        <td class="num">${totalCashIn}</td>
        <td class="num cash-out">${totalCashOut}</td>
        <td></td>
      </tr>
      <tr class="net-row" style="color: ${netColor}">
        <td colspan="${colCount - 2}" style="text-align:right; padding: 10px 8px;">${netLabel}</td>
        <td colspan="2" class="num" style="padding: 10px 8px;">${formattedNet}</td>
        <td></td>
      </tr>` : ""}
    </tbody>
  </table>
    </div>`;

    const html = buildPmsPrintDocument({
      documentTitle: "Financial Ledger Report",
      headerSubtitle: `Financial Ledger — ${ledgerScopeLabel}`,
      metaHtml,
      bodyHtml,
    });

    printHtmlDocument(html);
  };

  return (
    <div id="print-ledger-root" className="space-y-3 relative">
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border border-brand-green bg-brand-green px-4 py-2 text-sm font-bold text-pawn-gold transition-colors hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          Print Ledger
        </button>
      </div>

      <div className="print:hidden">
        <DataTable
          columns={columns}
          data={paginated}
          emptyMessage="No financial activity found for the selected filters."
          renderCell={(key, rawValue, row) => {
            if (key === "date") {
              return (
                <div>
                  <span className="text-sm text-text-secondary">{fmtDate(rawValue as string)}</span>
                  {row.time ? (
                    <div className="text-xs text-text-muted">{fmtTime(row.time)}</div>
                  ) : null}
                </div>
              );
            }
            if (key === "type") {
              const cfg = TYPE_CONFIG[rawValue as LedgerEntryType] ?? TYPE_CONFIG.other;
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
              const value = rawValue as string | undefined;
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
              const readableDescription = getReadableLedgerDescription(row as LedgerEntry);
              return (
                <span
                  className="block min-w-[220px] max-w-[360px] whitespace-normal text-sm leading-5 text-text-secondary"
                  title={readableDescription}
                >
                  {readableDescription}
                </span>
              );
            }
            if (key === "cashIn") {
              const value = rawValue as number;
              return (
                <span className={`text-sm font-bold ${value > 0 ? "text-emerald-600" : "text-text-muted"}`}>
                  {value > 0 ? `+${fmt(value)}` : "—"}
                </span>
              );
            }
            if (key === "cashOut") {
              const value = rawValue as number;
              return (
                <span className={`text-sm font-bold ${value > 0 ? "text-red-600" : "text-text-muted"}`}>
                  {value > 0 ? `-${fmt(value)}` : "—"}
                </span>
              );
            }
            if (key === "branchName") {
              const value = rawValue as string | undefined;
              return (
                <span className="text-sm font-medium text-text-secondary">
                  {value || "—"}
                </span>
              );
            }
            if (key === "reference") {
              const value = rawValue as string | undefined;
              return (
                <span className="text-xs font-mono text-text-muted">{value || "—"}</span>
              );
            }
            return rawValue as ReactNode;
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
  direction: "in" | "out" | "neutral";
  cardClass: string;
  labelClass: string;
  valueClass: string;
  barClass: string;
}[] = [
  {
    key: "pawnOut",
    label: "Pawn Out",
    direction: "out",
    cardClass: "border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/40",
    labelClass: "text-orange-700 dark:text-orange-300",
    valueClass: "text-orange-700 dark:text-orange-300",
    barClass: "bg-orange-500",
  },
  {
    key: "redeemIn",
    label: "Redeem",
    direction: "in",
    cardClass: "border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/40",
    labelClass: "text-cyan-700 dark:text-cyan-300",
    valueClass: "text-cyan-700 dark:text-cyan-300",
    barClass: "bg-cyan-500",
  },
  {
    key: "buyBackIn",
    label: "Buy Back",
    direction: "in",
    cardClass: "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/40",
    labelClass: "text-blue-700 dark:text-blue-300",
    valueClass: "text-blue-700 dark:text-blue-300",
    barClass: "bg-blue-500",
  },
  {
    key: "renewalIn",
    label: "Renewals",
    direction: "in",
    cardClass: "border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/40",
    labelClass: "text-teal-700 dark:text-teal-300",
    valueClass: "text-teal-700 dark:text-teal-300",
    barClass: "bg-teal-500",
  },
  {
    key: "saleIn",
    label: "Sales",
    direction: "in",
    cardClass: "border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/40",
    labelClass: "text-purple-700 dark:text-purple-300",
    valueClass: "text-purple-700 dark:text-purple-300",
    barClass: "bg-purple-500",
  },
  {
    key: "fundTransferIn",
    label: "Fund In",
    direction: "in",
    cardClass: "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40",
    labelClass: "text-emerald-700 dark:text-emerald-300",
    valueClass: "text-emerald-700 dark:text-emerald-300",
    barClass: "bg-emerald-500",
  },
  {
    key: "fundTransferOut",
    label: "Fund Out",
    direction: "out",
    cardClass: "border-red-500/30 bg-red-50/50 dark:bg-red-950/40",
    labelClass: "text-red-700 dark:text-red-300",
    valueClass: "text-red-700 dark:text-red-300",
    barClass: "bg-red-500",
  },
];

export function FinanceSummaryCards({ breakdown, todayCashIn, todayCashOut }: FinanceSummaryCardsProps) {
  const safeBreakdown = normalizeFinanceBreakdown(breakdown);

  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {todayCashIn != null && (
        <div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 transition-all hover:shadow-md dark:bg-emerald-900/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Today In</p>
            <div className="rounded-full bg-emerald-100 p-1 dark:bg-emerald-900/40">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600 dark:text-emerald-400">
                <path d="M7 13l5 5 5-5M12 18V6" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-lg font-black text-emerald-700 dark:text-emerald-300 truncate">{fmt(todayCashIn)}</p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/20" />
        </div>
      )}
      {todayCashOut != null && (
        <div className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-red-50/50 p-4 transition-all hover:shadow-md dark:bg-red-900/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Today Out</p>
            <div className="rounded-full bg-red-100 p-1 dark:bg-red-900/40">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-red-600 dark:text-red-400">
                <path d="M7 11l5-5 5 5M12 6v12" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-lg font-black text-red-700 dark:text-red-300 truncate">{fmt(todayCashOut)}</p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-red-500/20" />
        </div>
      )}
      {BREAKDOWN_ITEMS.map((item) => {
        const val = safeBreakdown[item.key];
        if (!Number.isFinite(val) || val === 0) return null;

        return (
          <div
            key={item.key}
            className={`group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md ${item.cardClass}`}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest ${item.labelClass}`}>
              {item.label}
            </p>
            <p className={`mt-2 text-lg font-black truncate ${item.valueClass}`}>
              {item.direction === "out" ? "-" : "+"}{fmt(val)}
            </p>
            <div className={`absolute bottom-0 left-0 h-1 w-full opacity-20 ${item.barClass}`} />
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
  { value: "redeem", label: "Redeem" },
  { value: "buy_back", label: "Buy Back" },
  { value: "renewal", label: "Renewal" },
  { value: "sale", label: "Sale" },
  { value: "fund_transfer_in", label: "Fund Transfer In" },
  { value: "fund_transfer_out", label: "Fund Transfer Out" },
  { value: "start", label: "Opening Balance" },
  { value: "end", label: "Closing Balance" },
  { value: "other", label: "Other" },
];

export function LedgerTypeFilter({
  value,
  onChange,
  className = "",
}: LedgerTypeFilterProps & { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border-main bg-surface py-2.5 pl-3 pr-8 text-sm font-medium text-text-primary transition-all focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/10 cursor-pointer"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-tertiary">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

/* ── Ledger filters bar ──────────────────────────── */

interface LedgerFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  searchPlaceholder?: string;
  variant?: "default" | "elevated";
}

export function LedgerFiltersBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
  hasActiveFilters,
  searchPlaceholder = "Search ledger...",
  variant = "default",
}: LedgerFiltersBarProps) {
  const inputClass =
    "w-full rounded-lg border border-border-main bg-surface px-4 py-2.5 text-sm font-medium text-text-primary focus:border-brand-green focus:outline-none transition-all";

  const searchInput = (
    <div className="relative w-full min-w-0">
      {variant === "elevated" ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      ) : null}
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={
          variant === "elevated"
            ? "w-full rounded-xl border border-border-main bg-surface py-2.5 pl-10 pr-4 text-sm font-medium text-text-primary placeholder:text-text-tertiary focus:border-brand-green focus:outline-none focus:ring-4 focus:ring-brand-green/10 transition-all"
            : `${inputClass} placeholder:text-text-muted`
        }
      />
    </div>
  );

  const filters = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end w-full min-w-0">
      <div className="w-full lg:flex-1 min-w-0">
        <LedgerTypeFilter value={typeFilter} onChange={onTypeFilterChange} className="w-full min-w-0" />
      </div>

      <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[22rem] min-w-0">
        <div className="flex w-full min-w-0 flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-text-tertiary">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-text-tertiary">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );

  const content = (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {searchInput}
      {filters}
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-xs font-bold text-red-500 hover:underline dark:text-red-300"
        >
          Clear Filters
        </button>
      ) : null}
    </div>
  );

  if (variant === "elevated") {
    return (
      <div className="w-full min-w-0 rounded-2xl border border-border-main bg-surface/50 p-4 shadow-sm backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
