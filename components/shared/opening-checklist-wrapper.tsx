"use client";

import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { InventoryAuditModal } from "./inventory-audit-modal";

export function OpeningChecklistWrapper() {
  const { currentStep, isComplete, completeCashOnHand, completeInventoryAudit } = useOpeningChecklist();

  if (isComplete) return null;

  return (
    <>
      <DailyBalanceConfirmation
        isOpen={currentStep === "CASH_ON_HAND"}
        type="starting"
        currentCash="10000" // This should ideally come from an API
        onConfirm={completeCashOnHand}
        onClose={() => {}} // Disabled close for mandatory workflow
      />

      <InventoryAuditModal
        isOpen={currentStep === "INVENTORY_AUDIT"}
        onConfirm={completeInventoryAudit}
      />
    </>
  );
}
