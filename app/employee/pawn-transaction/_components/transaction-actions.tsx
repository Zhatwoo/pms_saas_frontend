import React from "react";
import type { ComponentProps } from "react";
import { ActionButton } from "@/components/shared/action-button";

type ActionVariant = NonNullable<ComponentProps<typeof ActionButton>["variant"]>;

// ── Icons ──────────────────────────────────────────────────────────────────

const downloadIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const printerIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

// 🔄 Renew — circular arrows
const renewIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ↔️ Sales / Transfer — two-way arrows
const salesIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4 4 4" />
    <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
  </svg>
);

// ↩️ Buy Back — undo arrow
const buyBackIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </svg>
);

// ➕ New Pawn Transaction — plus
const plusIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);



// ── Types ──────────────────────────────────────────────────────────────────

const filters = ["Renew", "Sales / Transfer", "Buy Back"] as const;
type FilterButton = (typeof filters)[number];
type FilterType = "All" | FilterButton;

interface TransactionActionsProps {
  activeFilter?: FilterType;
  onRenewClick?: () => void;
  onExportCSV?: () => void;
  onPrintReport?: () => void;
  onNewPawn?: () => void;
  onBuyBack?: () => void;
  onSalesTransfer?: () => void;
  onStartDay?: () => void;
  onEndDay?: () => void;
}

const filterVariantMap: Record<FilterButton, ActionVariant> = {
  Renew: "renew",
  "Sales / Transfer": "sales",
  "Buy Back": "buyback",
};

const filterIconMap: Record<FilterButton, React.ReactElement> = {
  Renew: renewIcon,
  "Sales / Transfer": salesIcon,
  "Buy Back": buyBackIcon,
};

// ── Component ──────────────────────────────────────────────────────────────

export function TransactionActions({
  activeFilter = "All",
  onRenewClick,
  onExportCSV,
  onPrintReport,
  onNewPawn,
  onBuyBack,
  onSalesTransfer,
  onStartDay,
  onEndDay,
}: TransactionActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left — filter buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Renew — amber/orange solid */}
        <button
          onClick={onRenewClick}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition shadow-sm bg-orange-500 hover:bg-orange-600 ${activeFilter === "Renew" ? "ring-2 ring-offset-1 ring-orange-400" : "opacity-80 hover:opacity-100"}`}
        >
          {renewIcon}
          Renew
        </button>

        {/* Sales / Transfer — purple solid */}
        <button
          onClick={onSalesTransfer}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition shadow-sm bg-purple-600 hover:bg-purple-700 ${activeFilter === "Sales / Transfer" ? "ring-2 ring-offset-1 ring-purple-400" : "opacity-80 hover:opacity-100"}`}
        >
          {salesIcon}
          Sales / Transfer
        </button>

        {/* Buy Back — sky/blue solid */}
        <button
          onClick={onBuyBack}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition shadow-sm bg-sky-600 hover:bg-sky-700 ${activeFilter === "Buy Back" ? "ring-2 ring-offset-1 ring-sky-400" : "opacity-80 hover:opacity-100"}`}
        >
          {buyBackIcon}
          Buy Back
        </button>
      </div>

      {/* Right — action buttons */}
      <div className="flex flex-col items-end gap-2">
        {/* Row 1: New Pawn Transaction, Start Day, End Day */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewPawn}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
          >
            {plusIcon}
            New Pawn Transaction
          </button>
          <button
            onClick={onStartDay}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            Start Day
          </button>
          <button
            onClick={onEndDay}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm"
          >
            End Day
          </button>
        </div>

        {/* Row 2: Export CSV, Print Report */}
        <div className="flex items-center gap-2">
          <ActionButton variant="outline" onClick={onExportCSV}>
            <span className="flex items-center gap-1.5">
              {downloadIcon}
              Export CSV
            </span>
          </ActionButton>
          <ActionButton variant="primary" className="bg-emerald-700 border-pawn-gold text-pawn-gold" onClick={onPrintReport}>
            <span className="flex items-center gap-1.5">
              {printerIcon}
              Print Report
            </span>
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
