const CUSTOM_PAGE_TITLES: Record<string, string> = {
  view_user: "View Customer",
  users: "Employees",
  devices: "Device Management",
};

const DASHBOARD_DESCRIPTION =
  "Overview of performance, transactions, and inventory.";

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/dashboard": DASHBOARD_DESCRIPTION,
  "/admin/dashboard": DASHBOARD_DESCRIPTION,
  "/pawn-transactions": "View and manage all pawn transaction records",
  "/admin/pawn-transactions": "View and manage all pawn transaction records",
  "/inventory/pawned-items":
    "Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.",
  "/admin/inventory/pawned-items":
    "Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.",
  "/inventory/qr-replacements":
    "Comprehensive list of all QR replacement requests across all branches.",
  "/expiration-monitoring": "Track contracts nearing expiration and overdue items",
  "/admin/expiration-monitoring": "Track contracts nearing expiration and overdue items",
  "/branch-overview": "Create, edit, and manage all pawnshop branches.",
  "/admin/branch-overview": "Create, edit, and manage all pawnshop branches.",
  "/branches": "Create, edit, and manage all pawnshop branches.",
  "/branch-finance":
    "Review branch fund requests, transfer approved funds, and track transfer history from live backend data.",
  "/admin/branch-finance":
    "Request fund transfers or expense approvals from Super Admin and monitor status in real time.",
};

export interface PageDescriptionContext {
  branchName?: string;
}

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Dashboard";

  if (CUSTOM_PAGE_TITLES[last]) {
    return CUSTOM_PAGE_TITLES[last];
  }

  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getPageDescription(
  pathname: string,
  context?: PageDescriptionContext,
): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/";

  if (normalized === "/devices") {
    const isAllBranches =
      !context?.branchName || context.branchName === "All Branches";
    return isAllBranches
      ? "Manage authorized devices for all branches"
      : `Manage authorized devices for ${context.branchName}`;
  }

  return PAGE_DESCRIPTIONS[normalized] ?? null;
}
