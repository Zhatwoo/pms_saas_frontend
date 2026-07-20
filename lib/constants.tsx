import type { NavGroup, Role } from "@/types";
import {
  DashboardIcon,
  PawnTransactionIcon,
  CustomersIcon,
  InventoryIcon,
  ExpirationIcon,
  ReportsIcon,
  UserManagementIcon,
  BranchesIcon,
  SettingsIcon,
  AuditLogIcon,
  IncidentReportIcon,
  DeviceIcon,
} from "@/lib/icons";
import { BRAND_CONFIG } from "./brand-config";

export const APP_NAME = BRAND_CONFIG.companyName;
export const APP_SHORT_NAME = BRAND_CONFIG.shortCompanyName;
export const APP_TAGLINE = BRAND_CONFIG.tagline;

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
          { label: "QR Replacements", href: "/inventory/qr-replacements" },
        ],
      },
      { label: "Expiration Monitoring", href: "/expiration-monitoring", icon: <ExpirationIcon /> },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { label: "Customers", href: "/customers", icon: <CustomersIcon /> },
      { label: "Reports", href: "/reports", icon: <ReportsIcon /> },
      { label: "Incident Ticket", href: "/incident-report", icon: <IncidentReportIcon /> },
      {
        label: "Branch Management",
        href: "/branches",
        icon: <BranchesIcon />,
        subItems: [
          { label: "Overview", href: "/branch-overview" },
          { label: "Finance", href: "/branch-finance" },
        ],
      },
      { label: "Employee Management", href: "/users", icon: <UserManagementIcon /> },
      { label: "Device Management", href: "/devices", icon: <DeviceIcon /> },
      { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
      { label: "Audit Logs", href: "/audit-logs", icon: <AuditLogIcon /> },
    ],
  },
  {
    section: "SAAS",
    items: [
      { label: "Client Management", href: "/client-management", icon: <Building2 className="h-5 w-5" strokeWidth={1.5} /> },
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
      { label: "Customers", href: "/admin/customers", icon: <CustomersIcon /> },
      {
        label: "Branch Management",
        href: "/admin/branches",
        icon: <BranchesIcon />,
        subItems: [
          { label: "Overview", href: "/admin/branch-overview" },
          { label: "Finance", href: "/admin/branch-finance" },
        ],
      },
      { label: "Reports", href: "/admin/reports", icon: <ReportsIcon /> },
      { label: "Incident Ticket", href: "/admin/incident-report", icon: <IncidentReportIcon /> },
      { label: "Employee Management", href: "/admin/users", icon: <UserManagementIcon /> },
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
      { label: "Expiration Monitoring", href: "/employee/expiration-monitoring", icon: <ExpirationIcon /> },
      { label: "Branch Finance", href: "/employee/branch-finance", icon: <ReportsIcon /> },
      { label: "Incident Ticket", href: "/employee/incident-report", icon: <IncidentReportIcon /> },
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
