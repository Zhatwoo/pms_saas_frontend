"use client";

import { useState } from "react";
import type { CustomerDetail } from "./types";

const cameraIcon = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-text-tertiary"
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const closeIcon = (
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
);

const inputClass =
  "h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700";

interface EditCustomerModalProps {
  customer: CustomerDetail;
  onClose: () => void;
  onSave: (updated: CustomerDetail) => void;
}

export function EditCustomerModal({ customer, onClose, onSave }: EditCustomerModalProps) {
  const [form, setForm] = useState({
    firstName: customer.firstName,
    middleName: customer.middleName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    idType: customer.idType,
    idNumber: customer.idNumber,
    street: customer.street,
    barangay: customer.barangay,
    city: customer.city,
    province: customer.province,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const firstName = form.firstName.trim() || customer.firstName;
    const middleName = form.middleName.trim();
    const lastName = form.lastName.trim() || customer.lastName;
    onSave({
      ...customer,
      firstName,
      middleName,
      lastName,
      name: `${firstName}${middleName ? " " + middleName : ""} ${lastName}`,
      email: form.email.trim() || customer.email,
      phone: form.phone.trim() || customer.phone,
      idType: form.idType,
      idNumber: form.idNumber.trim() || customer.idNumber,
      street: form.street.trim() || customer.street,
      barangay: form.barangay.trim() || customer.barangay,
      city: form.city.trim() || customer.city,
      province: form.province.trim() || customer.province,
      address: `${form.barangay.trim()}, ${form.city.trim()}`,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-900 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
            Customer Management
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Edit Customer Profile</h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Update the customer details for{" "}
                <span className="font-bold text-amber-300">{customer.name}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close edit customer modal"
            >
              {closeIcon}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {/* Name */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                First Name
              </label>
              <input name="firstName" type="text" value={form.firstName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Middle Name
              </label>
              <input name="middleName" type="text" value={form.middleName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Last Name
              </label>
              <input name="lastName" type="text" value={form.lastName} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Street / Subdivision / Compound
            </label>
            <input name="street" type="text" value={form.street} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Barangay / District / Locality
              </label>
              <input name="barangay" type="text" value={form.barangay} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                City / Municipality
              </label>
              <input name="city" type="text" value={form.city} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Province
              </label>
              <input name="province" type="text" value={form.province} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Contact No.
              </label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="09XX-XXX-XXXX" className={inputClass} />
            </div>
          </div>

          {/* ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                ID Presented
              </label>
              <select name="idType" value={form.idType} onChange={handleChange} className={inputClass}>
                <option value="Driver's License">Driver&apos;s License</option>
                <option value="National ID">National ID</option>
                <option value="Passport">Passport</option>
                <option value="PhilHealth ID">PhilHealth ID</option>
                <option value="SSS ID">SSS ID</option>
                <option value="Voter's ID">Voter&apos;s ID</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                ID Number
              </label>
              <input name="idNumber" type="text" value={form.idNumber} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Email Address
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
          </div>

          {/* Verification Photos */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
              Verification Photos
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-main bg-surface-secondary transition-colors hover:border-emerald-400 hover:bg-emerald-surface/30">
                  {cameraIcon}
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  Front View
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-main bg-surface-secondary transition-colors hover:border-emerald-400 hover:bg-emerald-surface/30">
                  {cameraIcon}
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  Serial No / ID
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-sm text-emerald-text">
            Update the profile details and save the changes.
          </div>

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
              className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
