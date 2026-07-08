"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { ApiError, api } from "@/lib/api";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { BRANCH_DAY_ENDED_EVENT, BRANCH_DAY_END_LOGOUT_MESSAGE } from "@/lib/branch-day-events";
import { toast } from "sonner";

export type ChecklistStep = 
  | "CASH_ON_HAND" 
  | "INVENTORY_AUDIT" 
  | "COMPLETED";

type DailyOpeningApiStatus = {
  openingDate: string;
  status: "none" | "pending" | "completed";
  checklistStep: ChecklistStep;
  modulesAllowed: boolean;
  startingCash?: number;
  expectedStartingCash?: number;
};

function isOpeningChecklistRole(role?: string | null) {
  return role === "employee" || role === "admin";
}

interface OpeningChecklistContextValue {
  currentStep: ChecklistStep;
  /** UI modals hidden when today's checklist step is COMPLETED. */
  isComplete: boolean;
  /** Matches backend OpeningChecklistGuard — gates module pages and API-heavy views. */
  modulesAllowed: boolean;
  /** False until the first daily-opening status fetch finishes for employees. */
  isOpeningChecklistReady: boolean;
  /** Hides opening modals while filing a starting-cash mismatch incident report. */
  openingChecklistModalHidden: boolean;
  hideOpeningChecklistModal: () => void;
  resetOpeningChecklistModalHidden: () => void;
  completeCashOnHand: (amount: string) => Promise<void>;
  completeInventoryAudit: () => Promise<void>;
  resetChecklist: () => void;
  /** Re-fetch daily opening from server (e.g. after end-of-day balance closes the session). */
  refreshOpeningChecklistFromServer: () => Promise<void>;
  /** Server-computed expected starting cash when branch day needs to be opened. */
  expectedStartingCash: number | null;
  debugSetInventoryAudit: () => void;
}

const OpeningChecklistContext = createContext<OpeningChecklistContextValue | null>(null);

const openingLoadPromiseByKey = new Map<string, Promise<DailyOpeningApiStatus>>();
const openingLoadStartedAtByKey = new Map<string, number>();
const OPENING_LOAD_COOLDOWN_MS = 5000;
const OPENING_VISIBILITY_SYNC_COOLDOWN_MS = 30000;
/** Detect another employee's End Day while this tab still thinks the branch is open. */
const BRANCH_SESSION_POLL_MS = 30000;
const BRANCH_END_SYNC_COOLDOWN_MS = 8000;

type BusinessSessionPollApi = {
  operationalCashAllowed: boolean;
  todaySession?: { status: string } | null;
};

