"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export interface InterestRateGroup {
  id: string;
  name: string;
  categories: string[];
  first5Days: number;
  day10: number;
  day20Additional: number;
  day30Additional: number;
  gracePeriodAdditional: number;
  defaultDuration: number;
  gracePeriodDuration: number;
  first5DaysLimit?: number;
  day10Limit?: number;
  day20Limit?: number;
  first5DaysStart?: number;
  day10Start?: number;
  day20Start?: number;
  day30Start?: number;
  gracePeriodStart?: number;
  isExpanded?: boolean;
}

type EditableNumberInputProps = {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  disabled?: boolean;
  className?: string;
};

function EditableNumberInput({
  value,
  onCommit,
  min,
  disabled,
  className,
}: EditableNumberInputProps) {
  const [text, setText] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(value.toString());
    }
  }, [value, isFocused]);

  const commitValue = () => {
    setIsFocused(false);
    const parsed = parseFloat(text);
    if (Number.isFinite(parsed)) {
      const normalized = min !== undefined ? Math.max(min, parsed) : parsed;
      onCommit(normalized);
    } else {
      setText(value.toString());
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={commitValue}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commitValue();
          e.currentTarget.blur();
        }
      }}
      onChange={(e) => setText(e.target.value)}
      className={className}
    />
  );
}

const ALL_CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "Appliances",
  "Gaming Console",
  "Cameras",
  "Smartwatches",
  "Audio & Earphones",
  "Other Items",
];

const DEFAULT_GUEST_GROUPS: InterestRateGroup[] = [
  {
    id: "group-1",
    name: "Gadgets",
    categories: ["Smartphone", "Laptop & PC", "Gaming Console"],
    first5Days: 5,
    first5DaysLimit: 5,
    day10: 10,
    day10Limit: 10,
    day20Additional: 10,
    day20Limit: 20,
    day30Additional: 10,
    gracePeriodAdditional: 10,
    defaultDuration: 30,
    gracePeriodDuration: 4,
    first5DaysStart: 1,
    day10Start: 6,
    day20Start: 11,
    day30Start: 21,
    gracePeriodStart: 31,
    isExpanded: true,
  },
  {
    id: "group-2",
    name: "General & Appliances",
    categories: ["Appliances", "Cameras", "Smartwatches", "Audio & Earphones", "Other Items"],
    first5Days: 7,
    first5DaysLimit: 5,
    day10: 12,
    day10Limit: 10,
    day20Additional: 10,
    day20Limit: 20,
    day30Additional: 10,
    gracePeriodAdditional: 10,
    defaultDuration: 30,
    gracePeriodDuration: 4,
    first5DaysStart: 1,
    day10Start: 6,
    day20Start: 11,
    day30Start: 21,
    gracePeriodStart: 31,
    isExpanded: true,
  },
];

