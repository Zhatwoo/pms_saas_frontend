"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditCustomerInfoModal, type CustomerUpdatePayload } from "@/components/shared/EditCustomerInfoModal";
import { RequestCustomerEditModal } from "@/components/shared/RequestCustomerEditModal";
import { updateCustomer } from "@/lib/api";
import type { Role } from "@/types";
import type { CustomerDetail } from "@/app/(pages)/customers/view_user/_components/types";

interface ViewCustomerModalProps {
  customer: CustomerDetail;
  onClose: () => void;
  userRole?: Role;
  initialAction?: "edit" | "request" | null;
  onCustomerRefresh?: () => Promise<void> | void;
}

type PreviewState = {
  src: string;
  title: string;
};

const overlayClass =
  "fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-md";

const modalClass =
  "w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl anim-modal-enter";

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

  if (matchCount <= 1) {
    return null;
  }

  return `${matchCount} customer records matched across ${branchCount || 1} branch${(branchCount || 1) === 1 ? "" : "es"}. Verify spelling before reusing this profile.`;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "C";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">{label}</p>
      <div className="rounded-2xl border border-border-main bg-surface px-3 py-2.5 text-sm font-semibold text-text-primary break-words">
        {value || "—"}
      </div>
    </div>
  );
}

function PreviewModal({ src, title, onClose }: PreviewState & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <div className="anim-modal-enter relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Identity Preview</p>
            <h3 className="mt-1 text-lg font-black text-text-primary">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-hover"
            aria-label="Close image preview"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex max-h-[calc(90vh-72px)] items-center justify-center bg-zinc-950 p-4">
          <img src={src} alt={title} className="max-h-[calc(90vh-120px)] w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

function PhotoTile({
  title,
  src,
  onOpen,
  emptyLabel,
}: {
  title: string;
  src: string | null | undefined;
  onOpen: (src: string, title: string) => void;
  emptyLabel: string;
}) {
  const hasImage = isVisualUrl(src);

  return (
    <div className="rounded-[1.25rem] border border-border-main bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">{title}</p>
        {hasImage && src && (
          <button
            type="button"
            onClick={() => onOpen(src, title)}
            className="rounded-full border border-border-main bg-surface-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Expand
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (src) {
            onOpen(src, title);
          }
        }}
        className={`mt-3 group flex min-h-[13rem] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-main bg-gradient-to-br from-surface to-surface-secondary transition-transform duration-300 ${hasImage ? "hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default"}`}
      >
        {hasImage && src ? (
          <img
            src={src}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
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
}: ViewCustomerModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const appliedInitialAction = useRef(false);

  const hasIdPresented = !isKnownNoId(customer.idType);
  const hasIdentityPhotos = Boolean(customer.idFrontPhoto || customer.idBackPhoto);
  const matchWarning = formatMatchLabel(customer);
  const canEdit = userRole === "admin";
  const canRequestEdit = userRole === "employee";

  const editableCustomer = useMemo(
    () => ({
      id: customer.id,
      full_name: customer.name,
      address: customer.address,
      barangay: customer.barangay,
      city: customer.city,
      province: customer.province,
      contact_number: customer.phone && customer.phone !== "N/A" ? customer.phone : "",
      email: customer.email && customer.email !== "N/A" ? customer.email : "",
      id_presented: hasIdPresented ? customer.idType : null,
    }),
    [customer, hasIdPresented],
  );

  useEffect(() => {
    setIsEditOpen(false);
    setIsRequestOpen(false);
    setPreview(null);
    appliedInitialAction.current = false;
  }, [customer.id]);

  useEffect(() => {
    if (appliedInitialAction.current || !initialAction || !userRole) {
      return;
    }

    if (initialAction === "edit" && canEdit) {
      setIsEditOpen(true);
      appliedInitialAction.current = true;
      return;
    }

    if (initialAction === "request" && canRequestEdit) {
      setIsRequestOpen(true);
      appliedInitialAction.current = true;
      return;
    }

    if ((initialAction === "edit" && !canEdit) || (initialAction === "request" && !canRequestEdit)) {
      appliedInitialAction.current = true;
    }
  }, [canEdit, canRequestEdit, initialAction, userRole]);

  async function handleSave(updated: CustomerUpdatePayload) {
    await updateCustomer(customer.id, updated);
    toast.success("Customer profile updated.");
    await Promise.resolve(onCustomerRefresh?.());
  }

  const showIdGallery = hasIdPresented && hasIdentityPhotos;
  const primaryVisual = resolveCustomerPrimaryVisual(customer);
  const recordPath = pathname?.startsWith("/admin")
    ? "/admin/customers/view_user"
    : pathname?.startsWith("/employee")
      ? "/employee/customers/view_user"
      : "/customers/view_user";

  return (
    <>
      <div className={overlayClass} onClick={onClose}>
        <div className={modalClass} onClick={(event) => event.stopPropagation()}>
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/90">
                  Customer Profile
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">{customer.name}</h2>
                <p className="mt-1 text-sm text-emerald-50/80">
                  {customer.branch} · Registered {customer.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close view customer modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-5">
              <div className={cardClass}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
                      Profile Overview
                    </p>
                    <h3 className="mt-1 text-xl font-black text-text-primary">{customer.name}</h3>
                    <p className="mt-1 text-sm text-text-secondary">{customer.email}</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 text-lg font-black text-emerald-700 shadow-sm">
                    {primaryVisual ? (
                      <img src={primaryVisual} alt={`${customer.name} profile`} className="h-full w-full object-cover" />
                    ) : (
                      <span>{initialsFromName(customer.name)}</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SummaryPill label="Contact" value={customer.phone} />
                  <SummaryPill label="Branch" value={customer.branch} />
                  <SummaryPill label="Registered" value={customer.createdAt} />
                  <SummaryPill label="ID Presented" value={customer.idType} />
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
                      Identity Media
                    </p>
                    <h3 className="mt-1 text-lg font-black text-text-primary">
                      {showIdGallery ? "ID front and back" : "Captured image"}
                    </h3>
                  </div>
                  <span className="rounded-full border border-border-main bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                      {showIdGallery ? "Preview ready" : "Profile image"}
                  </span>
                </div>

                  {showIdGallery ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <PhotoTile
                      title="Front ID"
                      src={customer.idFrontPhoto}
                      onOpen={(src, title) => setPreview({ src, title })}
                      emptyLabel="Front ID photo"
                    />
                    <PhotoTile
                      title="Back ID"
                      src={customer.idBackPhoto}
                      onOpen={(src, title) => setPreview({ src, title })}
                      emptyLabel="Back ID photo"
                    />
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-border-main bg-surface shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (primaryVisual) {
                          setPreview({ src: primaryVisual, title: "Captured image" });
                        }
                      }}
                      className="group relative flex min-h-[18rem] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-surface to-surface-secondary"
                    >
                      {primaryVisual ? (
                        <>
                          <img
                            src={primaryVisual}
                            alt={`${customer.name} profile image`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                            Expand
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-6 text-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
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

            <div className="space-y-5">
              <div className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
                      Customer Profile
                    </p>
                    <h3 className="mt-1 text-lg font-black text-text-primary">Record details</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition-colors hover:bg-emerald-100"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m18 2 4 4-10 10H8v-4L18 2z" />
                          <path d="M13 6 18 11" />
                        </svg>
                        Edit
                      </button>
                    )}
                    {canRequestEdit && (
                      <button
                        type="button"
                        onClick={() => setIsRequestOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-border-main bg-surface px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-text-secondary transition-colors hover:bg-surface-hover"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        Request Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <DetailRow label="Full Name" value={customer.name} />
                  <DetailRow label="Contact Number" value={customer.phone} />
                  <DetailRow label="Email Address" value={customer.email} />
                  <DetailRow label="Customer ID" value={customer.id} />
                  <div className="md:col-span-2">
                    <DetailRow label="Address" value={customer.address} />
                  </div>
                  <DetailRow label="Barangay" value={customer.barangay} />
                  <DetailRow label="City / Municipality" value={customer.city} />
                  <DetailRow label="Province" value={customer.province} />
                  <DetailRow label="Branch Reference" value={customer.branch} />
                </div>
              </div>

              <div className={cardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">
                  Profile Guidance
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Use the exact full name spelling when searching or linking a customer. This profile will combine transactions only when the match is deliberate and verified.
                </p>
                {matchWarning && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {matchWarning}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border-main px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border-main px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => router.push(`${recordPath}?id=${encodeURIComponent(customer.id)}`)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                Open Full Record
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <PreviewModal src={preview.src} title={preview.title} onClose={() => setPreview(null)} />
      )}

      {isEditOpen && (
        <EditCustomerInfoModal
          customer={editableCustomer}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSave}
        />
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

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value || "—"}</p>
    </div>
  );
}
