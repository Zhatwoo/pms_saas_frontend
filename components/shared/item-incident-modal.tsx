import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "@/lib/api";

interface ItemIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
  branchId: string;
  itemId: string;
  itemName?: string;
}

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function ItemIncidentModal({
  isOpen,
  onClose,
  onReported,
  branchId,
  itemId,
  itemName,
}: ItemIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(`Missing item: ${itemId}`);
    setSummary(
      `Item ${itemId}${itemName ? ` (${itemName})` : ""} was not found during the inventory audit.`,
    );
    setPriority("medium");
    setSubmitting(false);
    setError("");
  }, [isOpen, itemId, itemName]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !summary.trim()) {
      setError("Please complete the title and summary.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/incident-tickets", {
        title: title.trim(),
        summary: summary.trim(),
        category: "missing_inventory",
        priority,
        branchId,
        userId: null,
        amountImpact: null,
        transactionRef: itemId,
        inventoryItemRef: itemId,
        requiresManagerEscalation: false,
      });

      onReported?.();
      onClose();
    } catch (err) {
      console.error("Failed to report item incident:", err);
      setError(err instanceof Error ? err.message : "Failed to save incident ticket.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Report Missing Item</h2>
              <p className="mt-1 text-sm text-text-tertiary">
                Create an incident ticket for this audit discrepancy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-main p-2 text-text-secondary transition-colors hover:bg-surface-secondary"
            aria-label="Close item incident modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Item</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {itemName || "Unknown item"} <span className="text-text-tertiary">({itemId})</span>
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-rose-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Summary</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-rose-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-rose-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-main px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
