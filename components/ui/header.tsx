"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClockIcon, BellIcon } from "@/lib/icons";

interface HeaderProps {
  userInitials?: string;
  notificationCount?: number;
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

export function Header({
  userInitials = "U",
  notificationCount = 0,
}: HeaderProps) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(formatDateTime());
    const interval = setInterval(() => setTime(formatDateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const title = getPageTitle(pathname);

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1.5 text-sm text-zinc-500">
          <ClockIcon />
          <span className="min-w-[180px]">{time}</span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pawn-sidebar text-sm font-semibold text-white">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
