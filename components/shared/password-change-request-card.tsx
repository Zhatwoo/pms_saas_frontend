"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

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

export function PasswordChangeRequestCard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState("");
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

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

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
      await api.post("/password-change-requests", {
        reason: trimmed,
      });
      setReason("");
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(mapPasswordRequestError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewRequest = async (id: string, decision: "approved" | "rejected") => {
    const note = window.prompt(
      decision === "approved" ? "Optional approval note:" : "Optional rejection reason:",
      "",
    );

    setReviewingId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/password-change-requests/${id}/review`, {
        decision,
        note: note?.trim() || undefined,
      });
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
    try {
      await api.post(`/password-change-requests/${lastRequest.id}/activate`, {
        currentPassword: trimmedCurrentPassword,
        newPassword: trimmedNewPassword,
      });
      setActivationCurrentPassword("");
      setActivationNewPassword("");
      setActivationConfirmPassword("");
      setShowActivationCurrentPassword(false);
      setShowActivationNewPassword(false);
      setShowActivationConfirmPassword(false);
      setSuccess("Password updated. Use the new password on your next login.");
      await loadData();
    } catch (err) {
      setError(mapPasswordRequestError(err));
    } finally {
      setIsActivating(false);
    }
  };

  const lastRequest = mine[0];
  const isActivationComplete =
    Boolean(lastRequest?.isActivated) ||
    (lastRequest?.reviewNote ?? "").toLowerCase().includes("password updated successfully");

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
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
          {lastRequest?.status === "approved" && !isActivationComplete && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/60">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                Activate Approved Password
              </p>
              <p className="mt-1 text-[10px] text-emerald-900 dark:text-emerald-200">
                Log in using your old password, then confirm the approved new password here to activate it.
              </p>

              <div className="mt-3 space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showActivationCurrentPassword ? "text" : "password"}
                      value={activationCurrentPassword}
                      onChange={(e) => setActivationCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-12 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowActivationCurrentPassword((value) => !value)}
                      className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      {showActivationCurrentPassword ? "•" : "o"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    Approved New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showActivationNewPassword ? "text" : "password"}
                      value={activationNewPassword}
                      onChange={(e) => setActivationNewPassword(e.target.value)}
                      placeholder="Re-enter approved new password"
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-12 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowActivationNewPassword((value) => !value)}
                      className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                    >
                      {showActivationNewPassword ? "•" : "o"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showActivationConfirmPassword ? "text" : "password"}
                      value={activationConfirmPassword}
                      onChange={(e) => setActivationConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-12 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowActivationConfirmPassword((value) => !value)}
                      className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                    >
                      {showActivationConfirmPassword ? "•" : "o"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => void activateApprovedRequest()}
                disabled={isActivating}
                className="mt-3 w-full rounded-lg bg-emerald-700 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
              >
                {isActivating ? "Activating..." : "Activate New Password"}
              </button>
              {error && (
                <p className="mt-2 text-[10px] font-semibold text-red-600">
                  {error}
                </p>
              )}
              {success && (
                <p className="mt-2 text-[10px] font-semibold text-emerald-700">
                  {success}
                </p>
              )}
            </div>
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
                      onClick={() => void reviewRequest(request.id, "approved")}
                      disabled={reviewingId === request.id}
                      className="rounded-md bg-emerald-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => void reviewRequest(request.id, "rejected")}
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

      {isModalOpen && canRequest && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

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
                <div className="mx-auto">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-300">
                    Reason for Password Change
                  </label>
                  <div className="relative">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Example: I suspect my password was exposed and need immediate reset approval."
                      className="min-h-[140px] w-full rounded-lg border border-input-border bg-input-bg px-4 py-3 pr-14 text-sm leading-6 text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-400 focus:border-emerald-500"
                    />
                    <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-zinc-900 dark:text-zinc-400">
                      {reason.length}/500
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-900 dark:text-zinc-400">Minimum 10 characters.</p>
                  {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg border border-border-main bg-surface px-5 py-2 text-xs font-bold text-zinc-900 transition-colors hover:bg-surface-hover dark:text-zinc-300 disabled:opacity-60"
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
    </>
  );
}
