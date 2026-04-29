import type { ReactNode } from "react";

interface DataLoadingWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  className?: string;
}

export function DataLoadingWrapper({
  isLoading,
  children,
  loadingText = "Updating data...",
  className = "",
}: DataLoadingWrapperProps) {
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface/40 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-full border border-border-main bg-surface px-4 py-2 shadow-md">
            <svg className="h-5 w-5 animate-spin text-pawn-gold" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-text-secondary">{loadingText}</span>
          </div>
        </div>
      )}
      <div
        className={`transition-opacity duration-200 ${
          isLoading ? "pointer-events-none opacity-60" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
