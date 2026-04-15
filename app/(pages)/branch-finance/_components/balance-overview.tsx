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
  return `₱${n.toLocaleString("en-PH")}`;
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
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-pawn-gold backdrop-blur-sm">
            <WalletIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{branchName}</h2>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/70">
              Balance Overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
          <ClockIcon />
          <span className="text-[10px] text-emerald-300">
            {fmtDate(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Current Balance (hero) */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-400/60">
            Current Balance
          </p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-white">
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

        {/* Action Buttons beside balance */}
        {onAddFunds && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAddFunds}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-emerald-500/30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Funds
            </button>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3 px-6 pb-6">
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

/* ── All Branches Aggregate Card ──────────────────────── */
function AggregateBranchCard({
  totalBranches,
  branchRows,
}: {
  totalBranches: number;
  branchRows: BranchBalanceRow[];
}) {
  return (
    <div className="space-y-4">
      {/* Per-branch list */}
      <div className="rounded-xl border border-border-main bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">
            Per-Branch Balances
          </h3>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            {totalBranches} branches
          </span>
        </div>
        <div className="divide-y divide-border-subtle">
          {branchRows.map((b) => (
            <div
              key={b.branchId}
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface-secondary"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-text-primary">{b.name}</p>
                  <p className="text-xs text-text-muted">ID: {b.branchId}</p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div className="hidden sm:block">
                  <p className="text-xs font-bold tracking-wider uppercase text-text-tertiary">Start Balance</p>
                  <p className={`text-base font-semibold ${b.startingBalance < 50000 ? "text-amber-600" : "text-text-secondary"}`}>{fmt(b.startingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-emerald-600">End / Current</p>
                  <p className="text-base font-extrabold text-emerald-700">{fmt(b.currentBalance)}</p>
                </div>
                <div className="w-16">
                  <span
                    className={`inline-flex w-full items-center justify-center rounded px-2 py-1 text-xs font-bold ${
                      b.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
  onAddFunds: () => void;
}

export function BalanceOverview({
  isAllBranches,
  selectedBranchId,
  selectedBranchName,
  balances,
  onAddFunds,
}: BalanceOverviewProps) {
  if (isAllBranches) {
    return (
      <AggregateBranchCard
        totalBranches={balances.length}
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
