"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PaginationFooter } from "@/components/shared/pagination";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { DateFilterSelector } from "@/components/shared/date-filter-selector";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  userId: string;
  branchId: string | null;
  action: string;
  details: string | null;
  createdAt: string;
  userFullName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  branchName: string;
}

interface LoginLog {
  id: string;
  created_at: string;
  login_status: string;
  failure_reason: string | null;
  ip_address: string | null;
  device_fingerprint: string | null;
  employee_id: string | null;
  employee: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface UserDirectoryEntry {
  id?: string;
  authId?: string;
  auth_id?: string;
  fullName?: string | null;
  full_name?: string | null;
  email?: string | null;
}

type JsonRecord = Record<string, unknown>;

const PH_TIME_ZONE = "Asia/Manila";

function getInitials(name: string) {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

function Avatar({
  src,
  name,
  sizeClass = "h-9 w-9",
  iconSizeClass = "h-5 w-5",
}: {
  src?: string | null;
  name: string;
  sizeClass?: string;
  iconSizeClass?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        className={`${sizeClass} rounded-full object-cover bg-slate-100`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-slate-200 text-slate-500 flex items-center justify-center overflow-hidden`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconSizeClass}
      >
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
        <path d="M16 3.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
      </svg>
    </div>
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tryParseJson(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stripApiPrefix(path: string) {
  return path.replace(/^\/api\//, "").replace(/^api\//, "");
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

function formatMoney(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatAuditDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: value, time: "" };
  }

  return {
    date: date.toLocaleDateString("en-CA", {
      timeZone: PH_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    time: date.toLocaleTimeString("en-PH", {
      timeZone: PH_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  };
}

function getPathFromAction(action: string) {
  const parts = action.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ").trim() : "";
}

function summarizePath(path: string) {
  const cleaned = stripApiPrefix(path).split("/").filter(Boolean);
  const labels = cleaned
    .filter((segment) => !/^[0-9a-f-]{8,}$/i.test(segment))
    .map(titleCase);

  return labels.length > 0 ? labels.join(" / ") : "Record";
}

function formatFriendlyActionLabel(action: string, details: string | null) {
  const parsed = tryParseJson(details);
  const record = isRecord(parsed) ? parsed : null;
  const path = typeof record?.url === "string" ? record.url.split("?")[0] : getPathFromAction(action);

  if (path.includes("/api/pawn-tickets")) {
    return "Pawn ticket transaction";
  }

  if (path.includes("/api/auth/verify-password")) {
    return "Security confirmation";
  }

  if (path.includes("/users/") && path.includes("/transfer-branch")) {
    return "Branch reassignment";
  }

  if (path.includes("/users/") && action.startsWith("DELETE ")) {
    return "User account removal";
  }

  if (path.includes("/users/")) {
    return "User account update";
  }

  if (path.includes("/auth/profile")) {
    return "Profile update";
  }

  if (path.includes("/api/auth/register")) {
    return "Account access request";
  }

  if (path.includes("/api/fund-requests/") && path.includes("/review")) {
    return "Fund request review";
  }

  if (path.includes("/api/fund-requests/") && path.includes("/confirm")) {
    return "Fund transfer confirmation";
  }

  if (path.includes("/api/fund-requests/") && path.includes("/transfer")) {
    return "Fund transfer";
  }

  if (path.includes("/api/inventory/pawned/") && path.includes("/remarks")) {
    return "Pawned item remark";
  }

  if (path.includes("/api/inventory/pawned/") && path.includes("/renew")) {
    return "Pawn renewal";
  }

  if (path.includes("/api/inventory/pawned/") && path.includes("/expire")) {
    return "Pawn expiration";
  }

  if (action === "CUSTOMER_EDIT_PROCESSED") return "Customer profile update";
  if (action === "CUSTOMER_EDIT_REQUESTED") return "Customer edit request";

  return humanizeText(summarizePath(path));
}

const FIELD_LABELS: Record<string, string> = {
  fullName: "Name",
  email: "Email",
  avatarUrl: "Profile Photo",
  accountStatus: "Account Status",
  branchId: "Branch",
  role: "Role",
};

function getChangedFields(body: JsonRecord | null, record?: JsonRecord | null) {
  const rawFields = Array.isArray(record?.changedFields)
    ? record.changedFields.filter((field): field is string => typeof field === "string")
    : body
      ? Object.keys(body)
      : [];

  return rawFields
    .filter((key) => !["password", "currentPassword", "newPassword", "token"].includes(key))
    .map((key) => FIELD_LABELS[key] ?? titleCase(key));
}

function findBranchName(
  branchId: unknown,
  branches: { id: string; name: string }[],
  fallback?: string | null,
) {
  if (typeof branchId !== "string" || !branchId) {
    return fallback ?? null;
  }

  return branches.find((branch) => branch.id === branchId)?.name ?? fallback ?? branchId;
}

function findUserName(
  userId: unknown,
  userNamesById: Map<string, string>,
  body?: JsonRecord | null,
  record?: JsonRecord | null,
) {
  if (
    record &&
    typeof record.targetUserName === "string" &&
    record.targetUserName.trim()
  ) {
    return record.targetUserName.trim();
  }

  if (body && typeof body.fullName === "string" && body.fullName.trim()) {
    return body.fullName.trim();
  }

  if (typeof userId !== "string" || !userId) {
    return null;
  }

  return userNamesById.get(userId) ?? null;
}

function formatActivityDescription(
  action: string,
  details: string | null,
  branches: { id: string; name: string }[],
  userNamesById: Map<string, string>,
) {
  const parsed = tryParseJson(details);
  const record = isRecord(parsed) ? parsed : null;
  const body = isRecord(record?.body) ? record.body : null;
  const path = typeof record?.url === "string" ? record.url.split("?")[0] : getPathFromAction(action);

  if (action === "FUND_REQUEST_REVIEWED" && record) {
    const requestNo = typeof record.requestNo === "string" ? record.requestNo : "the request";
    const decision = typeof record.decision === "string" ? humanizeText(record.decision) : "reviewed";
    const approvedAmount = formatMoney(record.approvedAmount);
    const branchName = findBranchName(record.destinationBranchId ?? record.branchId, branches);

    if (approvedAmount && branchName) {
      return `Reviewed fund request ${requestNo} for ${branchName} and ${decision} it for ${approvedAmount}.`;
    }

    if (branchName) {
      return `Reviewed fund request ${requestNo} for ${branchName} and ${decision} it.`;
    }

    return approvedAmount
      ? `Reviewed fund request ${requestNo} and ${decision} it for ${approvedAmount}.`
      : `Reviewed fund request ${requestNo} and ${decision} it.`;
  }

  if (action === "FUND_TRANSFER_CONFIRMED" && record) {
    const requestNo = typeof record.requestNo === "string" ? record.requestNo : "the request";
    const amount = formatMoney(record.confirmedReceivedAmount);
    const destinationBranch = findBranchName(record.destinationBranchId, branches);
    return amount
      ? `Confirmed receipt of transferred funds for ${destinationBranch ?? "the branch"} under ${requestNo} worth ${amount}.`
      : `Confirmed receipt of transferred funds for ${destinationBranch ?? "the branch"} under ${requestNo}.`;
  }

  if (action === "FUND_TRANSFER_RELEASED" && record) {
    const requestNo = typeof record.requestNo === "string" ? record.requestNo : "the request";
    const amount = formatMoney(record.amountTransferred);
    const sourceBranch = findBranchName(record.sourceBranchId, branches, "Main vault");
    const destinationBranch = findBranchName(record.destinationBranchId, branches);

    if (sourceBranch && destinationBranch && amount) {
      return `Released ${amount} from ${sourceBranch} to ${destinationBranch} for ${requestNo}.`;
    }

    if (sourceBranch && destinationBranch) {
      return `Released funds from ${sourceBranch} to ${destinationBranch} for ${requestNo}.`;
    }

    return amount
      ? `Released funds for ${requestNo} amounting to ${amount}.`
      : `Released funds for ${requestNo}.`;
  }

  if (action === "FUND_TRANSFER_SOURCE_CONFIRMED" && record) {
    const requestNo = typeof record.requestNo === "string" ? record.requestNo : "the request";
    const sourceBranch = findBranchName(record.sourceBranchId, branches);
    const destinationBranch = findBranchName(record.destinationBranchId, branches);

    if (sourceBranch && destinationBranch) {
      return `Confirmed transfer of funds from ${sourceBranch} to ${destinationBranch} for ${requestNo}.`;
    }

    return `Confirmed the source branch transfer for ${requestNo}.`;
  }

  if (action === "BRANCH_CASH_ON_HAND_UPDATED" && record) {
    const requestNo = typeof record.requestNo === "string" ? record.requestNo : "the request";
    const delta = formatMoney(record.delta);
    return delta
      ? `Updated branch cash on hand by ${delta} for ${requestNo}.`
      : `Updated branch cash on hand for ${requestNo}.`;
  }

  if (action === "FUND_REQUEST_CREATED" && record) {
    const requestNo = typeof record.requestNo === "string" ? record.requestNo : "a new request";
    const amount = formatMoney(record.amountRequested);
    const targetBranch =
      findBranchName(record.destinationBranchId ?? record.branchId, branches) ?? "a branch";

    return amount
      ? `Created fund request ${requestNo} for ${targetBranch} worth ${amount}.`
      : `Created fund request ${requestNo} for ${targetBranch}.`;
  }

  if (path.includes("/api/auth/verify-password")) {
    return "Confirmed identity by entering their password for a protected action.";
  }

  if (path.includes("/api/auth/register") && action.startsWith("POST ")) {
    const applicantName =
      (typeof body?.fullName === "string" && body.fullName.trim()) ||
      (typeof body?.email === "string" && body.email.trim()) ||
      "a new applicant";
    const requestedRole =
      typeof body?.role === "string" ? humanizeText(body.role) : "account access";
    const branchName = findBranchName(body?.branchId, branches) ?? "the selected branch";
    return `Submitted an account access request for ${applicantName} as ${requestedRole} at ${branchName}.`;
  }

  const remarkMatch = path.match(/\/api\/inventory\/pawned\/([^/]+)\/remarks$/);
  if (remarkMatch) {
    return "Added a remark to a pawned item record.";
  }

  const renewMatch = path.match(/\/api\/inventory\/pawned\/([^/]+)\/renew$/);
  if (renewMatch) {
    const amountPaid = formatMoney(body?.amount_paid);
    return amountPaid
      ? `Recorded a renewal payment of ${amountPaid} for a pawned item.`
      : "Recorded a renewal for a pawned item.";
  }

  const expireMatch = path.match(/\/api\/inventory\/pawned\/([^/]+)\/expire$/);
  if (expireMatch) {
    return "Marked a pawned item as expired and transferred it.";
  }

  if (path.includes("/api/pawn-tickets") && action.startsWith("POST ")) {
    return "Created a new pawn ticket transaction.";
  }

  if (path.includes("/auth/profile") && (action.startsWith("POST ") || action.startsWith("PATCH "))) {
    const changedFields = getChangedFields(body, record);
    return changedFields.length > 0
      ? `Updated their ${changedFields.join(" and ")}.`
      : "Updated their profile.";
  }

  const userUpdateMatch = path.match(/(?:\/api)?\/users\/([^/]+)(?:\/update)?$/);
  if (userUpdateMatch && (action.startsWith("PATCH ") || action.startsWith("POST ") || action.startsWith("PUT "))) {
    const changedFields = getChangedFields(body, record);
    const targetUserName = findUserName(userUpdateMatch[1], userNamesById, body, record) ?? "a user";
    return changedFields.length > 0
      ? `Updated ${targetUserName}'s ${changedFields.join(" and ")}.`
      : `Updated ${targetUserName}'s account details.`;
  }

  const userTransferBranchMatch = path.match(/(?:\/api)?\/users\/([^/]+)\/transfer-branch$/);
  if (userTransferBranchMatch) {
    const targetUserName =
      findUserName(userTransferBranchMatch[1], userNamesById, body, record) ?? "a user";
    const branchName =
      findBranchName(body?.branchId, branches, typeof record?.targetBranchName === "string" ? record.targetBranchName : null) ??
      "another branch";
    return `Transferred ${targetUserName} to ${branchName}.`;
  }

  const deleteUserMatch = path.match(/(?:\/api)?\/users\/([^/]+)$/);
  if (deleteUserMatch && action.startsWith("DELETE ")) {
    const targetUserName = findUserName(deleteUserMatch[1], userNamesById, body, record) ?? "a user";
    return `Deleted ${targetUserName}'s account.`;
  }

  const fundReviewMatch = path.match(/\/api\/fund-requests\/([^/]+)\/review$/);
  if (fundReviewMatch) {
    const decision = typeof body?.decision === "string" ? humanizeText(body.decision) : "reviewed";
    const approvedAmount = formatMoney(body?.approvedAmount);
    const branchName =
      findBranchName(body?.branchId ?? record?.branchId ?? record?.destinationBranchId, branches) ??
      "the selected branch";
    return approvedAmount
      ? `Reviewed a fund request for ${branchName} and ${decision} it for ${approvedAmount}.`
      : `Reviewed a fund request for ${branchName} and ${decision} it.`;
  }

  const fundConfirmMatch = path.match(/\/api\/fund-requests\/([^/]+)\/confirm$/);
  if (fundConfirmMatch) {
    const branchName =
      findBranchName(body?.branchId ?? record?.destinationBranchId ?? record?.branchId, branches) ??
      "the receiving branch";
    return `Confirmed a fund transfer request for ${branchName}.`;
  }

  const fundTransferMatch = path.match(/\/api\/fund-requests\/([^/]+)\/transfer$/);
  if (fundTransferMatch) {
    const sourceBranch = findBranchName(body?.sourceBranchId ?? record?.sourceBranchId, branches, "Main vault");
    const destinationBranch =
      findBranchName(body?.toBranchId ?? body?.branchId ?? record?.destinationBranchId, branches) ??
      "the destination branch";
    return `Transferred funds from ${sourceBranch ?? "the source"} to ${destinationBranch}.`;
  }

  if (action === "CUSTOMER_EDIT_PROCESSED" && record) {
    const customerName = typeof record.customerName === "string" ? record.customerName : "a customer";
    const actorLabel = typeof record.actorLabel === "string" ? record.actorLabel : "Admin";
    const changedFields = isRecord(record.changedFields) ? Object.keys(record.changedFields) : [];
    const fieldList = changedFields.map(titleCase).join(", ");
    return fieldList
      ? `${actorLabel} updated ${customerName}'s profile: ${fieldList}.`
      : `${actorLabel} updated ${customerName}'s profile.`;
  }

  if (action === "CUSTOMER_EDIT_REQUESTED" && record) {
    const customerName = typeof record.customerName === "string" ? record.customerName : "a customer";
    const actorLabel = typeof record.actorLabel === "string" ? record.actorLabel : "Employee";
    const branchName = typeof record.branchName === "string" ? record.branchName : null;
    return branchName
      ? `${actorLabel} requested an edit for ${customerName} (${branchName}).`
      : `${actorLabel} requested an edit for ${customerName}.`;
  }

  if (typeof parsed === "string" && parsed.trim()) {
    return parsed;
  }

  const method = action.split(" ")[0]?.toUpperCase();
  const methodVerb =
    method === "POST"
      ? "Created"
      : method === "PATCH" || method === "PUT"
        ? "Updated"
        : method === "DELETE"
          ? "Deleted"
          : "Processed";

  return `${methodVerb} ${summarizePath(path).toLowerCase()}.`;
}

function formatActivityReference(
  action: string,
  details: string | null,
  branches: { id: string; name: string }[],
  userNamesById: Map<string, string>,
) {
  const parsed = tryParseJson(details);
  const record = isRecord(parsed) ? parsed : null;
  const body = isRecord(record?.body) ? record.body : null;
  const params = isRecord(record?.params) ? record.params : null;
  const path = typeof record?.url === "string" ? record.url.split("?")[0] : getPathFromAction(action);

  if (record) {
    if (typeof record.requestNo === "string") {
      return `Reference: ${record.requestNo}`;
    }

    if (typeof record.transferReference === "string") {
      return `Reference: ${record.transferReference}`;
    }
  }

  if (path.includes("/api/inventory/pawned/") && typeof body?.remark === "string") {
    return `Remark: ${body.remark}`;
  }

  if (path.includes("/api/auth/verify-password")) {
    return "Security confirmation";
  }

  if (path.includes("/api/auth/register")) {
    const applicantName =
      (typeof body?.fullName === "string" && body.fullName.trim()) ||
      (typeof body?.email === "string" && body.email.trim()) ||
      null;
    const branchName = findBranchName(body?.branchId, branches);

    if (applicantName && branchName) {
      return `${applicantName} - ${branchName}`;
    }

    if (applicantName) {
      return `Applicant: ${applicantName}`;
    }

    if (branchName) {
      return `Branch: ${branchName}`;
    }

    return "Account access request";
  }

  const userPathMatch = path.match(/\/api\/users\/([^/]+)(?:\/transfer-branch)?$/);
  if (userPathMatch) {
    const targetUserId =
      (params && typeof params.id === "string" && params.id) || userPathMatch[1];
    const targetUserName = findUserName(targetUserId, userNamesById, body, record);
    return targetUserName ? `User: ${targetUserName}` : "User account";
  }

  if (path.includes("/api/fund-requests/") && params && typeof params.id === "string") {
    const sourceBranch = findBranchName(body?.sourceBranchId ?? record?.sourceBranchId, branches);
    const destinationBranch =
      findBranchName(
        body?.toBranchId ?? body?.branchId ?? record?.destinationBranchId ?? record?.branchId,
        branches,
      );

    if (sourceBranch && destinationBranch) {
      return `${sourceBranch} -> ${destinationBranch}`;
    }

    if (destinationBranch) {
      return `Branch: ${destinationBranch}`;
    }

    return `Request ID: ${params.id}`;
  }

  return null;
}



// Helper to guess log type based on action/details text
function guessLogType(action: string, details: string) {
  const text = (action + " " + (details || "")).toLowerCase();
  if (text.includes("pawn") || text.includes("redeem") || text.includes("renew")) return "TRANSACTION";
  if (text.includes("fund") || text.includes("cash") || text.includes("wallet")) return "FUND TRANSFER";
  if (text.includes("item transfer") || text.includes("move") || text.includes("vault")) return "ITEM TRANSFER";
  if (text.includes("login") || text.includes("auth")) return "AUTH TRACE";
  return "SYSTEM LOG";
}

// Helper to guess action verb if action field is long
function getBadgeAction(action: string) {
  const a = action.toLowerCase();
  if (a.includes("create") || a.includes("new")) return "CREATE";
  if (a.includes("update") || a.includes("edit") || a.includes("patch")) return "UPDATE";
  if (a.includes("delete") || a.includes("remove")) return "DELETE";
  if (a.includes("transfer")) return "TRANSFER";
  if (a.includes("redeem")) return "REDEEM";
  if (a.includes("fail")) return "FAILED";
  return "EXECUTE";
}

// Helper to guess status
function getGuessStatus(action: string, details: string) {
  const text = (action + " " + (details || "")).toLowerCase();
  if (text.includes("fail") || text.includes("error") || text.includes("wrong")) return "Failed";
  if (text.includes("pending")) return "Pending";
  return "Success";
}

const FAILURE_REASON_LABELS: Record<string, string> = {
  INVALID_CREDENTIALS: "Wrong password",
  USER_NOT_FOUND: "Account not found",
  ACCOUNT_INACTIVE: "Account inactive",
  DEVICE_BLOCKED: "Device blocked",
  DEVICE_PENDING: "Device not yet authorized",
  MISSING_DEVICE_FINGERPRINT: "Device fingerprint missing",
  UNKNOWN_DEVICE: "Unauthorized device",
  OUTSIDE_BRANCH_NETWORK: "Outside branch network",
  OUTSIDE_NETWORK: "Outside allowed network",
};

function formatLoginReason(reason: string | null) {
  if (!reason) return "—";
  return FAILURE_REASON_LABELS[reason] ?? reason.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function formatLoginStatus(status: string) {
  if (status === "SUCCESS") return { label: "Success", color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" };
  if (status === "BLOCKED") return { label: "Blocked", color: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/50" };
  return { label: "Failed", color: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" };
}

function getLoginEmployeeName(employee: LoginLog["employee"]) {
  return employee?.full_name?.trim() || employee?.email?.trim() || "Unknown";
}

function formatLoginRole(role?: string | null) {
  return role ? humanizeText(role) : "Role unavailable";
}

function canRequestDeviceAuthorization(log: LoginLog) {
  return log.failure_reason === "UNKNOWN_DEVICE" && Boolean(log.device_fingerprint);
}

const PERIODS = ["Daily", "Weekly", "Monthly", "Yearly", "All Time"];

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { branches, selectedBranch, setSelectedBranch, canSwitchBranch, isAllBranches } =
    useBranch();
  const userId = user?.id;
  const userRole = user?.role;
  const canViewAuditLogs =
    userRole === "super_admin" || userRole === "admin" || userRole === "employee";

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [userDirectory, setUserDirectory] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All Logs");
  const [isLoading, setIsLoading] = useState(true);

  // Login logs state
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);
  const [loginStatusFilter, setLoginStatusFilter] = useState("ALL");
  const [loginSearchQuery, setLoginSearchQuery] = useState("");
  const [loginCurrentPage, setLoginCurrentPage] = useState(1);
  const [requestingDeviceLogId, setRequestingDeviceLogId] = useState<string | null>(null);

  // Date Filtering
  const [activePeriod, setActivePeriod] = useState("All Time");
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const onDateRangeChange = useCallback((start: string | null, end: string | null) => {
    setDateRange({ start, end });
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const branchOptions = useMemo(() => {
    return branches.map((branchOption) => ({
      value: branchOption.id,
      label: branchOption.name,
    }));
  }, [branches]);

  const activeBranchId = useMemo(() => {
    if (isAllBranches) {
      return null;
    }

    return selectedBranch.id;
  }, [isAllBranches, selectedBranch.id]);

  const selectedBranchValue = activeBranchId ?? "__all__";

  const handleBranchChange = (branchId: string) => {
    const nextBranch = branches.find((branchOption) => branchOption.id === branchId);
    if (nextBranch) {
      setSelectedBranch(nextBranch);
    }
  };

  const scopedBranchLabel = canSwitchBranch
    ? selectedBranch.name
    : user?.branchName || selectedBranch.name || "Assigned Branch";

  const pageBranchOptions = useMemo(() => {
    if (branchOptions.length > 0) {
      return branchOptions;
    }

    return [
      {
        value: selectedBranchValue,
        label: scopedBranchLabel,
      },
    ];
  }, [branchOptions, scopedBranchLabel, selectedBranchValue]);

  useEffect(() => {
    async function fetchLogs() {
      if (!userId || !canViewAuditLogs) {
        setLogs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (canSwitchBranch && activeBranchId) {
          queryParams.set("branchId", activeBranchId);
        }
        if (dateRange.start) {
          queryParams.set("startDate", dateRange.start);
        }
        if (dateRange.end) {
          queryParams.set("endDate", dateRange.end);
        }
        const queryString = queryParams.toString();
        const data = await api.get<ActivityLog[]>(
          `/activity-logs${queryString ? `?${queryString}` : ""}`,
        );
        setLogs(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchLogs();

    const interval = window.setInterval(() => void fetchLogs(), 60_000);
    return () => window.clearInterval(interval);
  }, [userId, activeBranchId, canSwitchBranch, canViewAuditLogs, dateRange.start, dateRange.end]);

  useEffect(() => {
    async function fetchUserDirectory() {
      if (!canViewAuditLogs || userRole === "employee") {
        setUserDirectory(new Map());
        return;
      }

      try {
        const data = await api.get<UserDirectoryEntry[]>("/users");
        const nextDirectory = new Map<string, string>();

        data.forEach((entry) => {
          const resolvedName =
            entry.fullName?.trim() ||
            entry.full_name?.trim() ||
            entry.email?.trim() ||
            null;

          if (!resolvedName) return;

          if (entry.id) {
            nextDirectory.set(entry.id, resolvedName);
          }

          if (entry.authId) {
            nextDirectory.set(entry.authId, resolvedName);
          }

          if (entry.auth_id) {
            nextDirectory.set(entry.auth_id, resolvedName);
          }
        });

        setUserDirectory(nextDirectory);
      } catch (error) {
        console.warn("Failed to load user directory for audit logs:", error);
        setUserDirectory(new Map());
      }
    }

    void fetchUserDirectory();
  }, [canViewAuditLogs, userRole]);

  // Fetch login logs when Login Logs tab is active
  useEffect(() => {
    if (filterType !== "Login Logs") return;
    if (userRole !== "super_admin" && userRole !== "admin") return;

    async function fetchLoginLogs() {
      setLoginLogsLoading(true);
      try {
        const data = await api.get<LoginLog[]>("/devices/logs?limit=500");
        setLoginLogs(data);
      } catch (err) {
        console.error("Failed to fetch login logs:", err);
      } finally {
        setLoginLogsLoading(false);
      }
    }

    void fetchLoginLogs();
  }, [filterType, userRole]);

  // Derive synthetic data fields for UI matching
  const enrichedLogs = useMemo(() => {
    const userNamesById = new Map(userDirectory);

    logs
      .filter((log) => log.userId && log.userFullName)
      .forEach((log) => {
        userNamesById.set(log.userId, log.userFullName);
      });

    // Filter out raw HTTP logs for endpoints that have a structured counterpart
    const SUPPRESSED_PATH_PATTERNS = [
      /\/api\/customers\/[^/]+\/request-edit/,
    ];

    const filteredRaw = logs.filter((l) => {
      const parsed = tryParseJson(l.details);
      const record = isRecord(parsed) ? parsed : null;
      const url = typeof record?.url === "string" ? record.url : "";
      if (!url) return true; // keep structured logs (no url field)
      return !SUPPRESSED_PATH_PATTERNS.some((pattern) => pattern.test(url));
    });

    return filteredRaw.map(l => ({
      ...l,
      logType: guessLogType(l.action, l.details || ""),
      actionBadge: getBadgeAction(l.action),
      statusGuess: getGuessStatus(l.action, l.details || ""),
      description: formatActivityDescription(l.action, l.details || "", branches, userNamesById),
      reference: formatActivityReference(l.action, l.details || "", branches, userNamesById),
    }));
  }, [branches, logs, userDirectory]);

  // Statistics
  const totalLogs = enrichedLogs.length;
  const totalTransactions = enrichedLogs.filter(l => l.logType === "TRANSACTION").length;
  const totalFundTransfers = enrichedLogs.filter(l => l.logType === "FUND TRANSFER").length;
  const totalItemTransfers = enrichedLogs.filter(l => l.logType === "ITEM TRANSFER").length;

  // Login logs filter
  const filteredLoginLogs = useMemo(() => {
    let result = loginLogs;
    if (loginStatusFilter !== "ALL") {
      result = result.filter(l => l.login_status === loginStatusFilter);
    }
    if (loginSearchQuery) {
      const q = loginSearchQuery.toLowerCase();
      result = result.filter(l =>
        (l.employee?.full_name ?? "").toLowerCase().includes(q) ||
        (l.employee?.email ?? "").toLowerCase().includes(q) ||
        (l.ip_address ?? "").toLowerCase().includes(q) ||
        (l.device_fingerprint ?? "").toLowerCase().includes(q) ||
        (l.failure_reason ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [loginLogs, loginStatusFilter, loginSearchQuery]);

  useEffect(() => {
    setLoginCurrentPage(1);
  }, [loginStatusFilter, loginSearchQuery]);

  // Tabs
  const TABS = userRole === "super_admin" || userRole === "admin"
    ? ["All Logs", "Transaction Logs", "Fund Transfer", "Item Transfer", "Login Logs"]
    : ["All Logs", "Transaction Logs", "Fund Transfer", "Item Transfer"];

  const filteredLogs = useMemo(() => {
    let result = enrichedLogs;
    if (canSwitchBranch && activeBranchId) {
      result = result.filter(l => l.branchId === activeBranchId);
    }
    if (filterType !== "All Logs") {
      if (filterType === "Transaction Logs") result = result.filter(l => l.logType === "TRANSACTION");
      if (filterType === "Fund Transfer") result = result.filter(l => l.logType === "FUND TRANSFER");
      if (filterType === "Item Transfer") result = result.filter(l => l.logType === "ITEM TRANSFER");
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.userFullName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeBranchId, canSwitchBranch, enrichedLogs, searchQuery, filterType]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, activeBranchId]);

  const totalItems = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalLoginItems = filteredLoginLogs.length;
  const totalLoginPages = Math.ceil(totalLoginItems / itemsPerPage) || 1;
  const paginatedLoginLogs = filteredLoginLogs.slice((loginCurrentPage - 1) * itemsPerPage, loginCurrentPage * itemsPerPage);

  useEffect(() => {
    if (loginCurrentPage > totalLoginPages) {
      setLoginCurrentPage(totalLoginPages);
    }
  }, [loginCurrentPage, totalLoginPages]);

  const handleRequestDeviceAuthorization = async (log: LoginLog) => {
    if (!log.device_fingerprint) {
      toast.error("This login log has no device fingerprint.");
      return;
    }

    setRequestingDeviceLogId(log.id);
    try {
      const employeeName = getLoginEmployeeName(log.employee);
      await api.post("/devices/request-authorization", {
        deviceFingerprint: log.device_fingerprint,
        deviceName: `${employeeName} device request from login log`,
        deviceType: "DESKTOP",
        ipAddress: log.ip_address ?? undefined,
        email: log.employee?.email ?? undefined,
      });
      toast.success("Device authorization request sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request device authorization.");
    } finally {
      setRequestingDeviceLogId(null);
    }
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["Date", "Time", "User", "Role", "Branch", "Log Type", "Action", "Description", "Reference", "Status"];
    const rows = filteredLogs.map(log => {
      const { date: dString, time: tString } = formatAuditDateTime(log.createdAt);
      return [
        dString,
        tString,
        log.userFullName,
        log.userRole,
        log.branchName || "All",
        log.logType,
        log.actionBadge,
        `"${(log.description || "").replace(/"/g, '""')}"`,
        `"${(log.reference || "").replace(/"/g, '""')}"`,
        log.statusGuess
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${formatAuditDateTime(new Date().toISOString()).date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canViewAuditLogs) {
    return (
      <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary">Access Restricted</h2>
        <p className="mt-2 text-sm text-text-muted">
          Audit logs are available only to Employee, Admin, and Super Admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">

          {/* Branch badge removed per user request */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[
          { label: "ALL ACTIVITY", count: totalLogs, sub: "All log types", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "TRANSACTIONS", count: totalTransactions, sub: "Pawn, redeem, renew", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "FUND TRANSFERS", count: totalFundTransfers, sub: "Cash moves", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
          { label: "ITEM TRANSFERS", count: totalItemTransfers, sub: "Branch to Branch", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }
        ].map((card, i) => (
          <div key={i} className="flex flex-col justify-between rounded-xl bg-surface p-3 md:p-5 border border-border-main shadow-sm relative overflow-hidden group transition-colors duration-300">
            <div className="flex justify-between items-start z-10">
              <span className="text-[10px] md:text-xs font-bold text-text-muted tracking-widest uppercase">{card.label}</span>
              <svg className="w-4 h-4 md:w-5 md:h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
            </div>
            <div className="mt-3 md:mt-4 z-10">
              <span className="text-2xl md:text-4xl font-black text-text-primary">{card.count}</span>
            </div>
            <div className="mt-1.5 md:mt-2 flex items-center gap-2 z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] md:text-xs text-text-muted font-medium">{card.sub}</span>
            </div>
            {/* Hover dash effect */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/10 transition-all duration-500"></div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="rounded-xl border border-border-main bg-surface shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex px-2 pt-2 border-b border-border-subtle overflow-x-auto hide-scrollbar">
          {TABS.map(tab => {
            const isActive = filterType === tab;
            let count = totalLogs;
            if (tab === "Transaction Logs") count = totalTransactions;
            if (tab === "Fund Transfer") count = totalFundTransfers;
            if (tab === "Item Transfer") count = totalItemTransfers;
            if (tab === "Login Logs") count = loginLogs.length;

            return (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${isActive ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-transparent text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary rounded-t-lg"
                  }`}
              >
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-surface-secondary text-text-tertiary"}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {filterType === "Login Logs" ? (
          <>
            {/* Login Logs Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border-b border-border-subtle">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input
                    type="text"
                    placeholder="Search by name, email, IP..."
                    value={loginSearchQuery}
                    onChange={e => setLoginSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-input-border bg-input-bg pl-9 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                {["ALL", "SUCCESS", "FAILED", "BLOCKED"].map(s => (
                  <button
                    key={s}
                    onClick={() => setLoginStatusFilter(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${loginStatusFilter === s
                      ? s === "SUCCESS" ? "bg-emerald-600 text-white border-emerald-600"
                        : s === "FAILED" ? "bg-amber-500 text-white border-amber-500"
                          : s === "BLOCKED" ? "bg-rose-600 text-white border-rose-600"
                            : "bg-zinc-800 text-white border-zinc-700"
                      : "bg-surface border-border-main text-text-secondary hover:bg-surface-hover"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                {filteredLoginLogs.length} RECORDS
              </div>
            </div>

            {/* Login Logs — Card view for tablet portrait, table for landscape+ */}
            {loginLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinnerLabel text="Loading login logs..." className="text-base font-medium text-text-tertiary" />
              </div>
            ) : paginatedLoginLogs.length === 0 ? (
              <div className="py-12 text-center text-base font-medium text-text-tertiary">No login logs found.</div>
            ) : (
              <>
                {/* Card view < lg */}
                <div className="block lg:hidden divide-y divide-border-subtle">
                  {paginatedLoginLogs.map(log => {
                    const { date: dStr, time: tStr } = formatAuditDateTime(log.created_at);
                    const { label: statusLabel, color: statusColor } = formatLoginStatus(log.login_status);
                    const employeeName = getLoginEmployeeName(log.employee);
                    const employeeRole = formatLoginRole(log.employee?.role);
                    const showRequestAction = canRequestDeviceAuthorization(log);
                    const isRequesting = requestingDeviceLogId === log.id;
                    return (
                      <div key={log.id} className="bg-surface p-4 hover:bg-surface-hover transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-primary">{dStr}</span>
                            <span className="text-xs font-medium text-text-tertiary mt-0.5">{tStr}</span>
                          </div>
                          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded border text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                        </div>
                        {log.employee && (
                          <div className="mt-3 flex items-center gap-3">
                            <Avatar
                              src={log.employee.avatarUrl}
                              name={employeeName}
                              sizeClass="h-8 w-8"
                              iconSizeClass="h-4 w-4"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-text-primary">{employeeName}</span>
                              <span className="text-xs text-text-tertiary capitalize">{employeeRole}</span>
                            </div>
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                          <span><span className="font-bold text-text-tertiary">Reason:</span> {formatLoginReason(log.failure_reason)}</span>
                          <span><span className="font-bold text-text-tertiary">IP:</span> {log.ip_address ?? "—"}</span>
                        </div>
                        {log.device_fingerprint && (
                          <p className="mt-1 text-[10px] font-mono text-text-tertiary truncate" title={log.device_fingerprint}>
                            Device: {log.device_fingerprint.slice(0, 24)}…
                          </p>
                        )}
                        {showRequestAction && (
                          <button
                            type="button"
                            onClick={() => void handleRequestDeviceAuthorization(log)}
                            disabled={isRequesting}
                            className="mt-3 rounded-lg border border-emerald-600 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          >
                            {isRequesting ? "Sending..." : "Request Access"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Table view ≥ lg */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-amber-400">
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">Date & Time</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">Status</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">Employee</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">Reason</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">IP Address</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">Device Fingerprint</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide xl:px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {paginatedLoginLogs.map(log => {
                        const { date: dStr, time: tStr } = formatAuditDateTime(log.created_at);
                        const { label: statusLabel, color: statusColor } = formatLoginStatus(log.login_status);
                        const employeeName = getLoginEmployeeName(log.employee);
                        const employeeRole = formatLoginRole(log.employee?.role);
                        const showRequestAction = canRequestDeviceAuthorization(log);
                        const isRequesting = requestingDeviceLogId === log.id;
                        return (
                          <tr key={log.id} className="bg-surface hover:bg-surface-hover transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-text-primary">{dStr}</span>
                                <span className="text-xs font-medium text-text-tertiary mt-0.5">{tStr}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                              <span className={`inline-flex px-2.5 py-1 rounded border text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                              {log.employee ? (
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={log.employee.avatarUrl}
                                    name={employeeName}
                                    sizeClass="h-8 w-8"
                                    iconSizeClass="h-4 w-4"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-primary">{employeeName}</span>
                                    <span className="text-xs text-text-tertiary capitalize">{employeeRole}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-text-tertiary italic">Unknown</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                              <span className="text-sm text-text-secondary">{formatLoginReason(log.failure_reason)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                              <span className="text-xs font-mono text-text-tertiary">{log.ip_address ?? "—"}</span>
                            </td>
                            <td className="px-4 py-4 xl:px-6">
                              <span className="text-xs font-mono text-text-tertiary truncate max-w-[160px] block" title={log.device_fingerprint ?? ""}>
                                {log.device_fingerprint ? log.device_fingerprint.slice(0, 16) + "…" : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                              {showRequestAction ? (
                                <button
                                  type="button"
                                  onClick={() => void handleRequestDeviceAuthorization(log)}
                                  disabled={isRequesting}
                                  className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                >
                                  {isRequesting ? "Sending..." : "Request Access"}
                                </button>
                              ) : (
                                <span className="text-xs text-text-tertiary">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-4">
              <PaginationFooter
                currentPage={loginCurrentPage}
                totalPages={totalLoginPages}
                totalItems={totalLoginItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setLoginCurrentPage}
                mode="edge-pairs"
              />
            </div>
          </>
        ) : (
          <>
        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border-b border-border-subtle">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative w-full sm:max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg pl-9 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {canSwitchBranch && (
              <select
                value={selectedBranchValue}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-sm font-medium text-text-primary outline-none hover:border-text-tertiary focus:border-emerald-500 sm:w-auto"
              >
                {pageBranchOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            <button className="h-11 w-full rounded-lg border border-input-border bg-input-bg px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-2 sm:w-auto">
              All Actions
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <div className="h-11 flex items-center">
              <DateFilterSelector
                periods={PERIODS}
                activePeriod={activePeriod}
                onPeriodChange={setActivePeriod}
                onDateRangeChange={onDateRangeChange}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
              {totalItems} RECORDS
            </div>
          </div>
        </div>

        {/* Table Data — Card view for tablet portrait, table for landscape+ */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinnerLabel text="Loading audit trail..." className="text-base font-medium text-text-tertiary" />
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="py-12 text-center text-base font-medium text-text-tertiary">No logs found matching your criteria.</div>
        ) : (
          <>
            {/* Card view < lg */}
            <div className="block lg:hidden divide-y divide-border-subtle">
              {paginatedLogs.map((log) => {
                const { date: dString, time: tString } = formatAuditDateTime(log.createdAt);
                const statusBadge =
                  log.statusGuess === "Success" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50" :
                  log.statusGuess === "Failed" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50" :
                  "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50";

                return (
                  <div key={log.id} className="bg-surface p-4 hover:bg-surface-hover transition-colors">
                    {/* Top row: date + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{dString}</span>
                        <span className="text-xs font-medium text-text-tertiary mt-0.5">{tString}</span>
                      </div>
                      <span className={`shrink-0 inline-flex px-2.5 py-1 rounded text-xs font-bold ${statusBadge}`}>
                        {log.statusGuess}
                      </span>
                    </div>

                    {/* User */}
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar
                        src={log.userAvatarUrl}
                        name={log.userFullName}
                        sizeClass="h-8 w-8"
                        iconSizeClass="h-4 w-4"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{log.userFullName}</span>
                        <span className="text-xs font-medium text-text-tertiary capitalize">{log.userRole.replace('_', ' ')} • {log.branchName || "All"}</span>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${
                        log.logType === 'TRANSACTION' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                        log.logType === 'ITEM TRANSFER' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                        log.logType === 'FUND TRANSFER' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>{log.logType}</span>
                      <span className={`text-xs font-black tracking-widest uppercase ${
                        log.actionBadge === 'FAILED' || log.actionBadge === 'DELETE' ? 'text-rose-600 dark:text-rose-400' :
                        log.actionBadge === 'CREATE' ? 'text-blue-600 dark:text-blue-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      }`}>{log.actionBadge}</span>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm font-bold leading-relaxed text-text-primary line-clamp-3">{log.description}</p>
                    {(log.reference || log.action) && (
                      <p className="mt-1 text-xs text-text-tertiary line-clamp-2">
                        {log.reference || formatFriendlyActionLabel(log.action, log.details || "")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Table view ≥ lg */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-900 text-amber-400">
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-left xl:px-6">Date & Time</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-left xl:px-6">User</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-left xl:px-6">Log Type</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-left xl:px-6">Action</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-left w-[30%] xl:px-6">Description</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-right xl:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {paginatedLogs.map((log) => {
                    const { date: dString, time: tString } = formatAuditDateTime(log.createdAt);

                    return (
                      <tr key={log.id} className="bg-surface hover:bg-surface-hover transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-primary">{dString}</span>
                            <span className="text-xs font-medium text-text-tertiary mt-0.5">{tString}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={log.userAvatarUrl}
                              name={log.userFullName}
                              sizeClass="h-9 w-9"
                              iconSizeClass="h-5 w-5"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-text-primary">{log.userFullName}</span>
                              <span className="text-xs font-medium text-text-tertiary capitalize mt-0.5">{log.userRole.replace('_', ' ')} • {log.branchName || "All"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${log.logType === 'TRANSACTION' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                            log.logType === 'ITEM TRANSFER' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                              log.logType === 'FUND TRANSFER' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                            }`}>
                            {log.logType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap xl:px-6">
                          <span className={`text-xs font-black tracking-widest uppercase ${log.actionBadge === 'FAILED' || log.actionBadge === 'DELETE' ? 'text-rose-600 dark:text-rose-400' :
                            log.actionBadge === 'CREATE' ? 'text-blue-600 dark:text-blue-400' :
                              'text-emerald-600 dark:text-emerald-400'
                            }`}>
                            {log.actionBadge}
                          </span>
                        </td>
                        <td className="px-4 py-4 xl:px-6">
                          <div className="flex flex-col max-w-sm">
                            <span className="text-sm font-bold text-text-primary line-clamp-2" title={log.description}>
                              {log.description}
                            </span>
                            <span
                              className="text-xs text-text-tertiary mt-1 line-clamp-2"
                              title={log.reference || log.action}
                            >
                              {log.reference || formatFriendlyActionLabel(log.action, log.details || "")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right xl:px-6">
                          <div className="flex justify-end">
                            {log.statusGuess === "Success" && (
                              <span className="inline-flex px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-xs font-bold">Success</span>
                            )}
                            {log.statusGuess === "Failed" && (
                              <span className="inline-flex px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 text-xs font-bold">Failed</span>
                            )}
                            {log.statusGuess === "Pending" && (
                              <span className="inline-flex px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 text-xs font-bold">Pending</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer Pagination */}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          mode="edge-pairs"
        />
          </>
        )}
      </div>
    </div>
  );
}
