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
  isExpanded?: boolean;
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
    day10: 10,
    day20Additional: 10,
    day30Additional: 10,
    gracePeriodAdditional: 10,
    defaultDuration: 30,
    gracePeriodDuration: 4,
    isExpanded: true,
  },
  {
    id: "group-2",
    name: "General & Appliances",
    categories: ["Appliances", "Cameras", "Smartwatches", "Audio & Earphones", "Other Items"],
    first5Days: 7,
    day10: 12,
    day20Additional: 10,
    day30Additional: 10,
    gracePeriodAdditional: 10,
    defaultDuration: 30,
    gracePeriodDuration: 4,
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
    async function loadInterestRates() {
      setIsLoading(true);
      try {
        const data = await api.get<InterestRateGroup[]>("/settings/interest_rates");
        if (data && Array.isArray(data) && data.length > 0) {
          setGroups(data.map(g => ({ ...g, isExpanded: g.isExpanded ?? true })));
        } else {
          setGroups(DEFAULT_GUEST_GROUPS);
        }
      } catch (error) {
        console.warn("No custom interest rates found, loading defaults.");
        setGroups(DEFAULT_GUEST_GROUPS);
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
      day10: 10,
      day20Additional: 10,
      day30Additional: 10,
      gracePeriodAdditional: 10,
      defaultDuration: 30,
      gracePeriodDuration: 4,
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
      <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white shadow-sm dark:bg-slate-900 dark:border-zinc-700">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Loading Interest rate profiles...
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:bg-slate-900 dark:border-zinc-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-700">
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
              className="rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-zinc-200 rounded-xl dark:border-zinc-700">
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
                className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-slate-900/40"
              >
                {/* Collapsible Bar */}
                <div
                  onClick={() => handleToggleExpand(group.id)}
                  className="flex cursor-pointer items-center justify-between bg-zinc-100/50 px-4 py-3 transition hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/60"
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
                          className="h-7 rounded border border-zinc-200 bg-white px-2 text-xs font-bold text-zinc-800 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                  <div className="p-4 space-y-5 border-t border-zinc-200 dark:border-zinc-800">
                    {/* Grid Layout: Config Fields + Categories + display logic */}
                    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                      {/* Left: Input Rates fields */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          Interest Rate Structures
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              First 5 Days Rate (%)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.first5Days}
                              onChange={(e) => handleUpdateGroupField(group.id, "first5Days", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              Day 10 Rate (%)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.day10}
                              onChange={(e) => handleUpdateGroupField(group.id, "day10", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              Day 20 Additional (%)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.day20Additional}
                              onChange={(e) => handleUpdateGroupField(group.id, "day20Additional", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              Day 30 Additional (%)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.day30Additional}
                              onChange={(e) => handleUpdateGroupField(group.id, "day30Additional", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              Grace Period Additional (%)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.gracePeriodAdditional}
                              onChange={(e) => handleUpdateGroupField(group.id, "gracePeriodAdditional", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              Default Duration (Days)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.defaultDuration}
                              onChange={(e) => handleUpdateGroupField(group.id, "defaultDuration", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                              Grace Period Duration (Days)
                            </label>
                            <input
                              type="number"
                              disabled={!isSuperAdmin}
                              value={group.gracePeriodDuration}
                              onChange={(e) => handleUpdateGroupField(group.id, "gracePeriodDuration", e.target.value)}
                              className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Category selection check list */}
                      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-slate-900">
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
                                  className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
                                />
                                <span className="text-[11px] select-none">{cat}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Displays Logic Section: cumulative summary & sample calc */}
                    <div className="grid gap-4 rounded-xl border border-zinc-100 bg-white p-3 sm:grid-cols-2 dark:border-zinc-800 dark:bg-slate-900">
                      {/* Cumulative display stages */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                          Cumulative Interest Stages
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between py-0.5 border-b border-zinc-50 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-[10px]">First 5 days:</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{cumFirst5}%</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-zinc-50 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-[10px]">Day 10 (1st Maturity):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{cumDay10}%</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-zinc-50 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-[10px]">Day 20 (2nd Maturity):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">+{group.day20Additional}% <span className="text-[10px] font-normal text-zinc-400">({cumDay20}% total)</span></span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-zinc-50 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-[10px]">Day 30 (Expiry Date):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">+{group.day30Additional}% <span className="text-[10px] font-normal text-zinc-400">({cumDay30}% total)</span></span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Grace Period (Day 31-34):</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">+{group.gracePeriodAdditional}% <span className="text-[10px] font-normal text-zinc-400">({cumGrace}% total)</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Sample calculations */}
                      <div className="space-y-1.5 border-t border-zinc-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                          Sample Computation Summary (₱10,000 Principle)
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">First 5 days interest:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumFirst5) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Day 10 Interest due:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumDay10) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Day 20 Interest due:</span>
                            <span className="font-black text-emerald-600">₱ {((sampleAmount * cumDay20) / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-zinc-500 text-[10px]">Day 30 Interest due:</span>
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
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/10">
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
