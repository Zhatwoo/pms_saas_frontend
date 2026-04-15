"use client";

import { useEffect, useState } from "react";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CustomerFormInput) => Promise<void>;
}

export interface CustomerFormInput {
  fullName: string;
  phoneNumber: string;
  email: string;
  idType: string;
  idNumber: string;
  address: string;
}

type IdType = "driver-license" | "national-id" | "passport" | "sss";

const idTypeOptions: { value: IdType; label: string }[] = [
  { value: "driver-license", label: "Driver's License" },
  { value: "national-id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "sss", label: "SSS" },
];

const initialFormState: CustomerFormInput = {
  fullName: "",
  phoneNumber: "+63",
  email: "",
  idType: "driver-license",
  idNumber: "",
  address: "",
};

const PHONE_REGEX = /^\+639\d{9}$/;

function normalizePhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly || digitsOnly === "6" || digitsOnly === "63") {
    return "+63";
  }

  let local = digitsOnly;
  if (local.startsWith("63")) {
    local = local.slice(2);
  } else if (local.startsWith("0")) {
    local = local.slice(1);
  }

  local = local.slice(0, 10);
  return `+63${local}`;
}

export function AddCustomerModal({ isOpen, onClose, onSave }: AddCustomerModalProps) {
  const [form, setForm] = useState<CustomerFormInput>({ ...initialFormState });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  function updateField<K extends keyof CustomerFormInput>(
    key: K,
    value: CustomerFormInput[K],
  ) {
    if (key === "phoneNumber") {
      const normalizedPhone = normalizePhoneNumber(String(value));
      if (!normalizedPhone || PHONE_REGEX.test(normalizedPhone)) {
        setPhoneError("");
      } else {
        setPhoneError("Use format +639XXXXXXXXX");
      }
      setForm((current) => ({ ...current, phoneNumber: normalizedPhone }));
      return;
    }

    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = form.fullName.trim();
    const trimmedPhone = form.phoneNumber.trim();
    const trimmedEmail = form.email.trim();
    const trimmedIdNumber = form.idNumber.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    if (!trimmedPhone || trimmedPhone === "+63") {
      setError("Phone number is required.");
      return;
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Use format +639XXXXXXXXX");
      return;
    }

    if (!trimmedIdNumber) {
      setError("ID number is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        email: trimmedEmail,
        idType: form.idType,
        idNumber: trimmedIdNumber,
        address: form.address.trim(),
      });
      setForm({ ...initialFormState });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save customer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-900 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
            Customer Management
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Add New Customer</h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Register a new customer profile with their identification
                details.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close add customer modal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Full Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Juan Dela Cruz"
                className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                placeholder="+639123456789"
                maxLength={13}
                aria-invalid={phoneError ? "true" : "false"}
                className={`h-11 w-full rounded-md border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700 ${
                  phoneError ? "border-red-400" : "border-input-border"
                }`}
              />
              {phoneError ? (
                <p className="mt-1 text-xs font-medium text-red-500">{phoneError}</p>
              ) : (
                <p className="mt-1 text-xs text-text-tertiary">Format: +639XXXXXXXXX</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="juandelacruz@gmail.com"
                className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            {/* ID Type */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                ID Type
              </label>
              <select
                value={form.idType}
                onChange={(e) => updateField("idType", e.target.value)}
                className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
              >
                {idTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ID Number */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                ID Number
              </label>
              <input
                type="text"
                value={form.idNumber}
                onChange={(e) => updateField("idNumber", e.target.value)}
                placeholder="N5012345678"
                className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Main Street, Brgy. San Antonio, Manila"
                className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-sm text-emerald-text">
            Make sure to verify the customer&apos;s valid ID before saving.
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-border-main pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-main px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
