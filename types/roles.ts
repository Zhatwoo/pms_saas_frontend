import type { ReactNode } from "react";

export type Role = "superadmin" | "admin" | "branch";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  branchId?: string;
  avatarUrl?: string;
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