export function OpeningChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user, forceLogoutToLogin } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ChecklistStep>("CASH_ON_HAND");
  const [isComplete, setIsComplete] = useState(false);
  const [modulesAllowed, setModulesAllowed] = useState(false);
  const [isOpeningChecklistReady, setIsOpeningChecklistReady] = useState(false);
  const [openingChecklistModalHidden, setOpeningChecklistModalHidden] = useState(false);
  const [expectedStartingCash, setExpectedStartingCash] = useState<number | null>(null);
  const hasLoadedBranchDayRef = useRef<string | null>(null);
  const lastSyncedOpeningDateRef = useRef<string | null>(null);
  const isLoadingOpeningRef = useRef(false);
  const lastVisibilitySyncAtRef = useRef(0);
  const lastBranchEndSyncAtRef = useRef(0);
  const awaitingBranchStartRef = useRef(false);
  const sessionPollInFlightRef = useRef(false);
  const branchEndLogoutTriggeredRef = useRef(false);

  const logoutEmployeeForBranchEndDay = useCallback(() => {
    if (branchEndLogoutTriggeredRef.current) return;
    if (user?.role !== "employee" || !user.branchId) return;
    branchEndLogoutTriggeredRef.current = true;
    forceLogoutToLogin(BRANCH_DAY_END_LOGOUT_MESSAGE);
  }, [forceLogoutToLogin, user?.branchId, user?.role]);

  const applyServerStatus = useCallback((data: DailyOpeningApiStatus) => {
    lastSyncedOpeningDateRef.current = data.openingDate;
    const step =
      !data.modulesAllowed && data.checklistStep === "COMPLETED"
        ? "CASH_ON_HAND"
        : data.checklistStep;
    const complete = step === "COMPLETED" && Boolean(data.modulesAllowed);
    setCurrentStep(step);
    setIsComplete(complete);
    setModulesAllowed(Boolean(data.modulesAllowed));
    awaitingBranchStartRef.current =
      !data.modulesAllowed &&
      (step === "CASH_ON_HAND" || step === "INVENTORY_AUDIT");
    setExpectedStartingCash(
      data.expectedStartingCash != null &&
        Number.isFinite(Number(data.expectedStartingCash))
        ? Number(data.expectedStartingCash)
        : null,
    );
  }, []);

  const loadDailyOpeningForEmployee = useCallback(
    async (options?: { preserveShell?: boolean }) => {
      if (!user || !isOpeningChecklistRole(user.role) || !user.branchId) {
        return;
      }
      const key = `${user.branchId}:${getPhCalendarDateString()}`;
      const now = Date.now();
      const lastStartedAt = openingLoadStartedAtByKey.get(key) ?? 0;
      const pendingRequest = openingLoadPromiseByKey.get(key);

      if (pendingRequest) {
        await pendingRequest.then(applyServerStatus).catch((err) => {
          console.error("[Checklist] Failed to load daily opening status:", err);
          setCurrentStep("CASH_ON_HAND");
          setIsComplete(false);
          setModulesAllowed(false);
        }).finally(() => {
          setIsOpeningChecklistReady(true);
        });
        return;
      }

      if (now - lastStartedAt < OPENING_LOAD_COOLDOWN_MS) {
        setIsOpeningChecklistReady(true);
        return;
      }

      /** Avoid unmounting the whole employee shell on tab focus / file-picker blur (would feel like a full page restart). */
      if (!options?.preserveShell) {
        setIsOpeningChecklistReady(false);
      }
      openingLoadStartedAtByKey.set(key, now);

      const request = api.get<DailyOpeningApiStatus>("/branch-finance/daily-opening/status");
      openingLoadPromiseByKey.set(key, request);

      try {
        const data = await request;
        applyServerStatus(data);
        hasLoadedBranchDayRef.current = key;
      } catch (err) {
        console.error("[Checklist] Failed to load daily opening status:", err);
        setCurrentStep("CASH_ON_HAND");
        setIsComplete(false);
        setModulesAllowed(false);
        hasLoadedBranchDayRef.current = key;
      } finally {
        openingLoadPromiseByKey.delete(key);
        setIsOpeningChecklistReady(true);
      }
    },
    [user, applyServerStatus],
  );

  useEffect(() => {
    if (!user || !isOpeningChecklistRole(user.role)) {
      setIsComplete(true);
      setModulesAllowed(true);
      setIsOpeningChecklistReady(true);
      hasLoadedBranchDayRef.current = null;
      lastSyncedOpeningDateRef.current = null;
      return;
    }

    if (!user.branchId) {
      setIsComplete(true);
      setModulesAllowed(true);
      setIsOpeningChecklistReady(true);
      return;
    }

    const phToday = getPhCalendarDateString();
    const key = `${user.branchId}:${phToday}`;
    const dayChanged =
      lastSyncedOpeningDateRef.current != null &&
      lastSyncedOpeningDateRef.current !== phToday;

    if (dayChanged) {
      hasLoadedBranchDayRef.current = null;
    }

    if (hasLoadedBranchDayRef.current === key && !dayChanged) {
      setIsOpeningChecklistReady(true);
      return;
    }

    void loadDailyOpeningForEmployee();
  }, [user, loadDailyOpeningForEmployee]);

  useEffect(() => {
    if (!user || !isOpeningChecklistRole(user.role)) return;

    /** Branch-wide session: refetch when the tab becomes visible again, but avoid chatty focus churn. */
    const syncOpeningFromServer = () => {
      const now = Date.now();
      if (now - lastVisibilitySyncAtRef.current < OPENING_VISIBILITY_SYNC_COOLDOWN_MS) {
        return;
      }
      lastVisibilitySyncAtRef.current = now;
      void loadDailyOpeningForEmployee({ preserveShell: true });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const phToday = getPhCalendarDateString();
      if (
        lastSyncedOpeningDateRef.current != null &&
        lastSyncedOpeningDateRef.current !== phToday
      ) {
        hasLoadedBranchDayRef.current = null;
        lastVisibilitySyncAtRef.current = 0;
        void loadDailyOpeningForEmployee({ preserveShell: true });
        return;
      }

      syncOpeningFromServer();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user, loadDailyOpeningForEmployee]);

  /** Same-tab End Day — employees sign out; admins refresh checklist state only. */
  useEffect(() => {
    if (user?.role !== "employee" || !user.branchId) return;

    const onBranchDayEnded = () => {
      logoutEmployeeForBranchEndDay();
    };

    window.addEventListener(BRANCH_DAY_ENDED_EVENT, onBranchDayEnded);
    return () => {
      window.removeEventListener(BRANCH_DAY_ENDED_EVENT, onBranchDayEnded);
    };
  }, [logoutEmployeeForBranchEndDay, user]);

  /** Admin-only: End Day in another tab refreshes opening checklist without logout. */
  useEffect(() => {
    if (user?.role !== "admin" || !user.branchId) return;

    const onBranchDayEnded = () => {
      const now = Date.now();
      if (now - lastBranchEndSyncAtRef.current < BRANCH_END_SYNC_COOLDOWN_MS) {
        return;
      }
      lastBranchEndSyncAtRef.current = now;
      awaitingBranchStartRef.current = true;
      hasLoadedBranchDayRef.current = null;
      lastVisibilitySyncAtRef.current = 0;
      openingLoadStartedAtByKey.delete(
        `${user.branchId}:${getPhCalendarDateString()}`,
      );
      setOpeningChecklistModalHidden(false);
      setIsComplete(false);
      setModulesAllowed(false);
      setCurrentStep("CASH_ON_HAND");
      void loadDailyOpeningForEmployee({ preserveShell: true });
    };

    window.addEventListener(BRANCH_DAY_ENDED_EVENT, onBranchDayEnded);
    return () => {
      window.removeEventListener(BRANCH_DAY_ENDED_EVENT, onBranchDayEnded);
    };
  }, [user, loadDailyOpeningForEmployee]);

  /**
   * Employee-only: poll branch session while modules appear open — catches End Day
   * from another employee without requiring tab focus or manual refresh.
   */
  useEffect(() => {
    if (
      user?.role !== "employee" ||
      !user.branchId ||
      !modulesAllowed ||
      awaitingBranchStartRef.current
    ) {
      return;
    }

    let cancelled = false;

    const pollBranchSession = async () => {
      if (sessionPollInFlightRef.current || cancelled) return;
      sessionPollInFlightRef.current = true;
      try {
        const session = await api.get<BusinessSessionPollApi>(
          "/branch-finance/business-session",
        );
        if (cancelled || session.operationalCashAllowed) return;

        // Log out only when today's session was explicitly closed (End Day),
        // not when the branch simply has not started today yet.
        if (session.todaySession?.status === "CLOSED") {
          logoutEmployeeForBranchEndDay();
        }
      } catch {
        /* ignore transient network errors */
      } finally {
        sessionPollInFlightRef.current = false;
      }
    };

    const id = window.setInterval(() => {
      void pollBranchSession();
    }, BRANCH_SESSION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user, modulesAllowed, logoutEmployeeForBranchEndDay]);

  const refreshOpeningChecklistFromServer = useCallback(async () => {
    if (!user || !isOpeningChecklistRole(user.role) || !user.branchId) {
      return;
    }
    hasLoadedBranchDayRef.current = null;
    lastVisibilitySyncAtRef.current = 0;
    openingLoadStartedAtByKey.delete(`${user.branchId}:${getPhCalendarDateString()}`);
    await loadDailyOpeningForEmployee({ preserveShell: true });
  }, [user, loadDailyOpeningForEmployee]);

  const hideOpeningChecklistModal = useCallback(() => {
    setOpeningChecklistModalHidden(true);
  }, []);

  const resetOpeningChecklistModalHidden = useCallback(() => {
    setOpeningChecklistModalHidden(false);
  }, []);

  const completeCashOnHand = useCallback(async (amount: string) => {
    try {
      await api.post("/branch-finance/daily-balance", {
        type: "starting",
        amount: parseFloat(amount) || 0,
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.statusCode === 409 &&
        error.message.includes("Starting balance was already submitted")
      ) {
        await refreshOpeningChecklistFromServer();
        return;
      }

      if (
        error instanceof ApiError &&
        error.statusCode === 422 &&
        (error.payload.code === "STARTING_BALANCE_MISMATCH" ||
          error.message.toLowerCase().includes("starting cash"))
      ) {
        const expected = Number(
          error.payload.expectedAmount ?? error.payload.required_amount ?? 0,
        );
        const entered = Number(
          error.payload.enteredAmount ?? amount.replace(/,/g, "") ?? 0,
        );
        const businessDate = String(
          error.payload.businessDate ??
            error.payload.business_date ??
            getPhCalendarDateString(),
        );
        const params = new URLSearchParams({
          startingMismatch: "1",
          expected: String(Number.isFinite(expected) ? expected : 0),
          entered: String(Number.isFinite(entered) ? entered : 0),
          businessDate,
        });

        setOpeningChecklistModalHidden(true);
        toast.error("Starting cash mismatch. Please file an incident report.");
        router.replace(`/employee/incident-report?${params.toString()}`);
        return;
      }

      throw error;
    }

    try {
      const data = await api.get<DailyOpeningApiStatus>(
        "/branch-finance/daily-opening/status",
      );
      applyServerStatus(data);
    } catch {
      setCurrentStep("INVENTORY_AUDIT");
      setIsComplete(false);
      setModulesAllowed(false);
    }
  }, [applyServerStatus, refreshOpeningChecklistFromServer, router]);

  const completeInventoryAudit = useCallback(async () => {
    await api.post("/branch-finance/daily-opening/complete", {});
    awaitingBranchStartRef.current = false;
    hasLoadedBranchDayRef.current = null;
    openingLoadStartedAtByKey.delete(
      `${user?.branchId ?? ""}:${getPhCalendarDateString()}`,
    );
    await loadDailyOpeningForEmployee({ preserveShell: true });
  }, [user?.branchId, loadDailyOpeningForEmployee]);

  const resetChecklist = useCallback(() => {
    awaitingBranchStartRef.current = false;
    setCurrentStep("CASH_ON_HAND");
    setIsComplete(false);
    setModulesAllowed(false);
    setOpeningChecklistModalHidden(false);
    hasLoadedBranchDayRef.current = null;
    lastSyncedOpeningDateRef.current = null;
  }, []);

  const debugSetInventoryAudit = useCallback(() => {
    setCurrentStep("INVENTORY_AUDIT");
    setIsComplete(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      currentStep,
      isComplete,
      modulesAllowed,
      isOpeningChecklistReady,
      openingChecklistModalHidden,
      hideOpeningChecklistModal,
      resetOpeningChecklistModalHidden,
      completeCashOnHand,
      completeInventoryAudit,
      resetChecklist,
      refreshOpeningChecklistFromServer,
      expectedStartingCash,
      debugSetInventoryAudit,
    }),
    [
      currentStep,
      isComplete,
      modulesAllowed,
      isOpeningChecklistReady,
      openingChecklistModalHidden,
      hideOpeningChecklistModal,
      resetOpeningChecklistModalHidden,
      completeCashOnHand,
      completeInventoryAudit,
      resetChecklist,
      refreshOpeningChecklistFromServer,
      expectedStartingCash,
      debugSetInventoryAudit,
    ],
  );

  return (
    <OpeningChecklistContext.Provider value={contextValue}>
      {children}
    </OpeningChecklistContext.Provider>
  );
}

export function useOpeningChecklist() {
  const context = useContext(OpeningChecklistContext);
  if (!context) throw new Error("useOpeningChecklist must be used within OpeningChecklistProvider");
  return context;
}

export function useOptionalOpeningChecklist() {
  return useContext(OpeningChecklistContext);
}
