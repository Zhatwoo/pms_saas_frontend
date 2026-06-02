"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { subscribeToPasswordRequestNotifications } from "@/lib/notification-stream";

type PasswordChangeRequest = {
  id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  isActivated?: boolean;
  createdAt: string;
  reviewNote?: string | null;
  requester?: {
    fullName?: string | null;
  } | null;
};

type ReviewModalState = {
  request: PasswordChangeRequest;
  decision: "approved" | "rejected";
};

function mapPasswordRequestError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Cannot POST /api/password-change-requests")) {
    return "Password request route is not available yet. Restart PMS_backend and try again.";
  }

  if (message.includes("Cannot GET /api/password-change-requests")) {
    return "Password request routes are missing in the running backend. Restart PMS_backend and refresh this page.";
  }

  if (message.includes("Cannot POST /api/password-change-requests/")) {
    return "Password activation route is not available yet. Restart PMS_backend and try again.";
  }

  if (message.includes("Current password is required")) {
    return "The running backend is still using the old password-request flow. Restart PMS_backend on port 4000 and refresh this page.";
  }

  return message || "Failed to submit password change request";
}

function PasswordField({
  label,
  value,
  visible,
  placeholder,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-input-border bg-input-bg px-3 pr-12 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeRequestCard() {
  const { user } = useAuth();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isPasswordSavedModalOpen, setIsPasswordSavedModalOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState<ReviewModalState | null>(null);
  const [reason, setReason] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [activationCurrentPassword, setActivationCurrentPassword] = useState("");
  const [activationNewPassword, setActivationNewPassword] = useState("");
  const [activationConfirmPassword, setActivationConfirmPassword] = useState("");
  const [showActivationCurrentPassword, setShowActivationCurrentPassword] = useState(false);
  const [showActivationNewPassword, setShowActivationNewPassword] = useState(false);
  const [showActivationConfirmPassword, setShowActivationConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mine, setMine] = useState<PasswordChangeRequest[]>([]);
  const [pending, setPending] = useState<PasswordChangeRequest[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const canRequest = user?.role === "employee" || user?.role === "admin";
  const canReview = user?.role === "admin" || user?.role === "super_admin";
  const approverLabel = useMemo(() => {
    if (user?.role === "employee") return "Branch Admin";
    if (user?.role === "admin") return "System Admin";
    return null;
  }, [user?.role]);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return;

    if (!options?.silent) {
      setIsLoading(true);
    }
    try {
      const jobs: Promise<unknown>[] = [];

      if (canRequest) {
        jobs.push(
          api.get<PasswordChangeRequest[]>("/password-change-requests/mine").then((rows) => {
            setMine(Array.isArray(rows) ? rows : []);
          }),
        );
      }

      if (canReview) {
        jobs.push(
          api.get<PasswordChangeRequest[]>("/password-change-requests/pending").then((rows) => {
            setPending(Array.isArray(rows) ? rows : []);
          }),
        );
      }

      await Promise.all(jobs);
    } catch (err) {
      setError(mapPasswordRequestError(err));
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [canRequest, canReview, user]);

  const loadDataRef = useRef(loadData);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return undefined;

    const unsubscribe = subscribeToPasswordRequestNotifications(() => {
      void loadDataRef.current({ silent: true });
    });
    const fallback = window.setInterval(() => {
      void loadDataRef.current({ silent: true });
    }, 30_000);

    return () => {
      unsubscribe();
      window.clearInterval(fallback);
    };
  }, [user]);

  const lastRequest = mine[0];
  const isActivationComplete =
    Boolean(lastRequest?.isActivated) ||
    (lastRequest?.reviewNote ?? "").toLowerCase().includes("password updated successfully");
  const hasOneTimeAccess = lastRequest?.status === "approved" && !isActivationComplete;

  const openChangePassword = () => {
    setError(null);
    setSuccess(null);
    if (hasOneTimeAccess) {
      setIsActivationModalOpen(true);
      return;
    }
    setIsRequestModalOpen(true);
  };

  const submitRequest = async () => {
    const trimmed = reason.trim();
    setError(null);
    setSuccess(null);

    if (trimmed.length < 10) {
      setError("Please provide at least 10 characters for the reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/password-change-requests", { reason: trimmed });
      setReason("");
      setIsRequestModalOpen(false);
      await loadData();
    } catch (err) {
      setError(mapPasswordRequestError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (request: PasswordChangeRequest, decision: "approved" | "rejected") => {
    setReviewModal({ request, decision });
    setReviewNote("");
    setError(null);
    setSuccess(null);
  };

  const closeReviewModal = () => {
    if (reviewingId) return;
    setReviewModal(null);
    setReviewNote("");
  };

  const reviewRequest = async () => {
    if (!reviewModal) return;

    setReviewingId(reviewModal.request.id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/password-change-requests/${reviewModal.request.id}/review`, {
        decision: reviewModal.decision,
        note: reviewNote.trim() || undefined,
      });
      setReviewModal(null);
      setReviewNote("");
      await loadData();
    } catch (err) {
      setError(mapPasswordRequestError(err));
    } finally {
      setReviewingId(null);
    }
  };

  const activateApprovedRequest = async () => {
    const trimmedCurrentPassword = activationCurrentPassword.trim();
    const trimmedNewPassword = activationNewPassword.trim();
    const trimmedConfirmPassword = activationConfirmPassword.trim();
    setError(null);
    setSuccess(null);

    if (!lastRequest || lastRequest.status !== "approved") {
      setError("No approved password request is ready to activate.");
      return;
    }

    if (trimmedCurrentPassword.length < 6) {
      setError("Current password must be at least 6 characters.");
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError("New password confirmation does not match.");
      return;
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setIsActivating(true);
    const authRefreshGraceUntil = Date.now() + 12_000;
    try {
      window.sessionStorage.setItem(
        "pms_auth_refresh_grace_until",
        String(authRefreshGraceUntil),
      );

      const result = await api.post<{ message?: string }>(
        `/password-change-requests/${lastRequest.id}/activate`,
        {
          currentPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
        },
        { suppressAuthExpired: true },
      );
      setActivationCurrentPassword("");
      setActivationNewPassword("");
      setActivationConfirmPassword("");
      setShowActivationCurrentPassword(false);
      setShowActivationNewPassword(false);
      setShowActivationConfirmPassword(false);
      setIsActivationModalOpen(false);
      setSuccess(result.message || "Password saved successfully.");
      setMine((previous) =>
        previous.map((request) =>
          request.id === lastRequest.id
            ? {
                ...request,
                isActivated: true,
                reviewNote: "Password updated successfully.",
              }
            : request,
        ),
      );
      setIsPasswordSavedModalOpen(true);
    } catch (err) {
      setError(mapPasswordRequestError(err));
    } finally {
      setIsActivating(false);
      window.setTimeout(() => {
        if (
          window.sessionStorage.getItem("pms_auth_refresh_grace_until") ===
          String(authRefreshGraceUntil)
        ) {
          window.sessionStorage.removeItem("pms_auth_refresh_grace_until");
        }
      }, 12_000);
    }
  };

  return (
    <>
      <button
        onClick={openChangePassword}
        disabled={!canRequest}
        className="mt-2 w-full rounded-lg border border-amber-200 bg-amber-100 py-2 text-[9px] font-bold uppercase tracking-wider text-amber-900 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
      >
        Change Password
      </button>

      {canRequest && (
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-left dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-400">Last Request Status</p>
          <p className="mt-1 text-[11px] font-semibold capitalize text-zinc-900 dark:text-zinc-100">
            {lastRequest?.status || "No requests yet"}
          </p>
          {lastRequest?.reviewNote && (
            <p className="mt-1 text-[10px] text-zinc-700 dark:text-zinc-400">{lastRequest.reviewNote}</p>
          )}
          {approverLabel && (
            <p className="mt-1 text-[9px] text-zinc-600 dark:text-zinc-500">Approval Route: {approverLabel}</p>
          )}
          {hasOneTimeAccess && (
            <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
              One-time password change access is approved. Click Change Password to use it.
            </p>
          )}
          {success && (
            <p className="mt-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">{success}</p>
          )}
        </div>
      )}

      {canReview && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-200">
              Password Approval Queue
            </h3>
            {isLoading && <span className="text-[9px] text-zinc-600 dark:text-zinc-400">Loading...</span>}
          </div>

          {pending.length === 0 ? (
            <p className="text-[10px] text-zinc-700 dark:text-zinc-400">No pending password requests.</p>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 5).map((request) => (
                <div key={request.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950/60">
                  <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                    {request.requester?.fullName || "User"}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-700 dark:text-zinc-300">{request.reason}</p>
                  <p className="mt-1 text-[9px] text-zinc-600 dark:text-zinc-500">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openReviewModal(request, "approved")}
                      disabled={reviewingId === request.id}
                      className="rounded-md bg-emerald-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openReviewModal(request, "rejected")}
                      disabled={reviewingId === request.id}
                      className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isRequestModalOpen && canRequest && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />

          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border-main bg-surface text-text-primary shadow-[0_30px_90px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.22),transparent_18%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
            <div className="relative px-5 py-6 sm:px-6 sm:py-7">
              <div className="mx-auto flex w-full flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.08)] dark:text-emerald-200">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 17.5A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5z" />
                    <path d="M12 11a2 2 0 0 1 2 2v2H10v-2a2 2 0 0 1 2-2z" />
                    <path d="M9 11V9a3 3 0 0 1 6 0v2" />
                  </svg>
                </div>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
                  Request Password Change
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-900 dark:text-zinc-300">
                  Provide a reason for this request. It will be sent to {approverLabel || "the assigned approver"} for review and approval.
                </p>
              </div>

              <div className="mt-5 border-t border-border-main pt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-300">
                  Reason for Password Change
                </label>
                <div className="relative">
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Example: I suspect my password was exposed and need immediate reset approval."
                    className="min-h-[140px] w-full rounded-lg border border-input-border bg-input-bg px-4 py-3 pr-14 text-sm leading-6 text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                  />
                  <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-zinc-900 dark:text-zinc-400">
                    {reason.length}/500
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-900 dark:text-zinc-400">Minimum 10 characters.</p>
                {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsRequestModalOpen(false);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg border border-border-main bg-surface px-5 py-2 text-xs font-bold text-zinc-900 transition-colors hover:bg-surface-hover disabled:opacity-60 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void submitRequest()}
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={closeReviewModal} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl">
            <div className={`h-1.5 ${reviewModal.decision === "approved" ? "bg-emerald-500" : "bg-red-500"}`} />
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary">
                Password Approval
              </p>
              <h3 className="mt-2 text-xl font-black text-text-primary">
                {reviewModal.decision === "approved" ? "Approve Request" : "Reject Request"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Add a note for {reviewModal.request.requester?.fullName || "the user"}. This message will be shown with the request result.
              </p>
              <div className="mt-4 rounded-lg border border-border-main bg-surface-subtle p-3">
                <p className="text-xs font-bold text-text-primary">
                  {reviewModal.request.requester?.fullName || "User"}
                </p>
                <p className="mt-1 text-xs text-text-secondary">{reviewModal.request.reason}</p>
              </div>
              <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                {reviewModal.decision === "approved" ? "Approval Note" : "Rejection Reason"}
              </label>
              <textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                maxLength={500}
                placeholder={reviewModal.decision === "approved" ? "Example: Approved for one-time password change access." : "Explain why this request is rejected."}
                className="mt-2 min-h-[120px] w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500"
              />
              {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeReviewModal}
                  disabled={Boolean(reviewingId)}
                  className="rounded-lg border border-border-main px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void reviewRequest()}
                  disabled={Boolean(reviewingId)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-60 ${reviewModal.decision === "approved" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {reviewingId ? "Saving..." : reviewModal.decision === "approved" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isActivationModalOpen && hasOneTimeAccess && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsActivationModalOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl">
            <div className="h-1.5 bg-emerald-500" />
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                One-Time Access
              </p>
              <h3 className="mt-2 text-xl font-black text-text-primary">Activate New Password</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Your password change was approved once. Enter your current password and your new password to use this approval.
              </p>

              <div className="mt-4 space-y-3">
                <PasswordField
                  label="Current Password"
                  value={activationCurrentPassword}
                  visible={showActivationCurrentPassword}
                  onToggle={() => setShowActivationCurrentPassword((value) => !value)}
                  onChange={setActivationCurrentPassword}
                  placeholder="Enter current password"
                />
                <PasswordField
                  label="New Password"
                  value={activationNewPassword}
                  visible={showActivationNewPassword}
                  onToggle={() => setShowActivationNewPassword((value) => !value)}
                  onChange={setActivationNewPassword}
                  placeholder="Enter new password"
                />
                <PasswordField
                  label="Confirm New Password"
                  value={activationConfirmPassword}
                  visible={showActivationConfirmPassword}
                  onToggle={() => setShowActivationConfirmPassword((value) => !value)}
                  onChange={setActivationConfirmPassword}
                  placeholder="Confirm new password"
                />
              </div>

              {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setIsActivationModalOpen(false)}
                  disabled={isActivating}
                  className="rounded-lg border border-border-main px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void activateApprovedRequest()}
                  disabled={isActivating}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {isActivating ? "Activating..." : "Use Approval"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPasswordSavedModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/30 bg-surface shadow-2xl">
            <div className="h-1.5 bg-emerald-500" />
            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-black text-text-primary">Password Saved</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Your password was updated successfully.
              </p>
              <button
                onClick={() => setIsPasswordSavedModalOpen(false)}
                className="mt-5 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
