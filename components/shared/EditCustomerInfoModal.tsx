"use client";

import { useEffect, useMemo, useState } from "react";
import { PHONE_REGEX, normalizePhoneNumber } from "@/lib/phone-number";
import { PhilippineAddressFields } from "@/components/shared/philippine-address-fields";

export type CustomerUpdatePayload = {
  full_name?: string;
  address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  contact_number?: string;
  email?: string;
  id_presented?: string;
};

export type EditableCustomerInfo = {
  id: string;
  full_name: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  contact_number: string | null;
  email: string | null;
  id_presented: string | null;
};

interface EditCustomerInfoModalProps {
  customer: EditableCustomerInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CustomerUpdatePayload) => Promise<void>;
}

const inputClass =
  "h-11 w-full rounded-2xl border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";

const overlayClass =
  "fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-md";

const modalClass =
  "w-full max-w-3xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl anim-modal-enter";

const idOptions = [
  "Driver's License",
  "National ID",
  "Passport",
  "PhilHealth ID",
  "SSS ID",
  "Voter's ID",
  "UMID",
  "Postal ID",
  "TIN ID",
  "Other",
];

function buildDisplayName(customer: EditableCustomerInfo) {
  return customer.full_name?.trim() || customer.id;
}

export function EditCustomerInfoModal({
  customer,
  isOpen,
  onClose,
  onSave,
}: EditCustomerInfoModalProps) {
  const initialValues = useMemo(
    () => ({
      fullName: customer.full_name,
      contactNumber: customer.contact_number || "",
      address: customer.address || "",
      barangay: customer.barangay || "",
      city: customer.city || "",
      province: customer.province || "",
      email: customer.email || "",
      hasIdPresented: Boolean(customer.id_presented?.trim()),
      idPresented: customer.id_presented || "",
    }),
    [customer],
  );

  const [values, setValues] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      setError(null);
      setIsSaving(false);
    }
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  function setField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const fullName = values.fullName.trim();
    const normalizedPhone = normalizePhoneNumber(values.contactNumber.trim());
    const email = values.email.trim();
    const address = values.address.trim();
    const barangay = values.barangay.trim();
    const city = values.city.trim();
    const province = values.province.trim();
    const idPresented = values.hasIdPresented ? values.idPresented.trim() : "";

    if (!fullName) {
      setError("Full name is required.");
      return;
    }

    if (!normalizedPhone || !PHONE_REGEX.test(normalizedPhone)) {
      setError("Enter a valid mobile number in +639XXXXXXXXX format.");
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (values.hasIdPresented && !idPresented) {
      setError("Select or enter the ID presented by the customer.");
      return;
    }

    const payload: CustomerUpdatePayload = {
      full_name: fullName,
      contact_number: normalizedPhone,
      email: email || undefined,
      address: address || undefined,
      barangay: barangay || undefined,
      city: city || undefined,
      province: province || undefined,
      id_presented: values.hasIdPresented ? idPresented : undefined,
    };

    setIsSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save customer details.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(event) => event.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90">
                Edit Customer Profile
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {buildDisplayName(customer)}
              </h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Update contact and address details only. Images and QR fields stay locked.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close edit customer modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name" required>
              <input
                type="text"
                value={values.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                className={inputClass}
                placeholder="Customer full name"
                autoComplete="off"
              />
            </Field>

            <Field label="Contact Number" required>
              <input
                type="tel"
                value={values.contactNumber}
                onChange={(event) => setField("contactNumber", event.target.value)}
                onBlur={(event) => setField("contactNumber", normalizePhoneNumber(event.target.value))}
                className={inputClass}
                placeholder="+639XXXXXXXXX"
                autoComplete="tel"
              />
            </Field>
          </div>

          <Field label="Email Address">
            <input
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              className={inputClass}
              placeholder="customer@example.com"
              autoComplete="email"
            />
          </Field>

          <PhilippineAddressFields
            value={{
              address: values.address,
              barangay: values.barangay,
              city: values.city,
              province: values.province,
            }}
            onFieldChange={setField}
          />

          <div className="rounded-[1.25rem] border border-border-main bg-surface-secondary p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
                  ID Presented
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Images and QR codes are locked in this flow.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
                <input
                  type="checkbox"
                  checked={values.hasIdPresented}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      hasIdPresented: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-border-main text-emerald-700 focus:ring-emerald-500"
                />
                Customer presented an ID
              </label>
            </div>

            <div className="mt-4">
              <select
                value={values.idPresented}
                onChange={(event) => setField("idPresented", event.target.value)}
                disabled={!values.hasIdPresented}
                className={`${inputClass} ${!values.hasIdPresented ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <option value="">Select ID type</option>
                {idOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

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
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}
