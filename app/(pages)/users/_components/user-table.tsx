"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/components/shared/status-badge";
import type { UserRecord, UserRole } from "../page";

interface UserTableProps {
  users: UserRecord[];
  totalUsers: number;
  canDeleteUser: boolean;
  deletingUserId: string | null;
  onDeleteUser: (user: UserRecord) => void;
}

interface MenuPosition {
  top: number;
  left: number;
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

function ActionsMenu({
  user,
  canDeleteUser,
  isDeleting,
  onDeleteUser,
}: {
  user: UserRecord;
  canDeleteUser: boolean;
  isDeleting: boolean;
  onDeleteUser: (user: UserRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const menuWidth = 144;
      const viewportPadding = 8;
      const left = Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - menuWidth),
      );

      setMenuPosition({
        top: rect.bottom + 8,
        left,
      });
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    updatePosition();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={!canDeleteUser}
        className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
        aria-label={`Open actions for ${user.fullName}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[70] w-36 rounded-lg border border-border-main bg-surface py-1 shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDeleteUser(user);
              }}
              className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
            >
              {isDeleting ? "Deleting..." : "Delete user"}
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

export function UserTable({
  users,
  totalUsers,
  canDeleteUser,
  deletingUserId,
  onDeleteUser,
}: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="flex items-center justify-between bg-surface px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary">User Accounts</h3>
          <p className="mt-1 text-xs text-text-tertiary">
            Showing {users.length} of {totalUsers} users
          </p>
        </div>
        <p className="text-xs text-text-tertiary">System access and branch assignments</p>
      </div>

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
            {users.map((user, index) => (
              <tr
                key={`${user.id}-${user.email}`}
                className={`border-t border-border-subtle ${
                  index % 2 === 0 ? "bg-surface" : "bg-surface-secondary"
                }`}
              >
                <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                  {user.fullName}
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
                  <StatusBadge label={user.status} variant="green" />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <ActionsMenu
                    user={user}
                    canDeleteUser={canDeleteUser && user.role !== "SUPER_ADMIN"}
                    isDeleting={deletingUserId === user.id}
                    onDeleteUser={onDeleteUser}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="border-t border-border-subtle px-4 py-10 text-center text-sm text-text-tertiary">
          No users match the current search and filters.
        </div>
      )}
    </div>
  );
}
