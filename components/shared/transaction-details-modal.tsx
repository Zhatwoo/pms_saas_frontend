"use client";

import { StatusBadge } from "./status-badge";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";

import { type PurposeType, type TransactionRow } from "@/app/employee/pawn-transaction/_components/transaction-table";



interface TransactionDetailsModalProps {
  isOpen: boolean;
  transaction: TransactionRow | null;
  onClose: () => void;
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-950/10 bg-white/80 p-4 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-zinc-900/70">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-900/45 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-emerald-950 dark:text-zinc-100">
        {value || "—"}
      </p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <InfoStat label={label} value={value} />
  );
}

function purposeVariant(
  purpose: PurposeType,
): "blue" | "green" | "orange" | "purple" | "black" {
  if (purpose === "Sold Item") return "orange";
  if (purpose === "Renew") return "green";
  if (purpose === "Buy Back") return "blue";
  if (purpose === "Pawn") return "purple";
  if (purpose === "Buy Out") return "purple";
  if (purpose === "Fund Transfer" || purpose === "Cash Transfer") return "blue";
  return "black";
}

function moneyValue(value: string) {
  return formatPeso(value, { compactZero: true });
}

export function TransactionDetailsModal({
  isOpen,
  transaction,
  onClose,
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-xl">
      <div className="max-h-[92vh] w-full max-w-5xl scale-in-center overflow-y-auto rounded-[28px] border border-emerald-950/10 bg-gradient-to-b from-surface to-surface-secondary shadow-[0_24px_80px_rgba(15,23,42,0.35)] transition-colors dark:border-white/10 dark:from-zinc-950 dark:to-zinc-900">
        <div className="relative overflow-hidden border-b border-emerald-950/10 px-6 py-6 dark:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800" />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-amber-300/90">
                Transaction Details
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                {transaction.transactionNo}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/80">
                Review transaction details, financial values, and related records in a single view.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={transaction.purpose}
                  variant={purposeVariant(transaction.purpose)}
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-3 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock label="Date" value={transaction.date} />
          <InfoBlock label="Time" value={formatTimeWithAmPm(transaction.time)} />
          <InfoBlock label="Unit" value={transaction.unit} />
          <InfoBlock label="Unit Code" value={transaction.unitCode} />
          <InfoBlock label="Buy Back" value={moneyValue(transaction.buyBack)} />
          <InfoBlock label="Buy Out" value={moneyValue(transaction.buyOut)} />
          <InfoBlock label="Sold" value={moneyValue(transaction.sold)} />
          <InfoBlock label="Cash In" value={moneyValue(transaction.cashIn)} />
          <InfoBlock label="Cash Out" value={moneyValue(transaction.cashOut)} />
          <InfoBlock label="Return" value={moneyValue(transaction.returnVal)} />
          <InfoBlock label="Pawn" value={moneyValue(transaction.pawn)} />
          <InfoBlock label="Storage" value={moneyValue(transaction.storage)} />
          <InfoBlock
            label="Related Pawned Item ID"
            value={transaction.relatedPawnedItemId || "—"}
          />
        </div>

        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-1">
          <div className="rounded-3xl border border-emerald-950/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-900/45 dark:text-zinc-400">
              Performance QR Code
            </p>
            {transaction.qrCode ? (
              <div className="mt-4 flex flex-col items-center">
                <img
                  src={transaction.qrCode}
                  alt="Transaction QR"
                  className="h-48 w-48 rounded-2xl border border-emerald-950/10 bg-white p-3 object-contain shadow-lg dark:border-white/10 dark:bg-zinc-950"
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-tertiary">
                No QR code security record available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
