"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  isBranchTransferApiNotification,
  type ApiNotification,
} from "@/lib/notifications";
import { subscribeToBranchTransferNotifications } from "@/lib/notification-stream";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";

export function BranchTransferAcknowledgement() {
  const { user, refreshProfile, forceLogoutToLogin } = useAuth();
  const { selectedBranch, refreshBranches } = useBranch();
  const [pending, setPending] = useState<ApiNotification | null>(null);
  const [securityLogoutMessage, setSecurityLogoutMessage] = useState<string | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownNotificationIdsRef = useRef(new Set<string>());

  const shouldCheck = user?.role === "admin" || user?.role === "employee";
  const branchName = useMemo(() => {
    return user?.branchName || selectedBranch.name || "your current branch";
  }, [selectedBranch.name, user?.branchName]);

  const loadPendingTransfer = useCallback(async () => {
    if (!shouldCheck) {
      setPending(null);
      return;
    }

    try {
      const notifications = await api.get<ApiNotification[]>("/notifications");
      const transferNotice =
        notifications.find(
          (notification) =>
            !notification.is_read &&
            isBranchTransferApiNotification(notification),
        ) ?? null;
      setPending((current) => current ?? transferNotice);
    } catch (err) {
      console.warn("Failed to load branch transfer acknowledgement:", err);
      setPending(null);
    }
  }, [shouldCheck]);

  useEffect(() => {
    void loadPendingTransfer();
  }, [loadPendingTransfer, user?.id, user?.branchId]);

  useEffect(() => {
    if (!shouldCheck) return undefined;

    return subscribeToBranchTransferNotifications((notification) => {
      if (
        notification &&
        !notification.is_read &&
        !shownNotificationIdsRef.current.has(notification.id)
      ) {
        shownNotificationIdsRef.current.add(notification.id);
        setSecurityLogoutMessage(
          "Your branch assignment was changed. Please sign in again to continue with your updated branch access.",
        );
        return;
      }
      void loadPendingTransfer();
    });
  }, [forceLogoutToLogin, loadPendingTransfer, shouldCheck]);

  useEffect(() => {
    if (!shouldCheck) return undefined;

    const handleTransferNotice = () => {
      setSecurityLogoutMessage(
        "Your branch assignment was changed. Please sign in again to continue with your updated branch access.",
      );
    };

    window.addEventListener(
      "pms:branch-transfer-notification",
      handleTransferNotice,
    );

    return () => {
      window.removeEventListener(
        "pms:branch-transfer-notification",
        handleTransferNotice,
      );
    };
  }, [forceLogoutToLogin, shouldCheck]);

  const handleConfirm = async () => {
    if (!pending) return;

    setIsConfirming(true);
    setError(null);
    try {
      await api.patch(`/notifications/${encodeURIComponent(pending.id)}/read`, {});
      await refreshProfile();
      await refreshBranches();
      setPending(null);
    } catch (err) {
      console.error("Failed to confirm branch transfer:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not confirm your branch transfer. Please try again.",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (securityLogoutMessage) {
    return (
      <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-security-title"
          className="w-full max-w-md rounded-lg border border-amber-400/40 bg-surface-main p-6 text-text-primary shadow-2xl"
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
            Security Notice
          </p>
          <h2 id="branch-security-title" className="mt-3 text-xl font-bold">
            Branch assignment changed
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {securityLogoutMessage}
          </p>
          <button
            type="button"
            onClick={() => forceLogoutToLogin(securityLogoutMessage)}
            className="mt-6 w-full rounded-md bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-transfer-title"
        className="w-full max-w-md rounded-lg border border-brand-green/30 bg-surface-main p-6 text-text-primary shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-green">
          Branch Assignment
        </p>
        <h2 id="branch-transfer-title" className="mt-3 text-xl font-bold">
          {pending.title || `You were transferred to ${branchName}`}
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {pending.message ||
            pending.subtitle ||
            `Your account is now assigned to ${branchName}. Please confirm before continuing.`}
        </p>
        {error ? (
          <p className="mt-4 rounded-md border border-red-400/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming}
          className="mt-6 w-full rounded-md bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isConfirming ? "Confirming..." : "I understand"}
        </button>
      </div>
    </div>
  );
}
