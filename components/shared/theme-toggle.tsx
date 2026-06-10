"use client";

import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

type ThemeToggleVariant = "default" | "onDark";

interface ThemeToggleProps {
  className?: string;
  variant?: ThemeToggleVariant;
}

export function ThemeToggle({ className, variant = "default" }: ThemeToggleProps) {
  const { isDark, toggleTheme, isTransitioning } = useTheme();

  return (
    <button
      type="button"
      onClick={(event) => toggleTheme(event)}
      disabled={isTransitioning}
      id="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pawn-gold/60 focus-visible:ring-offset-2",
        variant === "onDark"
          ? "text-white/80 hover:bg-white/10 hover:text-amber-300"
          : "text-text-tertiary hover:bg-surface-hover hover:text-pawn-gold",
        isTransitioning && "pointer-events-none opacity-75",
        className,
      )}
    >
      <svg
        className={cn(
          "absolute transition-all duration-500",
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      <svg
        className={cn(
          "absolute transition-all duration-500",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
