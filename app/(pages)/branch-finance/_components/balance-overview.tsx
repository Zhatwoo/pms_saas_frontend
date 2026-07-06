"use client";

interface BalanceCardProps {
  branchName: string;
  startingBalance: number;
  currentBalance: number;
  totalAdded: number;
  totalTransferred: number;
  lastUpdated: string;
  onAddFunds?: () => void;
}

interface BranchBalanceRow {
  branchId: string;
  name: string;
  startingBalance: number;
  currentBalance: number;
  status: string;
}

/* ── Icons ─────────────────────────────────────────────── */
function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ── Single Branch Balance Card ─────────────────────────── */
function SingleBranchCard({
  branchName,
  startingBalance,
  currentBalance,
  totalAdded,
  totalTransferred,
  lastUpdated,
  onAddFunds,
}: BalanceCardProps) {
  const delta = currentBalance - startingBalance;
  const deltaPercent = startingBalance > 0 ? ((delta / startingBalance) * 100).toFixed(1) : "0.0";
  const isPositive = delta >= 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 shadow-lg">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-pawn-gold backdrop-blur-sm">
            <WalletIcon />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white md:text-xl">{branchName}</h2>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/70">
              Balance Overview
            </p>
          </div>
        </div>
        <div className="flex w-fit items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm sm:self-auto">
          <ClockIcon />
          <span className="text-[10px] text-emerald-300">
            {fmtDate(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Current Balance (hero) */}
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between md:px-6">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-400/60">
            Current Balance
          </p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-amber-400 sm:text-4xl">
              {fmt(currentBalance)}
            </span>
            <span
              className={`mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                isPositive
                  ? "bg-emerald-400/20 text-emerald-300"
                  : "bg-red-400/20 text-red-300"
              }`}
            >
              {isPositive ? <TrendUpIcon /> : <ArrowDownIcon />}
              {isPositive ? "+" : ""}
              {deltaPercent}%
            </span>
          </div>
        </div>

        {onAddFunds && (
          <div className="w-full shrink-0 sm:w-auto">
            <button
              onClick={onAddFunds}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500/30 sm:w-auto md:px-6 md:py-3 md:text-base"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Manual Cash Transfer
            </button>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-6 sm:grid-cols-3 md:px-6">
        <div className="rounded-lg bg-white/5 px-3.5 py-3 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase text-emerald-400/70">Starting</p>
          <p className="mt-0.5 text-base font-bold text-white">{fmt(startingBalance)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3.5 py-3 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase text-emerald-400/70">End Balance</p>
          <p className="mt-0.5 text-base font-bold text-white">{fmt(currentBalance)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3.5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-1 text-emerald-400/70">
            <ArrowUpIcon />
            <p className="text-xs font-medium uppercase">Added</p>
          </div>
          <p className="mt-0.5 text-base font-bold text-emerald-300">{fmt(totalAdded)}</p>
        </div>
      </div>
    </div>
  );
}

function AggregateBranchCard({
  totalBranches,
  branchRows,
  systemExpenses = 0,
  onAddFunds,
  onAddSystemExpense,
}: {
  totalBranches: number;
  branchRows: BranchBalanceRow[];
  systemExpenses?: number;
  onAddFunds?: () => void;
  onAddSystemExpense?: () => void;
}) {
  const branchTotal = branchRows.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalCurrent = branchTotal - systemExpenses;

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="overflow-hidden rounded-xl border border-border-main bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 shadow-lg">
        <div className="flex flex-col gap-3 px-4 pt-5 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-pawn-gold backdrop-blur-sm">
              <WalletIcon />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white sm:text-xl">All Branches Overview</h2>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/70">
                Combined Balance
              </p>
            </div>
          </div>
          <div className="flex w-fit items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm sm:self-auto">
            <span className="text-[10px] font-bold text-emerald-300">
              {totalBranches} Active Branches
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-400/60">
              Total Overall Sales / Balance
            </p>
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <span className="text-3xl font-extrabold tracking-tight text-amber-400 sm:text-4xl">
                {fmt(totalCurrent)}
              </span>
            </div>
            {systemExpenses > 0 && (
              <p className="mt-1 text-xs font-medium text-emerald-300/80">
                (Branch Total: {fmt(branchTotal)} - System Expenses: {fmt(systemExpenses)})
              </p>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
            {onAddFunds && (
              <button
                onClick={onAddFunds}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500/30 sm:w-auto sm:px-5 sm:py-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Manual Cash Transfer
              </button>
            )}
            {onAddSystemExpense && (
              <button
                onClick={onAddSystemExpense}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2.5 text-sm font-bold text-red-100 transition-colors hover:bg-red-500/30 sm:w-auto sm:px-5 sm:py-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Add System Expense
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of branches */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {branchRows.map((b) => (
          <div
            key={b.branchId}
            className="flex flex-col justify-between rounded-xl border border-border-main bg-surface px-5 py-4 shadow-sm transition-colors hover:border-emerald-500/30 hover:bg-surface-secondary"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-text-primary">{b.name}</p>
                <p className="text-[10px] uppercase text-text-muted">ID: {b.branchId}</p>
              </div>
              <span
                className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold ${
                  b.status === "Active"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-zinc-500/15 text-zinc-300"
                }`}
              >
                {b.status}
              </span>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Start</p>
                <p className={`text-sm font-semibold ${b.startingBalance < 50000 ? "text-amber-500/80" : "text-text-secondary"}`}>{fmt(b.startingBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Current</p>
                <p className="text-sm font-extrabold text-emerald-400">{fmt(b.currentBalance)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Exported component ──────────────────────────────── */
export interface BranchBalance {
  branchId: string;
  name: string;
  startingBalance: number;
  currentBalance: number;
  totalAdded: number;
  totalTransferred: number;
  lastUpdated: string;
  status: string;
}

interface BalanceOverviewProps {
  isAllBranches: boolean;
  selectedBranchId: string;
  selectedBranchName: string;
  balances: BranchBalance[];
  systemExpenses?: number;
  onAddFunds: () => void;
  onAddSystemExpense?: () => void;
}

export function BalanceOverview({
  isAllBranches,
  selectedBranchId,
  selectedBranchName,
  balances,
  systemExpenses = 0,
  onAddFunds,
  onAddSystemExpense,
}: BalanceOverviewProps) {
  if (isAllBranches) {
    return (
      <AggregateBranchCard
        totalBranches={balances.length}
        systemExpenses={systemExpenses}
        onAddFunds={onAddFunds}
        onAddSystemExpense={onAddSystemExpense}
        branchRows={balances.map((b) => ({
          branchId: b.branchId,
          name: b.name,
          startingBalance: b.startingBalance,
          currentBalance: b.currentBalance,
          status: b.status,
        }))}
      />
    );
  }

  const branch = balances.find((b) => b.branchId === selectedBranchId || b.name === selectedBranchName) || (balances.length === 1 ? balances[0] : undefined);
  if (!branch) {
    return (
      <SingleBranchCard
        branchName={selectedBranchName}
        startingBalance={0}
        currentBalance={0}
        totalAdded={0}
        totalTransferred={0}
        lastUpdated={new Date().toISOString()}
        onAddFunds={onAddFunds}
      />
    );
  }

  return (
    <SingleBranchCard
      branchName={branch.name}
      startingBalance={branch.startingBalance}
      currentBalance={branch.currentBalance}
      totalAdded={branch.totalAdded}
      totalTransferred={branch.totalTransferred}
      lastUpdated={branch.lastUpdated}
      onAddFunds={onAddFunds}
    />
  );
}
