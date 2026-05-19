"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { api, ApiError } from "@/lib/api";

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

type DailyOpeningStatusApi = {
  expectedStartingCash?: number;
};

/**
 * Branch-wide starting balance + checklist modal for employees (all routes, including pawn).
 */
export function OpeningChecklistWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStep, isComplete, completeCashOnHand } = useOpeningChecklist();
  const [expectedCash, setExpectedCash] = useState("0");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (currentStep !== "CASH_ON_HAND" || isComplete) return;

    let cancelled = false;
    setIsLoadingExpectedAmount(true);
    (async () => {
      let resolved: number | null = null;

      try {
        const opening = await api.get<DailyOpeningStatusApi>(
          "/branch-finance/daily-opening/status",
        );
        if (cancelled) return;
        if (
          opening?.expectedStartingCash != null &&
          Number.isFinite(Number(opening.expectedStartingCash))
        ) {
          resolved = Number(opening.expectedStartingCash);
        }
      } catch (e) {
        console.warn("[OpeningChecklistWrapper] daily-opening status failed", e);
      }

      if (resolved === null) {
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
            resolved = Number(session.latestBalance?.endingBalance ?? 0);
          }
        } catch (e) {
          console.warn(
            "[OpeningChecklistWrapper] business-session fetch failed",
            e,
          );
        }
      }

      if (resolved === null && !cancelled) {
        try {
          const bal = await api.get<{
            startingBalance: number;
            endingBalance: number;
          }>("/branch-finance/latest-balance");
          if (!cancelled) {
            resolved = Number(bal?.endingBalance ?? bal?.startingBalance ?? 0);
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

  const handleConfirm = async (amount: string) => {
    setSubmitError(null);
    try {
      await completeCashOnHand(amount);
    } catch (e: unknown) {
      if (
        e instanceof ApiError &&
        e.statusCode === 422 &&
        e.payload?.code === "STARTING_BALANCE_MISMATCH"
      ) {
        const expected = Number(e.payload?.expectedAmount);
        const entered = Number(e.payload?.enteredAmount);
        const businessDate =
          typeof e.payload?.businessDate === "string"
            ? e.payload.businessDate
            : "";
        const incidentBase = pathname?.includes("/admin/")
          ? "/admin/incident-report"
          : "/employee/incident-report";
        const qs = new URLSearchParams({
          startingMismatch: "1",
          expected: Number.isFinite(expected) ? String(expected) : "0",
          entered: Number.isFinite(entered) ? String(entered) : amount,
          businessDate,
        });
        router.push(`${incidentBase}?${qs.toString()}`);
        return;
      }
      setSubmitError(
        e instanceof ApiError ? e.message : "Could not save starting balance.",
      );
      throw e;
    }
  };

  if (isComplete) return null;

  return (
    <>
      {submitError ? (
        <div className="fixed inset-x-4 top-4 z-[110] mx-auto max-w-lg rounded-lg border border-red-300 bg-red-950/90 px-4 py-3 text-sm text-red-50 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <span>{submitError}</span>
            <button
              type="button"
              className="shrink-0 font-bold text-red-200 hover:underline"
              onClick={() => setSubmitError(null)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      <DailyBalanceConfirmation
        isOpen={currentStep === "CASH_ON_HAND"}
        type="starting"
        titleOverride="Branch starting balance"
        subtitleOverride="Confirm physical cash on hand. Expected amount matches the branch book ending from the last closed day (or system suggestion)."
        currentCash={expectedCash}
        onConfirm={handleConfirm}
        onClose={() => {}}
      />
    </>
  );
}
