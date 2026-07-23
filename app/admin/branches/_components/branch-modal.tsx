"use client";

import { useEffect, useMemo, useState } from "react";
import { PHONE_REGEX, normalizePhoneNumber } from "@/lib/phone-number";

interface BranchFormData {
  branchId: string;
  name: string;
  location: string;
  contactNumber: string;
  status: string;
}

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchFormData) => void;
  initialData?: BranchFormData | null;
  mode: "create" | "edit";
  existingCount: number;
}

const statusOptions = ["Active", "Inactive", "Process", "Terminated"];

function generateBranchId(count: number): string {
  const num = count + 1;
  return String(num).padStart(3, "0");
}

export function BranchModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  existingCount,
}: BranchModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("+63");
  const [status, setStatus] = useState("Active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatedId = useMemo(
    () =>
      mode === "create"
        ? generateBranchId(existingCount)
        : initialData?.branchId || "",
    [mode, existingCount, initialData, isOpen],
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLocation(initialData.location);
      setContactNumber(initialData.contactNumber || "+63");
      setStatus(initialData.status);
    } else {
      setName("");
      setLocation("");
      setContactNumber("+63");
      setStatus("Active");
    }
    setErrors({});
  }, [initialData, isOpen]);

  function updateContactNumber(value: string) {
    const normalized = normalizePhoneNumber(value);
    setContactNumber(normalized);

    setErrors((current) => {
      const nextErrors = { ...current };

      if (!normalized || normalized === "+63") {
        nextErrors.contactNumber = "Contact number is required";
      } else if (!PHONE_REGEX.test(normalized)) {
        nextErrors.contactNumber = "Use format +639XXXXXXXXX";
      } else {
        delete nextErrors.contactNumber;
      }

      return nextErrors;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Branch name is required";
    if (!location.trim()) newErrors.location = "Location is required";

    const trimmedContact = contactNumber.trim();
    if (!trimmedContact || trimmedContact === "+63") {
      newErrors.contactNumber = "Contact number is required";
    } else if (!PHONE_REGEX.test(trimmedContact)) {
      newErrors.contactNumber = "Use format +639XXXXXXXXX";
    }

    if (!status) newErrors.status = "Status is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      branchId: generatedId,
      name: name.trim(),
      location: location.trim(),
      contactNumber: contactNumber.trim(),
      status,
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md animate-[fadeInUp_0.25s_ease-out] rounded-xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {mode === "create" ? "Create New Branch" : "Edit Branch"}
            </h2>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {mode === "create"
                ? "Add a new pawnshop branch location"
                : "Update branch information"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Branch ID
            </label>
            <input
              type="text"
              value={generatedId}
              readOnly
              disabled
              className="cursor-not-allowed rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm font-semibold text-text-muted outline-none"
            />
            <span className="text-[10px] text-text-muted">Auto-generated and cannot be edited</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BGC Branch"
              className={`rounded-lg border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-pawn-sidebar transition-colors duration-200 ${
                errors.name ? "border-red-400" : "border-input-border"
              }`}
            />
            {errors.name && (
              <span className="text-[10px] text-red-500">{errors.name}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bonifacio Global City, Taguig"
              className={`rounded-lg border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-pawn-sidebar transition-colors duration-200 ${
                errors.location ? "border-red-400" : "border-input-border"
              }`}
            />
            {errors.location && (
              <span className="text-[10px] text-red-500">{errors.location}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => updateContactNumber(e.target.value)}
              placeholder="+639XXXXXXXXX"
              className={`rounded-lg border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-pawn-sidebar transition-colors duration-200 ${
                errors.contactNumber ? "border-red-400" : "border-input-border"
              }`}
            />
            {errors.contactNumber && (
              <span className="text-[10px] text-red-500">{errors.contactNumber}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`rounded-lg border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-pawn-sidebar transition-colors duration-200 ${
                errors.status ? "border-red-400" : "border-input-border"
              }`}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.status && (
              <span className="text-[10px] text-red-500">{errors.status}</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg border border-pawn-sidebar-light bg-pawn-sidebar px-4 py-2 text-xs font-bold text-pawn-gold transition-opacity hover:opacity-90"
            >
              {mode === "create" ? "Create Branch" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
