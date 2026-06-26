import type { Role } from "@/types";

export type NotificationTab = "All" | "Transactions" | "Alerts" | "Requests";
export type NotificationGroup = "Today" | "Earlier";

export interface ApiNotification {
  id: string;
  title: string;
  subtitle?: string | null;
  message?: string | null;
  category?: string | null;
  notification_type?: string | null;
  target_url?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  branch_id?: string | null;
  customer_id?: string | null;
  log_id?: string | null;
}

export interface HeaderNotification {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<NotificationTab, "All">;
  group: NotificationGroup;
  unread: boolean;
  notificationType?: string | null;
  targetUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt?: string | null;
  userId?: string | null;
  branchId?: string | null;
  customerId?: string | null;
  logId?: string | null;
}

export function normalizeNotificationCategory(
  category?: string | null,
): Exclude<NotificationTab, "All"> {
  if (category === "Alerts" || category === "Requests") {
    return category;
  }

  return "Transactions";
}

export function getNotificationGroup(createdAt?: string | null): NotificationGroup {
  if (!createdAt) return "Earlier";

  const today = new Date().toISOString().split("T")[0];
  const itemDate = new Date(createdAt).toISOString().split("T")[0];
  return itemDate === today ? "Today" : "Earlier";
}

export function mapNotification(item: ApiNotification): HeaderNotification {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.message ?? item.subtitle ?? "",
    category: normalizeNotificationCategory(item.category),
    unread: !item.is_read,
    notificationType: item.notification_type ?? null,
    targetUrl: item.target_url ?? null,
    entityType: item.entity_type ?? null,
    entityId: item.entity_id ?? null,
    createdAt: item.created_at ?? null,
    userId: item.user_id ?? null,
    branchId: item.branch_id ?? null,
    customerId: item.customer_id ?? null,
    logId: item.log_id ?? null,
    group: getNotificationGroup(item.created_at),
  };
}

export function isFundTransferNotification(
  notification: Pick<HeaderNotification, "notificationType" | "entityType">,
): boolean {
  return (
    notification.notificationType === "FUND_TRANSFER" ||
    notification.entityType === "fund_transfer"
  );
}

export function isFundTransferApiNotification(
  notification: Pick<ApiNotification, "notification_type" | "entity_type">,
): boolean {
  return (
    notification.notification_type === "FUND_TRANSFER" ||
    notification.entity_type === "fund_transfer"
  );
}

export function isPawnTransactionApiNotification(
  notification: Pick<ApiNotification, "category" | "notification_type" | "entity_type">,
): boolean {
  return (
    notification.category === "Transactions" ||
    notification.notification_type === "transaction" ||
    notification.notification_type === "payment" ||
    notification.notification_type === "redemption" ||
    notification.entity_type === "transaction" ||
    notification.entity_type === "payment" ||
    notification.entity_type === "redemption"
  );
}

export function isExpirationAlertApiNotification(
  notification: Pick<ApiNotification, "category" | "notification_type" | "entity_type">,
): boolean {
  return (
    notification.category === "Alerts" &&
    (notification.notification_type === "pawn_item" ||
      notification.entity_type === "pawn_item")
  );
}

export function isIncidentReportApiNotification(
  notification: Pick<ApiNotification, "notification_type" | "entity_type">,
): boolean {
  return (
    notification.notification_type === "INCIDENT_REPORT" ||
    notification.entity_type === "incident_ticket"
  );
}

export function isBranchTransferNotification(
  notification: Pick<HeaderNotification, "notificationType" | "entityType">,
): boolean {
  return (
    notification.notificationType === "USER_BRANCH_TRANSFER" ||
    notification.entityType === "user_branch_transfer"
  );
}

export function isBranchTransferApiNotification(
  notification: Pick<ApiNotification, "notification_type" | "entity_type">,
): boolean {
  return (
    notification.notification_type === "USER_BRANCH_TRANSFER" ||
    notification.entity_type === "user_branch_transfer"
  );
}

export function isPasswordRequestApiNotification(
  notification: Pick<ApiNotification, "notification_type" | "entity_type">,
): boolean {
  return (
    notification.notification_type === "PASSWORD_CHANGE_REQUEST" ||
    notification.entity_type === "password_request"
  );
}

export function isBranchDayEndedApiNotification(
  notification: Pick<ApiNotification, "notification_type" | "entity_type">,
): boolean {
  return (
    notification.notification_type === "BRANCH_DAY_ENDED" ||
    notification.entity_type === "branch_day_end"
  );
}

export function addRolePrefixToTargetUrl(targetUrl: string, role?: Role): string {
  if (!targetUrl.startsWith("/")) return targetUrl;
  if (targetUrl.startsWith("/admin/") || targetUrl.startsWith("/employee/")) {
    return targetUrl;
  }

  if (role === "admin") {
    return `/admin${targetUrl}`;
  }

  if (role === "employee") {
    if (targetUrl.startsWith("/pawn-transactions")) {
      return targetUrl.replace("/pawn-transactions", "/employee/pawn-transaction");
    }
    return `/employee${targetUrl}`;
  }

  return targetUrl;
}
