"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { api } from "@/lib/api";

/**
 * Pawn Transaction owns starting-balance modal on that route (single UX surface).
 * Global checklist modal applies sa iba pang employee routes.
 */
export function OpeningChecklistWrapper() {
  const pathname = usePathname();
  const ownsLocally =
    pathname === "/employee/pawn-transaction" ||
    pathname.startsWith("/employee/pawn-transaction/");

  const { currentStep, isComplete, completeCashOnHand } = useOpeningChecklist();
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

  if (ownsLocally) return null;

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
      />
    </>
  );
}
