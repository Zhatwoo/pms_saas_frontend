"use client";

import { useState } from "react";
import { CreateUserModal } from "./_components/create-user-modal";
import { UserActions } from "./_components/user-actions";
import { UserStats } from "./_components/user-stats";
import { UserTable } from "./_components/user-table";

export type UserRole = "ADMIN" | "EMPLOYEE";
export type RoleFilter = "ALL" | UserRole;

export interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  branch: string;
  created: string;
  status: "Active";
}

export interface CreateUserInput {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  branch: string;
}

export const userBranches = ["Taguig", "Pasig"];

const initialUsers: UserRecord[] = [
  {
    id: "USR-001",
    username: "john_doey",
    fullName: "John Doey",
    email: "johndoe@gmail.com",
    role: "ADMIN",
    branch: "Taguig",
    created: "Mar 10, 2022",
    status: "Active",
  },
  {
    id: "USR-002",
    username: "lebrong24",
    fullName: "Lebron James",
    email: "legends@gmail.com",
    role: "ADMIN",
    branch: "Pasig",
    created: "Jan 06, 2025",
    status: "Active",
  },
  {
    id: "USR-003",
    username: "mj_hihi",
    fullName: "Michael Jackstubber",
    email: "mj@gmail.com",
    role: "EMPLOYEE",
    branch: "Taguig",
    created: "Oct 14, 2024",
    status: "Active",
  },
  {
    id: "USR-004",
    username: "philscrew",
    fullName: "Philip Screw",
    email: "screwpilipe23@gmail.com",
    role: "EMPLOYEE",
    branch: "Pasig",
    created: "Sep 22, 2025",
    status: "Active",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  function handleCreateUser(input: CreateUserInput) {
    setUsers((currentUsers) => {
      const createdUser: UserRecord = {
        id: `USR-${String(currentUsers.length + 1).padStart(3, "0")}`,
        username: input.username.trim(),
        fullName: input.fullName.trim(),
        email: input.email.trim(),
        role: input.role,
        branch: input.branch,
        created: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: "Active",
      };

      return [createdUser, ...currentUsers];
    });

    setIsCreateModalOpen(false);
  }

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      user.username.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesBranch = branchFilter === "All" || user.branch === branchFilter;

    return matchesSearch && matchesRole && matchesBranch;
  });

  const totalBranches = new Set(users.map((user) => user.branch)).size;
  const activeUsers = users.filter((user) => user.status === "Active").length;

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-zinc-500">Taguig Branch</p>

      <UserActions
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        onCreateUser={() => setIsCreateModalOpen(true)}
      />
      <UserStats
        totalUsers={users.length}
        totalBranches={totalBranches}
        activeUsers={activeUsers}
      />
      <UserTable users={filteredUsers} totalUsers={users.length} />

      {isCreateModalOpen && (
        <CreateUserModal
          branches={userBranches}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateUser={handleCreateUser}
        />
      )}
    </div>
  );
}
