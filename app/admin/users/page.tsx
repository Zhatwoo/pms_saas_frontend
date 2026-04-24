"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { UserActions } from "./_components/user-actions";
import { UserStats } from "./_components/user-stats";
import { UserTable } from "./_components/user-table";
import { UserDetailDrawer } from "./_components/user-detail-drawer";
import { UpdateUserModal } from "./_components/update-user-modal";

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

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  branchId?: string | null;
  currentPassword?: string;
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

function mapAccountStatus(raw: string | null | undefined): AccountStatusUi {
  const v = (raw ?? "active").toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "rejected") return "Rejected";
  return "Active";
}

function mapUserRecord(user: UserApiRecord): UserRecord {
  const fullName = user.fullName ?? user.full_name ?? user.email;
  const role = mapApiRoleToUi(user.role);
  const branchName = user.branchName ?? user.branch_name ?? null;
  const createdAt = user.createdAt ?? user.created_at ?? new Date().toISOString();

  return {
    id: user.id ?? user.auth_id ?? user.authId ?? user.email,
    fullName: fullName?.trim() || user.email,
    email: user.email,
    role,
    branchId: user.branchId ?? user.branch_id ?? null,
    branch:
      branchName ??
      (role === "SUPER_ADMIN" ? "All Branches" : "Unassigned"),
    created: new Date(createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status: mapAccountStatus(user.accountStatus ?? user.account_status),
  };
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function AdminUserManagementPage() {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isCurrentAdminTarget = useCallback(
    (target: UserRecord) => {
      if (!user) return false;
      return target.id === user.id || target.email.toLowerCase() === user.email.toLowerCase();
    },
    [user],
  );

  const canAdminManageUser = useCallback(
    (target: UserRecord) => {
      if (user?.role !== "admin") return false;
      if (target.role === "SUPER_ADMIN") return false;
      if (target.role === "EMPLOYEE") return true;
      return isCurrentAdminTarget(target);
    },
    [user?.role, isCurrentAdminTarget],
  );

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsersPage();
  }, [loadUsersPage]);

  useEffect(() => {
    if (roleFilter === "SUPER_ADMIN") {
      setRoleFilter("ALL");
    }
  }, [roleFilter]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((record) => {
      const matchesSearch =
        query.length === 0 ||
        record.fullName.toLowerCase().includes(query) ||
        record.email.toLowerCase().includes(query) ||
        record.branch.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "PENDING"
          ? record.status === "Pending"
          : roleFilter === "ALL" || record.role === roleFilter;

      const matchesBranch =
        isAllBranches || record.branchId === selectedBranch.id;

      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [users, search, roleFilter, isAllBranches, selectedBranch.id]);

  const totalBranches = new Set(
    users
      .map((record) => record.branchId)
      .filter((branchId): branchId is string => Boolean(branchId)),
  ).size;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const pendingUsers = users.filter((u) => u.status === "Pending").length;

  const handleExportUsers = useCallback(() => {
    if (filteredUsers.length === 0) {
      toast.error("No users to export.");
      return;
    }

    const headers = [
      "Full Name",
      "Email",
      "Role",
      "Branch",
      "Created",
      "Status",
    ];

    const rows = filteredUsers.map((record) =>
      [
        record.fullName,
        record.email,
        record.role,
        record.branch,
        record.created,
        record.status,
      ]
        .map((cell) => csvCell(String(cell)))
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const branchLabel = isAllBranches
      ? "all_branches"
      : selectedBranch.name.toLowerCase().replace(/\s+/g, "_");
    const dateLabel = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `admin_users_${branchLabel}_${dateLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Users exported successfully.");
  }, [filteredUsers, isAllBranches, selectedBranch.name]);

  const handleOpenEdit = useCallback(
    (target: UserRecord) => {
      if (!canAdminManageUser(target)) {
        toast.error("Admin can only edit their own account name and employee accounts.");
        return;
      }
      setSelectedUser(target);
      setIsUpdateModalOpen(true);
    },
    [canAdminManageUser],
  );

  const handleOpenDetails = useCallback((target: UserRecord) => {
    setSelectedUser(target);
    setIsDrawerOpen(true);
  }, []);

  const handleUpdateUser = useCallback(
    async (id: string, input: UpdateUserInput) => {
      const target = users.find((u) => u.id === id);
      if (!target || !canAdminManageUser(target)) {
        throw new Error("Admin can only edit their own account name and employee accounts.");
      }

      setUpdatingUserId(id);
      setError("");

      try {
        const payload: {
          fullName?: string;
        } = {};

        if (input.fullName) payload.fullName = input.fullName;

        const updated = await api.patch<UserApiRecord>(`/users/${id}`, payload);
        setUsers((current) =>
          current.map((u) => (u.id === id ? mapUserRecord(updated) : u)),
        );
        toast.success("User updated successfully.");
      } catch (updateError) {
        const msg =
          updateError instanceof Error
            ? updateError.message
            : "Failed to update user profile.";
        setError(msg);
        toast.error(msg);
        throw updateError;
      } finally {
        setUpdatingUserId(null);
      }
    },
    [users, canAdminManageUser],
  );

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
        onExportUsers={handleExportUsers}
        canCreateUser={false}
        onCreateUser={() => {
          toast.error("Admin cannot create user accounts.");
        }}
        showSuperAdminRoleTab={false}
      />

      {isLoading ? (
        <div className="rounded-lg border border-border-main bg-surface px-4 py-10 text-center text-sm text-text-tertiary">
          Loading users...
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          totalUsers={users.length}
          canDeleteUser={false}
          canApproveUser={false}
          deletingUserId={null}
          updatingUserId={updatingUserId}
          onUserClick={handleOpenDetails}
          onEditUser={handleOpenEdit}
          onDeleteUser={() => {
            toast.error("Admin cannot delete user accounts.");
          }}
          onApproveUser={() => {
            toast.error("Admin cannot approve user accounts.");
          }}
          onRejectUser={() => {
            toast.error("Admin cannot reject user accounts.");
          }}
        />
      )}

      <UserDetailDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        canEditUser={Boolean(selectedUser && canAdminManageUser(selectedUser))}
        onEditUser={handleOpenEdit}
      />

      {isUpdateModalOpen && selectedUser && (
        <UpdateUserModal
          user={selectedUser}
          availableRoles={isCurrentAdminTarget(selectedUser) ? ["ADMIN"] : ["EMPLOYEE"]}
          canEditRole={false}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
}
