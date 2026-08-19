import type { UserRecord } from "./types";

export function getUserBranchId(record: UserRecord): string {
  return record.branchId ?? record.branch_id ?? "";
}

export function getBranchManagers(
  users: UserRecord[],
  branchId: string,
): UserRecord[] {
  return users.filter(
    (record) =>
      Boolean(record.id) &&
      getUserBranchId(record) === branchId &&
      record.role === "admin",
  );
}

export function getDefaultEscalationOwnerUserId(
  users: UserRecord[],
  branchId: string,
): string {
  return getBranchManagers(users, branchId)[0]?.id ?? "";
}

export function resolveEscalationOwnerUserId(
  escalationOwnerUserId: string,
  users: UserRecord[],
  branchId: string,
): string {
  const managers = getBranchManagers(users, branchId);
  if (managers.length === 0) return "";
  if (managers.some((manager) => manager.id === escalationOwnerUserId)) {
    return escalationOwnerUserId;
  }
  return managers[0]?.id ?? "";
}
