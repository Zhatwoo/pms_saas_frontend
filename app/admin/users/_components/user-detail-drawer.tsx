"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import type { AccountStatusUi, UserRecord } from "../page";

interface UserDetailDrawerProps {
  user: UserRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canEditUser?: boolean;
  onEditUser?: (user: UserRecord) => void;
}

function statusBadgeVariant(status: AccountStatusUi): "green" | "yellow" | "red" {
  if (status === "Pending") return "yellow";
  if (status === "Rejected") return "red";
  return "green";
}

function getUserInitials(fullName: string) {
  return fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserDetailDrawer({
  user,
  isOpen,
  onClose,
  canEditUser = false,
  onEditUser,
}: UserDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l border-border-main bg-surface shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 bg-pawn-sidebar px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-pawn-gold">
              Admin User Details
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {user?.fullName || "User"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-pawn-gold transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close user details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {user && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="rounded-lg border border-border-subtle bg-surface-secondary p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex items-center gap-3 border-b border-border-subtle pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pawn-gold text-sm font-bold text-zinc-900">
                      {getUserInitials(user.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{user.fullName}</p>
                      <p className="text-[10px] text-text-muted">{user.email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Account ID
                    </p>
                    <p className="mt-1 truncate font-mono text-[11px] font-semibold text-text-primary" title={user.id}>
                      {user.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Status
                    </p>
                    <div className="mt-1">
                      <StatusBadge
                        label={user.status}
                        variant={statusBadgeVariant(user.status)}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Role
                    </p>
                    <p className="mt-1 text-xs font-bold text-brand-green">
                      {user.role.replace("_", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Branch
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {user.branch}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Account Metadata
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">Created Date</p>
                        <p className="text-[10px] text-text-muted">Date of registration</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {user.created}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">System Access</p>
                        <p className="text-[10px] text-text-muted">Current account permission state</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-green capitalize">
                      {user.status === "Active" ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-sm text-emerald-text">
                {canEditUser
                  ? "You can edit this account from the action below."
                  : "This account is view-only for admins. Other admin accounts and super admin accounts cannot be edited here."}
              </div>

              {canEditUser && onEditUser && (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Quick Action
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onEditUser(user);
                      onClose();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-main bg-surface px-3 py-3 text-sm font-semibold text-text-secondary transition-colors hover:border-brand-green hover:bg-brand-green/10 hover:text-brand-green"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
