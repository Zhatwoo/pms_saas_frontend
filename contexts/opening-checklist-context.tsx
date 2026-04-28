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
import { api } from "@/lib/api";

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

  const saveState = useCallback((step: ChecklistStep, complete: boolean) => {
    if (!user) return;
    const state = { step, complete, timestamp: new Date().toISOString() };
    localStorage.setItem(
      `opening_checklist_${user.id}_${new Date().toDateString()}`,
      JSON.stringify(state)
    );
  }, [user]);

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
      // NEW: Check if there's any inventory. If none, we might be a new branch or have 0 items.
      const checkInventory = async () => {
        try {
          const tally = await api.post<any>("/inventory/pawned/qr-tally", {
            branch_id: user.branchId,
            scanned_item_ids: [],
          });
          
          if (tally && tally.totalInSystem === 0) {
            console.log("[Checklist] No items found in inventory. Auto-completing checklist.");
            setCurrentStep("COMPLETED");
            setIsComplete(true);
            saveState("COMPLETED", true);
            return;
          }
        } catch (err) {
          console.warn("[Checklist] Could not verify inventory for auto-skip:", err);
        }
        
        setCurrentStep("CASH_ON_HAND");
        setIsComplete(false);
      };
      
      void checkInventory();
    }
  }, [user, saveState]);

  const completeCashOnHand = useCallback(async (amount: string) => {
    // Call Start Day API to persist the starting cash balance
    try {
      await api.post("/branch-finance/daily-balance", {
        type: "starting",
        amount: parseFloat(amount) || 0,
      });
    } catch (err) {
      console.error("Failed to confirm starting cash:", err);
    }

    const nextStep: ChecklistStep = "INVENTORY_AUDIT";
    setCurrentStep(nextStep);
    saveState(nextStep, false);

    // Only redirect to inventory if not already on pawn transaction page
    if (!pathname?.includes("/pawn-transaction")) {
      router.push("/employee/inventory/pawned-items");
    }
  }, [saveState, router, pathname]);

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
