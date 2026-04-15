"use client";

import { useEffect, useState } from "react";
import type {
  BranchOption,
  CreateableUserRole,
  UserRecord,
} from "../page";

interface UpdateUserModalProps {
  user: UserRecord | null;
  branches: BranchOption[];
  onClose: () => void;
  onUpdateUser: (id: string, input: Partial<UserRecord>) => Promise<void>;
}

interface FormState {
  fullName: string;
  role: CreateableUserRole;
  branchId: string;
}

const roleOptions: CreateableUserRole[] = ["ADMIN", "EMPLOYEE"];

export function UpdateUserModal({
  user,
  branches,
  onClose,
  onUpdateUser,
}: UpdateUserModalProps) {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    role: "EMPLOYEE",
    branchId: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        role: user.role as CreateableUserRole,
        branchId: user.branchId || "",
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    
    setError("");
    const trimmedFullName = form.fullName.trim();

    if (!trimmedFullName || !form.branchId) {
      setError("Complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateUser(user.id, {
        fullName: trimmedFullName,
        role: form.role as any,
        branchId: form.branchId,
      });
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-emerald-900 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
            User Management
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Update User Profile</h2>
              <p className="mt-1 text-base text-emerald-50/80">
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
                className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-all focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/5"
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

            <div>
              <label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
                Role
              </label>
              <select
                value={form.role}
                onChange={(event) => updateField("role", event.target.value as CreateableUserRole)}
                className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-all focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/5"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
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
              className="rounded-md bg-emerald-700 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-800"
            >
              {isSubmitting ? "Updating..." : "Update Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
