"use client";

import { StatusBadge } from "./status-badge";
import { formatTimeWithAmPm } from "@/lib/time";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn" | "Fund Transfer" | "Cash Transfer";

export interface TransactionDetailsData {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
  details: string;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  profilePhoto?: string;
  idPhoto?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  transaction: TransactionDetailsData | null;
  onClose: () => void;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-main bg-surface-secondary p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-text-primary">{value || "—"}</p>
    </div>
  );
}

function purposeVariant(purpose: PurposeType): "blue" | "green" | "orange" | "purple" | "black" {
  if (purpose === "Sold Item") return "orange";
  if (purpose === "Renew") return "green";
  if (purpose === "Buy Back") return "blue";
  if (purpose === "Pawn") return "purple";
  return "black";
}

export function TransactionDetailsModal({ isOpen, transaction, onClose }: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-4xl scale-in-center overflow-y-auto rounded-3xl border border-border-main bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-main pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Transaction Details</p>
            <h2 className="mt-1 text-2xl font-black text-text-primary">{transaction.transactionNo}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge label={transaction.purpose} variant={purposeVariant(transaction.purpose)} />
              <span className="text-sm text-text-tertiary">{transaction.branch}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border-main px-3 py-2 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock label="Date" value={transaction.date} />
          <InfoBlock label="Time" value={formatTimeWithAmPm(transaction.time)} />
          <InfoBlock label="Cash In" value={transaction.cashIn} />
          <InfoBlock label="Cash Out" value={transaction.cashOut} />
          <InfoBlock label="Return" value={transaction.returnVal} />
          <InfoBlock label="Unit" value={transaction.unit} />
          <InfoBlock label="Unit Code" value={transaction.unitCode} />
          <InfoBlock label="Pawn" value={transaction.pawn} />
          <InfoBlock label="Storage" value={transaction.storage} />
          <InfoBlock label="Related Pawned Item ID" value={transaction.relatedPawnedItemId || "—"} />
          <InfoBlock label="Related Sale Item ID" value={transaction.relatedSaleItemId || "—"} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Details</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">{transaction.details || "—"}</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Profile Photo</p>
              {transaction.profilePhoto ? (
                <img src={transaction.profilePhoto} alt="Profile" className="mt-3 h-44 w-full rounded-xl border border-border-main object-cover" />
              ) : (
                <p className="mt-3 text-sm text-text-tertiary">No profile photo available.</p>
              )}
            </div>
            <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">ID Photo</p>
              {transaction.idPhoto ? (
                <img src={transaction.idPhoto} alt="ID" className="mt-3 h-44 w-full rounded-xl border border-border-main object-cover" />
              ) : (
                <p className="mt-3 text-sm text-text-tertiary">No ID photo available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
