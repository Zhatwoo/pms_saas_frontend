"use client";

import { useEffect, useState } from "react";
import {
  PURPOSE_OPTIONS,
  type TransactionBranchOption,
  type TransactionRow,
} from "./types";

interface TransactionFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  transaction: TransactionRow | null;
  branches: TransactionBranchOption[];
  onClose: () => void;
  onSubmit: (transaction: TransactionRow) => void;
}

export function TransactionFormModal({
  isOpen,
  mode,
  transaction,
  branches,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const [formValues, setFormValues] = useState<TransactionRow | null>(transaction);

  useEffect(() => {
    setFormValues(transaction);
  }, [transaction]);

  if (!isOpen || !formValues) {
    return null;
  }

  function updateField<K extends keyof TransactionRow>(
    field: K,
    value: TransactionRow[K],
  ) {
    setFormValues((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function handleBranchChange(branchId: string) {
    const branch = branches.find((item) => item.id === branchId);
    updateField("branchId", branchId);
    updateField("branch", branch?.name ?? "");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formValues) {
      return;
    }
    onSubmit(formValues);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-green">
              Pawn Transactions
            </p>
            <h2 className="mt-1 text-xl font-bold text-text-primary">
              {mode === "create" ? "Add Transaction" : "Edit Transaction"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Transaction No.">
              <input
                value={formValues.transactionNo}
                onChange={(event) => updateField("transactionNo", event.target.value)}
                required
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Branch">
              <select
                value={formValues.branchId}
                onChange={(event) => handleBranchChange(event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Purpose">
              <select
                value={formValues.purpose}
                onChange={(event) =>
                  updateField("purpose", event.target.value as TransactionRow["purpose"])
                }
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              >
                {PURPOSE_OPTIONS.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Date">
              <input
                type="date"
                value={formValues.date}
                onChange={(event) => updateField("date", event.target.value)}
                required
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Time">
              <input
                type="time"
                value={formValues.time}
                onChange={(event) => updateField("time", event.target.value)}
                required
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Customer Name">
              <input
                value={formValues.customerName}
                onChange={(event) => updateField("customerName", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Customer Address">
              <input
                value={formValues.customerAddress}
                onChange={(event) => updateField("customerAddress", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Item / Unit">
              <input
                value={formValues.unit}
                onChange={(event) => updateField("unit", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Unit Code">
              <input
                value={formValues.unitCode}
                onChange={(event) => updateField("unitCode", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Cash In">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.cashIn}
                onChange={(event) => updateField("cashIn", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Cash Out">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.cashOut}
                onChange={(event) => updateField("cashOut", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Return Value">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.returnVal}
                onChange={(event) => updateField("returnVal", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Pawn Amount">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.pawn}
                onChange={(event) => updateField("pawn", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <Field label="Storage Fee">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formValues.storage}
                onChange={(event) => updateField("storage", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </Field>

            <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                Details
              </label>
              <input
                value={formValues.details}
                onChange={(event) => updateField("details", event.target.value)}
                className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                Notes
              </label>
              <textarea
                rows={4}
                value={formValues.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="w-full resize-none rounded-lg border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-main px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg border border-brand-green bg-brand-green px-5 py-2 text-sm font-bold text-white transition-colors hover:brightness-110"
            >
              {mode === "create" ? "Save Transaction" : "Update Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
        {label}
      </label>
      {children}
    </div>
  );
}
