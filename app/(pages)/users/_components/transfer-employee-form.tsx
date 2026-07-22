"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import type { UserRecord, BranchOption } from "../page";

interface UserApiRecord {
  id?: string;
  fullName?: string | null;
  full_name?: string | null;
  email: string;
  role: "super_admin" | "superadmin" | "admin" | "employee" | "branch";
  branchId?: string | null;
  branch_id?: string | null;
  branchName?: string | null;
  branch_name?: string | null;
}

interface UserTransferRecord {
  id: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  branchId: string | null;
  branchName: string;
}

interface BranchApiRecord {
  id: string;
  name: string;
}

function mapUserRole(role: UserApiRecord["role"]): UserTransferRecord["role"] {
  switch (role) {
    case "super_admin":
    case "superadmin":
      return "SUPER_ADMIN";
    case "admin":
      return "ADMIN";
    default:
      return "EMPLOYEE";
  }
}

function mapTransferUser(user: UserApiRecord): UserTransferRecord {
  const branchId = user.branchId ?? user.branch_id ?? null;
  const branchName = user.branchName ?? user.branch_name ?? "Unassigned";

  return {
    id: user.id ?? user.email,
    fullName: user.fullName ?? user.full_name ?? user.email,
    role: mapUserRole(user.role),
    branchId,
    branchName,
  };
}

interface TransferEmployeeFormProps {
  selectedUser: UserRecord | null;
  canManageUsers: boolean;
  onTransferSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function TransferEmployeeForm({
  selectedUser,
  canManageUsers,
  onTransferSuccess,
  onError,
}: TransferEmployeeFormProps) {
  const [users, setUsers] = useState<UserTransferRecord[]>([]);
  const [branches, setBranches] = useState<BranchApiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState("");

  const [transferSourceBranchId, setTransferSourceBranchId] = useState("ALL");
  const [transferBranchId, setTransferBranchId] = useState("");

  const loadTransferData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [usersData, branchData] = await Promise.all([
        api.get<UserApiRecord[]>("/users"),
        api.get<BranchApiRecord[]>("/branches"),
      ]);

      setUsers(usersData.map(mapTransferUser));
      setBranches(branchData);

      if (selectedUser?.branchId) {
        setTransferSourceBranchId(selectedUser.branchId);
      }
    } catch (loadError) {
      const errorMsg =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load transfer data.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, onError]);

  useEffect(() => {
    void loadTransferData();
  }, [loadTransferData]);

  const transferCandidates = useMemo(() => {
    return users
      .filter((u) => u.role !== "SUPER_ADMIN")
      .filter((u) => {
        if (transferSourceBranchId === "ALL") return true;
        return u.branchId === transferSourceBranchId;
      });
  }, [users, transferSourceBranchId]);

  const transferDestinationOptions = useMemo(() => {
    if (!selectedUser || !selectedUser.branchId) return branches;
    return branches.filter((b) => b.id !== selectedUser.branchId);
  }, [branches, selectedUser]);

  async function handleTransferEmployee() {
    if (!canManageUsers) return;
    if (!selectedUser || !transferBranchId) {
      const errorMsg = "Select a destination branch.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsTransferring(true);
    setError("");

    try {
      const updated = await api.patch<UserApiRecord>(
        `/users/${selectedUser.id}/transfer-branch`,
        { branchId: transferBranchId },
      );

      const updatedUser = mapTransferUser(updated);
      setUsers((current) =>
        current.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      );

      setTransferSourceBranchId(updatedUser.branchId ?? "ALL");
      setTransferBranchId("");
      const successMsg = `Transferred successfully! ${updatedUser.fullName} is now assigned to ${updatedUser.branchName}.`;
      onTransferSuccess?.(successMsg);
    } catch (transferError) {
      const errorMsg =
        transferError instanceof Error
          ? transferError.message
          : "Failed to transfer employee.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsTransferring(false);
    }
  }

  if (!canManageUsers) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
        Only Super Admin users can transfer employees.
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="rounded-lg border border-border-main bg-surface px-4 py-4 text-sm text-text-tertiary">
        Select a user to transfer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-border-main bg-surface px-4 py-8 text-center text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Loading transfer options..." className="justify-center text-sm text-text-tertiary" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Destination Branch
            </label>
            <select
              value={transferBranchId}
              onChange={(event) => setTransferBranchId(event.target.value)}
              className="h-10 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
            >
              <option value="">Select destination</option>
              {transferDestinationOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleTransferEmployee}
            disabled={isTransferring || !transferBranchId}
            className="h-10 w-full rounded-md border border-brand-green bg-brand-green px-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTransferring ? "Transferring..." : "Transfer to Selected Branch"}
          </button>
        </div>
      )}
    </div>
  );
}
