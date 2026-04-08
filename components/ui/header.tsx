"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClockIcon, BellIcon } from "@/lib/icons";
import { useTheme } from "@/contexts/theme-context";
import { BranchSelectorDropdown } from "@/components/shared/branch-selector-dropdown";

interface HeaderProps {
  userInitials?: string;
  notificationCount?: number;
  branchName?: string;
  hideBranchSelector?: boolean;
}

function formatDateTime(): string {
  const now = new Date();
  return now.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Dashboard";
  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/* ── Sun / Moon icons with animated morph ─────────────── */
function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      id="theme-toggle"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-tertiary transition-all duration-300 hover:bg-surface-hover hover:text-pawn-gold"
    >
      {/* Sun icon */}
      <svg
        className={`absolute transition-all duration-500 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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

      {/* Moon icon */}
      <svg
        className={`absolute transition-all duration-500 ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

export function Header({
  userInitials = "U",
  notificationCount = 0,
  branchName,
  hideBranchSelector = false,
}: HeaderProps) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(formatDateTime());
    const interval = setInterval(() => setTime(formatDateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const title = getPageTitle(pathname || "");

  return (
    <header className="flex items-center justify-between border-b border-border-main bg-header-bg px-6 py-3 transition-colors duration-300">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-text-primary leading-none">{title}</h1>
        {branchName && (
          <p className="mt-1 text-sm font-medium text-zinc-500">{branchName}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Branch Selector – superadmin only */}
        {!hideBranchSelector && <BranchSelectorDropdown />}

        {/* Clock */}
        <div className="flex items-center gap-2 rounded-full border border-border-main px-4 py-1.5 text-sm text-text-tertiary">
          <ClockIcon />
          <span className="min-w-[180px]">{time}</span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-full p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary">
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Theme Toggle – beside notifications */}
        <ThemeToggleButton />

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pawn-sidebar text-sm font-semibold text-white">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
