"use client";

import { useState, useEffect } from "react";

export interface AddSystemExpenseData {
  amount: number;
  category: string;
  notes: string;
}

interface AddSystemExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddSystemExpenseData) => void;
  isSubmitting?: boolean;
}

export function AddSystemExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddSystemExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Expense - Operations");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setCategory("Expense - Operations");
      setNotes("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    onSubmit({
      amount: Number(amount),
      category,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-main px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Add System Expense</h2>
              <p className="text-xs text-text-secondary">Deducted from overall balance — not from any branch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Expense Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg py-3 pl-10 pr-4 text-lg font-bold text-text-primary outline-none transition-colors focus:border-red-400 focus:ring-1 focus:ring-red-400"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-red-400 focus:ring-1 focus:ring-red-400"
            >
              <option value="Expense - Operations">Operations</option>
              <option value="Expense - Supplies">Supplies</option>
              <option value="Expense - Maintenance">Maintenance</option>
              <option value="Expense - Utilities">Utilities</option>
              <option value="Expense - Salary">Salary</option>
              <option value="Expense - Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Notes <span className="text-text-muted text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 w-full resize-none rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-red-400 focus:ring-1 focus:ring-red-400"
              placeholder="Additional details about this expense..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input-border px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || Number(amount) <= 0}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Confirm Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
