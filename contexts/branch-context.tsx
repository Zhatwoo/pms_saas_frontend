"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "./auth-context";

/* ── Branch option shape ─────────────────────────────────── */
export interface BranchOption {
  id: string;        // branch id, e.g. "001"
  name: string;      // display label
  location?: string; // optional subtitle
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
}

const BranchContext = createContext<BranchContextValue | null>(null);

/* ── Mock branch list (will be replaced with API fetch) ─── */
const MOCK_BRANCHES: BranchOption[] = [
  { id: "001", name: "Head Office – Makati", location: "Makati City, Metro Manila" },
  { id: "002", name: "BGC Branch", location: "Bonifacio Global City, Taguig" },
  { id: "003", name: "Cebu City Branch", location: "Cebu City, Cebu" },
  { id: "004", name: "Davao Branch", location: "Davao City, Davao del Sur" },
  { id: "005", name: "Quezon City Branch", location: "Quezon City, Metro Manila" },
  { id: "006", name: "Iloilo Branch", location: "Iloilo City, Western Visayas" },
  { id: "007", name: "Calamba Branch", location: "Calamba City, Laguna" },
];

/* ── Provider ────────────────────────────────────────────── */
export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  // Build branch list: superadmin gets "All" + every branch; others just their own
  const branches = useMemo<BranchOption[]>(() => {
    if (isSuperAdmin) {
      return [ALL_BRANCHES_OPTION, ...MOCK_BRANCHES];
    }
    // Non-superadmins see only their assigned branch
    const own = MOCK_BRANCHES.find((b) => b.id === user?.branchId);
    return own ? [own] : MOCK_BRANCHES.slice(0, 1);
  }, [isSuperAdmin, user?.branchId]);

  const [selected, setSelected] = useState<BranchOption>(branches[0]);

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
    }),
    [selected, branches, setSelectedBranch, isSuperAdmin],
  );

  return <BranchContext value={value}>{children}</BranchContext>;
}

/* ── Hook ────────────────────────────────────────────────── */
export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
