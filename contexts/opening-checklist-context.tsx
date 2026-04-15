"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./auth-context";
import { useRouter, usePathname } from "next/navigation";

export type ChecklistStep = 
  | "CASH_ON_HAND" 
  | "INVENTORY_AUDIT" 
  | "COMPLETED";

interface OpeningChecklistContextValue {
  currentStep: ChecklistStep;
  isComplete: boolean;
  completeCashOnHand: (amount: string) => Promise<void>;
  completeInventoryAudit: () => Promise<void>;
  resetChecklist: () => void;
}

const OpeningChecklistContext = createContext<OpeningChecklistContextValue | null>(null);

export function OpeningChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<ChecklistStep>("CASH_ON_HAND");
  const [isComplete, setIsComplete] = useState(false);

  // Load state from localStorage on mount (persistence across refresh during the workday)
  useEffect(() => {
    if (!user || user.role !== "employee") {
      setIsComplete(true);
      return;
    }

    const saved = localStorage.getItem(`opening_checklist_${user.id}_${new Date().toDateString()}`);
    if (saved) {
      const { step, complete } = JSON.parse(saved);
      setCurrentStep(step);
      setIsComplete(complete);
    } else {
      setCurrentStep("CASH_ON_HAND");
      setIsComplete(false);
    }
  }, [user]);

  const saveState = useCallback((step: ChecklistStep, complete: boolean) => {
    if (!user) return;
    const state = { step, complete, timestamp: new Date().toISOString() };
    localStorage.setItem(
      `opening_checklist_${user.id}_${new Date().toDateString()}`,
      JSON.stringify(state)
    );
  }, [user]);

  const completeCashOnHand = useCallback(async (amount: string) => {
    // Here you would typically call an API to log the starting cash
    console.log(`Starting cash confirmed: ₱${amount}`);
    const nextStep: ChecklistStep = "INVENTORY_AUDIT";
    setCurrentStep(nextStep);
    saveState(nextStep, false);
    
    // Automatic redirect to inventory
    router.push("/employee/inventory/pawned-items");
  }, [saveState, router]);

  const completeInventoryAudit = useCallback(async () => {
    console.log("Unified inventory audit complete");
    const nextStep: ChecklistStep = "COMPLETED";
    setCurrentStep(nextStep);
    setIsComplete(true);
    saveState(nextStep, true);
  }, [saveState]);

  const resetChecklist = useCallback(() => {
    setCurrentStep("CASH_ON_HAND");
    setIsComplete(false);
    if (user) {
      localStorage.removeItem(`opening_checklist_${user.id}_${new Date().toDateString()}`);
    }
  }, [user]);

  return (
    <OpeningChecklistContext.Provider
      value={{
        currentStep,
        isComplete,
        completeCashOnHand,
        completeInventoryAudit,
        resetChecklist,
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
