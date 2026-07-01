"use client";

import { useState } from "react";

interface DeleteDeviceModalProps {
  isOpen: boolean;
  deviceName: string;
  employeeName: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteDeviceModal({
  isOpen,
  deviceName,
  employeeName,
  onClose,
  onConfirm,
}: DeleteDeviceModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
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
      <div className="relative z-10 w-full max-w-sm animate-[fadeInUp_0.25s_ease-out] rounded-xl border border-red-200 bg-surface shadow-2xl">
        {/* Warning Icon */}
        <div className="flex flex-col items-center px-6 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
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
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <h3 className="mt-4 text-base font-bold text-text-primary">
            Delete Device
          </h3>
          <p className="mt-2 text-center text-xs leading-relaxed text-text-tertiary">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-text-primary">{deviceName}</span>
            {employeeName && (
              <>
                {" "}
                registered to{" "}
                <span className="font-bold text-text-primary">{employeeName}</span>
              </>
            )}
            ? This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-border-main bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
