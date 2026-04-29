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
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
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

        <div className="px-6 py-5">
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

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
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
