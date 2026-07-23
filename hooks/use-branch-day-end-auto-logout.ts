"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  BRANCH_DAY_END_LOGOUT_MESSAGE,
  BRANCH_DAY_END_STORAGE_KEY,
} from "@/lib/branch-day-events";
import { subscribeToBranchDayEndedNotifications } from "@/lib/notification-stream";
import { isBranchDayEndedApiNotification, type ApiNotification } from "@/lib/notifications";

function matchesEmployeeBranch(
  userBranchId: string | null | undefined,
  notification: ApiNotification,
): boolean {
  if (!userBranchId) return false;
  if (!notification.branch_id) return true;
  return notification.branch_id === userBranchId;
}

/**
 * Employee-only: sign out when the branch business day ends (End Day from any coworker).
 */
export function useBranchDayEndAutoLogout() {
  const { user, forceLogoutToLogin } = useAuth();
  const logoutTriggeredRef = useRef(false);

  const triggerLogout = useCallback(() => {
    if (logoutTriggeredRef.current) return;
    if (user?.role !== "employee" || !user?.branchId) return;
    logoutTriggeredRef.current = true;
    forceLogoutToLogin(BRANCH_DAY_END_LOGOUT_MESSAGE);
  }, [forceLogoutToLogin, user?.branchId, user?.role]);

  useEffect(() => {
    if (user?.role !== "employee" || !user?.branchId) return;

    return subscribeToBranchDayEndedNotifications((notification) => {
      if (!notification || !isBranchDayEndedApiNotification(notification)) return;
      if (!matchesEmployeeBranch(user?.branchId, notification)) return;
      triggerLogout();
    });
  }, [triggerLogout, user?.branchId, user?.role]);

  useEffect(() => {
    if (user?.role !== "employee" || !user?.branchId) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== BRANCH_DAY_END_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as { branchId?: string };
        if (parsed.branchId === user?.branchId) {
          triggerLogout();
        }
      } catch {
        /* ignore malformed payload */
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [triggerLogout, user?.branchId, user?.role]);

  return { triggerLogout };
}
