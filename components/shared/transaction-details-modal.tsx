"use client";

import { StatusBadge } from "./status-badge";
import { useRef, useState } from "react";
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
    <div className="rounded-2xl border border-border-main bg-surface p-4 shadow-sm transition-colors">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-text-primary">
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
  const isAdminOrSuperAdmin = user?.role === "super_admin";
  
  // State for buyback proof preview
  const [buybackProofPreview, setBuybackProofPreview] = useState<{ src: string; title: string } | null>(null);
  
  const modalAriaProps = {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "transaction-details-modal-title",
  } as const;

  if (!isOpen || !transaction) return null;

  // Proof for buy out (full settlement) or buy back (repurchase)
  const shouldShowBuybackProof =
    transaction.buyback_proof &&
    (transaction.purpose === "Buy Back" || transaction.purpose === "Buy Out");

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-xl" {...modalAriaProps} ref={modalRef}>
      <div className="max-h-[92vh] w-[95vw] max-w-5xl scale-in-center overflow-y-auto rounded-[28px] border bg-surface shadow-[0_24px_80px_rgba(15,23,42,0.35)] transition-colors border-border-main md:w-[90vw]">
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
              {isAdminOrSuperAdmin && transaction.relatedPawnedItemId && (
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

        <div className={`grid gap-4 px-6 pb-6 ${
          isAdminOrSuperAdmin 
            ? (shouldShowBuybackProof 
                ? (transaction.idPhoto ? "lg:grid-cols-3" : "lg:grid-cols-2") 
                : (transaction.idPhoto ? "lg:grid-cols-2" : "lg:grid-cols-1"))
            : (shouldShowBuybackProof 
                ? (transaction.idPhoto ? "lg:grid-cols-2" : "lg:grid-cols-1")
                : (transaction.idPhoto ? "lg:grid-cols-1" : ""))
        }`}>
          {/* Security Identity - Admin/SuperAdmin Only */}
          {isAdminOrSuperAdmin && (
            <div className="rounded-3xl border border-border-main bg-surface p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
                Security Identity
              </p>
              {(transaction.qrCode || transaction.qr_code) ? (
                <div className="mt-4 flex flex-col items-center">
                  <img
                    src={transaction.qrCode || transaction.qr_code}
                    alt="Transaction QR"
                    className="h-48 w-48 rounded-2xl bg-white p-3 object-contain shadow-lg border border-border-main dark:opacity-90"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">
                  No QR code security record available.
                </p>
              )}
            </div>
          )}

          {/* Buyback Proof - Replaces QR for Employees, Additional section for Admin */}
          {shouldShowBuybackProof && (
            <div className="rounded-3xl border border-border-main bg-surface p-5 shadow-sm flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
                Buyback Proof
              </p>
              <div className="mt-4 flex-1 flex flex-col items-center justify-center">
                <img
                  src={transaction.buyback_proof!}
                  alt="Buyback Proof"
                  className="max-h-[300px] w-auto rounded-2xl object-contain shadow-lg border border-border-main cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setBuybackProofPreview({ src: transaction.buyback_proof!, title: "Buyback Transaction Proof" })}
                />
              </div>
            </div>
          )}

          {/* Renewal MOA Proof */}
          {transaction.idPhoto && (
            <div className="rounded-3xl border border-border-main bg-surface p-5 shadow-sm flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
                Renewal MOA Proof
              </p>
              <div className="mt-4 flex-1 flex flex-col items-center justify-center">
                <img
                  src={transaction.idPhoto}
                  alt="Renewal MOA Proof"
                  className="max-h-64 rounded-2xl bg-white p-1 object-contain shadow-lg border border-border-main dark:opacity-90"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buyback Proof Preview Lightbox */}
      {buybackProofPreview && (
        <div 
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md" 
          onClick={() => setBuybackProofPreview(null)}
        >
          <div 
            className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-2xl" 
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Proof Preview</p>
                <h3 className="mt-1 text-lg font-black text-text-primary">{buybackProofPreview.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setBuybackProofPreview(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-hover"
                aria-label="Close image preview"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="flex max-h-[calc(90vh-72px)] items-center justify-center bg-zinc-950 p-4">
              <img 
                src={buybackProofPreview.src} 
                alt={buybackProofPreview.title} 
                className="max-h-[calc(90vh-120px)] w-full object-contain" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
