import {
  getBranchManagers,
  getDefaultEscalationOwnerUserId,
  resolveEscalationOwnerUserId,
} from "@/app/(pages)/incident-report/_components/incident-manager";
import type { UserRecord } from "@/app/(pages)/incident-report/_components/types";

const branchId = "branch-main";

const users: UserRecord[] = [
  {
    id: "admin-1",
    fullName: "Ryan Admin",
    email: "ryan@example.com",
    role: "admin",
    branchId,
  },
  {
    id: "admin-2",
    fullName: "Lei Admin",
    email: "lei@example.com",
    role: "admin",
    branchId,
  },
  {
    id: "employee-1",
    fullName: "Neo Employee",
    email: "neo@example.com",
    role: "employee",
    branchId,
  },
  {
    id: "admin-other",
    fullName: "Other Branch Admin",
    email: "other@example.com",
    role: "admin",
    branchId: "branch-other",
  },
];

describe("incident-manager helpers", () => {
  it("returns branch admins for manager selection", () => {
    expect(getBranchManagers(users, branchId)).toEqual([
      users[0],
      users[1],
    ]);
  });

  it("defaults escalation owner to the first branch admin", () => {
    expect(getDefaultEscalationOwnerUserId(users, branchId)).toBe("admin-1");
  });

  it("keeps a valid selected manager and falls back when invalid", () => {
    expect(resolveEscalationOwnerUserId("admin-2", users, branchId)).toBe(
      "admin-2",
    );
    expect(resolveEscalationOwnerUserId("missing-admin", users, branchId)).toBe(
      "admin-1",
    );
    expect(resolveEscalationOwnerUserId("", users, branchId)).toBe("admin-1");
  });
});
