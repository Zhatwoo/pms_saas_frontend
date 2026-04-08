"use client";

import { useEffect, useState } from "react";
import type { CreateUserInput, UserRole } from "../page";

interface CreateUserModalProps {
  branches: string[];
  onClose: () => void;
  onCreateUser: (input: CreateUserInput) => void;
}

interface FormState {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  branch: string;
}

const roleOptions: UserRole[] = ["ADMIN", "EMPLOYEE"];

const initialFormState = (branches: string[]): FormState => ({
  username: "",
  fullName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  branch: branches[0] ?? "",
});

export function CreateUserModal({
  branches,
  onClose,
  onCreateUser,
}: CreateUserModalProps) {
  const [form, setForm] = useState<FormState>(() => initialFormState(branches));
  const [error, setError] = useState("");

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedUsername = form.username.trim();
    const trimmedFullName = form.fullName.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedUsername || !trimmedFullName || !trimmedEmail || !form.password) {
      setError("Complete all required fields before creating the user.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    onCreateUser({
      username: trimmedUsername,
      fullName: trimmedFullName,
      email: trimmedEmail,
      password: form.password,
      role: form.role,
      branch: form.branch,
    });

    setForm(initialFormState(branches));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-emerald-900 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
            User Management
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Create New User</h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Add a new employee or admin account and assign a branch.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close create user modal"
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

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="john_doe"
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Full Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="John Doe"
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="johndoe@gmail.com"
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Temporary Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="At least 6 characters"
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Role
              </label>
              <select
                value={form.role}
                onChange={(event) => updateField("role", event.target.value as UserRole)}
                className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-700"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Branch
              </label>
              <select
                value={form.branch}
                onChange={(event) => updateField("branch", event.target.value)}
                className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-700"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
            New users are added to the table immediately for now. Backend persistence can be connected next once the users API is ready.
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
