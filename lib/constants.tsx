import type { NavGroup, Role } from "@/types";
import {
  DashboardIcon,
  PawnTransactionIcon,
  PawnTicketIcon,
  CustomersIcon,
  InventoryIcon,
  ExpirationIcon,
  ReportsIcon,
  UserManagementIcon,
  BranchesIcon,
  SettingsIcon,
  AuditLogIcon,
} from "@/lib/icons";

export const APP_NAME = "Pawnshop Management System";
export const APP_SHORT_NAME = "JCLB";
export const APP_TAGLINE = "BUY BACK SHOP";

const SUPERADMIN_NAV: NavGroup[] = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
    ],
  },
  {
    section: "TRANSACTION",
    items: [
      { label: "Pawn Transactions", href: "/pawn-transactions", icon: <PawnTransactionIcon /> },
      { label: "Pawn Ticket", href: "/pawn-ticket", icon: <PawnTicketIcon /> },
      { label: "Customers", href: "/customers", icon: <CustomersIcon /> },
    ],
  },
  {
    section: "INVENTORY",
    items: [
      {
        label: "Inventory",
        href: "/inventory",
        icon: <InventoryIcon />,
        subItems: [
          { label: "Pawned Items", href: "/inventory/pawned-items" },
          { label: "Items For Sale", href: "/inventory/items-for-sale" },
        ],
      },
      { label: "Expiration Monitoring", href: "/expiration-monitoring", icon: <ExpirationIcon /> },
    ],
  },
  {
    section: "ADMIN",
    items: [
      { label: "Reports", href: "/reports", icon: <ReportsIcon /> },
      {
        label: "Branch Management",
        href: "/branches",
        icon: <BranchesIcon />,
        subItems: [
          { label: "Branch Finance", href: "/branch-finance" },
        ],
      },
      { label: "User Management", href: "/users", icon: <UserManagementIcon /> },
      { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
      { label: "Audit Logs", href: "/audit-logs", icon: <AuditLogIcon /> },
    ],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: <DashboardIcon /> },
    ],
  },
  {
    section: "TRANSACTION",
    items: [
      { label: "Pawn Transactions", href: "/admin/pawn-transactions", icon: <PawnTransactionIcon /> },
      { label: "Pawn Ticket", href: "/admin/pawn-ticket", icon: <PawnTicketIcon /> },
      { label: "Customers", href: "/admin/customers", icon: <CustomersIcon /> },
    ],
  },
  {
    section: "INVENTORY",
    items: [
      {
        label: "Inventory",
        href: "/admin/inventory",
        icon: <InventoryIcon />,
        subItems: [
          { label: "Pawned Items", href: "/admin/inventory/pawned-items" },
          { label: "Items For Sale", href: "/admin/inventory/items-for-sale" },
        ],
      },
      { label: "Expiration Monitoring", href: "/admin/expiration-monitoring", icon: <ExpirationIcon /> },
    ],
  },
  {
    section: "ADMIN",
    items: [
      { label: "Reports", href: "/admin/reports", icon: <ReportsIcon /> },
      {
        label: "Branch Management",
        href: "/admin/branches",
        icon: <BranchesIcon />,
        subItems: [
          { label: "Branch Finance", href: "/branch-finance" },
        ],
      },
      { label: "User Management", href: "/admin/users", icon: <UserManagementIcon /> },
      { label: "Settings", href: "/admin/settings", icon: <SettingsIcon /> },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: <AuditLogIcon /> },
    ],
  },
];

const BRANCH_NAV: NavGroup[] = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", href: "/employee/dashboard", icon: <DashboardIcon /> },
    ],
  },
  {
    section: "TRANSACTION",
    items: [
      { label: "Pawn Transactions", href: "/employee/pawn-transaction", icon: <PawnTransactionIcon /> },
      { label: "Pawn Ticket", href: "/employee/pawn-ticket", icon: <PawnTicketIcon /> },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { label: "Customers", href: "/employee/customers", icon: <CustomersIcon /> },
      {
        label: "Inventory",
        href: "/employee/inventory",
        icon: <InventoryIcon />,
        subItems: [
          { label: "Pawned Items", href: "/employee/inventory/pawned-items" },
          { label: "Items For Sale", href: "/employee/inventory/items-for-sale" },
        ],
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { label: "Settings", href: "/employee/settings", icon: <SettingsIcon /> },
      { label: "Audit Logs", href: "/employee/audit-logs", icon: <AuditLogIcon /> },
    ],
  },
];

export function getNavForRole(role: Role): NavGroup[] {
  switch (role) {
    case "super_admin":
      return SUPERADMIN_NAV;
    case "admin":
      return ADMIN_NAV;
    case "employee":
      return BRANCH_NAV;
    default:
      return [];
  }
}
