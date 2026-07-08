"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { LoadingSpinnerLabel } from "./loading-spinner-label";

export interface QrReplacementReviewDetails {
  itemId?: string;
  itemName?: string;
  pawnedItemId?: string;
  branch?: string;
  reason?: string;
  proofPhoto?: string | null;
  message?: string;
  requestStatus?: "pending" | "approved" | "rejected";
  reviewNote?: string;
  reviewedAt?: string;
  qrCode?: string;
}

interface QrReplacementReviewModalProps {
  isOpen: boolean;
  requestId: string | null;
  branchName?: string;
  requestedBy?: string;
  requestedByRole?: string;
  requestedAt?: string;
  details: QrReplacementReviewDetails;
  qrSize?: "small" | "large";
  onClose: () => void;
  onSuccess: () => void;
  onPrint: (itemId: string, qrCode?: string) => void;
}

export function QrReplacementReviewModal({
  isOpen,
  requestId,
  branchName,
  requestedBy,
  requestedByRole,
  requestedAt,
  details,
  qrSize = "small",
  onClose,
  onSuccess,
  onPrint,
}: QrReplacementReviewModalProps) {
  const [rejectionNote, setRejectionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [proofExpanded, setProofExpanded] = useState(false);

  const isPending = details.requestStatus === "pending";
  const isApproved = details.requestStatus === "approved";
  const isRejected = details.requestStatus === "rejected";

  useEffect(() => {
    if (!isOpen) {
      setRejectionNote("");
      setShowRejectConfirm(false);
      setProofExpanded(false);
    }
  }, [isOpen, requestId]);

  if (!isOpen || !requestId) return null;

  const handleReview = async (decision: "approve" | "reject") => {
    if (decision === "reject" && !rejectionNote.trim()) {
      toast.error("Please provide a note explaining why this request is rejected.");
      return;
    }

    setIsProcessing(true);
    try {
      await api.post(`/inventory/qr-replacement/${requestId}/review`, {
        decision,
        ...(decision === "reject" ? { note: rejectionNote.trim() } : {}),
      });
      toast.success(`Request ${decision === "approve" ? "approved" : "rejected"} successfully.`);

      if (decision === "approve" && details.itemId) {
        onPrint(details.itemId, details.qrCode);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process request.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setShowRejectConfirm(false);
    }
  };

  const formattedDate = requestedAt
    ? new Date(requestedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-review-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border-main bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-emerald-950 px-6 py-4">
          <div>
            <h2 id="qr-review-title" className="text-lg font-bold text-amber-400">
              Review QR Replacement Request
            </h2>
            <p className="mt-0.5 text-xs text-emerald-100/80">
              Verify the proof photo and details before approving or rejecting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-emerald-100/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Item ID" value={details.itemId} highlight />
            <InfoRow label="Item Name" value={details.itemName} />
            <InfoRow label="Branch" value={branchName || details.branch} />
            <InfoRow label="Reason" value={details.reason?.toUpperCase()} />
            <InfoRow label="Requested By" value={requestedBy} />
            <InfoRow label="Role" value={requestedByRole?.toUpperCase()} />
            <InfoRow label="Date Requested" value={formattedDate} className="sm:col-span-2" />
          </div>

          {details.message && (
            <div className="rounded-lg border border-border-subtle bg-surface-secondary p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Request Message
              </p>
              <p className="text-sm text-text-primary">{details.message}</p>
            </div>
          )}

          <div className="rounded-lg border border-border-subtle bg-surface-secondary p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Proof Photo
            </p>
            {details.proofPhoto ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setProofExpanded((prev) => !prev)}
                  className="block w-full overflow-hidden rounded-lg border border-border-main bg-black/5 transition-transform hover:scale-[1.01]"
                >
                  <img
                    src={details.proofPhoto}
                    alt="QR replacement proof"
                    className={`mx-auto w-full object-contain transition-all ${
                      proofExpanded ? "max-h-[60vh]" : "max-h-56"
                    }`}
                  />
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProofExpanded((prev) => !prev)}
                    className="rounded-lg border border-border-main bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-text-secondary hover:bg-surface-hover"
                  >
                    {proofExpanded ? "Collapse" : "Enlarge"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(details.proofPhoto!, "_blank")}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    Open Full Size
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-text-tertiary">No proof photo attached.</p>
            )}
          </div>

          {isRejected && details.reviewNote && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Rejection Note
              </p>
              <p className="text-sm text-rose-900 dark:text-rose-100">{details.reviewNote}</p>
            </div>
          )}

          {isPending && (
            <div className="rounded-lg border border-border-subtle bg-surface-secondary p-4">
              <label
                htmlFor="qr-rejection-note"
                className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary"
              >
                Rejection Note <span className="text-rose-500">*</span>
                <span className="ml-1 font-medium normal-case text-text-tertiary">
                  (required if rejecting)
                </span>
              </label>
              <textarea
                id="qr-rejection-note"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Explain why this replacement request is being rejected..."
                rows={3}
                disabled={isProcessing}
                className="w-full resize-none rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-rose-500 disabled:opacity-50"
              />
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle bg-surface-secondary px-6 py-4">
          {isPending ? (
            showRejectConfirm ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">
                  Reject this request? The requester will see your note.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setShowRejectConfirm(false)}
                    className="rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wide text-text-secondary hover:bg-surface-hover disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing || !rejectionNote.trim()}
                    onClick={() => handleReview("reject")}
                    className="rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isProcessing ? <LoadingSpinnerLabel text="Rejecting..." /> : "Confirm Reject"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onClose}
                  className="rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wide text-text-secondary hover:bg-surface-hover disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    if (!rejectionNote.trim()) {
                      toast.error("Please provide a rejection note first.");
                      return;
                    }
                    setShowRejectConfirm(true);
                  }}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleReview("approve")}
                  className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isProcessing ? <LoadingSpinnerLabel text="Approving..." /> : "Approve & Print QR"}
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                  isApproved
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {details.requestStatus}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wide text-text-secondary hover:bg-surface-hover"
                >
                  Close
                </button>
                {isApproved && details.itemId && (
                  <button
                    type="button"
                    onClick={() => onPrint(details.itemId!, details.qrCode)}
                    className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
                  >
                    Print QR ({qrSize})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  className = "",
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          highlight ? "text-emerald-600 dark:text-emerald-400" : "text-text-primary"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
