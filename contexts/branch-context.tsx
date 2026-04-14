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
}

/* ── Provider ────────────────────────────────────────────── */
export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [baseBranches, setBaseBranches] = useState<BranchOption[]>([]);

  const loadBranches = useCallback(async () => {
    if (!user) return;
    try {
      const path = isSuperAdmin ? "/branches" : (user.branchId ? `/branches/${user.branchId}` : null);
      if (!path) return;

      const data = await api.get<BranchApiItem | BranchApiItem[]>(path);

      const normalized: BranchOption[] = Array.isArray(data)
        ? data.map((branch) => ({
          id: branch.id,
          name: branch.name,
          location: branch.location,
          code: branch.branch_code,
        }))
        : [{
          id: data.id,
          name: data.name,
          location: data.location,
          code: data.branch_code,
        }];

      setBaseBranches(normalized);
    } catch {
      // Keep previous selector options on transient failures.
    }
  }, [user?.id, user?.branchId, isSuperAdmin]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
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
  }, [loadBranches]);

  // Build branch list: superadmin gets "All" + every branch; others just their own
  const branches = useMemo<BranchOption[]>(() => {
    if (isSuperAdmin) {
      return [ALL_BRANCHES_OPTION, ...baseBranches];
    }
    // Non-superadmins see only their assigned branch
    const own = baseBranches.find((b) => b.id === user?.branchId);
    if (own) return [own];

    if (user?.branchId) {
      return [{ id: user.branchId, name: `Branch ${user.branchId}` }];
    }

    return baseBranches.slice(0, 1);
  }, [baseBranches, isSuperAdmin, user?.branchId]);

  const [selected, setSelected] = useState<BranchOption>(ALL_BRANCHES_OPTION);

  useEffect(() => {
    if (branches.length === 0) return;

    const stillExists = branches.some((branch) => branch.id === selected.id);
    if (stillExists) return;

    setSelected(branches[0]);
  }, [branches, selected.id]);

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
