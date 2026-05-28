"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClockIcon, BellIcon, MenuIcon } from "@/lib/icons";
import { useTheme } from "@/contexts/theme-context";
import { BranchSelectorDropdown } from "@/components/shared/branch-selector-dropdown";
import { api } from "@/lib/api";
import { extractTransactionNoFromText } from "@/lib/pawn-transaction-navigation";
import {
  addRolePrefixToTargetUrl,
  type ApiNotification,
  type HeaderNotification,
  isFundTransferNotification,
  mapNotification,
  type NotificationTab,
} from "@/lib/notifications";
import { getNotificationStreamUrl } from "@/lib/notification-stream";
import { useAuth } from "@/contexts/auth-context";

interface HeaderProps {
  userInitials?: string;
  notificationCount?: number;
  branchName?: string;
  hideBranchSelector?: boolean;
  onMenuToggle?: () => void;
}

function formatTimeOnly(): string {
  const now = new Date();
  return now.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
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
  const customTitles: Record<string, string> = {
    "view_user": "View Customer",
    "users": "Employees",
  };

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Dashboard";
  
  if (customTitles[last]) {
    return customTitles[last];
  }

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
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-text-tertiary transition-all duration-300 hover:bg-surface-hover hover:text-pawn-gold"
    >
      {/* Sun icon */}
      <svg
        className={`absolute transition-all duration-500 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
        width="22"
        height="22"
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
        width="22"
        height="22"
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
  onMenuToggle,
}: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [time, setTime] = useState("");
  const [timeOnly, setTimeOnly] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HeaderNotification[]>([]);
  const readingIdsRef = useRef<Set<string>>(new Set());
  const soundEnabledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const enableNotificationSound = useCallback(() => {
    if (soundEnabledRef.current || typeof window === "undefined") return;

    const audio = audioRef.current ?? new Audio("/sounds/notif_1.mp3");
    audio.preload = "auto";
    audio.volume = 0.55;
    audioRef.current = audio;
    soundEnabledRef.current = true;
  }, []);

  const playBeepFallback = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (fallbackError) {
      console.warn("Notification sound failed:", fallbackError);
    }
  }, []);

  const playNotificationSound = useCallback(async () => {
    if (!soundEnabledRef.current) return;

    const soundPaths = ["/sounds/notif_1.mp3"];
    for (const path of soundPaths) {
      try {
        const audio =
          audioRef.current?.src.endsWith(path)
            ? audioRef.current
            : new Audio(path);
        audio.preload = "auto";
        audio.volume = 0.6;
        audio.currentTime = 0;
        audioRef.current = audio;
        await audio.play();
        return;
      } catch {
        continue;
      }
    }

    playBeepFallback();
  }, [playBeepFallback]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<ApiNotification[]>("/notifications");
      if (data && Array.isArray(data)) {
        setNotifications(data.map(mapNotification));
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const fetchNotificationsRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    setTime(formatDateTime());
    setTimeOnly(formatTimeOnly());
    const clockInterval = setInterval(() => {
      setTime(formatDateTime());
      setTimeOnly(formatTimeOnly());
    }, 1000);

    void fetchNotifications();

    // ─── Custom Event Listener (Bulletproof Fallback) ────────────────────
    const handleTransactionCreated = () => {
      void fetchNotificationsRef.current();
    };
    window.addEventListener("transaction_created", handleTransactionCreated);

    // ─── Realtime Subscription ───────────────────────────────────────────
    const enableSoundAfterInteraction = () => enableNotificationSound();
    window.addEventListener("pointerdown", enableSoundAfterInteraction, { once: true });
    window.addEventListener("keydown", enableSoundAfterInteraction, { once: true });

    let events: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    if (typeof EventSource !== "undefined") {
      events = new EventSource(getNotificationStreamUrl(), { withCredentials: true });

      events.addEventListener("notification.created", (event) => {
        try {
          const next = mapNotification(JSON.parse((event as MessageEvent).data));
          const alreadyLoaded = notificationsRef.current.some((item) => item.id === next.id);

          setNotifications((prev) => {
            if (prev.some((item) => item.id === next.id)) return prev;
            return [next, ...prev].slice(0, 50);
          });

          window.dispatchEvent(
            new CustomEvent("pms:notification-created", {
              detail: next,
            }),
          );

          if (isFundTransferNotification(next)) {
            window.dispatchEvent(
              new CustomEvent("pms:fund-transfer-notification", {
                detail: next,
              }),
            );
          }

          if (!alreadyLoaded && next.unread) {
            void playNotificationSound();
          }
        } catch (err) {
          console.error("Failed to parse realtime notification:", err);
        }
      });

      events.addEventListener("notification.read", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as {
            ids?: string[];
            all?: boolean;
          };
          const ids = new Set(payload.ids ?? []);
          setNotifications((prev) =>
            prev.map((item) =>
              payload.all || ids.has(item.id) ? { ...item, unread: false } : item,
            ),
          );
        } catch (err) {
          console.error("Failed to parse notification read event:", err);
        }
      });

      events.onerror = () => {
        fallbackInterval ??= setInterval(() => {
          void fetchNotificationsRef.current();
        }, 30_000);
      };
    } else {
      fallbackInterval = setInterval(fetchNotifications, 30_000);
    }

    return () => {
      clearInterval(clockInterval);
      if (fallbackInterval) clearInterval(fallbackInterval);
      events?.close();
      window.removeEventListener("transaction_created", handleTransactionCreated);
      window.removeEventListener("pointerdown", enableSoundAfterInteraction);
      window.removeEventListener("keydown", enableSoundAfterInteraction);
    };
  }, [enableNotificationSound, fetchNotifications, playNotificationSound]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (
        isNotificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isNotificationOpen]);

  const title = getPageTitle(pathname || "");
  const isCustomerDetailPage = (pathname || "").includes("view_user");
  const unreadCount = notifications.filter((item) => item.unread).length;
  const badgeCount = Math.max(notificationCount, unreadCount);
  const resolvedInitials =
    user?.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || userInitials;

  const filteredNotifications = useMemo(() => {
    if (activeTab === "All") {
      return notifications;
    }
    return notifications.filter((item) => item.category === activeTab);
  }, [activeTab, notifications]);

  const recentNotifications = filteredNotifications;

  const markAllAsRead = async () => {
    const snapshot = notifications;
    setNotifications((prev) => {
      return prev.map((item) => ({ ...item, unread: false }));
    });

    try {
      await api.patch("/notifications/read-all", {});
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      setNotifications(snapshot);
    }
  };

  const markOneAsRead = async (id: string, options?: { revertOnError?: boolean }) => {
    if (readingIdsRef.current.has(id)) return;
    readingIdsRef.current.add(id);
    const snapshot = notifications;
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );

    try {
      await api.patch(`/notifications/${encodeURIComponent(id)}/read`, {});
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      if (options?.revertOnError !== false) {
        setNotifications(snapshot);
      }
    } finally {
      readingIdsRef.current.delete(id);
    }
  };

  const handleViewAllNotifications = () => {
    const currentPath = pathname || "";
    let targetPath = "/audit-logs";

    if (currentPath.startsWith("/admin")) {
      targetPath = "/admin/audit-logs";
    } else if (currentPath.startsWith("/employee")) {
      targetPath = "/employee/audit-logs";
    }

    setIsNotificationOpen(false);
    router.push(targetPath);
  };

  const customerProfileBasePath = pathname.startsWith("/admin")
    ? "/admin/customers/view_user"
    : pathname.startsWith("/employee")
      ? "/employee/customers/view_user"
      : "/customers/view_user";

  const buildCustomerProfileHref = (customerId: string, logId?: string | null) => {
    const params = new URLSearchParams({ id: customerId });
    if (logId) {
      params.set("highlightLogId", logId);
    }

    return `${customerProfileBasePath}?${params.toString()}`;
  };

  const resolveNotificationHref = (item: HeaderNotification) => {
    if (item.targetUrl) {
      return addRolePrefixToTargetUrl(item.targetUrl, user?.role);
    }

    if (item.customerId) {
      return buildCustomerProfileHref(item.customerId, item.logId);
    }

    const transactionNo =
      extractTransactionNoFromText(item.title) ?? extractTransactionNoFromText(item.subtitle);
    if (transactionNo) {
      return addRolePrefixToTargetUrl(
        `/pawn-transactions?transactionNo=${encodeURIComponent(transactionNo)}&highlightTransaction=true`,
        user?.role,
      );
    }

    return null;
  };

  const renderNotificationRow = (item: HeaderNotification) => (
    (() => {
      const notificationHref = resolveNotificationHref(item);

      const content = (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{item.subtitle}</p>
            </div>
            {item.unread && (<span className="mt-1 h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'var(--emerald-text)'}}></span>)}
          </div>
        </>
      );

      if (!notificationHref) {
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => void markOneAsRead(item.id)}
            className="w-full rounded-lg border border-border-main bg-surface-subtle px-4 py-3 text-left transition-colors hover:border-[var(--emerald-border)] hover:bg-[var(--emerald-surface)]/70"
            title="Mark as read"
          >
            {content}
          </button>
        );
      }

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            void markOneAsRead(item.id, { revertOnError: false });
            setIsNotificationOpen(false);
            router.push(notificationHref);
          }}
          className="w-full cursor-pointer rounded-lg border border-border-main bg-surface-subtle px-4 py-3 text-left transition-colors hover:border-[var(--emerald-border)] hover:bg-[var(--emerald-surface)]/70"
          title={item.customerId ? "Open customer profile" : "Open related record"}
        >
          {content}
        </button>
      );
    })()
  );

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border-main bg-header-bg px-4 py-3 md:px-6 md:py-4 transition-colors duration-300">
      {/* Left section: hamburger + title + branch label */}
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Open sidebar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border-main text-text-tertiary transition hover:bg-surface-hover hover:text-text-primary lg:hidden"
          >
            <MenuIcon />
          </button>
        )}
        <h1 className="max-w-[9rem] whitespace-normal break-words text-xs font-bold leading-tight text-text-primary sm:max-w-[10rem] sm:text-sm md:max-w-[12rem] md:text-sm lg:max-w-none lg:text-base xl:text-lg">
          {title}
        </h1>
        {branchName && (
          <div className="hidden lg:flex items-center gap-4">
            <span className="h-6 w-px bg-border-main" />
            <span className="text-base font-semibold" style={{color: 'var(--emerald-text)'}}>
              {branchName}
            </span>
          </div>
        )}
      </div>

      {/* Center section: clock — hidden on mobile, time-only on tablet, full on desktop */}
      <div className="hidden md:flex items-center justify-center gap-2 rounded-full border border-border-main px-3 py-2 text-sm text-text-tertiary lg:px-4 lg:text-base">
        <ClockIcon />
        <span className="hidden lg:inline min-w-[180px] text-center">{time}</span>
        <span className="lg:hidden">{timeOnly}</span>
      </div>

      {/* Right section: branch selector, notifications, theme toggle, avatar */}
      <div className="flex shrink-0 items-center justify-end gap-1 md:gap-2 lg:gap-3">
        {/* Branch Selector – superadmin only */}
        {!hideBranchSelector && !isCustomerDetailPage && <BranchSelectorDropdown />}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              enableNotificationSound();
              setIsNotificationOpen((prev) => !prev);
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label="Open notifications"
          >
            <BellIcon />
            {badgeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="fixed left-2 right-2 top-[57px] z-50 rounded-xl border border-border-main bg-header-bg p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px] sm:fixed-none">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary">Notifications</h3>
              </div>

              <div className="mb-3 grid grid-cols-4 gap-1 rounded-lg border border-border-main bg-surface-subtle p-1">
                {(["All", "Transactions", "Alerts", "Requests"] as NotificationTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeTab === tab
                          ? "bg-pawn-sidebar text-white"
                          : "text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {tab}
                    </button>
                  ),
                )}
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Recent
                  </p>
                  <div className="space-y-2">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map(renderNotificationRow)
                    ) : (
                      <p className="rounded-md border border-dashed border-border-main px-3 py-2 text-sm text-text-tertiary">
                        No notifications.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-main pt-3">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded-md border border-border-main px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  Mark as read
                </button>
                <button
                  type="button"
                  onClick={handleViewAllNotifications}
                  className="rounded-md bg-[var(--emerald-surface)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--emerald-surface)]"
                >
                  View all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggleButton />

        {/* User Avatar */}
        <div className="h-11 w-11 overflow-hidden rounded-full bg-pawn-sidebar">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="User avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white">
              {resolvedInitials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
