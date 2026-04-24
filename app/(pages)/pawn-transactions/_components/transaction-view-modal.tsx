"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatPeso } from "@/lib/currency";
import { formatTimeWithAmPm } from "@/lib/time";
import type { PurposeType, TransactionRow } from "./types";

interface TransactionViewModalProps {
  isOpen: boolean;
  transaction: TransactionRow | null;
  onClose: () => void;
  onPrint?: (transaction: TransactionRow) => void;
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
  "Fund Transfer": "blue",
  "Cash Transfer": "blue",
};

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-main bg-surface-secondary p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-text-primary">
        {value || "-"}
      </p>
    </div>
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
  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border-main bg-surface p-6 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-border-main pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
              Transaction Details
            </p>
            <h2 className="mt-1 text-2xl font-black text-text-primary">
              {transaction.transactionNo}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge
                label={transaction.purpose}
                variant={purposeVariant[transaction.purpose]}
              />
              <span className="rounded-full border border-border-main px-3 py-1 text-xs font-semibold text-text-secondary">
                {transaction.branch}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {transaction.purpose === "Pawn" && onPrint ? (
              <button
                type="button"
                onClick={() => onPrint(transaction)}
                className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
              >
                Print Slip
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-main px-4 py-2 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">
              {transaction.notes || "No notes added for this transaction."}
            </p>
          </div>

          <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              QR Code
            </p>
            {transaction.qrCode ? (
              <div className="mt-3 flex justify-center">
                <img
                  src={transaction.qrCode}
                  alt={`${transaction.unit || transaction.transactionNo} QR code`}
                  className="h-48 w-48 rounded-xl border border-border-main bg-white p-2 object-contain shadow-sm"
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-tertiary">
                No QR code available for this transaction.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
