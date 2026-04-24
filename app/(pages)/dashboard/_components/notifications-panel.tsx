"use client";

import { useRouter } from "next/navigation";
import { useBranch } from "@/contexts/branch-context";
import {
  buildPawnTransactionHighlightHref,
  extractTransactionNoFromText,
} from "@/lib/pawn-transaction-navigation";

export interface NotificationItem {
  id: string | number;
  message: string;
  time: string;
  branchId?: string | null;
}

interface NotificationsPanelProps {
  notifications?: NotificationItem[];
}

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

  function handleNotificationClick(item: NotificationItem) {
    const transactionNo = extractTransactionNoFromText(item.message);
    if (!transactionNo) return;

    // If notification has a branchId, switch to that branch first
    if (item.branchId) {
      const targetBranch = branches.find((b) => b.id === item.branchId);
      if (targetBranch) {
        setSelectedBranch(targetBranch);
      }
    }

    router.push(buildPawnTransactionHighlightHref(transactionNo, "super_admin"));
  }

  return (
    <div className="rounded-lg border border-border-main bg-surface p-5 transition-colors duration-300">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Notifications & Alerts
        </h3>
        <p className="text-xs text-text-tertiary">
          Important updates requiring attention
        </p>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-sm text-text-tertiary py-4 text-center">
            No notifications
          </div>
        ) : (
          notifications.map((item) => {
            const transactionNo = extractTransactionNoFromText(item.message);
            const isClickable = Boolean(transactionNo);

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
                title={`Go to transaction ${transactionNo}`}
              >
                {content}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
