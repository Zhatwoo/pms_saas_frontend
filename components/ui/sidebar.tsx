"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { NavGroup, NavItem, Role } from "@/types";
import { APP_SHORT_NAME, APP_TAGLINE } from "@/lib/constants";
import { getRoleLabel } from "@/lib/auth";
import { LogoutIcon } from "@/lib/icons";
import { LogoutModal } from "./logout-modal";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";

interface SidebarProps {
  navGroups: NavGroup[];
  collapsed: boolean;
  onToggle: () => void;
  userName?: string;
  userRole?: Role;
  onLogout?: () => void;
  disabled?: boolean;
}

function NavItemComponent({
  item,
  collapsed,
  pathname,
  disabled,
  isExpanded,
  onToggle,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  disabled?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  // Active state logic
  const isSelfActive =
    pathname === item.href || pathname.startsWith((item.href ?? "") + "/");
  const effectivelyDisabled = disabled && item.href !== "/employee/dashboard";

  const router = useRouter();

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => {
            if (!collapsed) {
              // If we're about to expand (isExpanded is currently false), navigate to first sub-item
              if (!isExpanded && item.subItems && item.subItems.length > 0) {
                router.push(item.subItems[0].href);
              }
              onToggle();
            }
          }}
          title={collapsed ? item.label : undefined}
          disabled={disabled}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
            collapsed ? "justify-center" : ""
          } ${
            effectivelyDisabled 
              ? "opacity-30 cursor-not-allowed" 
              : "text-white/80 hover:bg-pawn-sidebar-light hover:text-white"
          }`}
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
              className={`transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isExpanded && !collapsed
              ? "grid-rows-[1fr] opacity-100 mt-1"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-9 space-y-1 pb-1">
              {item.subItems?.map((sub, subIdx) => {
                const isSubActive =
                  pathname === sub.href ||
                  pathname.startsWith((sub.href ?? "") + "/");
                return (
                  <Link
                    key={`${item.href ?? item.label}-sub-${subIdx}-${
                      sub.href ?? sub.label
                    }`}
                    href={effectivelyDisabled ? "#" : (sub.href ?? "#")}
                    className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      isSubActive
                        ? "bg-pawn-gold text-zinc-900 shadow-sm"
                        : effectivelyDisabled
                          ? "text-white/20 cursor-not-allowed"
                          : "text-white/60 hover:bg-pawn-sidebar-light hover:text-white"
                    }`}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular non-nested link
  const content = (
    <div
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        isSelfActive
          ? "bg-pawn-gold font-medium text-zinc-900"
          : effectivelyDisabled 
            ? "text-white/30 cursor-not-allowed" 
            : "text-white/80 hover:bg-pawn-sidebar-light hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && item.label}
    </div>
  );

  if (effectivelyDisabled) return content;

  return (
    <Link href={item.href ?? "#"}>
      {content}
    </Link>
  );
}

export function Sidebar({
  navGroups,
  collapsed,
  onToggle,
  userName,
  userRole,
  onLogout,
  disabled,
}: SidebarProps) {
  const { resetChecklist } = useOpeningChecklist();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  // Auto-expand based on pathname
  useEffect(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        const isAnySubActive =
          item.subItems &&
          item.subItems.some(
            (sub) =>
              pathname === sub.href ||
              pathname.startsWith((sub.href ?? "") + "/"),
          );
        if (isAnySubActive) {
          setExpandedKey(item.label);
          return;
        }
      }
    }
  }, [pathname, navGroups]);

  const userInitials = userName
    ? userName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

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
                  key={`${group.section}-${groupIdx}-item-${itemIdx}-${
                    item.href ?? item.label
                  }`}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                  disabled={disabled}
                  isExpanded={expandedKey === item.label}
                  onToggle={() => handleToggle(item.label)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2">
        <div
          className={`flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pawn-gold text-sm font-bold text-zinc-900">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {userName || "Current User"}
              </p>
              <p className="text-xs uppercase tracking-wide text-white/60">
                {userRole ? getRoleLabel(userRole) : "Signed In"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Debug: Reset Checklist */}
      {userRole === "employee" && (
        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => {
              resetChecklist();
              window.location.reload();
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition-colors hover:bg-rose-500/10 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {!collapsed && "Reset Checklist (Debug)"}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-pawn-sidebar-light hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogoutIcon />
          {!collapsed && "Logout"}
        </button>
      </div>

      <LogoutModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout?.();
        }}
      />
    </aside>
  );
}
