import type { ReactNode } from "react";

export type Role = "super_admin" | "admin" | "employee";

export interface User {
  id: string;
  authId?: string;
  fullName: string;
  email: string;
  role: Role;
  branchId?: string;
  branchName?: string;
  avatarUrl?: string;
  notificationSound?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  subItems?: { label: string; href: string }[];
}

export interface NavGroup {
  section: string;
  items: NavItem[];
}
