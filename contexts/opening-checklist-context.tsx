"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { ApiError, api } from "@/lib/api";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { toast } from "sonner";

export type ChecklistStep = 
  | "CASH_ON_HAND" 
  | "INVENTORY_AUDIT" 
  | "COMPLETED";

type DailyOpeningApiStatus = {
  openingDate: string;
  status: "none" | "pending" | "completed";
  checklistStep: ChecklistStep;
  startingCash?: number;
  expectedStartingCash?: number;
};

interface OpeningChecklistContextValue {
  currentStep: ChecklistStep;
  isComplete: boolean;
  /** False until the first daily-opening status fetch finishes for employees. */
  isOpeningChecklistReady: boolean;
  completeCashOnHand: (amount: string) => Promise<void>;
  completeInventoryAudit: () => Promise<void>;
  resetChecklist: () => void;
  /** Re-fetch daily opening from server (e.g. after end-of-day balance closes the session). */
  refreshOpeningChecklistFromServer: () => Promise<void>;
  debugSetInventoryAudit: () => void;
}

const OpeningChecklistContext = createContext<OpeningChecklistContextValue | null>(null);

const openingLoadPromiseByKey = new Map<string, Promise<DailyOpeningApiStatus>>();
const openingLoadStartedAtByKey = new Map<string, number>();
const OPENING_LOAD_COOLDOWN_MS = 5000;
/** Keep low so another employee on the same branch/day picks up Start/End day changes after tab focus. */
const OPENING_VISIBILITY_SYNC_COOLDOWN_MS = 8000;

function dailyOpeningCacheKey(
  userId: string,
  branchId: string,
  phDate: string,
): string {
  return `${userId}:${branchId}:${phDate}`;
}

export function OpeningChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ChecklistStep>("CASH_ON_HAND");
  const [isComplete, setIsComplete] = useState(false);
  const [isOpeningChecklistReady, setIsOpeningChecklistReady] = useState(false);
  const hasLoadedBranchDayRef = useRef<string | null>(null);
  const lastSyncedOpeningDateRef = useRef<string | null>(null);
  const isLoadingOpeningRef = useRef(false);
  const lastVisibilitySyncAtRef = useRef(0);

  const applyServerStatus = useCallback((data: DailyOpeningApiStatus) => {
    lastSyncedOpeningDateRef.current = data.openingDate;
    setCurrentStep(data.checklistStep);
    setIsComplete(data.checklistStep === "COMPLETED");
  }, []);

  const loadDailyOpeningForEmployee = useCallback(
    async (options?: { preserveShell?: boolean }) => {
      if (!user || user.role !== "employee" || !user.branchId) {
        return;
      }
      const key = dailyOpeningCacheKey(
        user.id,
        user.branchId,
        getPhCalendarDateString(),
      );
      const now = Date.now();
      const lastStartedAt = openingLoadStartedAtByKey.get(key) ?? 0;
      const pendingRequest = openingLoadPromiseByKey.get(key);

      if (pendingRequest) {
        await pendingRequest.then(applyServerStatus).catch((err) => {
          console.error("[Checklist] Failed to load daily opening status:", err);
          setCurrentStep("CASH_ON_HAND");
          setIsComplete(false);
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
        hasLoadedBranchDayRef.current = key;
      } finally {
        openingLoadPromiseByKey.delete(key);
        setIsOpeningChecklistReady(true);
      }
    },
    [user, applyServerStatus],
  );

  useEffect(() => {
    if (!user || user.role !== "employee") {
      setIsComplete(true);
      setIsOpeningChecklistReady(true);
      hasLoadedBranchDayRef.current = null;
      lastSyncedOpeningDateRef.current = null;
      return;
    }

    if (!user.branchId) {
      setIsComplete(true);
      setIsOpeningChecklistReady(true);
      return;
    }

    const phToday = getPhCalendarDateString();
    const key = dailyOpeningCacheKey(user.id, user.branchId, phToday);
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
    if (!user || user.role !== "employee") return;

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

  const refreshOpeningChecklistFromServer = useCallback(async () => {
    if (!user || user.role !== "employee" || !user.branchId) {
      return;
    }
    hasLoadedBranchDayRef.current = null;
    lastVisibilitySyncAtRef.current = 0;
    openingLoadStartedAtByKey.delete(
      dailyOpeningCacheKey(
        user.id,
        user.branchId,
        getPhCalendarDateString(),
      ),
    );
    await loadDailyOpeningForEmployee({ preserveShell: true });
  }, [user, loadDailyOpeningForEmployee]);

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

        toast.error("Starting cash mismatch. Please file an incident report.");
        router.replace(`/employee/incident-report?${params.toString()}`);
        return;
      }

      if (
        error instanceof ApiError &&
        error.statusCode === 422 &&
        error.payload?.code === "STARTING_BALANCE_MISMATCH"
      ) {
        const expected = Number(error.payload?.expectedAmount);
        const entered = Number(error.payload?.enteredAmount);
        const msg = Number.isFinite(expected)
          ? `Expected ${expected.toLocaleString("en-PH", { minimumFractionDigits: 2 })} but you entered ${Number.isFinite(entered) ? entered.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : amount}. File an incident report for the variance.`
          : error.message;
        throw new ApiError(msg, 422, error.payload);
      }

      throw error;
    }

    try {
      const data = await api.get<DailyOpeningApiStatus>(
        "/branch-finance/daily-opening/status",
      );
      applyServerStatus(data);
    } catch {
      /** Fallback so UI unlocks if status refetch fails after a successful POST. */
      setCurrentStep("COMPLETED");
      setIsComplete(true);
    }
  }, [applyServerStatus, refreshOpeningChecklistFromServer]);

  const completeInventoryAudit = useCallback(async () => {
    await api.post("/branch-finance/daily-opening/complete", {});
    setCurrentStep("COMPLETED");
    setIsComplete(true);
  }, []);

  const resetChecklist = useCallback(() => {
    setCurrentStep("CASH_ON_HAND");
    setIsComplete(false);
    hasLoadedBranchDayRef.current = null;
    lastSyncedOpeningDateRef.current = null;
  }, []);

  const debugSetInventoryAudit = useCallback(() => {
    setCurrentStep("INVENTORY_AUDIT");
    setIsComplete(false);
  }, []);

  return (
    <OpeningChecklistContext.Provider
      value={{
        currentStep,
        isComplete,
        isOpeningChecklistReady,
        completeCashOnHand,
        completeInventoryAudit,
        resetChecklist,
        refreshOpeningChecklistFromServer,
        debugSetInventoryAudit,
      }}
    >
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
