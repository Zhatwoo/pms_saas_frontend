"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/types";
import { APP_SHORT_NAME, APP_TAGLINE } from "@/lib/constants";
import { LogoutIcon } from "@/lib/icons";

interface SidebarProps {
  navGroups: NavGroup[];
  collapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
}

export function Sidebar({ navGroups, collapsed, onToggle, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-screen flex-col bg-pawn-sidebar text-white transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      {/* Logo + toggle */}
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-4">
        <button
          onClick={onToggle}
          className="flex-shrink-0 rounded-lg p-0.5 transition hover:bg-pawn-sidebar-light"
        >
          <Image
            src="/logo.jpg"
            alt="JCLB Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
        </button>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-base font-bold leading-tight tracking-wide text-white">
              {APP_SHORT_NAME}
            </p>
            <p className="text-[11px] font-medium leading-tight tracking-wider text-white/60">
              {APP_TAGLINE}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        {navGroups.map((group, groupIdx) => (
          <div key={group.section} className={groupIdx === 0 ? "mt-2" : "mt-5"}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-pawn-section">
                {group.section}
              </p>
            )}
            {collapsed && groupIdx > 0 && (
              <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-pawn-gold font-medium text-zinc-900"
                        : "text-white/80 hover:bg-pawn-sidebar-light hover:text-white"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-pawn-sidebar-light hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogoutIcon />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
