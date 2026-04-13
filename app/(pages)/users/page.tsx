"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { CreateUserModal } from "./_components/create-user-modal";
import { UserActions } from "./_components/user-actions";
import { UserStats } from "./_components/user-stats";
import { UserTable } from "./_components/user-table";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
export type CreateableUserRole = "ADMIN" | "EMPLOYEE";
export type RoleFilter = "ALL" | UserRole | "PENDING";
export type BranchFilter = "ALL" | string;

export type AccountStatusUi = "Pending" | "Active" | "Rejected";

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  branch: string;
  created: string;
  status: AccountStatusUi;
}

export interface BranchOption {
  id: string;
  name: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: CreateableUserRole;
  branchId: string;
}

interface BranchApiRecord {
  id: string;
  name: string;
}

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
  createdAt?: string;
  created_at?: string;
  authId?: string;
  auth_id?: string;
  accountStatus?: string | null;
  account_status?: string | null;
}

function mapApiRoleToUi(role: UserApiRecord["role"]): UserRole {
  switch (role) {
    case "super_admin":
    case "superadmin":
      return "SUPER_ADMIN";
    case "admin":
      return "ADMIN";
    case "employee":
    case "branch":
      return "EMPLOYEE";
    default:
      return "EMPLOYEE";
  }
}

function mapAccountStatus(
  raw: string | null | undefined,
): AccountStatusUi {
  const v = (raw ?? "active").toLowerCase();
  if (v === "pending") {
    return "Pending";
  }
  if (v === "rejected") {
    return "Rejected";
  }
  return "Active";
}

function mapUserRecord(user: UserApiRecord): UserRecord {
  const fullName = user.fullName ?? user.full_name ?? user.email;
  const branchId = user.branchId ?? user.branch_id ?? null;
  const branchName = user.branchName ?? user.branch_name ?? null;
  const createdAt = user.createdAt ?? user.created_at ?? new Date().toISOString();
  const accountRaw = user.accountStatus ?? user.account_status ?? "active";

  return {
    id: user.id ?? user.auth_id ?? user.authId ?? user.email,
    fullName: fullName?.trim() || user.email,
    email: user.email,
    role: mapApiRoleToUi(user.role),
    branchId,
    branch: branchName ?? "Unassigned",
    created: new Date(createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status: mapAccountStatus(accountRaw),
  };
}

export default function UsersPage() {
  const { user } = useAuth();
  const canManageUsers = user?.role === "super_admin";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState<BranchFilter>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadUsersPage = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const usersData = await api.get<UserApiRecord[]>("/users");
      setUsers(usersData.map(mapUserRecord));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load users.",
      );
    }

    try {
      const branchData = await api.get<BranchApiRecord[]>("/branches");
      setBranches(
        branchData.map((branch) => ({
          id: branch.id,
          name: branch.name,
        })),
      );
    } catch (branchError) {
      console.warn(
        "Failed to load branches for user form:",
        branchError instanceof Error ? branchError.message : branchError,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsersPage();
  }, [loadUsersPage]);

  useEffect(() => {
    if (!canManageUsers && roleFilter === "SUPER_ADMIN") {
      setRoleFilter("ALL");
    }
  }, [canManageUsers, roleFilter]);

  async function handleCreateUser(input: CreateUserInput) {
    const payload = {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      password: input.password,
      role: input.role.toLowerCase(),
      branchId: input.branchId,
    };

    console.log("[DEBUG] Current user role:", user?.role);
    console.log("[DEBUG] Payload details:", {
      fullName: payload.fullName,
      email: payload.email,
      password: `${payload.password.length} chars`,
      role: payload.role,
      branchId: payload.branchId,
      branchIdLength: payload.branchId.length,
      branchIdLooksLikeUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.branchId),
    });
    
    if (user?.role !== "super_admin") {
      throw new Error(
        `Permission denied: Only super_admin can create users. Your role is "${user?.role}"`,
      );
    }

    const createdUser = await api.post<UserApiRecord>("/users", payload);

    setUsers((currentUsers) => [mapUserRecord(createdUser), ...currentUsers]);
    setIsCreateModalOpen(false);
  }

  async function handleDeleteUser(userToDelete: UserRecord) {
    if (!canManageUsers) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${userToDelete.fullName || userToDelete.email}?`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingUserId(userToDelete.id);
    setError("");

    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== userToDelete.id),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete user.",
      );
    } finally {
      setIsDeletingUserId(null);
    }
  }

  async function handleUpdateAccountStatus(
    target: UserRecord,
    accountStatus: "active" | "rejected",
  ) {
    if (!canManageUsers) {
      return;
    }

    setUpdatingUserId(target.id);
    setError("");

    try {
      const updated = await api.patch<UserApiRecord>(`/users/${target.id}`, {
        accountStatus,
      });
      setUsers((current) =>
        current.map((u) =>
          u.id === target.id ? mapUserRecord(updated) : u,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update user.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((userRecord) => {
      const matchesSearch =
        query.length === 0 ||
        userRecord.fullName.toLowerCase().includes(query) ||
        userRecord.email.toLowerCase().includes(query) ||
        userRecord.branch.toLowerCase().includes(query);
      const matchesRole =
        roleFilter === "PENDING"
          ? userRecord.status === "Pending"
          : roleFilter === "ALL" || userRecord.role === roleFilter;
      const matchesBranch =
        branchFilter === "ALL" || userRecord.branchId === branchFilter;

      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [branchFilter, roleFilter, search, users]);

  const totalBranches = new Set(
    users
      .map((userRecord) => userRecord.branchId)
      .filter((branchId): branchId is string => Boolean(branchId)),
  ).size;
  const activeUsers = users.filter((user) => user.status === "Active").length;
  const pendingUsers = users.filter((user) => user.status === "Pending").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <UserActions
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        branchOptions={branches}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        canCreateUser={canManageUsers}
        onCreateUser={() => setIsCreateModalOpen(true)}
        showSuperAdminRoleTab={canManageUsers}
      />
      <UserStats
        totalUsers={users.length}
        totalBranches={totalBranches}
        activeUsers={activeUsers}
        pendingUsers={pendingUsers}
      />
      {isLoading ? (
        <div className="rounded-lg border border-border-main bg-surface px-4 py-10 text-center text-sm text-text-tertiary">
          Loading users...
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          totalUsers={users.length}
          canDeleteUser={canManageUsers}
          canApproveUser={canManageUsers}
          deletingUserId={isDeletingUserId}
          updatingUserId={updatingUserId}
          onDeleteUser={handleDeleteUser}
          onApproveUser={(u) => handleUpdateAccountStatus(u, "active")}
          onRejectUser={(u) => handleUpdateAccountStatus(u, "rejected")}
        />
      )}

      {isCreateModalOpen && canManageUsers && (
        <CreateUserModal
          branches={branches}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateUser={handleCreateUser}
        />
      )}
    </div>
  );
}
