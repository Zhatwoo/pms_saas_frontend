const CUSTOM_PAGE_TITLES: Record<string, string> = {
  view_user: "View Customer",
  users: "Employees",
};

const DASHBOARD_DESCRIPTION =
  "Overview of performance, transactions, and inventory.";

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

export function getPageDescription(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/dashboard") {
    return DASHBOARD_DESCRIPTION;
  }
  return null;
}
