import { StatCard, ThreeDotLoader } from "@/components/shared/stat-card";
import { formatPeso } from "@/lib/currency";

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

const redeemIcon = (
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
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h12a5 5 0 0 1 0 10H7" />
  </svg>
);

const transferIcon = (
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
    <path d="m16 3 4 4-4 4" />
    <path d="M20 7H9a7 7 0 0 0 0 14h1" />
  </svg>
);

const balanceIcon = <span className="text-lg font-black leading-none">₱</span>;

export interface TransactionStatsData {
  pawnedToday: number;
  buyBack: number;
  renewed: number;
  soldItem: number;
  redeemed?: number;
  transfer?: number;
  startingBalance: number;
  endingBalance: number;
}

interface TransactionStatsProps {
  data?: TransactionStatsData;
  isLoading?: boolean;
}

export function TransactionStats({ data, isLoading }: TransactionStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 2xl:grid-cols-7 xl:gap-6">
      <StatCard
        label="Pawn Today"
        value={data?.pawnedToday || 0}
        subtitle="Active contracts"
        icon={pawnedIcon}
        borderColor="bg-emerald-600"
        loading={isLoading}
      />
      <StatCard
        label="Buy Back"
        value={data?.redeemed || 0}
        subtitle="Claimed items"
        icon={redeemIcon}
        borderColor="bg-blue-500"
        loading={isLoading}
      />
      <StatCard
        label="Buy Out"
        value={data?.buyBack || 0}
        subtitle="Repurchased units"
        icon={buyBackIcon}
        borderColor="bg-indigo-600"
        loading={isLoading}
      />
      <StatCard
        label="Renewed"
        value={data?.renewed || 0}
        subtitle="Extended terms"
        icon={renewedIcon}
        borderColor="bg-amber-500"
        loading={isLoading}
      />
      <StatCard
        label="Transfer"
        value={data?.transfer || 0}
        subtitle="Internal moves"
        icon={transferIcon}
        borderColor="bg-purple-500"
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
      
      <div className="flex flex-col justify-between overflow-hidden rounded-lg border border-border-main bg-surface p-3 shadow-sm transition-colors duration-300">
        <div className="mb-2 h-1 w-full rounded-full bg-emerald-900 dark:bg-emerald-500" />

        <div className="flex items-start xl:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
              Starting balance
            </p>
            <div className="mt-0.5 text-lg font-black text-text-primary leading-none h-[22px] flex items-center">
              {isLoading ? <ThreeDotLoader /> : formatPeso(data?.startingBalance ?? 0)}
            </div>
          </div>
          <div className="flex h-8 w-8 xl:h-6 xl:w-6 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-tertiary">
            {balanceIcon}
          </div>
        </div>

        <div className="my-2 border-t border-dashed border-border-subtle" />

        <div className="flex items-end xl:items-center justify-between min-w-0">
          <div className="text-right w-full min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
              Ending balance
            </p>
            <div className="mt-0.5 text-lg font-black text-emerald-600 leading-none h-[22px] flex items-center justify-end">
              {isLoading ? <ThreeDotLoader /> : formatPeso(data?.endingBalance ?? 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
