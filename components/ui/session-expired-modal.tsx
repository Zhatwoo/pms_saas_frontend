"use client";

interface SessionExpiredModalProps {
  isOpen: boolean;
  message: string;
  secondsUntilRedirect: number;
  onConfirm: () => void;
}

export function SessionExpiredModal({
  isOpen,
  message,
  secondsUntilRedirect,
  onConfirm,
}: SessionExpiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-amber-200 bg-surface shadow-2xl"
      >
        <div className="flex flex-col items-center px-6 pt-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-700"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h3 id="session-expired-title" className="mt-4 text-lg font-bold text-text-primary">
            Session expired
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {message}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Redirecting to login in {Math.max(0, secondsUntilRedirect)}s
          </p>
        </div>

        <div className="px-6 py-5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-lg border border-amber-600 bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Re-login now
          </button>
        </div>
      </div>
    </div>
  );
}
