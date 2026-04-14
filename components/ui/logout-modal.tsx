"use client";

import { LogoutIcon } from "@/lib/icons";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal - matches AccountStatusModal layout */}
      <div className="relative z-10 w-full max-w-sm animate-[fadeInUp_0.25s_ease-out] overflow-hidden rounded-xl border border-red-200 bg-surface shadow-2xl dark:border-red-900/30">
        <div className="flex flex-col items-center px-6 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>

          <h3 className="mt-4 text-base font-bold text-text-primary">
            Confirm Logout
          </h3>
          <p className="mt-2 text-center text-xs leading-relaxed text-text-tertiary px-2">
            Are you sure you want to log out? You will need to sign in again to access the management dashboard.
          </p>
        </div>

        {/* Actions - matches AccountStatusModal actions */}
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Yes, Log out
          </button>
        </div>
      </div>
    </div>
  );
}
