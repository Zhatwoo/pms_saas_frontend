"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/contexts/branch-context";
import { PaginationFooter } from "@/components/shared/pagination";
import {
  buildPawnTransactionHighlightHref,
  extractTransactionNoFromText,
} from "@/lib/pawn-transaction-navigation";
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

const ITEMS_PER_PAGE = 5;

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

const arrowIcon = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-emerald-500"
  >
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

export function NotificationsPanel({ notifications = [] }: NotificationsPanelProps) {
  const router = useRouter();
  const { branches, setSelectedBranch } = useBranch();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [notifications]);

  const totalPages = Math.max(1, Math.ceil(notifications.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleNotifications = notifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function handleNotificationClick(item: NotificationItem) {
    const isExpiration = item.message.startsWith("Expiration Alert:");
    
    // If notification has a branchId, switch to that branch first
    if (item.branchId) {
      const targetBranch = branches.find((b) => b.id === item.branchId);
      if (targetBranch) {
        setSelectedBranch(targetBranch);
      }
    }

    if (isExpiration) {
      const ticketNoMatch = item.message.match(/Expiration Alert:\s*([A-Z0-9-]+)/i);
      const ticketNo = ticketNoMatch ? ticketNoMatch[1] : null;
      if (ticketNo) {
        const route = user?.role === "super_admin" ? "/expiration-monitoring" : user?.role === "admin" ? "/admin/expiration-monitoring" : "/employee/expiration-monitoring";
        router.push(`${route}?ticketNo=${ticketNo}&highlightTransaction=true`);
        return;
      }
    }

    const transactionNo = extractTransactionNoFromText(item.message);
    if (!transactionNo) return;

    router.push(buildPawnTransactionHighlightHref(transactionNo, user?.role === "super_admin" ? "super_admin" : "employee"));
  }

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
              visibleNotifications.map((item) => {
                const isExpiration = item.message.startsWith("Expiration Alert:");
                const transactionNo = extractTransactionNoFromText(item.message);
                const isClickable = isExpiration || Boolean(transactionNo);

                const content = (
                  <>
                    {infoIcon}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {item.message}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
                    </div>
                    {isClickable && arrowIcon}
                  </>
                );

                if (!isClickable) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-secondary p-3"
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className="flex w-full items-start gap-3 rounded-md border border-border-subtle bg-surface-secondary p-3 text-left transition-colors hover:border-emerald-400/50 hover:bg-emerald-50/10"
                    title={isExpiration ? "Go to expiration monitoring" : `Go to transaction ${transactionNo}`}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>

      {notifications.length > ITEMS_PER_PAGE && (
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={notifications.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          className="mt-4 -mx-5"
        />
      )}
      </div>
    </div>
  );
}
