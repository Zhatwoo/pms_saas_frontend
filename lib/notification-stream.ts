import {
  isExpirationAlertApiNotification,
  isFundTransferApiNotification,
  isPawnTransactionApiNotification,
  type ApiNotification,
} from "@/lib/notifications";

type NotificationChangeHandler = (notification?: ApiNotification) => void;
type NotificationPredicate = (notification: ApiNotification) => boolean;

export function getNotificationStreamUrl() {
  const configured =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

  if (configured) {
    return `${configured.replace(/\/$/, "")}/api/notifications/stream`;
  }

  if (typeof window === "undefined") {
    return "/api/notifications/stream";
  }

  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:4000/api/notifications/stream`;
  }

  return "/api/notifications/stream";
}

export function subscribeToNotifications(
  onChange: NotificationChangeHandler,
  predicate: NotificationPredicate,
  fallbackMs = 30_000,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let fallbackInterval: number | null = null;

  const startFallback = () => {
    fallbackInterval ??= window.setInterval(() => onChange(), fallbackMs);
  };

  const stopFallback = () => {
    if (!fallbackInterval) return;
    window.clearInterval(fallbackInterval);
    fallbackInterval = null;
  };

  if (typeof EventSource === "undefined") {
    startFallback();
    return stopFallback;
  }

  const events = new EventSource(getNotificationStreamUrl(), {
    withCredentials: true,
  });

  events.addEventListener("notification.created", (event) => {
    try {
      const notification = JSON.parse((event as MessageEvent).data) as ApiNotification;
      if (predicate(notification)) {
        onChange(notification);
      }
    } catch (err) {
      console.error("Failed to parse notification stream event:", err);
    }
  });

  events.onopen = stopFallback;
  events.onerror = startFallback;

  return () => {
    stopFallback();
    events.close();
  };
}

export function subscribeToFundTransferNotifications(
  onChange: NotificationChangeHandler,
) {
  return subscribeToNotifications(onChange, isFundTransferApiNotification);
}

export function subscribeToPawnTransactionNotifications(
  onChange: NotificationChangeHandler,
) {
  return subscribeToNotifications(onChange, isPawnTransactionApiNotification);
}

export function subscribeToFinanceRelevantNotifications(
  onChange: NotificationChangeHandler,
) {
  return subscribeToNotifications(
    onChange,
    (notification) =>
      isFundTransferApiNotification(notification) ||
      isPawnTransactionApiNotification(notification),
  );
}

export function subscribeToExpirationAlertNotifications(
  onChange: NotificationChangeHandler,
) {
  return subscribeToNotifications(onChange, isExpirationAlertApiNotification);
}
