"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "./auth-context";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient, getTokenFromCookie } from "@/lib/supabase-browser";

/* ── Branch option shape ─────────────────────────────────── */
export interface BranchOption {
  /** UUID — matches `user.branchId` and API `?branch=` filters */
  id: string;
  name: string;
  location?: string;
  phone?: string;
  /** Human-readable branch code from API (optional) */
  code?: string;
}

const ALL_BRANCHES_ID = "__all__";

export const ALL_BRANCHES_OPTION: BranchOption = {
  id: ALL_BRANCHES_ID,
  name: "All Branches",
  location: "Combined view across every branch",
};

/* ── Context value ───────────────────────────────────────── */
interface BranchContextValue {
  /** Currently selected branch (or the ALL sentinel). */
  selectedBranch: BranchOption;
  /** Branches available to pick from. */
  branches: BranchOption[];
  /** Change the selection (no-op for non-superadmins). */
  setSelectedBranch: (branch: BranchOption) => void;
  /** Whether the user can change branches (superadmin only). */
  canSwitchBranch: boolean;
  /** Convenience: true if viewing "All Branches". */
  isAllBranches: boolean;
  /** Force refresh branch options from API. */
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextValue | null>(null);

interface BranchApiItem {
  id: string;
  branch_code: string;
  name: string;
  location: string;
  contact_number?: string;
}

/* ── Provider ────────────────────────────────────────────── */
export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [baseBranches, setBaseBranches] = useState<BranchOption[]>([]);

  const loadBranches = useCallback(async () => {
    if (!user) return;
    try {
      // Use actor-scoped list endpoint for every role to avoid brittle /branches/:id lookups.
      const data = await api.get<BranchApiItem | BranchApiItem[]>("/branches");
      
      const normalized: BranchOption[] = Array.isArray(data) 
        ? data.map((branch) => ({
          id: branch.id,
          name: branch.name,
          location: branch.location,
          phone: branch.contact_number,
          code: branch.branch_code,
        }))
        : [{
          id: (data as any).id,
          name: (data as any).name,
          location: (data as any).location,
          phone: (data as any).contact_number || (data as any).contactNumber,
          code: (data as any).branch_code,
        }];

      setBaseBranches(normalized);
    } catch (error) {
      console.warn("[BranchProvider] Failed to load branches:", error);
      // Keep previous selector options on transient failures.
    }
  }, [user]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const token = getTokenFromCookie();
    if (token) {
      void supabase.realtime.setAuth(token);
    }

    const channel = supabase
      .channel("branch-selector-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branches" },
        () => {
          void loadBranches();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBranches, user]);

  // Build branch list: superadmin gets "All" + every branch; others just their own
  const branches: BranchOption[] = (() => {
    if (isSuperAdmin) {
      return [ALL_BRANCHES_OPTION, ...baseBranches];
    }
    // Non-superadmins see only their assigned branch
    const own = baseBranches.find((b) => b.id === user?.branchId);
    if (own) return [own];

    if (user?.branchId) {
      return [
        {
          id: user.branchId,
          name: user.branchName || `Branch ${user.branchId}`,
        },
      ];
    }

    return baseBranches.slice(0, 1);
  })();

  const [selected, setSelected] = useState<BranchOption>(ALL_BRANCHES_OPTION);

  /* ── Sync selected branch with available branches ──────── */
  useEffect(() => {
    if (branches.length === 0) return;

    const currentInList = branches.find((b) => b.id === selected.id);

    // If the selected branch no longer exists, reset to the first available
    if (!currentInList) {
      setSelected(branches[0]);
      return;
    }

    // IMPORTANT: If the name or other data has changed (e.g. from fallback ID to actual name), 
    // update the selection state so the UI reflects the latest fetched data.
    if (currentInList.name !== selected.name) {
      setSelected(currentInList);
    }
  }, [branches, selected.id, selected.name]);

  const setSelectedBranch = useCallback(
    (branch: BranchOption) => {
      if (!isSuperAdmin) return; // guard
      setSelected(branch);
    },
    [isSuperAdmin],
  );

  const value = useMemo<BranchContextValue>(
    () => ({
      selectedBranch: selected,
      branches,
      setSelectedBranch,
      canSwitchBranch: isSuperAdmin,
      isAllBranches: selected.id === ALL_BRANCHES_ID,
      refreshBranches: loadBranches,
    }),
    [selected, branches, setSelectedBranch, isSuperAdmin, loadBranches],
  );

  return <BranchContext value={value}>{children}</BranchContext>;
}

/* ── Hook ────────────────────────────────────────────────── */
export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
