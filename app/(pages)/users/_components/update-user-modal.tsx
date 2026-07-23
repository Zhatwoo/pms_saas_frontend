"use client";

import { useEffect, useState } from "react";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";
import type { UpdateUserInput, UserRecord, UserRole } from "../page";

interface UpdateUserModalProps {
  user: UserRecord | null;
  availableRoles: UserRole[];
  onClose: () => void;
  onUpdateUser: (id: string, input: UpdateUserInput) => Promise<void>;
  canEditRole?: boolean;
}

interface FormState {
  fullName: string;
  role: UserRole;
}

function isGlobalRole(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

function roleOptionLabel(role: UserRole): string {
  return role === "SUPER_ADMIN" ? "SUPER ADMIN" : role;
}

export function UpdateUserModal({
  user,
  availableRoles,
  onClose,
  onUpdateUser,
  canEditRole = true,
}: UpdateUserModalProps) {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    role: "EMPLOYEE",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const isSuperAdminRole = isGlobalRole(form.role);
  const shouldAllowRoleChange = canEditRole && availableRoles.length > 0;
  const isRoleCrossingSuperAdminBoundary =
    shouldAllowRoleChange &&
    ((form.role === "SUPER_ADMIN" && user?.role !== "SUPER_ADMIN") ||
      (user?.role === "SUPER_ADMIN" && form.role !== "SUPER_ADMIN"));

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        role: user.role,
      });
    }
  }, [user]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateRole(role: UserRole) {
    setForm((current) => ({
      ...current,
      role,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    
    setError("");
    const trimmedFullName = form.fullName.trim();

    if (!trimmedFullName) {
      setError("Complete all required fields.");
      return;
    }

    if (isRoleCrossingSuperAdminBoundary) {
      setIsPasswordModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UpdateUserInput = {
        fullName: trimmedFullName,
      };

      if (shouldAllowRoleChange) {
        payload.role = form.role;
        payload.branchId = isSuperAdminRole ? null : undefined;
      }

      await onUpdateUser(user.id, payload);
      onClose();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  const effectiveRole = shouldAllowRoleChange ? form.role : user.role;
  const isGlobalAccess = isGlobalRole(effectiveRole);
  const assignmentTitle = isGlobalAccess
    ? "All Branches"
    : user.branchId
    ? user.branch
    : "No Branch Assigned";
  const assignmentDescription = isGlobalAccess
    ? "This role is global and can view data across every branch."
    : user.branchId
    ? "Branch transfers are managed from the User Details panel opened from the eye icon."
    : "This account is currently unassigned. After saving, use User Details to transfer this user to a branch.";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bg-pawn-sidebar px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-pawn-gold">
              User Management
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Update User Profile</h2>
                <p className="mt-1 text-base text-white/80">
                  Modify account details for <span className="text-amber-300 font-bold">{user.email}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close update user modal"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Profile Details Section */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-bold uppercase tracking-widest text-text-tertiary">
                  Account Identity
                </label>
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="John Doe"
                  className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-all focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/5"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-md border border-input-border bg-zinc-50/50 dark:bg-surface-secondary px-4 text-base text-text-muted outline-none"
                />
              </div>

              {shouldAllowRoleChange ? (
                <div>
                  <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(event) => updateRole(event.target.value as UserRole)}
                    className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-all focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/5"
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {roleOptionLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
                    Role
                  </label>
                  <input
                    type="text"
                    value={roleOptionLabel(user.role)}
                    disabled
                    className="h-12 w-full cursor-not-allowed rounded-md border border-input-border bg-zinc-50/50 px-4 text-base text-text-muted outline-none dark:bg-surface-secondary"
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
                  {isGlobalAccess ? "Access Scope" : "Branch Assignment"}
                </label>
                <div className="rounded-xl border border-border-main bg-surface-secondary px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-text-primary">
                        {assignmentTitle}
                      </p>
                      <p className="mt-1 text-sm text-text-tertiary">
                        {assignmentDescription}
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                      {isGlobalAccess ? "Global Access" : "View Only"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-base text-emerald-text">
              {isRoleCrossingSuperAdminBoundary
                ? "Changing Super Admin access requires your password confirmation before the change is applied."
                : isGlobalAccess
                ? "Super Admin accounts have access to every branch. This account will not be tied to a single branch."
                : shouldAllowRoleChange
                ? "Need to move this user to another branch? Open the User Details panel from the eye icon and use the transfer section there."
                : "Admins can only update the full name here. Role and branch assignment are view-only."}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border-main pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border-main px-5 py-3 text-base font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-brand-green px-5 py-3 text-base font-bold text-white transition-colors hover:brightness-110"
              >
                {isSubmitting ? "Updating..." : "Update Account"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Authentication Required"
        description={
          form.role === "SUPER_ADMIN"
            ? "Enter your password to authorize promoting this account to Super Admin."
            : "Enter your password to authorize removing Super Admin access from this account."
        }
        onConfirm={async (password) => {
          if (!user) return false;

          await onUpdateUser(user.id, {
            fullName: form.fullName.trim(),
            role: form.role,
            branchId: null,
            currentPassword: password,
          });
          onClose();
          return true;
        }}
      />
    </>
  );
}
