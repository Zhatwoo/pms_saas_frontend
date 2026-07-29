import { useEffect, useState } from "react";
import { StatCard, ThreeDotLoader } from "@/components/shared/stat-card";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { TransactionStatsData } from "./types";
import { getPhCalendarDateString } from "@/lib/branch-calendar-date";

const pawnedIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const buyBackIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const renewedIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

const soldIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const balanceIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

interface BranchFinanceSummaryRecord {
  currentBalance: number;
}

interface TransactionStatsProps {
  data?: TransactionStatsData;
  isLoading?: boolean;
  selectedDate?: string;
}

export function TransactionStats({ data, isLoading = false, selectedDate }: TransactionStatsProps) {
  const todayString = getPhCalendarDateString();
  const isToday = !selectedDate || selectedDate === todayString;
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [liveCompanyBalance, setLiveCompanyBalance] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    if (isSuperAdmin) {
      api.get<BranchFinanceSummaryRecord[]>('/branch-finance/summary')
        .then((res) => {
           if (!active) return;
           const total = res.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);
           setLiveCompanyBalance(total);
        })
        .catch(console.error);
    }
    return () => { active = false; };
  }, [isSuperAdmin]);

  return (
    <div 
      className={`grid gap-4 ${
        isSuperAdmin 
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}
    >
      <StatCard
        label={isToday ? "Pawned Today" : "Pawned Items"}
        value={data?.pawnedToday || 0}
        subtitle="Active contracts"
        icon={pawnedIcon}
        borderColor="bg-brand-green"
        loading={isLoading}
      />
      <StatCard
        label="Buy Back"
        value={data?.buyBack || 0}
        subtitle="Purchased today"
        icon={buyBackIcon}
        borderColor="bg-blue-600"
        loading={isLoading}
      />
      <StatCard
        label="Renewed"
        value={data?.renewed || 0}
        subtitle="Contracts renewed"
        icon={renewedIcon}
        borderColor="bg-amber-500"
        loading={isLoading}
      />
      <StatCard
        label="Sold Item"
        value={data?.soldItem || 0}
        subtitle="Units sold"
        icon={soldIcon}
        borderColor="bg-orange-500"
        loading={isLoading}
      />

      {isSuperAdmin && (
        <div className="flex flex-col justify-between rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
          <div className="mb-3 h-1 w-full rounded-full bg-text-primary" />
          
          {/* Starting Balance */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                Start Balance
              </p>
              <p className="mt-0.5 text-xl font-bold text-text-primary">
                {isLoading ? <ThreeDotLoader /> : <>₱ {data?.startingBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</>}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-tertiary">
              {balanceIcon}
            </div>
          </div>

          <div className="my-2.5 border-t border-dashed border-border-main" />

          {/* Ending Balance (Range End) */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                End Balance (Range)
              </p>
              <p className="mt-0.5 text-xl font-bold text-brand-green">
                {isLoading ? <ThreeDotLoader /> : <>₱ {data?.endingBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</>}
              </p>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="flex flex-col justify-between rounded-lg border border-pawn-sidebar bg-pawn-sidebar p-4 shadow-sm">
          <div className="flex items-center gap-3 h-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pawn-sidebar-light text-pawn-gold">
              {balanceIcon}
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-white/70">
                Live Total Balance For All Branches
              </p>
              <p className="mt-0.5 text-lg xl:text-xl font-bold text-yellow-500">
                {isLoading ? <ThreeDotLoader /> : <>₱ {liveCompanyBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
