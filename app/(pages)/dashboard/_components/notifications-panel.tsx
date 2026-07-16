"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export interface NotificationItem {
  id: string | number;
  message: string;
  time: string;
  branchId?: string | null;
}

interface NotificationsPanelProps {
  notifications?: NotificationItem[];
}

const MAX_VISIBLE_NOTIFICATIONS = 5;

const infoIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export function NotificationsPanel({ notifications = [] }: NotificationsPanelProps) {
  const { user } = useAuth();
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS);
  const auditLogsHref =
    user?.role === "admin"
      ? "/admin/audit-logs"
      : user?.role === "employee"
        ? "/employee/audit-logs"
        : "/audit-logs";

  return (
    <div className="flex h-auto flex-col overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300 lg:h-[34rem]">
      <div className="flex h-full min-h-0 flex-col p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Notifications & Alerts
          </h3>
          <p className="text-xs text-text-tertiary">
            Important updates requiring attention
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-3 pb-4">
            {notifications.length === 0 ? (
              <div className="py-4 text-center text-sm text-text-tertiary">
                No notifications
              </div>
            ) : (
              visibleNotifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-secondary p-3"
                >
                  {infoIcon}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary break-all">
                      {item.message}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end border-t border-border-subtle pt-3">
          <Link
            href={auditLogsHref}
            className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-500"
          >
            View all
          </Link>
        </div>
      </div>
    </div>
  );
}
