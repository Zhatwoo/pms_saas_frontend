"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

/* ──────────────── Types ──────────────── */

interface CustomerReward {
  id: string;
  reward_id: string;
  name: string;
  description: string;
  reward_type: string;
  reward_value: number;
  status: "earned" | "claimed" | "expired";
  earned_at: string;
  claimed_at: string | null;
  notes: string;
}

interface RewardProgress {
  reward_id: string;
  name: string;
  description: string;
  reward_type: string;
  reward_value: number;
  required_transaction_count: number;
  required_total_amount: number;
  transaction_type: string | null;
  current_transaction_count: number;
  current_total_amount: number;
  tx_count_progress: number;
  amount_progress: number;
  is_eligible: boolean;
  already_earned: boolean;
}

/* ──────────────── Helper Functions ──────────────── */

function getRewardIcon(type: string) {
  switch (type) {
    case "cashback":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "discount":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="5" x2="5" y2="19" />
          <circle cx="6.5" cy="6.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      );
  }
}

function formatRewardValue(type: string, value: number) {
  if (type === "discount") return `${value}% Off`;
  if (type === "cashback") return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 0 })} Cashback`;
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 0 })} Freebie`;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ──────────────── Progress Ring ──────────────── */

function ProgressRing({
  progress,
  max,
  size = 48,
  strokeWidth = 4,
}: {
  progress: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(progress / max, 1) : 0;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-brand-green/15"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className={percentage >= 1 ? "text-brand-green" : "text-amber-500"}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

/* ──────────────── Main Component ──────────────── */

export function CustomerRewardsSection({
  customerId,
  userRole,
}: {
  customerId: string;
  userRole?: string;
}) {
  const [rewards, setRewards] = useState<CustomerReward[]>([]);
  const [progress, setProgress] = useState<RewardProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"progress" | "earned" | "claimed">("progress");

  const canClaim = userRole === "super_admin" || userRole === "admin" || userRole === "employee";

  const fetchData = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const [rewardsData, progressData] = await Promise.all([
        api.get<CustomerReward[]>(`/rewards/customer/${encodeURIComponent(customerId)}`),
        api.get<RewardProgress[]>(`/rewards/customer/${encodeURIComponent(customerId)}/progress`),
      ]);
      setRewards(Array.isArray(rewardsData) ? rewardsData : []);
      setProgress(Array.isArray(progressData) ? progressData : []);
    } catch (err) {
      console.warn("[CustomerRewards] Failed to load:", err);
      setRewards([]);
      setProgress([]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleClaim(customerRewardId: string, rewardName: string) {
    if (claimingId) return;
    setClaimingId(customerRewardId);
    try {
      await api.post(`/rewards/customer-rewards/${encodeURIComponent(customerRewardId)}/claim`, {});
      toast.success(`Reward "${rewardName}" claimed successfully!`);
      void fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to claim reward";
      toast.error(msg);
    } finally {
      setClaimingId(null);
    }
  }

  const earnedRewards = rewards.filter((r) => r.status === "earned");
  const claimedRewards = rewards.filter((r) => r.status === "claimed");
  const uncompletedProgress = progress.filter((p) => !p.already_earned);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">🎁 Rewards</h3>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green/30 border-t-brand-green" />
          <span className="ml-3 text-sm text-text-secondary">Loading rewards...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-main bg-surface shadow-sm transition-colors duration-300">
      {/* Header */}
      <div className="rounded-t-2xl border-b border-border-main bg-gradient-to-r from-brand-green/10 to-amber-50 px-5 py-4 dark:from-brand-green/15 dark:to-amber-950/40 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">🎁 Customer Rewards</h3>
            <p className="mt-0.5 text-xs text-text-secondary dark:text-zinc-400">
              {earnedRewards.length} earned · {claimedRewards.length} claimed
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-main dark:border-zinc-700">
        {(
          [
            { key: "progress", label: "Progress", count: uncompletedProgress.length },
            { key: "earned", label: "Earned", count: earnedRewards.length },
            { key: "claimed", label: "Claimed", count: claimedRewards.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 text-center text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-brand-green text-brand-green"
                : "text-text-secondary hover:text-text-primary dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-brand-green/10 text-brand-green"
                  : "bg-surface-secondary text-text-tertiary dark:bg-zinc-800 dark:text-zinc-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Progress Tab */}
        {activeTab === "progress" && (
          <div className="space-y-3">
            {uncompletedProgress.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-tertiary">
                No active reward goals. All rewards have been earned!
              </p>
            ) : (
              uncompletedProgress.map((item) => {
                const txPct = item.required_transaction_count > 0
                  ? Math.round((item.tx_count_progress / item.required_transaction_count) * 100)
                  : 100;
                const amtPct = item.required_total_amount > 0
                  ? Math.round((item.amount_progress / item.required_total_amount) * 100)
                  : 100;

                return (
                  <div
                    key={item.reward_id}
                    className={`group rounded-xl border p-4 transition-all ${
                      item.is_eligible
                        ? "border-brand-green/40 bg-brand-green/5 shadow-sm"
                        : "border-border-main bg-surface-secondary dark:border-zinc-700 dark:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <ProgressRing
                          progress={item.tx_count_progress}
                          max={item.required_transaction_count}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                          {txPct}%
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-brand-green">{getRewardIcon(item.reward_type)}</span>
                          <h4 className="text-sm font-semibold text-text-primary dark:text-zinc-100">{item.name}</h4>
                        </div>
                        <p className="mt-0.5 text-xs text-text-secondary dark:text-zinc-400">{item.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                            {item.tx_count_progress}/{item.required_transaction_count} transactions
                          </span>
                          {item.required_total_amount > 0 && (
                            <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                              ₱{item.amount_progress.toLocaleString()}/₱{item.required_total_amount.toLocaleString()} amount
                            </span>
                          )}
                          {item.transaction_type && (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              {item.transaction_type} only
                            </span>
                          )}
                        </div>
                        {item.is_eligible && (
                          <p className="mt-2 text-xs font-semibold text-brand-green">
                            ✅ Eligible! Reward will be granted on next qualifying transaction.
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-green">
                          {formatRewardValue(item.reward_type, item.reward_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Earned Tab */}
        {activeTab === "earned" && (
          <div className="space-y-3">
            {earnedRewards.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-tertiary">
                No earned rewards yet. Keep transacting to unlock rewards!
              </p>
            ) : (
              earnedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 rounded-xl border border-brand-green/25 bg-brand-green/5 p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                    {getRewardIcon(reward.reward_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-text-primary dark:text-zinc-100">{reward.name}</h4>
                    <p className="text-xs text-text-secondary dark:text-zinc-400">
                      {formatRewardValue(reward.reward_type, reward.reward_value)} · Earned {formatDate(reward.earned_at)}
                    </p>
                  </div>
                  {canClaim && (
                    <button
                      type="button"
                      disabled={claimingId === reward.id}
                      onClick={() => handleClaim(reward.id, reward.name)}
                      className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:opacity-50"
                    >
                      {claimingId === reward.id ? "Claiming..." : "Claim"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Claimed Tab */}
        {activeTab === "claimed" && (
          <div className="space-y-3">
            {claimedRewards.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-tertiary">
                No claimed rewards yet.
              </p>
            ) : (
              claimedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 rounded-xl border border-border-main bg-surface-secondary p-4 dark:border-zinc-700 dark:bg-zinc-900/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {getRewardIcon(reward.reward_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-text-primary line-through opacity-70 dark:text-zinc-300">{reward.name}</h4>
                    <p className="text-xs text-text-secondary dark:text-zinc-400">
                      {formatRewardValue(reward.reward_type, reward.reward_value)} · Claimed {formatDate(reward.claimed_at)}
                    </p>
                    {reward.notes && (
                      <p className="mt-1 text-xs italic text-text-tertiary">{reward.notes}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Claimed
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
