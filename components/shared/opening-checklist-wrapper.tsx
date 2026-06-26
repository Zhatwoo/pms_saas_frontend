"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { DailyBalanceConfirmation } from "./daily-balance-confirmation";
import { InventoryAuditModal } from "./inventory-audit-modal";
import { ApiError } from "@/lib/api";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";
import { toast } from "sonner";

/**
 * Branch-wide starting balance + checklist modal for employees (all routes, including pawn).
 */
export function OpeningChecklistWrapper() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isEmployee = user?.role === "employee";
  const {
    currentStep,
    isComplete,
    modulesAllowed,
    isOpeningChecklistReady,
    expectedStartingCash,
    openingChecklistModalHidden,
    hideOpeningChecklistModal,
    completeCashOnHand,
    completeInventoryAudit,
  } = useOpeningChecklist();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOnIncidentReportPage = Boolean(pathname?.includes("/incident-report"));
  const showStartingBalanceModal =
    isEmployee &&
    !modulesAllowed &&
    currentStep === "CASH_ON_HAND" &&
    !openingChecklistModalHidden &&
    !isOnIncidentReportPage;

  const expectedCash = String(
    expectedStartingCash != null && Number.isFinite(expectedStartingCash)
      ? expectedStartingCash
      : 0,
  );

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

  if (!isEmployee) return null;

  if (modulesAllowed && isComplete) return null;

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
        titleOverride="Start branch day"
        subtitleOverride="Ilagay ang physical starting balance para sa branch ngayong petsa (Manila). Kailangan ito bago magamit ang system pagkatapos ng End Day."
        currentCash={expectedCash}
        isLoadingExpectedAmount={
          showStartingBalanceModal && !isOpeningChecklistReady
        }
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
