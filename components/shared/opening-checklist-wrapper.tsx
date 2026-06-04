"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { InventoryAuditModal } from "./inventory-audit-modal";
import { api, ApiError } from "@/lib/api";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { toast } from "sonner";

/** Subset of `/branch-finance/business-session` used for operational gate only. */
interface BusinessSessionGateApi {
  operationalCashAllowed: boolean;
  pendingStartingSession: {
    suggestedStartingBalance: number;
  } | null;
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
  const {
    currentStep,
    isComplete,
    openingChecklistModalHidden,
    hideOpeningChecklistModal,
    resetOpeningChecklistModalHidden,
    completeCashOnHand,
    completeInventoryAudit,
    refreshOpeningChecklistFromServer,
  } = useOpeningChecklist();
  const [expectedCash, setExpectedCash] = useState("0");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingExpectedAmount, setIsLoadingExpectedAmount] = useState(false);

  const isOnIncidentReportPage = Boolean(pathname?.includes("/incident-report"));
  const showStartingBalanceModal =
    currentStep === "CASH_ON_HAND" &&
    !openingChecklistModalHidden &&
    !isOnIncidentReportPage;

  useEffect(() => {
    if (isOnIncidentReportPage) {
      resetOpeningChecklistModalHidden();
    }
  }, [isOnIncidentReportPage, resetOpeningChecklistModalHidden]);

  useEffect(() => {
    if (currentStep !== "CASH_ON_HAND" || isComplete) return;

    let cancelled = false;
    setIsLoadingExpectedAmount(true);
    (async () => {
      try {
        const [bizSession, opening] = await Promise.all([
          api.get<BusinessSessionGateApi>("/branch-finance/business-session"),
          api.get<DailyOpeningStatusApi>("/branch-finance/daily-opening/status").catch(
            () => ({ expectedStartingCash: undefined } as DailyOpeningStatusApi),
          ),
        ]);
        if (cancelled) return;

        if (bizSession.operationalCashAllowed === true) {
          await refreshOpeningChecklistFromServer();
          setIsLoadingExpectedAmount(false);
          return;
        }

        let resolved: number | null = null;
        if (
          opening?.expectedStartingCash != null &&
          Number.isFinite(Number(opening.expectedStartingCash))
        ) {
          resolved = Number(opening.expectedStartingCash);
        } else if (bizSession?.pendingStartingSession != null) {
          resolved = Number(
            bizSession.pendingStartingSession.suggestedStartingBalance ?? 0,
          );
        }

        if (!cancelled) {
          setExpectedCash(String(resolved ?? 0));
          setIsLoadingExpectedAmount(false);
        }
      } catch (e) {
        console.warn(
          "[OpeningChecklistWrapper] expected starting amount fetch failed",
          e,
        );
        if (!cancelled) setIsLoadingExpectedAmount(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsLoadingExpectedAmount(false);
    };
  }, [currentStep, isComplete, refreshOpeningChecklistFromServer]);

  const redirectStartingMismatch = (
    expected: number,
    entered: number,
    businessDate: string,
  ) => {
    hideOpeningChecklistModal();
    toast.error("Starting cash mismatch. Please file an incident report.");
    const incidentBase = pathname?.includes("/admin/")
      ? "/admin/incident-report"
      : "/employee/incident-report";
    const qs = new URLSearchParams({
      startingMismatch: "1",
      expected: String(expected),
      entered: String(entered),
      businessDate,
    });
    router.replace(`${incidentBase}?${qs.toString()}`);
  };

  const handleConfirm = async (amount: string) => {
    setSubmitError(null);

    const entered = parseFloat(amount.replace(/,/g, "")) || 0;
    const expected = parseFloat(String(expectedCash).replace(/,/g, "")) || 0;
    if (Math.abs(expected - entered) > 0.009) {
      redirectStartingMismatch(
        expected,
        entered,
        getPhCalendarDateString(),
      );
      return;
    }

    try {
      await completeCashOnHand(amount);
    } catch (e: unknown) {
      if (
        e instanceof ApiError &&
        e.statusCode === 422 &&
        e.payload?.code === "STARTING_BALANCE_MISMATCH"
      ) {
        const mismatchExpected = Number(
          e.payload?.expectedAmount ?? e.payload?.required_amount ?? expected,
        );
        const mismatchEntered = Number(
          e.payload?.enteredAmount ?? entered,
        );
        const businessDate =
          typeof e.payload?.businessDate === "string"
            ? e.payload.businessDate
            : typeof e.payload?.business_date === "string"
              ? e.payload.business_date
              : getPhCalendarDateString();
        redirectStartingMismatch(
          Number.isFinite(mismatchExpected) ? mismatchExpected : expected,
          Number.isFinite(mismatchEntered) ? mismatchEntered : entered,
          businessDate,
        );
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
        isOpen={showStartingBalanceModal}
        type="starting"
        titleOverride="Branch starting balance"
        subtitleOverride="Confirm physical cash on hand. Expected amount matches the branch book ending from the last closed day (or system suggestion)."
        currentCash={expectedCash}
        isLoadingExpectedAmount={isLoadingExpectedAmount}
        onConfirm={handleConfirm}
        onClose={() => {}}
      />
      <InventoryAuditModal
        isOpen={currentStep === "INVENTORY_AUDIT"}
        onConfirm={completeInventoryAudit}
        onClose={() => {}}
        isMandatory={true}
      />
    </>
  );
}
