"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClockIcon, BellIcon } from "@/lib/icons";
import { useTheme } from "@/contexts/theme-context";
import { BranchSelectorDropdown } from "@/components/shared/branch-selector-dropdown";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { getSupabaseBrowserClient, getTokenFromCookie } from "@/lib/supabase-browser";

type NotificationTab = "All" | "Transactions" | "Alerts" | "Requests";
type NotificationGroup = "Today" | "Earlier";

interface HeaderNotification {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<NotificationTab, "All">;
  group: NotificationGroup;
  unread: boolean;
}

const DEFAULT_NOTIFICATIONS: HeaderNotification[] = [
  {
    id: "tx-1",
    title: "Juan Dela Cruz - Item expires in 2 days",
    subtitle: "Transaction Alert: near expiry item",
    category: "Transactions",
    group: "Today",
    unread: true,
  },
  {
    id: "tx-2",
    title: "Maria Santos - Item already expired",
    subtitle: "Transaction Alert: expired pawn item",
    category: "Transactions",
    group: "Today",
    unread: true,
  },
  {
    id: "tx-3",
    title: "Successful buyback completed - OR#2241",
    subtitle: "Transaction Alert: buyback success",
    category: "Transactions",
    group: "Today",
    unread: true,
  },
  {
    id: "tx-4",
    title: "New pawn transaction created - PT#9821",
    subtitle: "Transaction Alert: new pawn",
    category: "Transactions",
    group: "Today",
    unread: true,
  },
  {
    id: "al-1",
    title: "3 customers have pending interest due today",
    subtitle: "Payment Reminder",
    category: "Alerts",
    group: "Today",
    unread: true,
  },
  {
    id: "al-2",
    title: "Low inventory warning: Jewelry trays below threshold",
    subtitle: "Inventory Update",
    category: "Alerts",
    group: "Today",
    unread: true,
  },
  {
    id: "rq-1",
    title: "Request #1023 - Waiting for approval",
    subtitle: "Request / Approval",
    category: "Requests",
    group: "Earlier",
    unread: true,
  },
  {
    id: "rq-2",
    title: "Request #1021 - Approved",
    subtitle: "Request / Approval",
    category: "Requests",
    group: "Earlier",
    unread: false,
  },
  {
    id: "al-3",
    title: "Status update: 2 items are In Transit / OTW",
    subtitle: "Status Tracking",
    category: "Alerts",
    group: "Earlier",
    unread: false,
  },
  {
    id: "al-4",
    title: "System warning: Backup sync delayed",
    subtitle: "Daily Summary / System Alert",
    category: "Alerts",
    group: "Earlier",
    unread: false,
  },
];

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
  const customTitles: Record<string, string> = {
    "view_user": "View Customer",
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
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-text-tertiary transition-all duration-300 hover:bg-surface-hover hover:text-pawn-gold"
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
}: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [time, setTime] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTime(formatDateTime());
    const clockInterval = setInterval(() => setTime(formatDateTime()), 1000);

    async function fetchNotifications() {
      try {
        const data = await api.get<any[]>("/notifications");
        if (data && Array.isArray(data)) {
          const now = new Date();
          const today = now.toISOString().split("T")[0];

          const mapped: HeaderNotification[] = data.map((item) => {
            const itemDate = new Date(item.created_at).toISOString().split("T")[0];
            return {
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              category: item.category as any,
              unread: !item.is_read,
              group: itemDate === today ? "Today" : "Earlier",
            };
          });
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }

    void fetchNotifications();

    // ─── Realtime Subscription ───────────────────────────────────────────
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) {
      // Fallback to polling if realtime is unavailable
      const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
      return () => {
        clearInterval(clockInterval);
        clearInterval(interval);
      };
    }

    const token = getTokenFromCookie();
    if (token) {
      void supabase.realtime.setAuth(token);
    }

    const channel = supabase
      .channel("header-notifications-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      clearInterval(clockInterval);
      void supabase.removeChannel(channel);
    };
  }, [user]);

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
  const unreadCount = notifications.filter((item) => item.unread).length;
  const badgeCount = Math.max(notificationCount, unreadCount);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "All") {
      return notifications;
    }
    return notifications.filter((item) => item.category === activeTab);
  }, [activeTab, notifications]);

  const todayNotifications = filteredNotifications.filter(
    (item) => item.group === "Today",
  );
  const earlierNotifications = filteredNotifications.filter(
    (item) => item.group === "Earlier",
  );

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all", {});
      setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, unread: false } : item)),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
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

  const renderNotificationRow = (item: HeaderNotification) => (
    <button
      key={item.id}
      type="button"
      onClick={() => markOneAsRead(item.id)}
      className="w-full rounded-lg border border-border-main bg-surface-subtle px-4 py-3 text-left transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{item.subtitle}</p>
        </div>
        {item.unread && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />}
      </div>
    </button>
  );

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-border-main bg-header-bg px-6 py-4 transition-colors duration-300">
      <div className="flex min-w-0 items-center gap-4 justify-self-start">
        <h1 className="text-3xl font-bold text-text-primary leading-none">{title}</h1>
        {branchName && (
          <div className="flex items-center gap-4">
            <span className="h-6 w-px bg-border-main" />
            <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {branchName}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-self-center gap-3">
        {/* Clock */}
        <div className="flex items-center gap-2 rounded-full border border-border-main px-4 py-2 text-base text-text-tertiary">
          <ClockIcon />
          <span className="min-w-[180px] text-center">{time}</span>
        </div>
      </div>

      <div className="flex items-center justify-self-end gap-3">
        {/* Branch Selector – superadmin only */}
        {!hideBranchSelector && <BranchSelectorDropdown />}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            className="relative rounded-full p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
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
            <div className="absolute right-0 top-12 z-50 w-[420px] rounded-xl border border-border-main bg-header-bg p-4 shadow-xl">
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
                    Today
                  </p>
                  <div className="space-y-2">
                    {todayNotifications.length > 0 ? (
                      todayNotifications.map(renderNotificationRow)
                    ) : (
                      <p className="rounded-md border border-dashed border-border-main px-3 py-2 text-sm text-text-tertiary">
                        No items.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Earlier
                  </p>
                  <div className="space-y-2">
                    {earlierNotifications.length > 0 ? (
                      earlierNotifications.map(renderNotificationRow)
                    ) : (
                      <p className="rounded-md border border-dashed border-border-main px-3 py-2 text-sm text-text-tertiary">
                        No items.
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
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  View all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle – beside notifications */}
        <ThemeToggleButton />

        {/* User Avatar */}
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pawn-sidebar text-base font-semibold text-white">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
