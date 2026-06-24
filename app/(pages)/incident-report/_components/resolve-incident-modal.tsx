"use client";

import { X } from "lucide-react";

interface ResolveIncidentModalProps {
  ticketNo: string;
  title: string;
  notes: string;
  isSubmitting: boolean;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResolveIncidentModal({
  ticketNo,
  title,
  notes,
  isSubmitting,
  onNotesChange,
  onClose,
  onConfirm,
}: ResolveIncidentModalProps) {
  const canSubmit = notes.trim().length > 0 && !isSubmitting;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4 dark:[&_.text-text-primary]:text-slate-50 dark:[&_.text-text-secondary]:text-slate-100 dark:[&_.text-text-tertiary]:text-slate-300 dark:[&_.text-text-muted]:text-slate-300 dark:[&_.text-slate-700]:text-slate-200 dark:[&_.text-slate-600]:text-slate-300 dark:[&_.text-slate-500]:text-slate-300 dark:[&_.text-slate-400]:text-slate-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{ticketNo}</p>
            <h2 className="mt-1 text-lg font-bold text-text-primary">Resolve Incident</h2>
            <p className="mt-1 text-sm text-text-tertiary">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-main p-2 text-text-secondary transition-colors hover:bg-surface-secondary"
            aria-label="Close resolve incident modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Resolution Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows={5}
              placeholder="Document the action taken, verification, and final outcome."
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-main px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit}
            className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Resolving..." : "Confirm Resolve"}
          </button>
        </div>
      </div>
    </div>
  );
}
