"use client";

import { useState, useEffect } from "react";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { formatPeso } from "@/lib/currency";
import { toast } from "sonner";
import { AddIncidentModal } from "@/app/(pages)/incident-report/_components/add-incident-modal";
import type {
  IncidentCategory,
  IncidentPriority,
  ManualTicketFormState,
  UserRecord,
} from "@/app/(pages)/incident-report/_components/types";

interface DailyBalanceConfirmationProps {
  isOpen: boolean;
  type: "starting" | "ending";
  currentCash: string;
  onConfirm: (amount: string) => void;
  onClose: () => void;
  /** Override title line (e.g. new business day branch messaging). */
  titleOverride?: string;
  /** Override subtitle under title. */
  subtitleOverride?: string;
  /** When true, disables Confirm button to prevent submission while expected amount is loading. */
  isLoadingExpectedAmount?: boolean;
}

export function DailyBalanceConfirmation({
  isOpen,
  type,
  currentCash,
  onConfirm,
  onClose,
  titleOverride,
  subtitleOverride,
  isLoadingExpectedAmount,
}: DailyBalanceConfirmationProps) {
  const { selectedBranch } = useBranch();
  const [confirmedAmount, setConfirmedAmount] = useState("0.00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIncidentReportOpen, setIsIncidentReportOpen] = useState(false);
  const [isIncidentSubmitting, setIsIncidentSubmitting] = useState(false);
  const [incidentForm, setIncidentForm] = useState<ManualTicketFormState>(() => ({
    title: "Starting balance issue",
    summary: "",
    category: "opening_cash",
    priority: "high",
    branchId: selectedBranch.id,
    userId: "",
    amountImpact: "",
    transactionRef: "",
    requiresManagerEscalation: false,
  }));

  useEffect(() => {
    if (!isOpen) return;

    setIsSubmitting(false);
    setConfirmedAmount(
      (Number(String(currentCash ?? "0").replace(/,/g, "")) || 0).toLocaleString(
        "en-PH",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      ),
    );
  }, [isOpen, type, currentCash]);

  if (!isOpen) return null;

  const formatCurrencyInput = (value: string) => {
    // Remove all non-numeric characters
    const digits = value.replace(/\D/g, "");
    if (!digits) return "0.00";

    // Convert to number and back to string with 2 decimal places
    const amount = parseInt(digits, 10) / 100;
    return amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setConfirmedAmount(formatted);
  };

  const expectedAmount = Number(String(currentCash ?? "0").replace(/,/g, "")) || 0;
  const enteredAmount = Number(confirmedAmount.replace(/,/g, "")) || 0;
  const isStartingBelowExpected = type === "starting" && enteredAmount < expectedAmount;

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (isStartingBelowExpected) {
      toast.error("Actual physical cash cannot be lower than the expected amount.");
      return;
    }
    const rawValue = confirmedAmount.replace(/,/g, "");
    if (isNaN(parseFloat(rawValue))) return;

    setIsSubmitting(true);
    try {
      await onConfirm(rawValue);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save balance. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncidentReport = () => {
    const expectedAmount = Number(String(currentCash ?? "0").replace(/,/g, "")) || 0;
    const enteredAmount = Number(confirmedAmount.replace(/,/g, "")) || 0;
    const amountImpact = Math.abs(expectedAmount - enteredAmount);

    setIncidentForm({
      title: "Starting balance issue",
      summary: `Starting balance needs review. Expected ${formatPeso(expectedAmount)} and entered ${formatPeso(enteredAmount)}.`,
      category: "opening_cash",
      priority: amountImpact > 0 ? "high" : "medium",
      branchId: selectedBranch.id,
      userId: "",
      amountImpact: amountImpact > 0 ? String(amountImpact) : "",
      transactionRef: "Starting balance",
      requiresManagerEscalation: amountImpact > 0,
    });

    setIsIncidentReportOpen(true);
  };

  const handleIncidentSubmit = async () => {
    if (isIncidentSubmitting) return;

    setIsIncidentSubmitting(true);
    try {
      await api.post("/incident-tickets", {
        title: incidentForm.title.trim(),
        summary: incidentForm.summary.trim(),
        category: incidentForm.category as IncidentCategory,
        priority: incidentForm.priority as IncidentPriority,
        branchId: incidentForm.branchId,
        userId: null,
        amountImpact: incidentForm.amountImpact ? Number(incidentForm.amountImpact) : null,
        transactionRef: incidentForm.transactionRef.trim() || null,
        requiresManagerEscalation: incidentForm.requiresManagerEscalation,
      });

      toast.success("Incident report saved.");
      setIsIncidentReportOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save incident report.";
      toast.error(message);
    } finally {
      setIsIncidentSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto scale-in-center rounded-2xl border border-border-main bg-surface p-4 shadow-2xl sm:p-6">
        <div className="mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-green text-pawn-gold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold capitalize text-text-primary sm:text-xl">
              {titleOverride ?? `${type} Cash Confirmation`}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
              {subtitleOverride ??
                "Please verify the physical cash on hand before proceeding."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4 text-center">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Expected Amount
            </label>
            <p className="text-2xl font-black text-pawn-gold sm:text-3xl">
              {formatPeso(
                Number(String(currentCash ?? "0").replace(/,/g, "")) || 0,
              )}
            </p>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <label className="text-xs font-bold text-text-secondary">
              Actual Physical Cash
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">
                ₱
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={confirmedAmount}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border-2 border-border-main bg-surface py-3.5 pl-10 pr-4 text-center text-xl font-black text-pawn-gold outline-none transition-all focus:border-brand-green disabled:opacity-50 sm:py-4 sm:text-left"
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center sm:text-left">
            <p className="text-[10px] font-medium leading-relaxed text-amber-800">
              <span className="font-bold">Note:</span> Any discrepancy will be logged and flagged for management review. Ensure all coins and bills are counted.
            </p>
          </div>
        </div>

          <div
            className={`mt-6 sm:mt-8 ${
              type === "starting"
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                : "flex flex-col gap-3 sm:flex-row"
            }`}
          >
          {type === "starting" && (
            <button
              type="button"
              onClick={handleIncidentReport}
              className="w-full rounded-xl border border-red-600 bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-50 sm:py-3"
            >
              Incident Report
            </button>
          )}
          {type !== "starting" && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border-main py-3.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50 sm:flex-1 sm:py-3"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !confirmedAmount || isLoadingExpectedAmount || isStartingBelowExpected}
            className={`w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 ${
              type !== "starting" ? "sm:flex-1" : ""
            } ${
              type === "starting" ? "bg-brand-green shadow-brand-green/20" : "bg-amber-600 shadow-amber-600/20"
            }`}
          >
            {isSubmitting ? "Processing..." : isLoadingExpectedAmount ? "Loading expected amount..." : "Confirm & Proceed"}
          </button>
          </div>

        {type === "starting" && isStartingBelowExpected ? (
          <p className="mt-3 text-center text-xs font-semibold text-red-600 sm:text-left">
            Actual physical cash must be equal to or higher than the expected amount before you can proceed.
          </p>
        ) : null}
        </div>
      </div>

      {isIncidentReportOpen ? (
        <AddIncidentModal
          formState={incidentForm}
          setFormState={setIncidentForm}
          branches={[selectedBranch]}
          users={[] as UserRecord[]}
          categoryOptions={[
            { value: "opening_cash", label: "Opening Cash Issue" },
            { value: "cash_shortage", label: "Cash Shortage" },
            { value: "other", label: "Other Money Incident" },
          ]}
          priorityOptions={[
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          isLoadingUsers={false}
          isSubmitting={isIncidentSubmitting}
          canSelectBranch={false}
          canSelectUser={false}
          onClose={() => setIsIncidentReportOpen(false)}
          onSubmit={handleIncidentSubmit}
          getUserName={() => ""}
        />
      ) : null}
    </>
  );
}
