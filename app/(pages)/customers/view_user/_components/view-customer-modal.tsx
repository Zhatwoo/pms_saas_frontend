"use client";

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

interface ViewCustomerModalProps {
  customer: CustomerDetail;
  onClose: () => void;
}

export function ViewCustomerModal({ customer, onClose }: ViewCustomerModalProps) {
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
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-700"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Customer Details</h2>
                <p className="mt-0.5 text-sm text-emerald-50/80">
                  Viewing profile for{" "}
                  <span className="font-bold text-amber-300">{customer.name}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close view customer modal"
            >
              {closeIcon}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50/50 shadow-sm">
              {customer.profilePhoto ? (
                <img
                  src={customer.profilePhoto}
                  alt={`${customer.name} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-400"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{customer.name}</h3>
              <p className="text-xs text-text-tertiary">{customer.email}</p>
              <p className="text-xs text-text-tertiary">{customer.phone}</p>
              <div className="mt-1.5 inline-flex rounded-full border border-border-main bg-surface-secondary px-3 py-0.5 text-[10px] font-medium text-text-secondary">
                Registered: {customer.createdAt} · {customer.branch}
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                First Name
              </p>
              <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                {customer.firstName}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                Middle Name
              </p>
              <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                {customer.middleName || "—"}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                Last Name
              </p>
              <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                {customer.lastName}
              </div>
            </div>
          </div>

          {/* Address Fields */}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                Street / Subdivision / Compound
              </p>
              <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                {customer.street}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  Barangay / District / Locality
                </p>
                <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                  {customer.barangay}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  City / Municipality
                </p>
                <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                  {customer.city}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  Province
                </p>
                <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                  {customer.province}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  Contact No.
                </p>
                <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
                  {customer.phone}
                </div>
              </div>
            </div>
          </div>

          {/* ID */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
              ID Presented
            </p>
            <div className="rounded-md border border-border-main bg-surface-secondary px-3 py-2.5 text-sm text-text-primary">
              {customer.idType} — {customer.idNumber}
            </div>
          </div>

          {/* Verification Photos */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
              Verification Photos
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-main bg-surface-secondary">
                  {customer.idFrontPhoto ? (
                    <img
                      src={customer.idFrontPhoto}
                      alt="ID Front View"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    cameraIcon
                  )}
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  Front View
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-main bg-surface-secondary">
                  {customer.idBackPhoto ? (
                    <img
                      src={customer.idBackPhoto}
                      alt="Serial No / ID"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    cameraIcon
                  )}
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  Serial No / ID
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-main px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-main px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
