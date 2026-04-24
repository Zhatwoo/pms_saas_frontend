"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { requestCustomerEdit } from "@/lib/api";

export type RequestMode = "specific" | "freeform";

interface RequestCustomerEditModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
}

const inputClass =
  "h-11 w-full rounded-2xl border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";

const textareaClass =
  "min-h-[160px] w-full rounded-2xl border border-input-border bg-input-bg px-3 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";

const overlayClass =
  "fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-md";

const modalClass =
  "w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl anim-modal-enter";

const fieldOptions = [
  { value: "full_name", label: "Full name" },
  { value: "contact_number", label: "Contact number" },
  { value: "address", label: "Address" },
  { value: "email", label: "Email" },
  { value: "id_presented", label: "ID presented" },
] as const;

function buildTemplate(field: string, customerName?: string) {
  const target = customerName?.trim() || "this customer";
  const fieldLabel = fieldOptions.find((option) => option.value === field)?.label ?? "details";

  return `Request to review ${fieldLabel.toLowerCase()} for ${target}. Please verify and update the customer record if needed.`;
}

export function RequestCustomerEditModal({
  customerId,
  isOpen,
  onClose,
  customerName,
}: RequestCustomerEditModalProps) {
  const [mode, setMode] = useState<RequestMode>("specific");
  const [field, setField] = useState<(typeof fieldOptions)[number]["value"]>("address");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fieldLabel = useMemo(
    () => fieldOptions.find((option) => option.value === field)?.label ?? "Address",
    [field],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMode("specific");
    setField("address");
    setNotes("");
    setIsSaving(false);
  }, [customerName, isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      toast.error("Please add a note before submitting the request.");
      return;
    }

    setIsSaving(true);
    try {
      await requestCustomerEdit(customerId, trimmedNotes, mode === "specific" ? field : undefined, mode);
      toast.success("Edit request submitted.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit edit request.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleModeChange(nextMode: RequestMode) {
    setMode(nextMode);
    setNotes("");
  }

  function handleFieldChange(nextField: (typeof fieldOptions)[number]["value"]) {
    setField(nextField);
    setNotes("");
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(event) => event.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90">
                Request Customer Edit
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {customerName?.trim() || "Customer"}
              </h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Submit a note for review. The backend receives this as a single request-edit payload.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close request edit modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="rounded-[1.25rem] border border-border-main bg-surface-secondary p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
              Request Mode
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handleModeChange("specific")}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${mode === "specific" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-border-main bg-surface text-text-primary hover:bg-surface-hover"}`}
              >
                <p className="text-sm font-bold">Specific field</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Pre-populate the request around one field, then refine the note.
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("freeform")}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${mode === "freeform" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-border-main bg-surface text-text-primary hover:bg-surface-hover"}`}
              >
                <p className="text-sm font-bold">Free-form note</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Write a general request with no field preselection.
                </p>
              </button>
            </div>
          </div>

          {mode === "specific" && (
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
                Field to review
              </span>
              <select
                value={field}
                onChange={(event) => handleFieldChange(event.target.value as (typeof fieldOptions)[number]["value"])}
                className={inputClass}
              >
                {fieldOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={textareaClass}
              placeholder={
                mode === "specific"
                  ? `Explain what should change for ${fieldLabel.toLowerCase()}.`
                  : "Write the customer edit request..."
              }
            />
          </label>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            This action sends a review request to the backend at /customers/{customerId}/request-edit.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border-main pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-main px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving && <span className="anim-loading h-4 w-4 rounded-full border border-white/30" />}
              {isSaving ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
