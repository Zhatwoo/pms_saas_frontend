import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

export type TutorialFeature = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  opensUpwards?: boolean;
};

export const essentialTutorialFeatures: TutorialFeature[] = [
  {
    id: "pawn-transactions",
    title: "Pawn Transactions",
    subtitle: "Transaction workflow",
    description: "Learn how to create, renew, redeem, and manage pawn transactions in one structured flow.",
    icon: ArrowLeftRight,
  },
  {
    id: "customers",
    title: "Customer Management",
    subtitle: "Customer records",
    description: "See how customer profiles, contact details, and transaction history stay organized in one place.",
    icon: Users,
  },
  {
    id: "pawned-items",
    title: "Pawned Items",
    subtitle: "Item tracking",
    description: "Track pawned items, vault status, and item details connected to each transaction.",
    icon: Package,
  },
  {
    id: "loans-payments",
    title: "Loans and Payments",
    subtitle: "Balance monitoring",
    description: "Monitor loan balances, payments, interest, and outstanding amounts across daily operations.",
    icon: Wallet,
  },
  {
    id: "expiration",
    title: "Expiration Monitoring",
    subtitle: "Due date alerts",
    description: "Stay on top of renewals, grace periods, and important transaction dates before they are missed.",
    icon: CalendarClock,
  },
  {
    id: "reports",
    title: "Reports",
    subtitle: "Business insights",
    description: "Generate and review reports that help you understand performance across branches and operations.",
    icon: BarChart3,
  },
  {
    id: "branch-overview",
    title: "Branch Overview",
    subtitle: "Multi-branch view",
    description: "View branch activity and operations from a centralized dashboard built for growing pawnshops.",
    icon: Building2,
  },
  {
    id: "users",
    title: "User Management",
    subtitle: "Roles and access",
    description: "Manage super admin, admin, and employee accounts with role-based access across your business.",
    icon: ShieldCheck,
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    subtitle: "Activity history",
    description: "Review system activity and user actions to maintain accountability across daily operations.",
    icon: ClipboardList,
  },
  {
    id: "branch-finance",
    title: "Branch Finance",
    subtitle: "Daily balance",
    description: "Monitor branch-level finance records, balances, and daily operational totals in one workspace.",
    icon: Landmark,
    opensUpwards: true,
  },
  {
    id: "inventory-scan",
    title: "Inventory Scan",
    subtitle: "QR workflow",
    description: "Use QR scanning to locate, verify, and manage inventory items with faster in-branch workflows.",
    icon: QrCode,
    opensUpwards: true,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    subtitle: "Operations overview",
    description: "Get a quick overview of the metrics and activities that matter most to your pawnshop each day.",
    icon: LayoutDashboard,
    opensUpwards: true,
  },
];

export const premiumTutorialFeatures: TutorialFeature[] = [
  {
    id: "incident-reports",
    title: "Incident Reports",
    subtitle: "Compliance tracking",
    description: "Document and track incident reports with structured records for internal review and follow-up.",
    icon: ClipboardList,
    opensUpwards: true,
  },
  {
    id: "items-for-sale",
    title: "Items for Sale",
    subtitle: "Retail inventory",
    description: "Manage sale items, featured listings, and retail inventory connected to your pawnshop operations.",
    icon: ShoppingBag,
    opensUpwards: true,
  },
];

export const allTutorialFeatures: TutorialFeature[] = [
  ...essentialTutorialFeatures,
  ...premiumTutorialFeatures,
];
