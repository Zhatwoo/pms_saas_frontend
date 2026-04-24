"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { CreateUserModal } from "./_components/create-user-modal";
import { UserActions } from "./_components/user-actions";
import { UserStats } from "./_components/user-stats";
import { UserTable } from "./_components/user-table";
import { UserDetailDrawer } from "./_components/user-detail-drawer";
import { DeleteUserModal } from "./_components/delete-user-modal";
import { UpdateUserModal } from "./_components/update-user-modal";
import { AccountStatusModal } from "./_components/account-status-modal";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
export type CreateableUserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
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
  branchId: string | null;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  branchId?: string | null;
  currentPassword?: string;
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
    branch:
      branchName ??
      (mapApiRoleToUi(user.role) === "SUPER_ADMIN" ? "All Branches" : "Unassigned"),
    created: new Date(createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status: mapAccountStatus(accountRaw),
  };
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const searchParams = useSearchParams();
  const canManageUsers = user?.role === "super_admin";
  const assignableUpdateRoles: UserRole[] =
    user?.role === "super_admin"
      ? ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]
      : ["ADMIN", "EMPLOYEE"];
  const assignableCreateRoles: CreateableUserRole[] =
    user?.role === "super_admin"
      ? ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]
      : ["ADMIN", "EMPLOYEE"];

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalMode, setStatusModalMode] = useState<"approve" | "reject" | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [highlightTransfer, setHighlightTransfer] = useState(false);

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

  useEffect(() => {
    const transferUserId = searchParams.get("transferUserId");
    const shouldHighlight = searchParams.get("highlightTransfer") === "true";

    if (transferUserId && users.length > 0) {
      const targetUser = users.find((u) => u.id === transferUserId);
      if (targetUser) {
        setSelectedUser(targetUser);
        setIsDrawerOpen(true);
        
        if (shouldHighlight) {
          setHighlightTransfer(true);
          const timer = setTimeout(() => {
            setHighlightTransfer(false);
          }, 4000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [users, searchParams]);

  async function handleCreateUser(input: CreateUserInput) {
    const payload = {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      password: input.password,
      role: input.role.toLowerCase(),
      branchId: input.role === "SUPER_ADMIN" ? null : input.branchId,
    };

    if (user?.role !== "super_admin") {
      throw new Error(
        `Permission denied: Only super_admin can create users. Your role is "${user?.role}"`,
      );
    }

    const createdUser = await api.post<UserApiRecord>("/users", payload);

    setUsers((currentUsers) => [mapUserRecord(createdUser), ...currentUsers]);
    setIsCreateModalOpen(false);
    toast.success("User created successfully!");
  }

  function handleUserClick(target: UserRecord) {
    setSelectedUser(target);
    setIsDrawerOpen(true);
  }

  async function handleDeleteUser(userToDelete: UserRecord) {
    if (!canManageUsers) {
      return;
    }

    setIsDeletingUserId(userToDelete.id);
    setError("");

    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== userToDelete.id),
      );
      setIsDeleteModalOpen(false);
      if (selectedUser?.id === userToDelete.id) {
        setIsDrawerOpen(false);
      }
      toast.success("User deleted successfully!");
    } catch (deleteError) {
      const msg = deleteError instanceof Error ? deleteError.message : "Failed to delete user.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsDeletingUserId(null);
    }
  }

  async function handleUpdateAccountStatus() {
    if (!canManageUsers || !selectedUser || !statusModalMode) {
      return;
    }

    if (statusModalMode === "reject") {
      await handleDeleteUser(selectedUser);
      setIsStatusModalOpen(false);
      return;
    }

    setUpdatingUserId(selectedUser.id);
    setError("");

    try {
      const updated = await api.patch<UserApiRecord>(`/users/${selectedUser.id}`, {
        accountStatus: "active",
      });
      setUsers((current) =>
        current.map((u) =>
          u.id === selectedUser.id ? mapUserRecord(updated) : u,
        ),
      );
      setIsStatusModalOpen(false);
      toast.success("Account status updated successfully!");
    } catch (updateError) {
      const msg = updateError instanceof Error ? updateError.message : "Failed to update user.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleUpdateUser(id: string, input: UpdateUserInput) {
    if (!canManageUsers) return;

    setUpdatingUserId(id);
    setError("");

    try {
      const payload: {
        fullName?: string;
        role?: string;
        branchId?: string | null;
        currentPassword?: string;
      } = {};
      if (input.fullName) payload.fullName = input.fullName;
      if (input.role) payload.role = input.role.toLowerCase();
      if (input.branchId !== undefined) payload.branchId = input.branchId;
      if (input.currentPassword) payload.currentPassword = input.currentPassword;

      const updated = await api.patch<UserApiRecord>(`/users/${id}`, payload);
      setUsers((current) =>
        current.map((u) => (u.id === id ? mapUserRecord(updated) : u)),
      );
      toast.success("User updated successfully!");
    } catch (updateError) {
      const msg = updateError instanceof Error ? updateError.message : "Failed to update user profile.";
      setError(msg);
      toast.error(msg);
      throw updateError;
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
        isAllBranches || userRecord.branchId === selectedBranch.id;

      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [selectedBranch.id, isAllBranches, roleFilter, search, users]);

  const totalBranches = new Set(
    users
      .map((userRecord) => userRecord.branchId)
      .filter((branchId): branchId is string => Boolean(branchId)),
  ).size;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const pendingUsers = users.filter((u) => u.status === "Pending").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <UserStats
        totalUsers={users.length}
        totalBranches={totalBranches}
        activeUsers={activeUsers}
        pendingUsers={pendingUsers}
      />
      <UserActions
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        canCreateUser={canManageUsers}
        onCreateUser={() => setIsCreateModalOpen(true)}
        showSuperAdminRoleTab={canManageUsers}
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
          onUserClick={handleUserClick}
          onEditUser={(u) => {
            setSelectedUser(u);
            setIsUpdateModalOpen(true);
          }}
          onDeleteUser={(u) => {
            setSelectedUser(u);
            setIsDeleteModalOpen(true);
          }}
          onApproveUser={(u) => {
            setSelectedUser(u);
            setStatusModalMode("approve");
            setIsStatusModalOpen(true);
          }}
          onRejectUser={(u) => {
            setSelectedUser(u);
            setStatusModalMode("reject");
            setIsStatusModalOpen(true);
          }}
        />
      )}

      {isCreateModalOpen && canManageUsers && (
        <CreateUserModal
          branches={branches}
          availableRoles={assignableCreateRoles}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateUser={handleCreateUser}
        />
      )}

      {isUpdateModalOpen && selectedUser && (
        <UpdateUserModal
          user={selectedUser}
          availableRoles={assignableUpdateRoles}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}

      <UserDetailDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        canManageUsers={canManageUsers}
        highlightTransfer={highlightTransfer}
        onEditUser={(u) => {
          setSelectedUser(u);
          setIsUpdateModalOpen(true);
        }}
        onDeleteUser={(u) => {
          setSelectedUser(u);
          setIsDeleteModalOpen(true);
        }}
        onTransferSuccess={() => loadUsersPage()}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        userToDelete={selectedUser}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (selectedUser) {
            await handleDeleteUser(selectedUser);
          }
        }}
      />

      <AccountStatusModal
        isOpen={isStatusModalOpen}
        mode={statusModalMode}
        user={selectedUser}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleUpdateAccountStatus}
      />
    </div>
  );
}

