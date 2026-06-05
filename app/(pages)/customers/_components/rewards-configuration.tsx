"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

/* ──────────────── Types ──────────────── */

interface Reward {
  id: string;
  name: string;
  description: string;
  reward_type: string;
  reward_value: number;
  required_transaction_count: number;
  required_total_amount: number;
  transaction_type: string | null;
  is_active: boolean;
  created_at: string;
}

interface RewardForm {
  name: string;
  description: string;
  reward_type: string;
  reward_value: string;
  required_transaction_count: string;
  required_total_amount: string;
  transaction_type: string;
  is_active: boolean;
}

const EMPTY_FORM: RewardForm = {
  name: "",
  description: "",
  reward_type: "cashback",
  reward_value: "",
  required_transaction_count: "5",
  required_total_amount: "0",
  transaction_type: "",
  is_active: true,
};

const REWARD_TYPES = [
  { value: "cashback", label: "Cashback" },
  { value: "discount", label: "Discount (%)" },
  { value: "freebie", label: "Freebie" },
];

const TRANSACTION_TYPES = [
  { value: "", label: "Any Transaction" },
  { value: "Pawn", label: "Pawn" },
  { value: "Buy Back", label: "Buy Back" },
  { value: "Renew", label: "Renew" },
  { value: "Sold Item", label: "Sold Item" },
];

/* ──────────────── Helpers ──────────────── */

function formatRewardValue(type: string, value: number) {
  if (type === "discount") return `${value}%`;
  return `₱${value.toLocaleString("en-PH")}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ──────────────── Main Component ──────────────── */

export function RewardsConfiguration() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RewardForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Reward[]>("/rewards");
      setRewards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[Rewards] Failed to load:", err);
      setRewards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRewards();
  }, [fetchRewards]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsModalOpen(true);
  }

  function openEdit(reward: Reward) {
    setForm({
      name: reward.name,
      description: reward.description,
      reward_type: reward.reward_type,
      reward_value: String(reward.reward_value),
      required_transaction_count: String(reward.required_transaction_count),
      required_total_amount: String(reward.required_total_amount),
      transaction_type: reward.transaction_type ?? "",
      is_active: reward.is_active,
    });
    setEditingId(reward.id);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    if (!form.name.trim()) {
      toast.error("Reward name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        reward_type: form.reward_type,
        reward_value: Number(form.reward_value) || 0,
        required_transaction_count: Number(form.required_transaction_count) || 1,
        required_total_amount: Number(form.required_total_amount) || 0,
        transaction_type: form.transaction_type || undefined,
        is_active: form.is_active,
      };

      if (editingId) {
        await api.patch(`/rewards/${editingId}`, payload);
        toast.success("Reward updated!");
      } else {
        await api.post("/rewards", payload);
        toast.success("Reward created!");
      }

      setIsModalOpen(false);
      void fetchRewards();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save reward");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await api.delete(`/rewards/${id}`);
      toast.success("Reward removed!");
      void fetchRewards();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete reward");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Tab Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Reward Rules</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Set the requirements for customers to earn rewards automatically.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Rule
          </button>
        )}
      </div>

      {/* Rewards List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
          <span className="ml-3 text-sm text-text-secondary">Loading rules...</span>
        </div>
      ) : rewards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-main bg-surface-secondary py-16 text-center">
          <p className="text-4xl">🎁</p>
          <p className="mt-3 text-sm font-semibold text-text-primary">No reward rules configured</p>
          <p className="mt-1 text-xs text-text-secondary">
            Create a rule to start granting rewards to your loyal customers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`group relative rounded-xl border bg-surface p-5 shadow-sm transition-colors hover:border-emerald-border hover:bg-surface-raised ${
                reward.is_active
                  ? "border-border-main"
                  : "border-border-main bg-surface opacity-70"
              }`}
            >
              {/* Status badge */}
              <div className="absolute right-4 top-4">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    reward.is_active
                      ? "bg-emerald-surface text-emerald-text"
                      : "bg-badge-muted-bg text-badge-muted-text"
                  }`}
                >
                  {reward.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Reward Info */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    reward.reward_type === "cashback"
                      ? "bg-emerald-surface text-emerald-text"
                      : reward.reward_type === "discount"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                  }`}
                >
                  {reward.reward_type === "cashback" ? "₱" : reward.reward_type === "discount" ? "%" : "🎁"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-text-primary">{reward.name}</h3>
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                    {reward.description || "No description"}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md border border-border-subtle bg-surface-secondary px-2 py-1 text-[10px] font-semibold text-text-secondary">
                  {reward.required_transaction_count} transactions
                </span>
                {Number(reward.required_total_amount) > 0 && (
                  <span className="rounded-md border border-border-subtle bg-surface-secondary px-2 py-1 text-[10px] font-semibold text-text-secondary">
                    ₱{Number(reward.required_total_amount).toLocaleString()} min
                  </span>
                )}
                {reward.transaction_type && (
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    {reward.transaction_type}
                  </span>
                )}
              </div>

              {/* Value & Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-border-main pt-3">
                <div>
                  <p className="text-lg font-bold text-emerald-text">
                    {formatRewardValue(reward.reward_type, Number(reward.reward_value))}
                  </p>
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(reward)}
                      className="rounded-lg border border-border-main bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reward.id)}
                      disabled={deletingId === reward.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                    >
                      {deletingId === reward.id ? "..." : "Del"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-900 px-6 py-5">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Edit Rule" : "Create New Rule"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">Rule Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Bronze Loyalty Tier"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">Reward Type</label>
                  <select
                    value={form.reward_type}
                    onChange={(e) => setForm({ ...form, reward_type: e.target.value })}
                    className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none"
                  >
                    {REWARD_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    {form.reward_type === "discount" ? "Value (%)" : "Value (₱)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.reward_value}
                    onChange={(e) => setForm({ ...form, reward_value: e.target.value })}
                    className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">Min Transactions</label>
                  <input
                    type="number"
                    min="1"
                    value={form.required_transaction_count}
                    onChange={(e) => setForm({ ...form, required_transaction_count: e.target.value })}
                    className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">Min Amount (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.required_total_amount}
                    onChange={(e) => setForm({ ...form, required_total_amount: e.target.value })}
                    className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">Transaction Type</label>
                <select
                  value={form.transaction_type}
                  onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
                  className="w-full rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none"
                >
                  {TRANSACTION_TYPES.map((tt) => (
                    <option key={tt.value} value={tt.value}>{tt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="comp_is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-border-main accent-emerald-600"
                />
                <label htmlFor="comp_is_active" className="text-sm text-text-secondary">Rule is active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border-main bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
