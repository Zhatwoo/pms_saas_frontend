"use client";

import { useState } from "react";

interface ConfirmPasswordModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => Promise<boolean>;
  onClose: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function ConfirmPasswordModal({
  isOpen,
  onConfirm,
  onClose,
  title = "Authentication Required",
  description = "Please enter your password to authorize this transaction.",
  isLoading: externalLoading = false,
}: ConfirmPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = externalLoading || internalLoading;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setInternalLoading(true);
    try {
      const isValid = await onConfirm(password);
      if (!isValid) {
        setError("Invalid password. Please try again.");
      } else {
        setPassword("");
        onClose();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-sm scale-in-center rounded-2xl bg-surface p-6 shadow-2xl border border-pawn-gold/30">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-text-primary">{title}</h2>
          <p className="mt-2 text-sm text-text-tertiary">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl border-2 bg-surface-secondary px-4 py-3 text-base font-bold outline-none transition-all ${
                error ? "border-rose-500 focus:border-rose-600" : "border-border-main focus:border-emerald-600"
              }`}
            />
            {error && <p className="mt-2 text-xs font-bold text-rose-500 uppercase tracking-tighter">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-border-main py-3 text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
