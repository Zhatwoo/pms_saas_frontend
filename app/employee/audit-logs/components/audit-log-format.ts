import type { EmployeeActivityLog } from "./employee-audit-log-types";

const PH_TIME_ZONE = "Asia/Manila";

type JsonRecord = Record<string, unknown>;

const FIELD_LABELS: Record<string, string> = {
  fullName: "Name",
  email: "Email",
  avatarUrl: "Profile Photo",
  accountStatus: "Account Status",
  branchId: "Branch",
  role: "Role",
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDetails(details: string | null): unknown {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return details;
  }
}

function humanizeText(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return humanizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripApiPrefix(path: string) {
  return path.replace(/^\/api\//, "/").replace(/^api\//, "/");
}

function getPathFromAction(action: string) {
  const parts = action.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ").trim() : "";
}

function summarizePath(path: string) {
  const labels = stripApiPrefix(path)
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^[0-9a-f-]{8,}$/i.test(segment))
    .map(titleCase);

  return labels.length > 0 ? labels.join(" / ") : "Activity";
}

function getChangedFields(body: JsonRecord | null, record: JsonRecord | null) {
  const rawFields = Array.isArray(record?.changedFields)
    ? record.changedFields.filter((field): field is string => typeof field === "string")
    : body
      ? Object.keys(body)
      : [];

  return rawFields
    .filter((key) => !["password", "currentPassword", "newPassword", "token"].includes(key))
    .map((key) => FIELD_LABELS[key] ?? titleCase(key));
}

function formatMoney(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatAuditDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: value, timeLabel: "" };
  }

  return {
    dateLabel: date.toLocaleDateString("en-CA", {
      timeZone: PH_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    timeLabel: date.toLocaleTimeString("en-PH", {
      timeZone: PH_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  };
}

export function formatActionLabel(action: string, details: string | null) {
  const parsed = parseDetails(details);
  const record = isRecord(parsed) ? parsed : null;
  const path = typeof record?.url === "string" ? record.url.split("?")[0] : getPathFromAction(action);

  if (path.includes("/auth/profile")) return "Profile update";
  if (path.includes("/auth/verify-password")) return "Security confirmation";
  if (path.includes("/auth/change-password")) return "Password change";
  if (path.includes("/auth/request-change-password") || action === "PASSWORD_CHANGE_REQUEST") {
    return "Password change request";
  }
  if (path.includes("/pawn-tickets")) return "Pawn ticket transaction";
  if (path.includes("/inventory/pawned/") && path.includes("/renew")) return "Pawn renewal";
  if (path.includes("/inventory/pawned/") && path.includes("/remarks")) return "Pawned item remark";
  if (path.includes("/inventory/pawned/") && path.includes("/expire")) return "Pawn expiration";
  if (action === "CUSTOMER_EDIT_REQUESTED") return "Customer edit request";

  return titleCase(summarizePath(path));
}

export function formatDescription(log: EmployeeActivityLog) {
  const parsed = parseDetails(log.details);
  const record = isRecord(parsed) ? parsed : null;
  const body = isRecord(record?.body) ? record.body : null;
  const path = typeof record?.url === "string" ? record.url.split("?")[0] : getPathFromAction(log.action);

  if (path.includes("/auth/profile")) {
    const changedFields = getChangedFields(body, record);
    return changedFields.length > 0
      ? `Updated your ${changedFields.join(" and ")}.`
      : "Updated your profile.";
  }

  if (path.includes("/auth/verify-password")) {
    return "Confirmed your password for a protected action.";
  }

  if (log.action === "PASSWORD_CHANGE_REQUEST") {
    return "Requested a password change for admin approval.";
  }

  if (log.action === "CUSTOMER_EDIT_REQUESTED" && record) {
    const customerName = typeof record.customerName === "string" ? record.customerName : "a customer";
    return `Requested an edit for ${customerName}.`;
  }

  if (path.includes("/pawn-tickets") && log.action.startsWith("POST ")) {
    const amount = formatMoney(body?.amount);
    return amount
      ? `Created a pawn ticket transaction for ${amount}.`
      : "Created a pawn ticket transaction.";
  }

  if (path.includes("/inventory/pawned/") && path.includes("/renew")) {
    const amountPaid = formatMoney(body?.amount_paid);
    return amountPaid
      ? `Recorded a renewal payment of ${amountPaid}.`
      : "Recorded a pawn renewal.";
  }

  if (path.includes("/inventory/pawned/") && path.includes("/remarks")) {
    return "Added a remark to a pawned item.";
  }

  if (typeof parsed === "string" && parsed.trim()) {
    return parsed;
  }

  const method = log.action.split(" ")[0]?.toUpperCase();
  const verb =
    method === "POST"
      ? "Created"
      : method === "PATCH" || method === "PUT"
        ? "Updated"
        : method === "DELETE"
          ? "Deleted"
          : "Processed";

  return `${verb} ${summarizePath(path).toLowerCase()}.`;
}

export function formatReference(log: EmployeeActivityLog) {
  const parsed = parseDetails(log.details);
  const record = isRecord(parsed) ? parsed : null;
  const body = isRecord(record?.body) ? record.body : null;

  if (record && typeof record.requestNo === "string") return record.requestNo;
  if (record && typeof record.referenceNo === "string") return record.referenceNo;
  if (record && typeof record.unitCode === "string") return record.unitCode;
  if (body && typeof body.unitCode === "string") return body.unitCode;
  if (body && typeof body.customerName === "string") return body.customerName;

  return log.branchName || "Own account";
}

export function getStatus(action: string, details: string | null): "Success" | "Pending" | "Failed" {
  const text = `${action} ${details ?? ""}`.toLowerCase();
  if (text.includes("fail") || text.includes("error") || text.includes("wrong")) return "Failed";
  if (text.includes("pending")) return "Pending";
  return "Success";
}
