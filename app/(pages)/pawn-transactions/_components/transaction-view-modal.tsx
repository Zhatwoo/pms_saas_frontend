"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";
import type { PurposeType, TransactionRow } from "./types";
import { useAuth } from "@/contexts/auth-context";

interface TransactionViewModalProps {
  isOpen: boolean;
  transaction: TransactionRow | null;
  onClose: () => void;
  onPrint?: (transaction: TransactionRow) => void;
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-950/10 bg-white/80 p-4 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-zinc-900/70">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-900/45 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-emerald-950 dark:text-zinc-100">
        {value || "-"}
      </p>
    </div>
  );
}

const purposeVariant: Record<
  PurposeType,
  "blue" | "green" | "orange" | "purple" | "black"
> = {
  Start: "black",
  End: "black",
  Pawn: "purple",
  Redeem: "green",
  Renew: "green",
  Reappraise: "green",
  "Buy Back": "blue",
  "Buy Out": "orange",
  "Sold Item": "orange",
  "Reserve / Layaway": "orange",
  "Fund Transfer": "blue",
  "Cash Transfer": "blue",
};

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <MetaCard label={label} value={value} />
  );
}

function formatAmount(value: string) {
  return formatPeso(value, { compactZero: true });
}

export function TransactionViewModal({
  isOpen,
  transaction,
  onClose,
  onPrint,
}: TransactionViewModalProps) {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-xl">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-emerald-950/10 bg-gradient-to-b from-surface to-surface-secondary shadow-[0_24px_80px_rgba(15,23,42,0.35)] dark:border-white/10 dark:from-zinc-950 dark:to-zinc-900">
        <div className="relative overflow-hidden border-b border-emerald-950/10 px-6 py-6 dark:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800" />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-amber-300/90">
                Transaction Details
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                {transaction.transactionNo}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-50/80">
                View full transaction context, financial breakdown, and supporting QR data.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={transaction.purpose}
                  variant={purposeVariant[transaction.purpose]}
                />
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  {transaction.branch}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {transaction.purpose === "Pawn" && onPrint ? (
                <button
                  type="button"
                  onClick={() => onPrint(transaction)}
                  className="rounded-xl border border-amber-400/30 bg-amber-400 px-4 py-2.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-amber-300"
                >
                  Print Slip
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock label="Customer" value={transaction.customerName || "Walk-in Customer"} />
          <InfoBlock label="Branch" value={transaction.branch} />
          <InfoBlock label="Address" value={transaction.customerAddress} />
          <InfoBlock label="Details" value={transaction.details} />
          <InfoBlock label="Unit" value={transaction.unit} />
          <InfoBlock label="Unit Code" value={transaction.unitCode} />
          <InfoBlock label="Date" value={transaction.date} />
          <InfoBlock label="Time" value={formatTimeWithAmPm(transaction.time)} />
          <InfoBlock label="Cash In" value={formatAmount(transaction.cashIn)} />
          <InfoBlock label="Cash Out" value={formatAmount(transaction.cashOut)} />
          <InfoBlock label="Return Value" value={formatAmount(transaction.returnVal)} />
          <InfoBlock label="Pawn Amount" value={formatAmount(transaction.pawn)} />
          <InfoBlock label="Storage Fee" value={formatAmount(transaction.storage)} />
        </div>

        <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-emerald-950/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-900/45 dark:text-zinc-400">
              Notes
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950 dark:text-zinc-100">
              {transaction.notes || "No notes added for this transaction."}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-950/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-900/45 dark:text-zinc-400">
              QR Code
            </p>
            {isAdminOrSuperAdmin ? (
              (transaction.qrCode || transaction.qr_code) ? (
                <div className="mt-4 flex justify-center">
                  <img
                    src={transaction.qrCode || transaction.qr_code}
                    alt={`${transaction.unit || transaction.transactionNo} QR code`}
                    className="h-48 w-48 rounded-2xl border border-emerald-950/10 bg-white p-3 object-contain shadow-lg"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-text-tertiary">
                  No QR code available for this transaction.
                </p>
              )
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center py-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/50">
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">
                      Visible to
                    </p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-emerald-800">
                      Admin only
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