export function InterestRatesSettings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [groups, setGroups] = useState<InterestRateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    const persistInterestRatesLocally = (nextGroups: InterestRateGroup[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem("interest_rates", JSON.stringify(nextGroups));
      } catch (storageError) {
        console.warn("Unable to persist interest rates locally", storageError);
      }
    };

    async function loadInterestRates() {
      setIsLoading(true);
      try {
        const data = await api.get<InterestRateGroup[]>("/settings/interest_rates");
        if (data && Array.isArray(data) && data.length > 0) {
          const normalizedGroups = data.map(g => ({
            ...g,
            first5DaysLimit: g.first5DaysLimit ?? 5,
            day10Limit: g.day10Limit ?? 10,
            day20Limit: g.day20Limit ?? 20,
            first5DaysStart: g.first5DaysStart ?? 1,
            day10Start: g.day10Start ?? (g.first5DaysLimit ?? 5) + 1,
            day20Start: g.day20Start ?? (g.day10Limit ?? 10) + 1,
            day30Start: g.day30Start ?? (g.day20Limit ?? 20) + 1,
            gracePeriodStart: g.gracePeriodStart ?? (g.defaultDuration ?? 30) + 1,
            isExpanded: g.isExpanded ?? true
          }));
          setGroups(normalizedGroups);
          persistInterestRatesLocally(normalizedGroups);
        } else {
          setGroups(DEFAULT_GUEST_GROUPS);
          persistInterestRatesLocally(DEFAULT_GUEST_GROUPS);
        }
      } catch (error) {
        console.warn("No custom interest rates found, loading defaults.");
        setGroups(DEFAULT_GUEST_GROUPS);
        persistInterestRatesLocally(DEFAULT_GUEST_GROUPS);
      } finally {
        setIsLoading(false);
      }
    }
    loadInterestRates();
  }, []);

  // Compute unassigned categories
  const assignedCategories = groups.reduce<string[]>((acc, group) => {
    return [...acc, ...group.categories];
  }, []);

  const unassignedCategories = ALL_CATEGORIES.filter(
    cat => !assignedCategories.includes(cat)
  );

  // Dynamic Validation checking
  useEffect(() => {
    if (unassignedCategories.length > 0) {
      setValidationError(
        `Note: Unassigned categories: ${unassignedCategories.join(", ")}. These will fall back to default interest rate policies.`
      );
    } else {
      setValidationError(null);
    }
  }, [unassignedCategories]);

  // Handlers for managing groups
  const handleAddGroup = () => {
    if (!isSuperAdmin) return;
    const newGroup: InterestRateGroup = {
      id: `group-${Date.now()}`,
      name: `New Interest Group`,
      categories: [],
      first5Days: 5,
      first5DaysLimit: 5,
      day10: 10,
      day10Limit: 10,
      day20Additional: 10,
      day20Limit: 20,
      day30Additional: 10,
      gracePeriodAdditional: 10,
      defaultDuration: 30,
      gracePeriodDuration: 4,
      first5DaysStart: 1,
      day10Start: 6,
      day20Start: 11,
      day30Start: 21,
      gracePeriodStart: 31,
      isExpanded: true,
    };
    setGroups([...groups, newGroup]);
    toast.success("New Interest Rate Group added.");
  };

  const handleRemoveGroup = (groupId: string) => {
    if (!isSuperAdmin) return;
    const groupToRemove = groups.find(g => g.id === groupId);
    if (!groupToRemove) return;

    setGroups(groups.filter(g => g.id !== groupId));
    toast.info(`Deleted "${groupToRemove.name}" group.`);
  };

  const handleToggleExpand = (groupId: string) => {
    setGroups(
      groups.map(g => (g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g))
    );
  };

  const handleUpdateGroupField = (
    groupId: string,
    field: keyof Omit<InterestRateGroup, "id" | "categories" | "isExpanded">,
    value: string | number
  ) => {
    if (!isSuperAdmin) return;
    setGroups(
      groups.map(g => {
        if (g.id === groupId) {
          if (field === "name") {
            return { ...g, name: value as string };
          }
          const numVal = parseFloat(value as string) || 0;
          return { ...g, [field]: numVal };
        }
        return g;
      })
    );
  };

  const getTiers = (group: InterestRateGroup) => {
    const limit1 = group.first5DaysLimit ?? 5;
    const rate1 = group.first5Days;
    const start1 = group.first5DaysStart ?? 1;

    const limit2 = group.day10Limit ?? 10;
    const rate2 = group.day10;
    const start2 = group.day10Start ?? limit1 + 1;

    const limit3 = group.day20Limit ?? 20;
    const rate3 = rate2 + group.day20Additional;
    const start3 = group.day20Start ?? limit2 + 1;

    const limit4 = group.defaultDuration;
    const rate4 = rate3 + group.day30Additional;
    const start4 = group.day30Start ?? limit3 + 1;

    const graceDuration = group.gracePeriodDuration;
    const rate5 = rate4 + group.gracePeriodAdditional;
    const start5 = group.gracePeriodStart ?? limit4 + 1;

    return [
      { id: "tier1", label: "Initial Period", startDay: start1, endDay: limit1, rate: rate1 },
      { id: "tier2", label: "1st Maturity", startDay: start2, endDay: limit2, rate: rate2 },
      { id: "tier3", label: "2nd Maturity", startDay: start3, endDay: limit3, rate: rate3 },
      { id: "tier4", label: "3rd Maturity (Expiry Date)", startDay: start4, endDay: limit4, rate: rate4 },
      { id: "tier5", label: "Grace Period", startDay: start5, endDay: limit4 + graceDuration, rate: rate5, duration: graceDuration }
    ];
  };

  const handleUpdateTierValue = (
    groupId: string,
    tierId: string,
    field: "endDay" | "rate" | "startDay",
    value: number
  ) => {
    if (!isSuperAdmin) return;
    setGroups(
      groups.map(g => {
        if (g.id !== groupId) return g;

        let limit1 = g.first5DaysLimit ?? 5;
        let rate1 = g.first5Days;
        let start1 = g.first5DaysStart ?? 1;

        let limit2 = g.day10Limit ?? 10;
        let rate2 = g.day10;
        let start2 = g.day10Start ?? limit1 + 1;

        let limit3 = g.day20Limit ?? 20;
        let rate3 = rate2 + g.day20Additional;
        let start3 = g.day20Start ?? limit2 + 1;

        let limit4 = g.defaultDuration;
        let rate4 = rate3 + g.day30Additional;
        let start4 = g.day30Start ?? limit3 + 1;

        let graceDuration = g.gracePeriodDuration;
        let rate5 = rate4 + g.gracePeriodAdditional;
        let start5 = g.gracePeriodStart ?? limit4 + 1;

        if (field === "endDay") {
          if (tierId === "tier1") {
            limit1 = value;
            if (limit2 <= limit1) limit2 = limit1 + 5;
            if (limit3 <= limit2) limit3 = limit2 + 10;
            if (limit4 <= limit3) limit4 = limit3 + 10;
            start2 = Math.max(start2, limit1 + 1);
          } else if (tierId === "tier2") {
            limit2 = Math.max(limit1 + 1, value);
            if (limit3 <= limit2) limit3 = limit2 + 10;
            if (limit4 <= limit3) limit4 = limit3 + 10;
            start2 = Math.min(start2, limit2);
            start3 = Math.max(start3, limit2 + 1);
          } else if (tierId === "tier3") {
            limit3 = Math.max(limit2 + 1, value);
            if (limit4 <= limit3) limit4 = limit3 + 10;
            start3 = Math.min(start3, limit3);
            start4 = Math.max(start4, limit3 + 1);
          } else if (tierId === "tier4") {
            limit4 = Math.max(limit3 + 1, value);
            start4 = Math.min(start4, limit4);
            start5 = Math.max(start5, limit4 + 1);
          } else if (tierId === "tier5") {
            const endDay5 = Math.max(limit4 + 1, value);
            graceDuration = endDay5 - limit4;
            start5 = Math.min(start5, endDay5);
          }
        } else if (field === "startDay") {
          if (tierId === "tier2") {
            const minStart = limit1 + 1;
            start2 = Math.max(minStart, Math.min(value, limit2));
            if (start2 > limit2) limit2 = start2;
            start3 = Math.max(start3, limit2 + 1);
          } else if (tierId === "tier3") {
            const minStart = limit2 + 1;
            start3 = Math.max(minStart, Math.min(value, limit3));
            if (start3 > limit3) limit3 = start3;
            start4 = Math.max(start4, limit3 + 1);
          } else if (tierId === "tier4") {
            const minStart = limit3 + 1;
            start4 = Math.max(minStart, Math.min(value, limit4));
            if (start4 > limit4) limit4 = start4;
            start5 = Math.max(start5, limit4 + 1);
          } else if (tierId === "tier5") {
            const minStart = limit4 + 1;
            start5 = Math.max(minStart, Math.min(value, limit4 + graceDuration));
          }
        } else if (field === "rate") {
          if (tierId === "tier1") {
            rate1 = value;
          } else if (tierId === "tier2") {
            rate2 = value;
          } else if (tierId === "tier3") {
            rate3 = value;
          } else if (tierId === "tier4") {
            rate4 = value;
          } else if (tierId === "tier5") {
            rate5 = value;
          }
        }

        return {
          ...g,
          first5DaysLimit: limit1,
          first5Days: rate1,
          first5DaysStart: start1,
          day10Limit: limit2,
          day10: rate2,
          day10Start: start2,
          day20Limit: limit3,
          day20Additional: rate3 - rate2,
          day20Start: start3,
          defaultDuration: limit4,
          day30Additional: rate4 - rate3,
          day30Start: start4,
          gracePeriodDuration: graceDuration,
          gracePeriodAdditional: rate5 - rate4,
          gracePeriodStart: start5,
        };
      })
    );
  };

  const handleCategoryCheckboxChange = (groupId: string, category: string, checked: boolean) => {
    if (!isSuperAdmin) return;
    setGroups(
      groups.map(g => {
        if (g.id === groupId) {
          const updatedCategories = checked
            ? [...g.categories, category]
            : g.categories.filter(c => c !== category);
          return { ...g, categories: updatedCategories };
        }
        // Remove from other groups if checked (should already be handled by UI disabling, but for safety)
        if (checked && g.id !== groupId) {
          return { ...g, categories: g.categories.filter(c => c !== category) };
        }
        return g;
      })
    );
  };

  const handleResetToDefaults = () => {
    if (!isSuperAdmin) return;
    if (window.confirm("Are you sure you want to reset all groups and rates to defaults?")) {
      setGroups(DEFAULT_GUEST_GROUPS);
      toast.success("Reset settings to system default gadget rates.");
    }
  };

  const handleSaveSettings = async () => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admins can modify interest rate policies.");
      return;
    }



    // Name validations
    const hasEmptyName = groups.some(g => !g.name.trim());
    if (hasEmptyName) {
      toast.error("Cannot save: Please ensure all groups have a valid name.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/settings/interest_rates", groups);
      if (typeof window !== "undefined") {
        localStorage.setItem("interest_rates", JSON.stringify(groups));
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      toast.success("Interest Rate structures updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to persist new Interest Rate structures.");
    } finally {
      setIsSaving(false);
    }
  };

  // Sample Calculation Helper
  const sampleAmount = 10000;

  if (isLoading) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-border-main bg-surface shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Loading Interest rate profiles...
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border-main px-4 py-3.5">
        <div className="space-y-0.5">
          <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
            Interest Rates Management
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Define customized dynamic interest rate structures mapped to different item categories.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaults}
              className="rounded-lg border border-border-main bg-surface-secondary hover:bg-surface-hover px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition dark:text-zinc-300"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleAddGroup}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Group
            </button>
          </div>
        )}
      </div>

      {/* Warnings & Validation errors */}
      {validationError && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-[10px] font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Main Groups Area */}
      <div className="p-4 space-y-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border-main rounded-xl">
            <p className="text-xs font-bold text-zinc-400">No Interest Rate Groups added yet.</p>
            <button
              onClick={handleAddGroup}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:underline"
            >
              Create first Group
            </button>
          </div>
        ) : (
          groups.map(group => {
            // Calculate cumulative totals
            const cumFirst5 = group.first5Days;
            const cumDay10 = group.day10;
            const cumDay20 = cumDay10 + group.day20Additional;
            const cumDay30 = cumDay20 + group.day30Additional;
            const cumGrace = cumDay30 + group.gracePeriodAdditional;

            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-border-main bg-surface-secondary"
              >
                {/* Collapsible Bar */}
                <div
                  onClick={() => handleToggleExpand(group.id)}
                  className="flex cursor-pointer items-center justify-between bg-surface px-4 py-3 transition hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-3">
                    <button
                      className="text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
                      aria-label={group.isExpanded ? "Collapse Group" : "Expand Group"}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`transition-transform duration-200 ${group.isExpanded ? "rotate-90" : ""}`}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {isSuperAdmin ? (
                        <input
                          type="text"
                          value={group.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateGroupField(group.id, "name", e.target.value)}
                          className="h-7 rounded border border-border-main bg-surface-secondary px-2 text-xs font-bold text-text-primary outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                          {group.name}
                        </span>
                      )}

                      {/* Display assigned categories count badge */}
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {group.categories.length} Categories Assigned
                      </span>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGroup(group.id);
                      }}
                      className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                      title="Delete Group"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Collapsible Content */}
                {group.isExpanded && (
                  <div className="p-4 space-y-5 border-t border-border-main">
                    {/* Grid Layout: Config Fields + Categories + display logic */}
                    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                      {/* Left: Input Rates fields */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Interest Rate Structures
                        </h4>
                        <div className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="border-b border-border-main bg-surface-secondary text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                  <th className="px-4 py-3">Maturity Stage / Tier</th>
                                  <th className="px-4 py-3 w-40">Maturity Start Day</th>
                                  <th className="px-4 py-3 w-40">Maturity End Day</th>
                                  <th className="px-4 py-3 w-32">Total Interest</th>
                                  <th className="px-4 py-3 hidden sm:table-cell">Active Range Preview</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-main text-xs">
                                {getTiers(group).map((tier, idx) => {
                                  const limit1 = group.first5DaysLimit ?? 5;
                                  const limit2 = group.day10Limit ?? 10;
                                  const limit3 = group.day20Limit ?? 20;
                                  const limit4 = group.defaultDuration;

                                  const minVal =
                                    tier.id === "tier1" ? 1 :
                                    tier.id === "tier2" ? limit1 + 1 :
                                    tier.id === "tier3" ? limit2 + 1 :
                                    tier.id === "tier4" ? limit3 + 1 :
                                    limit4 + 1;

                                  const minStart =
                                    tier.id === "tier1" ? 1 :
                                    tier.id === "tier2" ? limit1 + 1 :
                                    tier.id === "tier3" ? limit2 + 1 :
                                    tier.id === "tier4" ? limit3 + 1 :
                                    limit4 + 1;

                                  return (
                                    <tr
                                      key={tier.id}
                                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition duration-150"
                                    >
                                      <td className="px-4 py-3.5 font-semibold text-zinc-700 dark:text-zinc-300">
                                        <div className="flex items-center gap-2.5">
                                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            {idx + 1}
                                          </span>
                                          {tier.label}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3.5">
                                        {isSuperAdmin ? (
                                          <div className="relative flex items-center">
                                            <span className="absolute left-2.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold select-none">Day</span>
                                            <EditableNumberInput
                                              value={tier.startDay}
                                              min={minStart}
                                              onCommit={(val) => {
                                                handleUpdateTierValue(group.id, tier.id, "startDay", Math.round(val));
                                              }}
                                              disabled={tier.id === "tier1" || !isSuperAdmin}
                                              className="h-8 w-28 rounded-lg border border-border-main bg-surface-secondary pl-10 pr-3 text-xs font-bold text-text-primary outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                            />
                                          </div>
                                        ) : (
                                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                            Day {tier.startDay}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5">
                                        {isSuperAdmin ? (
                                          <div className="relative flex items-center">
                                            <span className="absolute left-2.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold select-none">Day</span>
                                            <EditableNumberInput
                                              value={tier.endDay}
                                              min={minVal}
                                              onCommit={(val) => {
                                                handleUpdateTierValue(group.id, tier.id, "endDay", Math.round(val));
                                              }}
                                              disabled={!isSuperAdmin}
                                              className="h-8 w-28 rounded-lg border border-border-main bg-surface-secondary pl-10 pr-3 text-xs font-bold text-text-primary outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                            />
                                          </div>
                                        ) : (
                                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                            Day {tier.endDay}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5">
                                        {isSuperAdmin ? (
                                          <div className="relative flex items-center">
                                            <EditableNumberInput
                                              value={tier.rate}
                                              min={0}
                                              onCommit={(val) => {
                                                handleUpdateTierValue(group.id, tier.id, "rate", val);
                                              }}
                                              disabled={!isSuperAdmin}
                                              className="h-8 w-24 rounded-lg border border-border-main bg-surface-secondary px-2.5 pr-6 text-xs font-bold text-text-primary outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                            />
                                            <span className="absolute right-2.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold pointer-events-none">%</span>
                                          </div>
                                        ) : (
                                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                            {tier.rate}%
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 hidden sm:table-cell">
                                        <span className="inline-flex items-center rounded-md bg-surface-secondary px-2 py-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                          Days {tier.startDay} - {tier.endDay} → {tier.rate}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
                          💡 <strong>Pro Tip:</strong> Enter the final cumulative interest rate for each stage (e.g. 5%, 10%, 20%, 30%, 40%). The system automatically handles delta calculation (e.g. &quot;plus 10%&quot;) behind the scenes.
                        </p>
                      </div>

                      {/* Right: Category selection check list */}
                      <div className="rounded-xl border border-border-main bg-surface p-3">
                        <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Category Alignment
                        </h4>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {ALL_CATEGORIES.map(cat => {
                            const isAssignedToThis = group.categories.includes(cat);
                            const isAssignedToOther =
                              !isAssignedToThis &&
                              groups.some(other => other.id !== group.id && other.categories.includes(cat));

                            return (
                              <label
                                key={cat}
                                className={`flex items-center gap-2 rounded px-2 py-1 text-xs transition cursor-pointer ${
                                  isAssignedToThis
                                    ? "bg-emerald-50/50 font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : isAssignedToOther
                                    ? "opacity-40 cursor-not-allowed text-zinc-400"
                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={!isSuperAdmin || isAssignedToOther}
                                  checked={isAssignedToThis}
                                  onChange={(e) =>
                                    handleCategoryCheckboxChange(group.id, cat, e.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded border-border-main text-emerald-600 outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 bg-surface-secondary"
                                />
                                <span className="text-[11px] select-none">{cat}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Displays Logic Section: cumulative summary & sample calc */}
                    <div className="grid gap-4 rounded-xl border border-border-main bg-surface p-3 sm:grid-cols-2">
                      {/* Cumulative display stages */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                          Cumulative Interest Stages
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between py-0.5 border-b border-border-main">
                            <span className="text-zinc-500 text-[10px]">First {group.first5DaysLimit ?? 5} days:</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{cumFirst5}%</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-border-main">
                            <span className="text-zinc-500 text-[10px]">Day {group.day10Limit ?? 10} (1st Maturity):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{cumDay10}%</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-border-main">
                            <span className="text-zinc-500 text-[10px]">Day {group.day20Limit ?? 20} (2nd Maturity):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">+{group.day20Additional}% <span className="text-[10px] font-normal text-zinc-400">({cumDay20}% total)</span></span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-border-main">
                            <span className="text-zinc-500 text-[10px]">Day {group.defaultDuration} (Expiry Date):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">+{group.day30Additional}% <span className="text-[10px] font-normal text-zinc-400">({cumDay30}% total)</span></span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Grace Period (Day {group.defaultDuration + 1}-{group.defaultDuration + group.gracePeriodDuration}):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">+{group.gracePeriodAdditional}% <span className="text-[10px] font-normal text-zinc-400">({cumGrace}% total)</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Sample calculations */}
                      <div className="space-y-1.5 border-t border-border-main pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                          Sample Computation Summary (₱10,000 Principle)
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">First {group.first5DaysLimit ?? 5} days interest:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumFirst5) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Day {group.day10Limit ?? 10} Interest due:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumDay10) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Day {group.day20Limit ?? 20} Interest due:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumDay20) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Day {group.defaultDuration} Interest due:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumDay30) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Grace Period Interest due:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumGrace) / 100).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Save panel */}
      {isSuperAdmin && groups.length > 0 && (
        <div className="flex items-center justify-end gap-3 border-t border-border-main bg-surface-secondary px-4 py-3">
          {settingsSaved && (
            <span className="text-[10px] font-bold text-emerald-600 animate-fade-in">
              Settings Saved!
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSaving ? "Saving..." : "Save & Update Policies"}
          </button>
        </div>
      )}
    </section>
  );
}
