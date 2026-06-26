"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { NavGroup, NavItem, Role } from "@/types";
import { APP_SHORT_NAME, APP_TAGLINE } from "@/lib/constants";
import { getRoleLabel } from "@/lib/auth";
import { LogoutIcon, MenuIcon, CloseIcon } from "@/lib/icons";
import { LogoutModal } from "./logout-modal";
import { useOptionalOpeningChecklist } from "@/contexts/opening-checklist-context";

interface SidebarProps {
  navGroups: NavGroup[];
  collapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  onNavigate?: () => void;
  userName?: string;
  userRole?: Role;
  userAvatarUrl?: string;
  onLogout?: () => void;
  disabled?: boolean;
}

function NavItemComponent({
  item,
  collapsed,
  onNavigate,
  pathname,
  disabled,
  isExpanded,
  onToggle,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  pathname: string;
  disabled?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isAllowedDuringRestriction = (href?: string) =>
    Boolean(href && href.startsWith("/employee/inventory/pawned-items"));

  // Active state logic
  const isSelfActive =
    pathname === item.href || pathname.startsWith((item.href ?? "") + "/");
  const effectivelyDisabled =
    Boolean(disabled) &&
    !isAllowedDuringRestriction(item.href) &&
    !(item.subItems?.some((sub) => isAllowedDuringRestriction(sub.href)) ?? false);

  const router = useRouter();

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => {
            if (effectivelyDisabled) {
              return;
            }
            if (!collapsed) {
              // If we're about to expand (isExpanded is currently false), navigate to first sub-item
              if (!isExpanded && item.subItems && item.subItems.length > 0) {
                router.push(item.subItems[0].href);
                onNavigate?.();
              }
              onToggle();
            }
          }}
          title={collapsed ? item.label : undefined}
          disabled={effectivelyDisabled}
          className={`flex w-full min-h-[48px] items-center justify-between overflow-hidden whitespace-nowrap rounded-lg px-4 py-3 text-base transition-colors ${
            collapsed ? "justify-center px-2" : ""
          } ${
            effectivelyDisabled
              ? "opacity-30 cursor-not-allowed"
              : "text-white/80 hover:bg-pawn-sidebar-light hover:text-white"
          }`}
        >
          <div
            className={`flex min-w-0 items-center ${
              collapsed ? "justify-center gap-0" : "gap-3"
            }`}
          >
            <span className="flex-shrink-0 text-pawn-gold">{item.icon}</span>
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </div>
          {!collapsed && (
            <svg
              width="18"
              height="18"
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
          className={`grid transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
            isExpanded && !collapsed
              ? "grid-rows-[1fr] opacity-100 mt-1"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-10 space-y-1 pb-1">
              {item.subItems?.map((sub, subIdx) => {
                const isSubActive =
                  pathname === sub.href ||
                  pathname.startsWith((sub.href ?? "") + "/");
                const isSubDisabled = Boolean(disabled) && !isAllowedDuringRestriction(sub.href);

                if (isSubDisabled) {
                  return (
                    <span
                      key={`${item.href ?? item.label}-sub-${subIdx}-${sub.href ?? sub.label}`}
                      aria-disabled="true"
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/20 cursor-not-allowed"
                    >
                      {sub.label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={`${item.href ?? item.label}-sub-${subIdx}-${
                      sub.href ?? sub.label
                    }`}
                    href={sub.href ?? "#"}
                    onClick={() => onNavigate?.()}
                    className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      isSubActive
                        ? "bg-pawn-gold text-zinc-900 shadow-sm"
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
      className={`flex min-h-[48px] items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg px-4 py-3 text-base transition-colors ${
        collapsed ? "justify-center px-2" : ""
      } ${
        isSelfActive
          ? "bg-pawn-gold font-medium text-zinc-900"
          : effectivelyDisabled 
            ? "text-white/30 cursor-not-allowed" 
            : "text-white/80 hover:bg-pawn-sidebar-light hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </div>
  );

  if (effectivelyDisabled) {
    return (
      <div aria-disabled="true" className="cursor-not-allowed">
        {content}
      </div>
    );
  }

  return (
    <Link href={item.href ?? "#"} onClick={() => onNavigate?.()}>
      {content}
    </Link>
  );
}

export function Sidebar({
  navGroups,
  collapsed,
  isMobileOpen,
  onToggle,
  onMobileClose,
  onNavigate,
  userName,
  userRole,
  userAvatarUrl,
  onLogout,
  disabled,
}: SidebarProps) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const openingChecklist = useOptionalOpeningChecklist();

  const isCompact = collapsed && !isMobileOpen;

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

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const firstFocusable = sidebarRef.current?.querySelector<HTMLElement>(
      'button, a, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [isMobileOpen]);

  const handleSidebarKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!isMobileOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onMobileClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusables = Array.from(
      sidebarRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute("disabled"));

    if (focusables.length === 0) {
      return;
    }

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  const userInitials = userName
    ? userName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      <aside
        ref={sidebarRef}
        onKeyDown={handleSidebarKeyDown}
        role={isMobileOpen ? "dialog" : undefined}
        aria-modal={isMobileOpen ? "true" : undefined}
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col overflow-hidden bg-pawn-sidebar text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:h-screen lg:flex-none lg:shadow-none lg:transition-[transform,width] lg:duration-100 lg:ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
          isMobileOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none lg:translate-x-0 lg:pointer-events-auto"
        } ${isCompact ? "lg:w-[72px]" : "lg:w-72"}`}
      >
        {/* Brand header */}
        <div
          className={`overflow-hidden py-4 transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
            isCompact ? "px-0" : "px-4"
          }`}
        >
          <div
            className={`flex w-full items-center transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
              isCompact ? "justify-center" : "justify-start gap-3"
            }`}
          >
            <button
              onClick={() => {
                if (isMobileOpen) {
                  onMobileClose();
                  return;
                }

                onToggle();
              }}
              aria-label={
                isMobileOpen
                  ? "Close sidebar"
                  : isCompact
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition hover:bg-pawn-sidebar-light"
            >
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
                  isCompact
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-2 opacity-0"
                }`}
              >
                <MenuIcon />
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
                  isCompact
                    ? "translate-x-2 opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              >
                <Image
                  src="/logo.png"
                  alt="JCLB Logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </span>
            </button>
          <div
            className={`overflow-hidden whitespace-nowrap text-left transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
              isCompact
                ? "max-w-0 -translate-x-2 opacity-0"
                : "max-w-[180px] translate-x-0 opacity-100"
            }`}
          >
            <p className="text-lg font-bold leading-tight tracking-wide text-white">
              {APP_SHORT_NAME}
            </p>
            <p className="text-xs font-medium leading-tight tracking-wider text-white/60">
              {APP_TAGLINE}
            </p>
          </div>
          {!isCompact && (
            <button
              type="button"
              onClick={() => {
                if (isMobileOpen) {
                  onMobileClose();
                  return;
                }

                onToggle();
              }}
              aria-label="Collapse sidebar"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-100 ease-[cubic-bezier(0.4,0.0,0.2,1)] hover:bg-pawn-sidebar-light opacity-100"
            >
              {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`scrollbar-hide flex-1 overflow-y-auto py-3 ${isCompact ? "px-2" : "px-3"}`}>
        {navGroups.map((group, groupIdx) => (
          <div
            key={`${group.section}-${groupIdx}`}
            className={groupIdx === 0 ? "mt-2" : "mt-5"}
          >
            {!isCompact && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-pawn-section">
                {group.section}
              </p>
            )}
            {isCompact && groupIdx > 0 && (
              <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item, itemIdx) => (
                <NavItemComponent
                  key={`${group.section}-${groupIdx}-item-${itemIdx}-${
                    item.href ?? item.label
                  }`}
                  item={item}
                  collapsed={isCompact}
                  onNavigate={onNavigate}
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
            isCompact ? "justify-center" : ""
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 aspect-square overflow-hidden items-center justify-center rounded-full bg-pawn-gold text-base font-bold leading-none text-zinc-900">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              userInitials
            )}
          </div>
          {!isCompact && (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-red-500">
                {userName || "Current User"}
              </p>
              <p className="text-sm uppercase tracking-wide text-white/60">
                {userRole ? getRoleLabel(userRole) : "Signed In"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title={isCompact ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-white/60 transition-colors hover:bg-pawn-sidebar-light hover:text-white ${
            isCompact ? "justify-center px-2" : ""
          }`}
        >
          <LogoutIcon />
          {!isCompact && "Logout"}
        </button>
      </div>


    </aside>
    <LogoutModal
      isOpen={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      onConfirm={() => {
        setShowLogoutConfirm(false);
        onLogout?.();
      }}
    />
    </>
  );
}
