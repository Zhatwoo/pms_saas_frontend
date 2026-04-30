"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RequestCustomerEditModal } from "@/components/shared/RequestCustomerEditModal";
import { PhilippineAddressFields } from "@/components/shared/philippine-address-fields";
import { updateCustomer } from "@/lib/api";
import type { Role } from "@/types";
import type { CustomerDetail } from "@/app/(pages)/customers/view_user/_components/types";

type ReviewContext = {
  logId: string;
  field: string | null;
  notes: string;
  requestingEmployeeId?: string;
};

interface ViewCustomerModalProps {
  customer: CustomerDetail;
  onClose: () => void;
  userRole?: Role;
  initialAction?: "edit" | "request" | null;
  onCustomerRefresh?: () => Promise<void> | void;
  requestingEmployeeId?: string;
  reviewContext?: ReviewContext;
}

type PreviewState = {
  src: string;
  title: string;
};

const overlayClass =
  "fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-md";

const modalClass =
  "w-[95vw] max-w-6xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl anim-modal-enter md:w-[90vw]";

const cardClass =
  "rounded-[1.5rem] border border-border-main bg-surface-secondary/90 p-5 shadow-sm backdrop-blur";

const isVisualUrl = (value: string | null | undefined) =>
  Boolean(value) && (/^https?:\/\//i.test(value as string) || /^data:image\//i.test(value as string));

function isKnownNoId(value: string) {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "n/a" || normalized === "no id / none" || normalized === "-";
}

export function resolveCustomerPrimaryVisual(customer: Pick<CustomerDetail, "idType" | "profilePhoto" | "idFrontPhoto" | "idBackPhoto">) {
  const hasIdPresented = !isKnownNoId(customer.idType);
  if (hasIdPresented) {
    return customer.idFrontPhoto || customer.profilePhoto || customer.idBackPhoto || null;
  }
  return customer.profilePhoto || customer.idFrontPhoto || customer.idBackPhoto || null;
}

function formatMatchLabel(customer: CustomerDetail) {
  const matchCount = customer.matchingCustomerCount || 0;
  const branchCount = customer.matchingBranchCount || 0;
  if (matchCount <= 1) return null;
  return `${matchCount} customer records matched across ${branchCount || 1} branch${(branchCount || 1) === 1 ? "" : "es"}. Verify spelling before reusing this profile.`;
}

function PreviewModal({ src, title, onClose }: PreviewState & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <div className="anim-modal-enter relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Identity Preview</p>
            <h3 className="mt-1 text-lg font-black text-text-primary">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-hover" aria-label="Close image preview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className="flex max-h-[calc(90vh-72px)] items-center justify-center bg-zinc-950 p-4">
          <img src={src} alt={title} className="max-h-[calc(90vh-120px)] w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

function PhotoTile({ title, src, onOpen, emptyLabel }: { title: string; src: string | null | undefined; onOpen: (src: string, title: string) => void; emptyLabel: string }) {
  const hasImage = isVisualUrl(src);
  return (
    <div className="rounded-[1.25rem] border border-border-main bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">{title}</p>
        {hasImage && src && (
          <button type="button" onClick={() => onOpen(src, title)} className="rounded-full border border-border-main bg-surface-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary transition-colors hover:bg-surface-hover">
            Expand
          </button>
        )}
      </div>
      <button type="button" onClick={() => { if (src) onOpen(src, title); }} className={`mt-3 group flex min-h-[13rem] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-main bg-gradient-to-br from-surface to-surface-secondary transition-transform duration-300 ${hasImage ? "hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default"}`}>
        {hasImage && src ? (
          <img src={src} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">{emptyLabel}</p>
              <p className="mt-1 text-xs text-text-tertiary">No file available for preview.</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

export function ViewCustomerModal({
  customer,
  onClose,
  userRole,
  initialAction,
  onCustomerRefresh,
  requestingEmployeeId,
  reviewContext,
}: ViewCustomerModalProps) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const appliedInitialAction = useRef(false);

  const hasIdPresented = !isKnownNoId(customer.idType);
  const hasIdentityPhotos = Boolean(customer.idFrontPhoto || customer.idBackPhoto);
  const matchWarning = formatMatchLabel(customer);
  const canEdit = userRole === "admin" || userRole === "super_admin";
  const canRequestEdit = userRole === "employee";
  const showIdGallery = hasIdPresented && hasIdentityPhotos;
  const primaryVisual = resolveCustomerPrimaryVisual(customer);
  const highlightedField = reviewContext?.field ?? null;
  const reviewNotes = reviewContext?.notes.trim() || "";
  const highlightedAddressField =
    highlightedField === "address" ||
    highlightedField === "barangay" ||
    highlightedField === "city" ||
    highlightedField === "region"
      ? highlightedField
      : null;

  // Inline edit form state — address is street-only, strip old concatenated parts
  function extractStreet(fullAddress: string, barangay: string, city: string, region: string): string {
    // If address contains commas and matches the old concatenated pattern, take only the first segment
    const parts = fullAddress.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) return fullAddress;
    // Check if later parts match known barangay/city/region values — if so it's the old format
    const knownParts = [barangay, city, region].filter(Boolean).map((p) => p.toLowerCase());
    const hasOldFormat = parts.slice(1).some((p) => knownParts.some((k) => p.toLowerCase().includes(k)));
    return hasOldFormat ? parts[0] : fullAddress;
  }

  const [fields, setFields] = useState({
    full_name: customer.name,
    contact_number: customer.phone !== "N/A" ? customer.phone : "",
    email: customer.email !== "N/A" ? customer.email : "",
    address: extractStreet(customer.address, customer.barangay, customer.city, customer.region),
    barangay: customer.barangay,
    city: customer.city,
    region: customer.region,
  });

  // Reset form + editing state when customer changes
  useEffect(() => {
    setIsEditing(false);
    setIsRequestOpen(false);
    setPreview(null);
    appliedInitialAction.current = false;
    setFields({
      full_name: customer.name,
      contact_number: customer.phone !== "N/A" ? customer.phone : "",
      email: customer.email !== "N/A" ? customer.email : "",
      address: extractStreet(customer.address, customer.barangay, customer.city, customer.region),
      barangay: customer.barangay,
      city: customer.city,
      region: customer.region,
    });
  }, [customer.id, customer.name, customer.phone, customer.email, customer.address, customer.barangay, customer.city, customer.region]);

  useEffect(() => {
    if (appliedInitialAction.current || !initialAction || !userRole) return;
    if (initialAction === "edit" && canEdit) {
      setIsEditing(true);
      appliedInitialAction.current = true;
      return;
    }
    if (initialAction === "request" && canRequestEdit) {
      setIsRequestOpen(true);
      appliedInitialAction.current = true;
      return;
    }
    appliedInitialAction.current = true;
  }, [canEdit, canRequestEdit, initialAction, userRole]);

  useEffect(() => {
    if (!reviewContext) return;
    setIsEditing(true);
    appliedInitialAction.current = true;
  }, [reviewContext]);

  const isDirty =
    fields.full_name !== customer.name ||
    fields.contact_number !== (customer.phone !== "N/A" ? customer.phone : "") ||
    fields.email !== (customer.email !== "N/A" ? customer.email : "") ||
    fields.address !== extractStreet(customer.address, customer.barangay, customer.city, customer.region) ||
    fields.barangay !== customer.barangay ||
    fields.city !== customer.city ||
    fields.region !== customer.region;

  function handleCancel() {
    setFields({
      full_name: customer.name,
      contact_number: customer.phone !== "N/A" ? customer.phone : "",
      email: customer.email !== "N/A" ? customer.email : "",
      address: extractStreet(customer.address, customer.barangay, customer.city, customer.region),
      barangay: customer.barangay,
      city: customer.city,
      region: customer.region,
    });
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateCustomer(customer.id, {
        full_name: fields.full_name.trim(),
        contact_number: fields.contact_number.trim(),
        email: fields.email.trim(),
        address: fields.address.trim(),
        barangay: fields.barangay.trim(),
        city: fields.city.trim(),
        region: fields.region.trim(),
        ...(reviewContext?.logId ? { logId: reviewContext.logId } : {}),
        ...(requestingEmployeeId ? { requestingEmployeeId } : {}),
      });
      toast.success("Customer profile updated.");
      setIsEditing(false);
      await Promise.resolve(onCustomerRefresh?.());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  function setField(key: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <div className={overlayClass} onClick={onClose}>
        <div className={modalClass} onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
            <div className="relative flex items-start justify-center">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/90">Customer Profile</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">{customer.name}</h2>
                <p className="mt-1 text-sm text-emerald-50/80">{customer.branch} · Registered {customer.createdAt}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close view customer modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="grid gap-6 px-6 py-6 xl:grid-cols-[1.02fr_0.98fr]">

            {/* Left column */}
            <div className="space-y-5">
              <div className={cardClass}>
                <div className="flex flex-col items-center text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Profile Overview</p>
                  <h3 className="mt-1 text-xl font-black text-text-primary">{customer.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{customer.email}</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SummaryPill label="Contact" value={customer.phone} />
                  <SummaryPill label="Branch" value={customer.branch} />
                  <SummaryPill label="Registered" value={customer.createdAt} />
                  <SummaryPill label="ID Presented" value={customer.idType} />
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex flex-col items-center text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Identity Media</p>
                  <h3 className="mt-1 text-lg font-black text-text-primary">{showIdGallery ? "ID front and back" : "Captured image"}</h3>
                  <span className="mt-1 inline-block rounded-full border border-border-main bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                    {showIdGallery ? "Preview ready" : "Profile image"}
                  </span>
                </div>

                {showIdGallery ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <PhotoTile title="Front ID" src={customer.idFrontPhoto} onOpen={(src, title) => setPreview({ src, title })} emptyLabel="Front ID photo" />
                    <PhotoTile title="Back ID" src={customer.idBackPhoto} onOpen={(src, title) => setPreview({ src, title })} emptyLabel="Back ID photo" />
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-border-main bg-surface shadow-sm">
                    <button type="button" onClick={() => { if (primaryVisual) setPreview({ src: primaryVisual, title: "Captured image" }); }} className="group relative flex min-h-[18rem] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-surface to-surface-secondary">
                      {primaryVisual ? (
                        <>
                          <img src={primaryVisual} alt={`${customer.name} profile image`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">Expand</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-6 text-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Captured image required</p>
                            <p className="mt-1 text-xs text-text-tertiary">No ID photos are available, but the employee-captured profile image should display here.</p>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div className={cardClass}>
                <div className="flex flex-col items-center text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Customer Profile</p>
                  <h3 className="mt-1 text-lg font-black text-text-primary">Record details</h3>
                </div>

                {reviewNotes && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Employee Note</p>
                        <p className="mt-1 text-sm leading-6 text-amber-950">{reviewNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fields */}
                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <EditableField label="Full Name" value={fields.full_name} editing={isEditing} highlighted={highlightedField === "full_name"} onChange={(v) => setField("full_name", v)} />
                    <EditableField label="Contact Number" value={fields.contact_number} editing={isEditing} highlighted={highlightedField === "contact_number"} onChange={(v) => setField("contact_number", v)} />
                    <EditableField label="Email Address" value={fields.email} editing={isEditing} highlighted={highlightedField === "email"} onChange={(v) => setField("email", v)} />
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Customer ID</p>
                      <div className="rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words">{customer.id || "—"}</div>
                    </div>
                  </div>

                  {isEditing ? (
                    <PhilippineAddressFields
                      value={{
                        address: fields.address,
                        barangay: fields.barangay,
                        city: fields.city,
                        region: fields.region,
                      }}
                      highlightedField={highlightedAddressField}
                      onFieldChange={(field, val) => setField(field, val)}
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Address</p>
                        <div className="min-h-[3.5rem] rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words whitespace-pre-line">
                          {[fields.address, fields.barangay, fields.city, fields.region].filter(Boolean).join(", ") || "—"}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Barangay</p>
                        <div className="rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words">{fields.barangay || "—"}</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">City / Municipality</p>
                        <div className="rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words">{fields.city || "—"}</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Region</p>
                        <div className="rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words">{fields.region || "—"}</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Branch Reference</p>
                        <div className="rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words">{customer.branch || "—"}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom-right action buttons — admin only */}
                {canEdit && (
                  <div className="mt-5 flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={handleCancel} disabled={isSaving} className="rounded-xl border border-border-main px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50">
                          Cancel
                        </button>
                        {isDirty && (
                          <button type="button" onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition-colors hover:bg-emerald-100 disabled:opacity-50">
                            {isSaving ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent" />
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                            )}
                            Save Changes
                          </button>
                        )}
                      </>
                    ) : (
                      <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition-colors hover:bg-emerald-100">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4-10 10H8v-4L18 2z" /><path d="M13 6 18 11" /></svg>
                        Edit Profile
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <p className="text-center text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">Profile Guidance</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Use the exact full name spelling when searching or linking a customer. This profile will combine transactions only when the match is deliberate and verified.
                </p>
                {matchWarning && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{matchWarning}</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          {canRequestEdit && (
            <div className="border-t border-border-main px-6 py-4 flex justify-end bg-surface">
              <button
                type="button"
                onClick={() => setIsRequestOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition-colors hover:bg-emerald-100"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Request Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <PreviewModal src={preview.src} title={preview.title} onClose={() => setPreview(null)} />
      )}

      {isRequestOpen && (
        <RequestCustomerEditModal
          customerId={customer.id}
          customerName={customer.name}
          isOpen={isRequestOpen}
          onClose={() => setIsRequestOpen(false)}
        />
      )}
    </>
  );
}

function EditableField({
  label,
  value,
  editing,
  highlighted = false,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  highlighted?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">{label}</p>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-2xl border bg-input-bg px-3 py-2.5 text-sm font-semibold text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 ${highlighted ? "border-amber-400 ring-2 ring-amber-400/20" : "border-input-border"}`}
        />
      ) : (
        <div className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold text-text-primary break-words ${highlighted ? "border-amber-400 bg-amber-50" : "border-border-main bg-surface"}`}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value || "—"}</p>
    </div>
  );
}
