import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import type { AccountStatusUi, UserRecord, UserRole } from "../page";

interface UserTableProps {
  users: UserRecord[];
  totalUsers: number;
  canDeleteUser: boolean;
  canApproveUser: boolean;
  deletingUserId: string | null;
  updatingUserId: string | null;
  onUserClick: (user: UserRecord) => void;
  onEditUser: (user: UserRecord) => void;
  onDeleteUser: (user: UserRecord) => void;
  onApproveUser: (user: UserRecord) => void;
  onRejectUser: (user: UserRecord) => void;
}

const ITEMS_PER_PAGE = 20;

function statusBadgeVariant(
  status: AccountStatusUi,
): "green" | "yellow" | "red" {
  if (status === "Pending") {
    return "yellow";
  }
  if (status === "Rejected") {
    return "red";
  }
  return "green";
}

function RoleBadge({ role }: { role?: UserRole }) {
  const normalizedRole = role ?? "EMPLOYEE";
  const className =
    normalizedRole === "SUPER_ADMIN"
      ? "bg-amber-100 text-amber-800"
      : normalizedRole === "ADMIN"
      ? "bg-emerald-950 text-emerald-50"
      : "bg-badge-muted-bg text-badge-muted-text";

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {normalizedRole.replace("_", " ")}
    </span>
  );
}

function InlineActions({
  onView,
  onEdit,
  onDelete,
  canDelete,
  isDeleting,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      {/* View */}
      <button
        onClick={onView}
        className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50"
        title="View Details"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      {/* Edit */}
      <button
        onClick={onEdit}
        className="flex h-7 w-7 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-50"
        title="Edit User"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={!canDelete || isDeleting}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          canDelete ? "text-red-500 hover:bg-red-50" : "text-zinc-300 cursor-not-allowed"
        }`}
        title="Delete User"
      >
        {isDeleting ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function UserTable({
  users,
  totalUsers,
  canDeleteUser,
  canApproveUser,
  deletingUserId,
  updatingUserId,
  onUserClick,
  onEditUser,
  onDeleteUser,
  onApproveUser,
  onRejectUser,
}: UserTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters/users change
  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="bg-emerald-900 text-amber-400">
                <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide">
                  Full Name
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide">
                  Email
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide">
                  Role
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide">
                  Branch
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide">
                  Created
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide">
                  Status
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <tr
                  key={`${user.id}-${user.email}`}
                  onClick={() => onUserClick(user)}
                  className={`group cursor-pointer border-t border-border-subtle transition-colors hover:bg-emerald-50/40 ${
                    index % 2 === 0 ? "bg-surface" : "bg-surface-secondary"
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="text-xs font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700 group-hover:underline">
                      {user.fullName}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                    {user.branch}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                    {user.created}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusBadge
                      label={user.status}
                      variant={statusBadgeVariant(user.status)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {canApproveUser && user.status === "Pending" ? (
                        <div className="flex gap-1.5 px-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApproveUser(user);
                            }}
                            disabled={updatingUserId === user.id}
                            className="rounded border border-emerald-700 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {updatingUserId === user.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRejectUser(user);
                            }}
                            disabled={updatingUserId === user.id}
                            className="rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-700 transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <InlineActions
                          onView={() => onUserClick(user)}
                          onEdit={() => onEditUser(user)}
                          onDelete={() => onDeleteUser(user)}
                          canDelete={canDeleteUser && user.role !== "SUPER_ADMIN"}
                          isDeleting={deletingUserId === user.id}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length > 0 && (
        <div className="rounded-lg border border-border-main bg-surface transition-colors duration-300">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={users.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
