"use client";

import { useState } from "react";

export interface RequestExpensesData {
  amount: number;
  category: string;
  notes: string;
}

interface RequestExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RequestExpensesData) => void;
}

export function RequestExpensesModal({ isOpen, onClose, onSubmit }: RequestExpensesModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState("Expense - Supplies");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: Number(amount),
        category,
        notes,
      });

      setAmount("");
      setCategory("Expense - Supplies");
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border-main px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Request Approve Expense</h2>
              <p className="text-xs text-text-secondary">Submit expense for Super Admin approval — deducted from branch balance</p>
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

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Requested Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                ₱
              </div>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-input-border bg-input-bg py-2.5 pl-8 pr-4 text-sm font-bold text-text-primary outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-input-bg py-2.5 px-4 text-sm font-medium text-text-primary outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Expense - Supplies">Supplies</option>
              <option value="Expense - Maintenance">Maintenance</option>
              <option value="Expense - Utilities">Utilities</option>
              <option value="Expense - Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide more context for this request..."
              className="h-20 w-full resize-none rounded-lg border border-input-border bg-input-bg p-3 text-sm text-text-primary outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
                className="rounded-lg border border-input-border bg-surface-secondary px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
