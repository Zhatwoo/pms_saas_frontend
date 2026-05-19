"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useOptionalOpeningChecklist } from "@/contexts/opening-checklist-context";
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
  /** Employee pawn: after successful End day, sign out and return to login. */
  logoutAfterEndDay?: boolean;
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
  logoutAfterEndDay = false,
}: BranchDaySessionToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  /** Employee layout wraps `OpeningChecklistProvider`; admin/super-admin shells do not — skip gating then. */
  const openingChecklist = useOptionalOpeningChecklist();
  const currentStep = openingChecklist?.currentStep ?? "COMPLETED";
  const isComplete = openingChecklist?.isComplete ?? true;
  const [session, setSession] = useState<BusinessSessionApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  /** While refetching with Start modal open, avoid flashing EXPECTED to 0 before new session arrives. */
  const lastResolvedExpectedCash = useRef<string | null>(null);

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
    lastResolvedExpectedCash.current = null;
  }, [branchId]);

  useEffect(() => {
    if (loading) return;
    const pending = session?.pendingStartingSession?.suggestedStartingBalance;
    if (pending != null && Number.isFinite(Number(pending))) {
      lastResolvedExpectedCash.current = String(pending);
      return;
    }
    const fromLatest = Number(session?.latestBalance?.endingBalance ?? 0);
    if (Number.isFinite(fromLatest)) {
      lastResolvedExpectedCash.current = String(fromLatest);
    }
  }, [session, loading]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onTxn = () => void loadSession();
    window.addEventListener("transaction_created", onTxn);
    return () => window.removeEventListener("transaction_created", onTxn);
  }, [loadSession]);

  /** After end-day, snapshot is stale until refetch — reload when Start modal opens so EXPECTED matches last close. */
  useEffect(() => {
    if (startOpen && visible) {
      void loadSession();
    }
  }, [startOpen, visible, loadSession]);

  const suggestedCash =
    session?.pendingStartingSession != null
      ? String(
          session.pendingStartingSession.suggestedStartingBalance ?? 0,
        )
      : String(Number(session?.latestBalance?.endingBalance ?? 0));

  const expectedCashForModal =
    startOpen &&
    loading &&
    lastResolvedExpectedCash.current != null
      ? lastResolvedExpectedCash.current
      : suggestedCash;

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
      if (
        e instanceof ApiError &&
        e.statusCode === 422 &&
        e.payload &&
        typeof e.payload === "object" &&
        (e.payload as { code?: string }).code === "STARTING_BALANCE_MISMATCH"
      ) {
        const p = e.payload as {
          expectedAmount?: number;
          enteredAmount?: number;
          businessDate?: string;
        };
        const expected = Number(p.expectedAmount);
        const entered = Number(p.enteredAmount);
        const businessDate =
          typeof p.businessDate === "string" ? p.businessDate : "";
        setStartOpen(false);
        setBanner(null);
        const incidentBase = pathname?.includes("/admin/")
          ? "/admin/incident-report"
          : "/employee/incident-report";
        const qs = new URLSearchParams({
          startingMismatch: "1",
          expected: Number.isFinite(expected) ? String(expected) : "0",
          entered: Number.isFinite(entered) ? String(entered) : "0",
          businessDate,
        });
        router.push(`${incidentBase}?${qs.toString()}`);
        return;
      }
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
      if (logoutAfterEndDay) {
        logout();
        return;
      }
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
  const checklistHandlesStarting =
    currentStep === "CASH_ON_HAND" && !isComplete;

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
          
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                loading ||
                !needsStart ||
                checklistHandlesStarting
              }
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
        currentCash={expectedCashForModal}
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
