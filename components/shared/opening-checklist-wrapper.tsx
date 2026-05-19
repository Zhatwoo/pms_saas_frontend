"use client";

import { useEffect, useState } from "react";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { InventoryAuditModal } from "./inventory-audit-modal";
import { api } from "@/lib/api";

/** Subset of `/branch-finance/business-session` used for expected starting cash. */
interface BusinessSessionExpectedApi {
  pendingStartingSession: {
    suggestedStartingBalance: number;
  } | null;
  latestBalance: {
    startingBalance: number;
    endingBalance: number;
    date: string;
  };
}

/**
 * Branch-wide starting balance + checklist modal for employees (all routes, including pawn).
 */
export function OpeningChecklistWrapper() {
  const { currentStep, isComplete, completeCashOnHand, completeInventoryAudit } = useOpeningChecklist();
  const [expectedCash, setExpectedCash] = useState("0");
  const [isLoadingExpectedAmount, setIsLoadingExpectedAmount] = useState(true);

  // Expected cash: business-session suggestion first (matches toolbar), then latest-balance.
  useEffect(() => {
    if (currentStep !== "CASH_ON_HAND" || isComplete) return;

    let cancelled = false;
    setIsLoadingExpectedAmount(true);
    (async () => {
      let resolved: number | null = null;

      try {
        const session = await api.get<BusinessSessionExpectedApi>(
          "/branch-finance/business-session",
        );
        if (cancelled) return;
        if (session?.pendingStartingSession != null) {
          resolved = Number(
            session.pendingStartingSession.suggestedStartingBalance ?? 0,
          );
        } else if (session) {
          resolved = Math.max(
            Number(session.latestBalance?.endingBalance ?? 0),
            Number(session.latestBalance?.startingBalance ?? 0),
          );
        }
      } catch (e) {
        console.warn(
          "[OpeningChecklistWrapper] business-session fetch failed",
          e,
        );
      }

      if (cancelled) return;

      if (resolved === null) {
        try {
          const bal = await api.get<{
            startingBalance: number;
            endingBalance: number;
          }>("/branch-finance/latest-balance");
          if (!cancelled) {
            resolved = Math.max(
              Number(bal?.endingBalance ?? 0),
              Number(bal?.startingBalance ?? 0),
            );
          }
        } catch (e) {
          console.warn(
            "[OpeningChecklistWrapper] latest-balance fetch failed",
            e,
          );
          resolved = 0;
        }
      }

      if (!cancelled) {
        setExpectedCash(String(resolved ?? 0));
        setIsLoadingExpectedAmount(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStep, isComplete]);

  if (isComplete) return null;

  return (
    <>
      <DailyBalanceConfirmation
        isOpen={currentStep === "CASH_ON_HAND"}
        type="starting"
        titleOverride="Branch starting balance"
        subtitleOverride="Confirm physical cash on hand. Expected amount is the branch's last recorded ending balance (or system suggestion)—usually after End Day—adjust if it differs."
        currentCash={expectedCash}
        onConfirm={completeCashOnHand}
        onClose={() => {}} // Disabled close for mandatory workflow
        isLoadingExpectedAmount={isLoadingExpectedAmount}
      />

      <InventoryAuditModal
        isOpen={currentStep === "INVENTORY_AUDIT"}
        displayMode="overlay"
        isMandatory={true}
        onConfirm={completeInventoryAudit}
        onClose={() => {}} // Mandatory
      />
    </>
  );
}
