interface NotificationItem {
  id: string | number;
  message: string;
  time: string;
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

export function NotificationsPanel({ notifications = [] }: NotificationsPanelProps) {
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
          <div className="text-sm text-text-tertiary py-4 text-center">No notifications</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-secondary p-3"
            >
              {infoIcon}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {item.message}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
