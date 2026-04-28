"use client";

import { useEffect, useState } from "react";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { InventoryAuditModal } from "./inventory-audit-modal";
import { api } from "@/lib/api";

export function OpeningChecklistWrapper() {
  const { currentStep, isComplete, completeCashOnHand, completeInventoryAudit } = useOpeningChecklist();
  const [expectedCash, setExpectedCash] = useState("0");

  // Fetch latest balance dynamically when the cash-on-hand step is active
  useEffect(() => {
    if (currentStep !== "CASH_ON_HAND" || isComplete) return;

    let cancelled = false;
    (async () => {
      try {
        const bal = await api.get<{ startingBalance: number; endingBalance: number }>(
          "/branch-finance/latest-balance"
        );
        if (!cancelled) {
          setExpectedCash(String(bal?.endingBalance ?? 0));
        }
      } catch {
        // Fallback to 0 if API fails
      }
    })();

    return () => { cancelled = true; };
  }, [currentStep, isComplete]);

  if (isComplete) return null;

  return (
    <>
      <DailyBalanceConfirmation
        isOpen={currentStep === "CASH_ON_HAND"}
        type="starting"
        currentCash={expectedCash}
        onConfirm={completeCashOnHand}
        onClose={() => {}} // Disabled close for mandatory workflow
      />

      <InventoryAuditModal
        isOpen={currentStep === "INVENTORY_AUDIT"}
        onConfirm={completeInventoryAudit}
        onClose={() => {}} // Disabled close for mandatory workflow
      />
    </>
  );
}
