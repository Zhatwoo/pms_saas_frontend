"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import type { UserRecord, AccountStatusUi } from "../page";

interface UserDetailDrawerProps {
  user: UserRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

function statusBadgeVariant(status: AccountStatusUi): "green" | "yellow" | "red" {
  if (status === "Pending") return "yellow";
  if (status === "Rejected") return "red";
  return "green";
}

export function UserDetailDrawer({
  user,
  isOpen,
  onClose,
}: UserDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l border-border-main bg-surface shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              User Details
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {user?.fullName || "—"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-300 transition-colors hover:bg-white/10 hover:text-white"
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
              {/* Account Overview */}
              <div className="rounded-lg border border-border-subtle bg-surface-secondary p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex items-center gap-3 border-b border-border-subtle pb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm`}>
                      {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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
                    <p className="mt-1 font-mono text-[11px] font-semibold text-text-primary truncate" title={user.id}>
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
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      Branch
                    </p>
                    <p className="mt-1 text-sm text-text-secondary italic">
                      {user.branch}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">System Access</p>
                        <p className="text-[10px] text-text-muted">Login permissions</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 capitalize">
                      {user.status === "Active" ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-900 px-3 py-2.5 text-xs font-bold text-amber-400 transition-opacity hover:opacity-90 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    View History Log
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 rounded-lg border border-border-main bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-900">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
