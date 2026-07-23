"use client";

export type TransactionConfirmDetail = {
  label: string;
  value: string;
};

interface TransactionConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: TransactionConfirmDetail[];
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function TransactionConfirmModal({
  isOpen,
  title,
  message,
  details = [],
  confirmLabel,
  cancelLabel = "Cancel",
  isLoading = false,
  onClose,
  onConfirm,
}: TransactionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-green/50 backdrop-blur-sm"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-confirm-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-brand-green/30 bg-white shadow-2xl shadow-brand-green/20 animate-in fade-in zoom-in-95 duration-200 dark:border-brand-green/40 dark:bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pt-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 dark:bg-brand-green/20">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-green"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <h3 id="transaction-confirm-title" className="mt-4 text-base font-black text-text-primary">
            {title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{message}</p>
          {details.length > 0 ? (
            <div className="mt-4 w-full rounded-xl border border-border-main bg-surface-secondary px-4 py-3 text-left text-xs text-text-secondary">
              {details.map((row) => (
                <p key={row.label} className={row.label === details[0]?.label ? "" : "mt-1"}>
                  <span className="font-bold text-text-tertiary">{row.label}:</span> {row.value}
                </p>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-center gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border-main bg-surface px-4 py-2.5 text-xs font-black text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-brand-green/20 transition-colors hover:opacity-90 disabled:bg-text-muted disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="anim-loading h-4 w-4 border-white/30 border-t-white rounded-full" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
