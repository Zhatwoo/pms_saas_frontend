"use client";

import { useState, type FormEvent } from "react";

interface ConfirmPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export function ConfirmPasswordModal({ isOpen, onClose, onConfirm }: ConfirmPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password.trim()) {
      setError("Please enter your account password to continue.");
      return;
    }

    setError("");
    onConfirm(password);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Confirm Account Password</h2>
          <p className="text-sm text-zinc-500">Enter your password before continuing to create a new transaction.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block text-sm font-medium text-zinc-700">
            Account Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-[30px] border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Enter password"
              autoFocus
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[30px] border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[30px] bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}