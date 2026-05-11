"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./auth-context";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";

export type ChecklistStep = 
  | "CASH_ON_HAND" 
  | "INVENTORY_AUDIT" 
  | "COMPLETED";

type DailyOpeningApiStatus = {
  openingDate: string;
  status: "none" | "pending" | "completed";
  checklistStep: ChecklistStep;
  startingCash?: number;
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
}

const OpeningChecklistContext = createContext<OpeningChecklistContextValue | null>(null);

export function OpeningChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<ChecklistStep>("CASH_ON_HAND");
  const [isComplete, setIsComplete] = useState(false);
  const [isOpeningChecklistReady, setIsOpeningChecklistReady] = useState(false);
  const hasLoadedBranchDayRef = useRef<string | null>(null);
  const lastSyncedOpeningDateRef = useRef<string | null>(null);

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
      const key = `${user.branchId}:${getPhCalendarDateString()}`;
      /** Avoid unmounting the whole employee shell on tab focus / file-picker blur (would feel like a full page restart). */
      if (!options?.preserveShell) {
        setIsOpeningChecklistReady(false);
      }
      try {
        const data = await api.get<DailyOpeningApiStatus>(
          "/branch-finance/daily-opening/status",
        );
        applyServerStatus(data);
        hasLoadedBranchDayRef.current = key;
      } catch (err) {
        console.error("[Checklist] Failed to load daily opening status:", err);
        setCurrentStep("CASH_ON_HAND");
        setIsComplete(false);
        hasLoadedBranchDayRef.current = key;
      } finally {
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
    if (!user || user.role !== "employee") return;

    /** Branch-wide session: refetch when returning to the tab so another employee's completion is picked up. */
    const syncOpeningFromServer = () => {
      hasLoadedBranchDayRef.current = null;
      void loadDailyOpeningForEmployee({ preserveShell: true });
    };

    const onVisibilityChange = () => {
      const phToday = getPhCalendarDateString();
      if (
        lastSyncedOpeningDateRef.current != null &&
        lastSyncedOpeningDateRef.current !== phToday
      ) {
        syncOpeningFromServer();
        return;
      }
      if (document.visibilityState === "visible") {
        syncOpeningFromServer();
      }
    };

    window.addEventListener("focus", syncOpeningFromServer);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", syncOpeningFromServer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user, loadDailyOpeningForEmployee]);

  const completeCashOnHand = useCallback(async (amount: string) => {
    await api.post("/branch-finance/daily-balance", {
      type: "starting",
      amount: parseFloat(amount) || 0,
    });

    const nextStep: ChecklistStep = "INVENTORY_AUDIT";
    setCurrentStep(nextStep);
    setIsComplete(false);

    if (!pathname?.includes("/pawn-transaction")) {
      router.push("/employee/inventory/pawned-items");
    }
  }, [router, pathname]);

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

  const refreshOpeningChecklistFromServer = useCallback(async () => {
    if (!user || user.role !== "employee" || !user.branchId) {
      return;
    }
    hasLoadedBranchDayRef.current = null;
    await loadDailyOpeningForEmployee({ preserveShell: true });
  }, [user, loadDailyOpeningForEmployee]);

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
