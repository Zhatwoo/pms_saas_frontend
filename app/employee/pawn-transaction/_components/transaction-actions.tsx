import React from "react";
import { ActionButton } from "@/components/shared/action-button";

export type ViewMode = "list" | "calendar";

const downloadIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const printerIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const renewIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const salesIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 16V4m0 0L3 8m4-4 4 4" />
    <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
  </svg>
);

const cartIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const reserveIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 7h16" />
    <path d="M6 7l1 14h10l1-14" />
    <path d="M9 11h6" />
  </svg>
);

const redeemIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </svg>
);

const plusIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const qrIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3h7v7H3z" />
    <path d="M14 3h7v7h-7z" />
    <path d="M3 14h7v7H3z" />
    <path d="M14 14h3v3h-3z" />
    <path d="M21 14v3h-3" />
    <path d="M21 21h-3v-3" />
  </svg>
);

export type FilterType =
  | "All"
  | "Renew"
  | "Sells / Transfer"
  | "Redeem"
  | "Buy Back"
  | "Reserve / Layaway"
  | "Pawn"
  | "Start"
  | "Buy Out"
  | "Sold Item";

interface TransactionActionsProps {
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
  onRenewClick?: () => void;

  onNewPawn?: () => void;
  onRedeem?: () => void;
  onBuyBack?: () => void;
  onReserveLayaway?: () => void;
  onSalesTransfer?: () => void;
  onStartDay?: () => void;
  onEndDay?: () => void;
  onQrScan?: () => void;
}

export function TransactionActions({
  activeFilter = "All",
  onFilterChange,
  onRenewClick,

  onNewPawn,
  onRedeem,
  onBuyBack,
  onReserveLayaway,
  onSalesTransfer,
  onStartDay,
  onEndDay,
  onQrScan,
}: TransactionActionsProps) {
  return (
    <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              onFilterChange?.("Renew");
              onRenewClick?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 ${activeFilter === "Renew"
                ? "ring-2 ring-orange-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {renewIcon}
            Renew
          </button>

          <button
            onClick={() => {
              onFilterChange?.("Sells / Transfer");
              onSalesTransfer?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 ${activeFilter === "Sells / Transfer"
                ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {salesIcon}
            Sells / Transfer
          </button>

          <button
            onClick={() => {
              onFilterChange?.("Redeem");
              onRedeem?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 ${activeFilter === "Redeem"
                ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {redeemIcon}
            Redeem
          </button>

          <button
            onClick={() => {
              onFilterChange?.("Buy Back");
              onBuyBack?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 ${activeFilter === "Buy Back"
                ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {cartIcon}
            Buy Back
          </button>

          <button
            onClick={() => {
              onFilterChange?.("Reserve / Layaway");
              onReserveLayaway?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-pawn-gold px-4 py-2 text-xs font-bold text-zinc-900 shadow-sm transition hover:opacity-90 ${activeFilter === "Reserve / Layaway"
                ? "ring-2 ring-pawn-gold/40 ring-offset-1 ring-offset-surface"
                : "opacity-90 hover:opacity-100"
              }`}
          >
            {reserveIcon}
            Reserve / Layaway
          </button>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onNewPawn}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 whitespace-nowrap"
            >
              {plusIcon}
              New Pawn
            </button>
            <button
              onClick={onStartDay}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Start Day
            </button>
            <button
              onClick={onEndDay}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
            >
              End Day
            </button>
            <button
              onClick={onQrScan}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-950 px-4 py-2 text-xs font-bold text-emerald-400 shadow-sm border border-emerald-400/20 transition hover:bg-emerald-900"
              title="Scan QR Code"
            >
              {qrIcon}
              Scan QR
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}
