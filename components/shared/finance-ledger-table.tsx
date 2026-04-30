"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
import type { Column } from "@/components/shared/data-table";

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

    const rows = filtered.map((e) => `
      <tr>
        <td>${fmtDate(e.date)} ${e.time || ""}</td>
        ${showBranchColumn ? `<td>${e.branchName || "—"}</td>` : ""}
        <td>${(TYPE_CONFIG[e.type] || TYPE_CONFIG.other).label}</td>
        <td>${e.itemName || "—"}</td>
        <td>${e.description || "—"}</td>
        <td style="text-align:right">${e.cashIn > 0 ? fmt(e.cashIn) : "—"}</td>
        <td style="text-align:right; color:#b91c1c">${e.cashOut > 0 ? fmt(e.cashOut) : "—"}</td>
        <td style="font-size:10px">${e.reference || "—"}</td>
      </tr>
    `).join("");

    const branchMeta = showBranchColumn
      ? `<p><strong>Scope:</strong> All Branches</p>`
      : `<p><strong>Branch:</strong> ${branchName || entries[0]?.branchName || "Unknown"}</p>
         <p><strong>Branch Code:</strong> ${branchCode || "N/A"}</p>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Financial Ledger Report</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 20px; }
    h1 { font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .meta { margin-bottom: 16px; font-size: 12px; line-height: 1.8; }
    .meta p { margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f3f4f6; font-weight: bold; padding: 6px 8px; border: 1px solid #ccc; text-align: left; white-space: nowrap; }
    td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: top; }
    tr:nth-child(even) { background: #f9fafb; }
    .total-row { background: #f3f4f6 !important; font-weight: bold; border-top: 2px solid #000; }
    .net-row { font-size: 13px; font-weight: bold; border-top: 2px solid #000; }
    .header { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: flex-start; }
    .logo { font-size: 16px; font-weight: bold; }
    .subtitle { font-size: 11px; color: #555; }
    @media print { @page { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Pawnshop Management System</div>
      <div class="subtitle">Financial Ledger Report</div>
    </div>
    <div style="text-align:right; font-size:11px; color:#555">
      <div>Printed: ${new Date().toLocaleString()}</div>
      ${dateFrom ? `<div>From: ${dateFrom}</div>` : ""}
      ${dateTo ? `<div>To: ${dateTo}</div>` : ""}
    </div>
  </div>
  <div class="meta">
    ${branchMeta}
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        ${showBranchColumn ? "<th>Branch</th>" : ""}
        <th>Type</th>
        <th>Item Name</th>
        <th>Description</th>
        <th style="text-align:right">Cash In</th>
        <th style="text-align:right">Cash Out</th>
        <th>Ref No.</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="${colCount}" style="text-align:center;padding:12px;font-style:italic">No transactions found.</td></tr>`}
      ${filtered.length > 0 ? `
      <tr class="total-row">
        <td colspan="${colCount - 2}" style="text-align:right">TOTAL</td>
        <td style="text-align:right">${totalCashIn}</td>
        <td style="text-align:right; color:#b91c1c">${totalCashOut}</td>
        <td></td>
      </tr>
      <tr class="net-row" style="color: ${netColor}">
        <td colspan="${colCount - 2}" style="text-align:right; padding: 10px 8px;">${netLabel}</td>
        <td colspan="2" style="text-align:right; padding: 10px 8px;">${formattedNet}</td>
        <td></td>
      </tr>` : ""}
    </tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <div id="print-ledger-root" className="space-y-3 relative">
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-emerald-700 dark:border-emerald-400/80 bg-emerald-700 px-4 py-2 text-sm font-bold text-amber-400 transition-colors hover:bg-emerald-800 dark:hover:bg-emerald-800"
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
    { key: "pawnOut", label: "Pawn Out", color: "text-orange-300", direction: "out" },
    { key: "redeemIn", label: "Redeem", color: "text-cyan-300", direction: "in" },
    { key: "buyBackIn", label: "Buy Back", color: "text-blue-300", direction: "in" },
    { key: "renewalIn", label: "Renewals", color: "text-teal-300", direction: "in" },
    { key: "saleIn", label: "Sales", color: "text-purple-300", direction: "in" },
    { key: "fundTransferIn", label: "Fund In", color: "text-emerald-300", direction: "in" },
    { key: "fundTransferOut", label: "Fund Out", color: "text-red-300", direction: "out" },
  ];

export function FinanceSummaryCards({ breakdown, todayCashIn, todayCashOut }: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
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
        const val = breakdown[item.key];
        if (val === 0) return null;

        // Map colors to more vibrant versions for the premium look
        const colorClass = item.color.replace('text-', 'text-').replace('-300', '-600 dark:text-').replace('-300', '-400');
        const borderClass = item.color.replace('text-', 'border-').replace('-300', '-500/20');
        const bgClass = item.color.replace('text-', 'bg-').replace('-300', '-50/50 dark:bg-').replace('-300', '-900/10');

        return (
          <div key={item.key} className={`group relative overflow-hidden rounded-xl border ${borderClass} ${bgClass} p-4 transition-all hover:shadow-md`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{item.label}</p>
            <p className={`mt-2 text-lg font-black truncate ${colorClass}`}>
              {item.direction === "out" ? "-" : "+"}{fmt(val)}
            </p>
            <div className={`absolute bottom-0 left-0 h-1 w-full opacity-20 ${item.color.replace('text-', 'bg-')}`} />
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

export function LedgerTypeFilter({ value, onChange }: LedgerTypeFilterProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-border-main bg-surface pl-3 pr-8 py-2 text-sm font-medium text-text-primary focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all cursor-pointer"
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
