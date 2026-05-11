"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { DailyBalanceConfirmation } from "@/components/shared/daily-balance-confirmation";
import { BranchEndDayModal } from "@/components/shared/branch-end-day-modal";

interface BusinessSessionApi {
  manilaCalendarDate: string;
  operationalCashAllowed: boolean;
  systemEndingBalanceToday: number | null;
  pendingStartingSession: {
    businessDate: string;
    suggestedStartingBalance: number;
  } | null;
  latestBalance: {
    startingBalance: number;
    endingBalance: number;
    date: string;
  };
}

export interface BranchDaySessionToolbarProps {
  /** Hide when missing or `"__all__"` (aggregate branch view). */
  branchId: string | null | undefined;
  onSessionChanged?: () => void;
  /** Employee shell: keep opening checklist in sync after submitting starting balance. */
  syncOpeningChecklist?: () => Promise<void>;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export function BranchDaySessionToolbar({
  branchId,
  onSessionChanged,
  syncOpeningChecklist,
}: BranchDaySessionToolbarProps) {
  const [session, setSession] = useState<BusinessSessionApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const visible =
    typeof branchId === "string" &&
    branchId.length > 0 &&
    branchId !== "__all__";

  const loadSession = useCallback(async () => {
    if (!visible) {
      setSession(null);
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      const qs = `?branch=${encodeURIComponent(branchId)}`;
      const data = await api.get<BusinessSessionApi>(
        `/branch-finance/business-session${qs}`,
      );
      setSession(data);
    } catch (e: unknown) {
      setSession(null);
      setBanner(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [branchId, visible]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onTxn = () => void loadSession();
    window.addEventListener("transaction_created", onTxn);
    return () => window.removeEventListener("transaction_created", onTxn);
  }, [loadSession]);

  const suggestedCash =
    session?.pendingStartingSession != null
      ? String(session.pendingStartingSession.suggestedStartingBalance)
      : String(session?.latestBalance?.startingBalance ?? 0);

  const systemEnding =
    session?.systemEndingBalanceToday ??
    session?.latestBalance?.endingBalance ??
    0;

  const handleStartConfirm = async (amount: string) => {
    try {
      await api.post("/branch-finance/daily-balance", {
        type: "starting",
        amount: parseFloat(amount.replace(/,/g, "")) || 0,
      });
      setStartOpen(false);
      await syncOpeningChecklist?.();
      await loadSession();
      onSessionChanged?.();
    } catch (e: unknown) {
      setBanner(errorMessage(e));
      throw e;
    }
  };

  const handleEndConfirm = async (physicalEndingAmount: number | undefined) => {
    try {
      await api.post("/branch-finance/end-day", {
        confirmed: true,
        ...(physicalEndingAmount !== undefined
          ? { physicalEndingAmount }
          : {}),
      });
      setEndOpen(false);
      await loadSession();
      onSessionChanged?.();
    } catch (e: unknown) {
      setBanner(errorMessage(e));
      throw e;
    }
  };

  if (!visible) return null;

  const open = session?.operationalCashAllowed === true;
  const needsStart = session != null && !session.operationalCashAllowed;

  return (
    <>
      <div className="rounded-xl border border-border-main bg-surface-secondary/80 px-4 py-3 shadow-sm print-hide">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Branch day (Manila)
            </p>
            <p className="truncate text-sm font-semibold text-text-primary">
              {loading
                ? "Checking session…"
                : session
                  ? open
                    ? `Open — ${session.manilaCalendarDate}`
                    : `Needs starting balance / closed — ${session.manilaCalendarDate}`
                  : "Session unavailable"}
            </p>
            <p className="mt-0.5 text-[11px] text-text-tertiary">
              Simulan ang araw (starting balance) o tapusin ang araw dito — hindi lang sa Branch Finance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading || !needsStart}
              onClick={() => setStartOpen(true)}
              className="rounded-lg border border-emerald-700 bg-emerald-800 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-300 shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start day
            </button>
            <button
              type="button"
              disabled={loading || !open}
              onClick={() => setEndOpen(true)}
              className="rounded-lg border border-amber-600/80 bg-amber-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              End day
            </button>
          </div>
        </div>
        {banner ? (
          <div className="mt-3 flex items-start justify-between gap-2 rounded-lg border border-red-300/50 bg-red-950/30 px-3 py-2 text-xs text-red-100">
            <span>{banner}</span>
            <button
              type="button"
              className="shrink-0 font-bold text-red-200 hover:underline"
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </div>
        ) : null}
      </div>

      <DailyBalanceConfirmation
        isOpen={startOpen}
        type="starting"
        currentCash={suggestedCash}
        titleOverride="Start branch day"
        subtitleOverride="Ilagay ang physical starting balance para sa branch ngayong petsa (Manila). Parehong sesyon ito para sa lahat ng empleyado."
        onClose={() => setStartOpen(false)}
        onConfirm={handleStartConfirm}
      />

      <BranchEndDayModal
        isOpen={endOpen}
        systemEndingBalance={systemEnding}
        manilaBusinessDate={session?.manilaCalendarDate ?? ""}
        onClose={() => setEndOpen(false)}
        onConfirm={handleEndConfirm}
      />
    </>
  );
}
