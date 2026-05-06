"use client";

import { StatusBadge } from "./status-badge";
import { useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAuth } from "@/contexts/auth-context";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";

import { type PurposeType, type TransactionRow } from "@/app/employee/pawn-transaction/_components/transaction-table";



interface TransactionDetailsModalProps {
  isOpen: boolean;
  transaction: TransactionRow | null;
  onClose: () => void;
  onRequestQRReplacement?: (pawnedItemId: string, itemCode: string) => void;
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-zinc-900">
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
  onRequestQRReplacement,
}: TransactionDetailsModalProps) {
  // Ref for focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const modalAriaProps = {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "transaction-details-modal-title",
  } as const;

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-xl" {...modalAriaProps} ref={modalRef}>
      <div className="max-h-[92vh] w-[95vw] max-w-5xl scale-in-center overflow-y-auto rounded-[28px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] transition-colors border-zinc-200 md:w-[90vw]">
        <div className="relative overflow-hidden border-b px-6 py-6 border-emerald-700/40" style={{ background: 'linear-gradient(to right, rgb(5, 150, 105), rgb(6, 95, 70), rgb(5, 150, 105))' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))' }} />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-emerald-300/5 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-amber-300/95">
                Transaction Details
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                {transaction.transactionNo}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100/80">
                Review transaction details, financial values, and related records in a single view.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={transaction.purpose}
                  variant={purposeVariant(transaction.purpose)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {transaction.relatedPawnedItemId && (
                <button
                  onClick={() => {
                    if (onRequestQRReplacement) {
                      onRequestQRReplacement(transaction.relatedPawnedItemId!, transaction.unitCode);
                    }
                  }}
                  disabled={!onRequestQRReplacement}
                  className="rounded-full border border-teal-300/50 bg-teal-500/20 px-4 py-2 text-sm font-bold text-teal-100 transition-all hover:bg-teal-500/35 hover:border-teal-300/70 hover:text-teal-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Request QR Code Replacement"
                >
                  🔄 Request QR Change
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-500/30 hover:border-emerald-300/60"
              >
                Close
              </button>
            </div>
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
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Security Identity
            </p>
            {isSuperAdmin ? (
              transaction.qrCode ? (
                <div className="mt-4 flex flex-col items-center">
                  <img
                    src={transaction.qrCode}
                    alt="Transaction QR"
                    className="h-48 w-48 rounded-2xl bg-white p-3 object-contain shadow-lg border border-zinc-200"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">
                  No QR code security record available.
                </p>
              )
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center py-12">
                <div className="flex h-48 w-48 items-center justify-center rounded-3xl border-2 border-dashed border-emerald-500 bg-cyan-100">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
                      QR Visible to
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
                      Super Admin Only
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
