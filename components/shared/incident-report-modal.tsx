import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { X } from "lucide-react";

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillItem?: { itemId: string; itemName?: string } | null;
  missingItems?: Array<{ itemId: string; itemName: string; category?: string }>;
}

const categoryOptions = [
  { value: "missing_inventory", label: "Missing Inventory" },
  { value: "other", label: "Other" },
];

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function IncidentReportModal({ isOpen, onClose, prefillItem, missingItems = [] }: IncidentReportModalProps) {
  const { selectedBranch } = useBranch();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("missing_inventory");
  const [priority, setPriority] = useState("medium");
  const [selectedMissingItemId, setSelectedMissingItemId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMissingItemId(prefillItem?.itemId ?? "");
      setTitle(prefillItem ? `Missing item: ${prefillItem.itemId}` : "Inventory incident report");
      setSummary(prefillItem ? `Item ${prefillItem.itemId} (${prefillItem.itemName ?? ""}) is missing from audit.` : "");
      setCategory("missing_inventory");
      setPriority("medium");
      setSuccess(false);
    } else {
      setTitle("");
      setSummary("");
      setSelectedMissingItemId("");
      setSubmitting(false);
    }
  }, [isOpen, prefillItem, missingItems]);

  useEffect(() => {
    if (!isOpen || category !== "missing_inventory") {
      return;
    }

    const selectedItem = missingItems.find((item) => item.itemId === selectedMissingItemId) ?? null;

    if (selectedItem) {
      setTitle(`Missing item: ${selectedItem.itemId}`);
      setSummary(`Item ${selectedItem.itemId} (${selectedItem.itemName}) is missing from audit.`);
    }
  }, [category, isOpen, missingItems, selectedMissingItemId]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/incident-tickets", {
        title: title.trim(),
        summary: summary.trim(),
        category,
        priority,
        branchId: selectedBranch.id,
        // Submit as current user — server infers reported_by
        userId: null,
        amountImpact: null,
        transactionRef: prefillItem?.itemId ?? null,
        requiresManagerEscalation: false,
      });

      setSuccess(true);
      // keep modal open briefly to show success then close
      window.setTimeout(() => {
        setSubmitting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to submit incident ticket:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4">
      <div
        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Incident Report</h2>
            <p className="mt-1 text-sm text-text-tertiary">Report a missing inventory item for review.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-main p-2 text-text-secondary transition-colors hover:bg-surface-secondary"
            aria-label="Close incident ticket modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short incident title"
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Summary</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Describe what happened and why the ticket needs attention."
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Missing Item</span>
            <select
              value={selectedMissingItemId}
              onChange={(e) => setSelectedMissingItemId(e.target.value)}
              disabled={missingItems.length === 0}
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="" disabled hidden>
                Select a missing item
              </option>
              {missingItems.map((item) => (
                <option key={item.itemId} value={item.itemId}>
                  {item.itemName} {item.category ? `(${item.category})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none">
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Branch</span>
            <input readOnly value={selectedBranch.name} className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Transaction Reference</span>
            <input value={selectedMissingItemId || (prefillItem?.itemId ?? "")} readOnly className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary" />
          </label>

          <div className="flex shrink-0 flex-col gap-3 border-t border-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:col-span-2">
            <p className="text-xs text-text-muted">This form writes directly to the incident tickets table.</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={onClose} className="rounded-lg border border-border-main px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving...' : 'Save Ticket'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IncidentReportModal;
