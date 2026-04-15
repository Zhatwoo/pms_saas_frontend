"use client";

import { useState } from "react";
import type { UserRecord } from "../page";

interface AccountStatusModalProps {
  isOpen: boolean;
  mode: "approve" | "reject" | null;
  user: UserRecord | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function AccountStatusModal({
  isOpen,
  mode,
  user,
  onClose,
  onConfirm,
}: AccountStatusModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !user || !mode) return null;

  const isReject = mode === "reject";
  const title = isReject ? "Reject & Delete Account" : "Approve Account";
  const themeColor = isReject ? "red" : "emerald";

  async function handleConfirm() {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-sm animate-[fadeInUp_0.25s_ease-out] rounded-xl border border-${themeColor}-200 bg-surface shadow-2xl overflow-hidden`}>
        <div className="flex flex-col items-center px-6 pt-6">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-${themeColor}-100`}>
            {isReject ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
          </div>

          <h3 className="mt-4 text-lg font-bold text-text-primary">
            {title}
          </h3>
          <p className="mt-2 text-center text-sm leading-relaxed text-text-tertiary px-2">
            {isReject ? (
              <>
                Are you sure you want to reject <span className="font-bold text-text-primary">{user.fullName}</span>? 
                This will <span className="text-red-600 font-semibold underline">delete</span> their account registration from the system.
              </>
            ) : (
              <>
                Are you sure you want to approve <span className="font-bold text-text-primary">{user.fullName}</span>? 
                This will grant them <span className="text-emerald-600 font-semibold italic">Active access</span> to the system.
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-border-main bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 rounded-lg border border-${isReject ? "red" : "emerald"}-600 bg-${isReject ? "red" : "emerald"}-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50`}
          >
            {isProcessing ? "Processing..." : isReject ? "Yes, Reject & Delete" : "Yes, Approve Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
