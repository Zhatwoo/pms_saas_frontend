"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { NavGroup, NavItem } from "@/types";
import { APP_SHORT_NAME, APP_TAGLINE } from "@/lib/constants";
import { LogoutIcon } from "@/lib/icons";

interface SidebarProps {
  navGroups: NavGroup[];
  collapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
}

function NavItemComponent({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  // For parent item, check if itself or any subitem is active
  const isSelfActive = pathname === item.href || pathname.startsWith((item.href ?? "") + "/");
  const isAnySubActive = hasSubItems && item.subItems?.some(
    (sub) => pathname === sub.href || pathname.startsWith((sub.href ?? "") + "/")
  );
  const isParentActive = isSelfActive || isAnySubActive;

  const [expanded, setExpanded] = useState(isAnySubActive);

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setExpanded(!expanded)}
          title={collapsed ? item.label : undefined}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
            collapsed ? "justify-center" : ""
          } text-white/80 hover:bg-pawn-sidebar-light hover:text-white`}
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 text-pawn-gold">{item.icon}</span>
            {!collapsed && item.label}
          </div>
          {!collapsed && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>

        {expanded && !collapsed && (
          <div className="ml-9 space-y-1">
            {item.subItems?.map((sub, subIdx) => {
              const isSubActive =
                pathname === sub.href || pathname.startsWith((sub.href ?? "") + "/");
              return (
                <Link
                  key={`${item.href ?? item.label}-sub-${subIdx}-${sub.href ?? sub.label}`}
                  href={sub.href ?? "#"}
                  className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    isSubActive
                      ? "bg-pawn-gold text-zinc-900"
                      : "text-white/60 hover:bg-pawn-sidebar-light hover:text-white"
                  }`}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Regular non-nested link
  return (
    <Link
      href={item.href ?? "#"}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        isSelfActive
          ? "bg-pawn-gold font-medium text-zinc-900"
          : "text-white/80 hover:bg-pawn-sidebar-light hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && item.label}
    </Link>
  );
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
          <div
            key={`${group.section}-${groupIdx}`}
            className={groupIdx === 0 ? "mt-2" : "mt-5"}
          >
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-pawn-section">
                {group.section}
              </p>
            )}
            {collapsed && groupIdx > 0 && (
              <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item, itemIdx) => (
                <NavItemComponent
                  key={`${group.section}-${groupIdx}-item-${itemIdx}-${item.href ?? item.label}`}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
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
