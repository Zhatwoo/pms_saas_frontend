"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useOptionalOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "@/components/shared/daily-balance-confirmation";
import { BranchEndDayModal } from "@/components/shared/branch-end-day-modal";
import { BRANCH_DAY_ENDED_EVENT, BRANCH_DAY_END_LOGOUT_MESSAGE, broadcastBranchDayEndedForBranch } from "@/lib/branch-day-events";

interface BusinessSessionApi {
  manilaCalendarDate: string;
  operationalCashAllowed: boolean;
  systemEndingBalanceToday: number | null;
  pendingStartingSession: {
    businessDate: string;
    suggestedStartingBalance: number;
  } | null;
  latestBalance: {
    startingBalance: number;
    endingBalance: number;
    date: string;
  };
}

export interface BranchDaySessionToolbarProps {
  /** Hide when missing or `"__all__"` (aggregate branch view). */
  branchId: string | null | undefined;
  onSessionChanged?: () => void;
  /** Employee shell: keep opening checklist in sync after submitting starting balance. */
  syncOpeningChecklist?: () => Promise<void>;
  /** Employee pawn: after successful End day, sign out and return to login. */
  logoutAfterEndDay?: boolean;
  /** Hide Start/End Day action buttons (e.g. for super admin read-only view). */
  hideActions?: boolean;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

/** Fired after a branch End Day completes — other tabs/employees refresh session state. */
const BRANCH_END_TOOLBAR_COOLDOWN_MS = 8000;

export function BranchDaySessionToolbar({
  branchId,
  onSessionChanged,
  syncOpeningChecklist,
  logoutAfterEndDay = false,
  hideActions = false,
}: BranchDaySessionToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { forceLogoutToLogin } = useAuth();
  /** Employee layout wraps `OpeningChecklistProvider`; admin/super-admin shells do not — skip gating then. */
  const openingChecklist = useOptionalOpeningChecklist();
  const currentStep = openingChecklist?.currentStep ?? "COMPLETED";
  const [session, setSession] = useState<BusinessSessionApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  /** While refetching with Start modal open, avoid flashing EXPECTED to 0 before new session arrives. */
  const lastResolvedExpectedCash = useRef<string | null>(null);
  const prevOperationalAllowedRef = useRef<boolean | null>(null);
  const autoStartPromptedRef = useRef(false);
  const startOpenRef = useRef(false);
  const lastBranchEndToolbarSyncAtRef = useRef(0);
  const lastLoadSessionAtRef = useRef(0);
  const SESSION_LOAD_COOLDOWN_MS = 8000;
  const loadSessionRef = useRef<() => Promise<void>>(async () => {});
  const refreshChecklistRef = useRef<() => Promise<void>>(async () => {});
  const resetModalHiddenRef = useRef<(() => void) | undefined>(undefined);
  const openingChecklistActiveRef = useRef(false);

  const visible =
    typeof branchId === "string" &&
    branchId.length > 0 &&
    branchId !== "__all__";

  const loadSession = useCallback(async () => {
    if (!visible) {
      setSession(null);
      return;
    }

    const now = Date.now();
    if (
      openingChecklistActiveRef.current &&
      openingChecklist != null &&
      !openingChecklist.modulesAllowed &&
      now - lastLoadSessionAtRef.current < SESSION_LOAD_COOLDOWN_MS
    ) {
      return;
    }
    lastLoadSessionAtRef.current = now;

    setLoading(true);
    setBanner(null);
    try {
      const qs = `?branch=${encodeURIComponent(branchId)}`;
      const data = await api.get<BusinessSessionApi>(
        `/branch-finance/business-session${qs}`,
      );
      setSession(data);
    } catch (e: unknown) {
      setSession(null);
      setBanner(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [branchId, visible, openingChecklist?.modulesAllowed]);

  useEffect(() => {
    loadSessionRef.current = loadSession;
  }, [loadSession]);

  const refreshChecklistState = useCallback(async () => {
    if (syncOpeningChecklist) {
      await syncOpeningChecklist();
      return;
    }
    await openingChecklist?.refreshOpeningChecklistFromServer?.();
  }, [syncOpeningChecklist, openingChecklist?.refreshOpeningChecklistFromServer]);

  useEffect(() => {
    refreshChecklistRef.current = refreshChecklistState;
  }, [refreshChecklistState]);

  useEffect(() => {
    resetModalHiddenRef.current = openingChecklist?.resetOpeningChecklistModalHidden;
  }, [openingChecklist?.resetOpeningChecklistModalHidden]);

  useEffect(() => {
    openingChecklistActiveRef.current = openingChecklist != null;
  }, [openingChecklist]);

  useEffect(() => {
    lastResolvedExpectedCash.current = null;
  }, [branchId]);

  useEffect(() => {
    if (loading) return;
    const pending = session?.pendingStartingSession?.suggestedStartingBalance;
    if (pending != null && Number.isFinite(Number(pending))) {
      lastResolvedExpectedCash.current = String(pending);
      return;
    }
    const fromLatest = Math.max(
      Number(session?.latestBalance?.startingBalance ?? 0),
      Number(session?.latestBalance?.endingBalance ?? 0),
    );
    if (Number.isFinite(fromLatest)) {
      lastResolvedExpectedCash.current = String(fromLatest);
    }
  }, [session, loading]);

  useEffect(() => {
    if (
      openingChecklistActiveRef.current &&
      openingChecklist != null &&
      !openingChecklist.modulesAllowed
    ) {
      return;
    }
    void loadSession();
  }, [loadSession, openingChecklist?.modulesAllowed]);

  useEffect(() => {
    const onTxn = () => void loadSessionRef.current();
    window.addEventListener("transaction_created", onTxn);
    return () => window.removeEventListener("transaction_created", onTxn);
  }, []);

  /** Admin-only: open toolbar Start modal after End Day (employees use OpeningChecklistWrapper). */
  const promptStartDayAfterClose = useCallback(async () => {
    await loadSessionRef.current();
    await refreshChecklistRef.current();
    resetModalHiddenRef.current?.();

    if (openingChecklistActiveRef.current) {
      return;
    }

    setStartOpen(true);
  }, []);

  /** Reload expected amount once when Start modal opens. */
  useEffect(() => {
    if (startOpen && !startOpenRef.current && visible) {
      void loadSessionRef.current();
    }
    startOpenRef.current = startOpen;
  }, [startOpen, visible]);

  /** Another employee ended the branch day — detected on session refresh. */
  useEffect(() => {
    if (!visible || loading || !session) return;

    const wasOpen = prevOperationalAllowedRef.current;
    const isOpen = session.operationalCashAllowed === true;

    if (
      wasOpen === true &&
      !isOpen &&
      !logoutAfterEndDay &&
      !autoStartPromptedRef.current
    ) {
      autoStartPromptedRef.current = true;
      window.dispatchEvent(new CustomEvent(BRANCH_DAY_ENDED_EVENT));
    }

    if (isOpen) {
      autoStartPromptedRef.current = false;
    }

    prevOperationalAllowedRef.current = isOpen;
  }, [visible, loading, session, logoutAfterEndDay]);

  useEffect(() => {
    const onBranchDayEnded = () => {
      if (logoutAfterEndDay) return;

      const now = Date.now();
      if (now - lastBranchEndToolbarSyncAtRef.current < BRANCH_END_TOOLBAR_COOLDOWN_MS) {
        return;
      }
      lastBranchEndToolbarSyncAtRef.current = now;

      if (!autoStartPromptedRef.current) {
        autoStartPromptedRef.current = true;
      }

      // Employee shell: context already syncs on End Day — skip duplicate business-session fetch.
      if (openingChecklistActiveRef.current) {
        return;
      }

      void promptStartDayAfterClose();
    };

    window.addEventListener(BRANCH_DAY_ENDED_EVENT, onBranchDayEnded);
    return () => {
      window.removeEventListener(BRANCH_DAY_ENDED_EVENT, onBranchDayEnded);
    };
  }, [logoutAfterEndDay, promptStartDayAfterClose]);

  const suggestedCash =
    session?.pendingStartingSession != null
      ? String(
          session.pendingStartingSession.suggestedStartingBalance ?? 0,
        )
      : String(
          Math.max(
            Number(session?.latestBalance?.startingBalance ?? 0),
            Number(session?.latestBalance?.endingBalance ?? 0),
          ),
        );

  const expectedCashForModal =
    startOpen &&
    loading &&
    lastResolvedExpectedCash.current != null
      ? lastResolvedExpectedCash.current
      : suggestedCash;

  const systemEnding =
    session?.systemEndingBalanceToday ??
    session?.latestBalance?.endingBalance ??
    0;

  const handleStartConfirm = async (amount: string) => {
    try {
      await api.post("/branch-finance/daily-balance", {
        type: "starting",
        amount: parseFloat(amount.replace(/,/g, "")) || 0,
      });
      setStartOpen(false);
      await syncOpeningChecklist?.();
      await loadSession();
      onSessionChanged?.();
    } catch (e: unknown) {
      if (
        e instanceof ApiError &&
        e.statusCode === 422 &&
        e.payload &&
        typeof e.payload === "object" &&
        (e.payload as { code?: string }).code === "STARTING_BALANCE_MISMATCH"
      ) {
        const p = e.payload as {
          expectedAmount?: number;
          enteredAmount?: number;
          businessDate?: string;
        };
        const expected = Number(p.expectedAmount);
        const entered = Number(p.enteredAmount);
        const businessDate =
          typeof p.businessDate === "string" ? p.businessDate : "";
        setStartOpen(false);
        setBanner(null);
        const incidentBase = pathname?.includes("/admin/")
          ? "/admin/incident-report"
          : "/employee/incident-report";
        const qs = new URLSearchParams({
          startingMismatch: "1",
          expected: Number.isFinite(expected) ? String(expected) : "0",
          entered: Number.isFinite(entered) ? String(entered) : "0",
          businessDate,
        });
        router.push(`${incidentBase}?${qs.toString()}`);
        return;
      }
      setBanner(errorMessage(e));
      throw e;
    }
  };

  const handleEndConfirm = async (physicalEndingAmount: number | undefined) => {
    try {
      await api.post("/branch-finance/end-day", {
        confirmed: true,
        ...(physicalEndingAmount !== undefined
          ? { physicalEndingAmount }
          : {}),
      });
      setEndOpen(false);
      if (logoutAfterEndDay) {
        if (branchId) {
          broadcastBranchDayEndedForBranch(branchId);
        }
        forceLogoutToLogin(BRANCH_DAY_END_LOGOUT_MESSAGE);
        return;
      }
      autoStartPromptedRef.current = true;
      window.dispatchEvent(new CustomEvent(BRANCH_DAY_ENDED_EVENT));
    } catch (e: unknown) {
      setBanner(errorMessage(e));
      throw e;
    }
  };

  if (!visible) return null;

  const open = session?.operationalCashAllowed === true;
  const needsStart = session != null && !session.operationalCashAllowed;
  const checklistHandlesStarting =
    openingChecklist != null &&
    !openingChecklist.modulesAllowed &&
    currentStep === "CASH_ON_HAND";

  return (
    <>
      <div className="rounded-xl border border-border-main bg-surface-secondary/80 px-4 py-3 shadow-sm print-hide">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-green">
              Branch day (Manila)
            </p>
            <p className="truncate text-sm font-semibold text-text-primary">
              {loading
                ? "Checking session…"
                : session
                  ? open
                    ? `Open — ${session.manilaCalendarDate}`
                    : `Needs starting balance / closed — ${session.manilaCalendarDate}`
                  : "Session unavailable"}
            </p>
          
          </div>
          {!hideActions && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                loading ||
                !needsStart ||
                checklistHandlesStarting
              }
              onClick={() => setStartOpen(true)}
              className="rounded-lg border border-brand-green bg-brand-green px-4 py-2 text-xs font-bold uppercase tracking-wide text-pawn-gold shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start day
            </button>
            <button
              type="button"
              disabled={loading || !open}
              onClick={() => setEndOpen(true)}
              className="rounded-lg border border-amber-600/80 bg-amber-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              End day
            </button>
          </div>
          )}
        </div>
        {banner ? (
          <div className="mt-3 flex items-start justify-between gap-2 rounded-lg border border-red-300/50 bg-red-950/30 px-3 py-2 text-xs text-red-100">
            <span>{banner}</span>
            <button
              type="button"
              className="shrink-0 font-bold text-red-200 hover:underline"
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </div>
        ) : null}
      </div>

      <DailyBalanceConfirmation
        isOpen={startOpen}
        type="starting"
        currentCash={expectedCashForModal}
        titleOverride="Start branch day"
        subtitleOverride="Ilagay ang physical starting balance para sa branch ngayong petsa (Manila). Parehong sesyon ito para sa lahat ng empleyado."
        onClose={() => setStartOpen(false)}
        onConfirm={handleStartConfirm}
      />

      <BranchEndDayModal
        isOpen={endOpen}
        systemEndingBalance={systemEnding}
        manilaBusinessDate={session?.manilaCalendarDate ?? ""}
        onClose={() => setEndOpen(false)}
        onConfirm={handleEndConfirm}
      />
    </>
  );
}
