"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";

interface BranchSummary {
  id: string;
  name: string;
}

interface SignupModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type SignupRole = "ADMIN" | "EMPLOYEE";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: SignupRole;
  branchId: string;
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  branchId: "",
};

export function SignupModal({ onClose, onSwitchToLogin }: SignupModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      setIsLoadingBranches(true);
      setLoadError("");
      try {
        const data = await api.get<BranchSummary[]>("/auth/signup/branches");
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setBranches(list);
          setForm((f) => ({
            ...f,
            branchId: f.branchId || list[0]?.id || "",
          }));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Could not load branches.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBranches(false);
        }
      }
    }

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedFullName = form.fullName.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedFullName || !trimmedEmail || !form.password || !form.branchId) {
      setError("Complete all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post<{ message?: string }>("/auth/register", {
        fullName: trimmedFullName,
        email: trimmedEmail,
        password: form.password,
        role: form.role.toLowerCase(),
        branchId: form.branchId,
      });

      setSuccess(
        res?.message ??
          "Registration submitted. A Super Admin must approve your account before you can sign in.",
      );
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          type="button"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="relative bg-emerald-800 px-8 pb-8 pt-10">
          <div className="absolute right-[-20px] top-[-30px] h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex flex-col items-center">
            <div className="rounded-2xl bg-emerald-950/50 p-2">
              <div className="overflow-hidden rounded-xl ring-2 ring-amber-400/60">
                <Image
                  src="/logo.jpg"
                  alt="JCLB Logo"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover"
                />
              </div>
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">JCLB Buy Back</h2>
            <p className="text-lg font-bold text-amber-400">Create account</p>
          </div>
        </div>

        <div className="relative bg-emerald-800">
          <div className="h-2 rounded-t-xl bg-stone-100" />
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
        </div>

        <div className="bg-stone-100 px-8 pb-8 pt-6">
          <h3 className="text-xl font-bold text-emerald-950">Request access</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Your account must be approved by a Super Admin before you can sign
            in.
          </p>

          {loadError && (
            <div className="mt-4 rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
              {loadError}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
              {success}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToLogin();
                }}
                className="mt-2 block font-bold text-emerald-800 underline"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                FULL NAME
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                placeholder="Your full name"
                disabled={Boolean(success)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                placeholder="you@example.com"
                disabled={Boolean(success)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                PASSWORD
              </label>
              <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="h-11 flex-1 bg-transparent px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                  placeholder="At least 6 characters"
                  disabled={Boolean(success)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                REQUESTED ROLE
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  updateField("role", e.target.value as SignupRole)
                }
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-xs text-zinc-900 outline-none"
                disabled={Boolean(success)}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                BRANCH
              </label>
              <select
                value={form.branchId}
                onChange={(e) => updateField("branchId", e.target.value)}
                className="h-11 w-full border border-zinc-300 bg-white px-3 text-xs text-zinc-900 outline-none"
                disabled={
                  Boolean(success) || isLoadingBranches || branches.length === 0
                }
                required
              >
                {isLoadingBranches ? (
                  <option value="">Loading branches…</option>
                ) : branches.length === 0 ? (
                  <option value="">No branches available</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                Boolean(success) ||
                isLoadingBranches ||
                branches.length === 0
              }
              className="w-full bg-emerald-800 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit request"}
            </button>
          </form>

          <div className="my-4 h-px bg-zinc-200" />
          <p className="text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToLogin();
              }}
              className="font-bold text-emerald-800 hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
