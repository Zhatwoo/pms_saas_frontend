import React from "react";

export type ViewMode = "list" | "calendar";

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
  isDayOpen?: boolean;
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
  isDayOpen = true,
}: TransactionActionsProps) {
  return (
    <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
      {!isDayOpen && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <svg className="h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <span>Day session is not started yet. Click <strong>"START DAY"</strong> on the toolbar above to submit starting cash before processing transactions.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!isDayOpen}
            onClick={onNewPawn}
            title={!isDayOpen ? "Start day session first to post transactions" : undefined}
            className="flex items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            {plusIcon}
            New Pawn
          </button>

          <button
            disabled={!isDayOpen}
            title={!isDayOpen ? "Start day session first to post transactions" : undefined}
            onClick={() => {
              if (!isDayOpen) return;
              onFilterChange?.("Renew");
              onRenewClick?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed ${activeFilter === "Renew"
                ? "ring-2 ring-orange-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {renewIcon}
            Renew
          </button>

          <button
            disabled={!isDayOpen}
            title={!isDayOpen ? "Start day session first to post transactions" : undefined}
            onClick={() => {
              if (!isDayOpen) return;
              onFilterChange?.("Sells / Transfer");
              onSalesTransfer?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed ${activeFilter === "Sells / Transfer"
                ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {salesIcon}
            Sells
          </button>

          <button
            disabled={!isDayOpen}
            title={!isDayOpen ? "Start day session first to post transactions" : undefined}
            onClick={() => {
              if (!isDayOpen) return;
              onFilterChange?.("Buy Out");
              onRedeem?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed ${activeFilter === "Buy Out" || activeFilter === "Redeem"
                ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {redeemIcon}
            Buy Out
          </button>

          <button
            disabled={!isDayOpen}
            title={!isDayOpen ? "Start day session first to post transactions" : undefined}
            onClick={() => {
              if (!isDayOpen) return;
              onFilterChange?.("Buy Back");
              onBuyBack?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed ${activeFilter === "Buy Back"
                ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-surface"
                : "opacity-80 hover:opacity-100"
              }`}
          >
            {cartIcon}
            Buy Back
          </button>

          <button
            disabled={!isDayOpen}
            title={!isDayOpen ? "Start day session first to post transactions" : undefined}
            onClick={() => {
              if (!isDayOpen) return;
              onFilterChange?.("Reserve / Layaway");
              onReserveLayaway?.();
            }}
            className={`flex items-center gap-1.5 rounded-lg bg-pawn-gold px-4 py-2 text-xs font-bold text-zinc-900 shadow-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${activeFilter === "Reserve / Layaway"
                ? "ring-2 ring-pawn-gold/40 ring-offset-1 ring-offset-surface"
                : "opacity-90 hover:opacity-100"
              }`}
          >
            {reserveIcon}
            Reserve / Layaway
          </button>
        </div>
      </div>
    </div>
  );
}
