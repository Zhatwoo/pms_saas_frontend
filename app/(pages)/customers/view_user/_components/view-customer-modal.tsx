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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const expandIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6" />
    <path d="M21 3l-7 7" />
    <path d="M9 21H3v-6" />
    <path d="M3 21l7-7" />
  </svg>
);

function isImageUrl(value: string | null | undefined) {
  return Boolean(value) && (/^https?:\/\//i.test(value as string) || /^data:image\//i.test(value as string));
}

function formatMatchLabel(customer: CustomerDetail) {
  const matchCount = customer.matchingCustomerCount || 0;
  const branchCount = customer.matchingBranchCount || 0;

  if (matchCount <= 1) {
    return null;
  }

  return `${matchCount} customer records matched across ${branchCount || 1} branch${(branchCount || 1) === 1 ? "" : "es"}. Verify spelling before reusing this profile.`;
}

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600">Identity Preview</p>
            <h3 className="mt-1 text-lg font-black text-text-primary">{alt}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-hover"
            aria-label="Close image preview"
          >
            {closeIcon}
          </button>
        </div>

        <div className="flex max-h-[calc(90vh-70px)] items-center justify-center bg-zinc-950 p-4">
          <img src={src} alt={alt} className="max-h-[calc(90vh-110px)] w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

interface ViewCustomerModalProps {
  customer: CustomerDetail;
  onClose: () => void;
}

export function ViewCustomerModal({ customer, onClose }: ViewCustomerModalProps) {
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);
  const primaryImage = customer.idType !== "No ID / None"
    ? customer.idFrontPhoto || customer.profilePhoto || null
    : customer.profilePhoto || customer.idFrontPhoto || null;

  const matchWarning = formatMatchLabel(customer);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90">Customer Profile</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">{customer.name}</h2>
                <p className="mt-1 text-sm text-emerald-50/85">One customer profile with branch-aware transaction history.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close view customer modal"
              >
                {closeIcon}
              </button>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                <div className="rounded-[1.5rem] border border-border-main bg-surface-secondary p-4 shadow-sm">
                  <div className="overflow-hidden rounded-[1.25rem] border border-border-main bg-zinc-50">
                    <button
                      type="button"
                      onClick={() => primaryImage && setPreview({ src: primaryImage, title: `${customer.name} identity image` })}
                      className="group relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50"
                    >
                      {primaryImage && isImageUrl(primaryImage) ? (
                        <>
                          <img src={primaryImage} alt={`${customer.name} primary identity`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                            {expandIcon}
                            Expand
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 px-6 text-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">No primary image available</p>
                            <p className="mt-1 text-xs text-text-tertiary">Add a profile photo or ID photo to improve recognition.</p>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Registered</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">{customer.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Branch</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">{customer.branch}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">ID Presented</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">{customer.idType} {customer.idNumber && customer.idNumber !== "-" ? `• ${customer.idNumber}` : ""}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-border-main bg-surface p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50 shadow-sm">
                      {primaryImage && isImageUrl(primaryImage) ? (
                        <button type="button" onClick={() => setPreview({ src: primaryImage, title: `${customer.name} identity image` })} className="h-full w-full">
                          <img src={primaryImage} alt={`${customer.name} avatar`} className="h-full w-full object-cover" />
                        </button>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xl font-black text-text-primary">{customer.name}</h3>
                      <p className="truncate text-sm text-text-tertiary">{customer.email}</p>
                      <p className="truncate text-sm text-text-tertiary">{customer.phone}</p>
                    </div>
                  </div>

                  {matchWarning && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Name verification required</p>
                      <p className="mt-1 text-sm font-medium">{matchWarning}</p>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="First Name" value={customer.firstName || "—"} />
                    <Field label="Middle Name" value={customer.middleName || "—"} />
                    <Field label="Last Name" value={customer.lastName || "—"} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Street / Subdivision / Compound" value={customer.street} wide />
                    <Field label="Barangay / District / Locality" value={customer.barangay} />
                    <Field label="City / Municipality" value={customer.city} />
                    <Field label="Province" value={customer.province} />
                    <Field label="Contact No." value={customer.phone} />
                    <Field label="Email Address" value={customer.email} />
                  </div>

                  <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Record Summary</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <SummaryChip label="Profile Count" value={`${customer.matchingCustomerCount || 1}`} />
                      <SummaryChip label="Branch Matches" value={`${customer.matchingBranchCount || 1}`} />
                      <SummaryChip label="Account Status" value={customer.idType === "No ID / None" ? "Photo Only" : "Verified"} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border-main bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-text-primary">Verification Photos</h3>
                    <p className="mt-1 text-xs text-text-tertiary">Click any image to expand it.</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <PhotoCard
                    title="Front ID / Primary Photo"
                    src={customer.idFrontPhoto || customer.profilePhoto}
                    onOpen={(src) => setPreview({ src, title: `${customer.name} front identity photo` })}
                  />
                  <PhotoCard
                    title="Back ID Photo"
                    src={customer.idBackPhoto}
                    onOpen={(src) => setPreview({ src, title: `${customer.name} back identity photo` })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-border-main bg-surface-secondary p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Customer Details</p>
                <dl className="mt-4 space-y-4">
                  <DetailRow label="Customer ID" value={customer.id} />
                  <DetailRow label="Name" value={customer.name} />
                  <DetailRow label="Address" value={customer.address} />
                  <DetailRow label="Branch Reference" value={customer.branch} />
                  <DetailRow label="Matched Records" value={`${customer.matchingCustomerCount || 1}`} />
                </dl>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">Profile Guidance</p>
                <p className="mt-2 text-sm font-medium leading-6">
                  Use the exact full name spelling when searching or linking a customer. This profile will combine transactions only when the name match is deliberate and verified.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border-main bg-surface p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Quick Stats</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <StatCard label="Profile Photo" value={customer.profilePhoto ? "Available" : "None"} />
                  <StatCard label="Front ID Photo" value={customer.idFrontPhoto ? "Available" : "None"} />
                  <StatCard label="Back ID Photo" value={customer.idBackPhoto ? "Available" : "None"} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border-main px-6 py-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border-main px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-text-tertiary">{label}</p>
      <div className="rounded-2xl border border-border-main bg-surface-secondary px-3 py-2.5 text-sm font-medium text-text-primary">
        {value || "—"}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-tertiary">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-text-primary break-words">{value || "—"}</dd>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-black text-text-primary">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface-secondary px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function PhotoCard({
  title,
  src,
  onOpen,
}: {
  title: string;
  src: string | null | undefined;
  onOpen: (src: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-tertiary">{title}</p>
        {src && isImageUrl(src) && (
          <button
            type="button"
            onClick={() => onOpen(src)}
            className="rounded-full border border-border-main bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Open
          </button>
        )}
      </div>
      <div className="mt-3 flex min-h-[14rem] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-main bg-surface">
        {src && isImageUrl(src) ? (
          <button type="button" onClick={() => onOpen(src)} className="h-full w-full">
            <img src={src} alt={title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.01]" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            {cameraIcon}
            <p className="text-xs font-medium text-text-tertiary">No image saved</p>
          </div>
        )}
      </div>
    </div>
  );
}