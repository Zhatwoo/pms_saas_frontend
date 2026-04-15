import type { Role, User } from "@/types";

const DEFAULT_ROUTE_BY_ROLE: Record<Role, string> = {
  super_admin: "/dashboard",
  admin: "/admin/dashboard",
  employee: "/employee/dashboard",
};

export function normalizeRole(role: string | null | undefined): Role | null {
  switch (role) {
    case "super_admin":
    case "superadmin":
      return "super_admin";
    case "admin":
      return "admin";
    case "employee":
    case "branch":
      return "employee";
    default:
      return null;
  }
}

export function normalizeUser(user: User | null): User | null {
  if (!user) {
    return null;
  }

  const role = normalizeRole(user.role);

  if (!role) {
    return null;
  }

  return {
    ...user,
    fullName: user.fullName?.trim() || user.email,
    role,
  };
}

export function getDefaultRouteForRole(role: Role): string {
  return DEFAULT_ROUTE_BY_ROLE[role];
}

export function getAuthorizedRedirect(
  role: Role,
  requestedRedirect: string | null,
): string {
  if (!requestedRedirect) {
    return getDefaultRouteForRole(role);
  }

  const isAllowed =
    (role === "super_admin" &&
      !requestedRedirect.startsWith("/admin") &&
      !requestedRedirect.startsWith("/employee")) ||
    (role === "admin" && requestedRedirect.startsWith("/admin")) ||
    (role === "employee" && requestedRedirect.startsWith("/employee"));

  return isAllowed ? requestedRedirect : getDefaultRouteForRole(role);
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "employee":
      return "Employee";
  }
}
