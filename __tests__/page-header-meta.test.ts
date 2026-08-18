import { getPageDescription, getPageTitle } from "@/lib/page-header-meta";

describe("getPageTitle", () => {
  it("returns Dashboard for the root dashboard route", () => {
    expect(getPageTitle("/dashboard")).toBe("Dashboard");
  });

  it("maps custom segment titles", () => {
    expect(getPageTitle("/customers/view_user")).toBe("View Customer");
    expect(getPageTitle("/users")).toBe("Employees");
    expect(getPageTitle("/devices")).toBe("Device Management");
  });
});

describe("getPageDescription", () => {
  it("returns the dashboard overview copy on dashboard routes", () => {
    expect(getPageDescription("/dashboard")).toBe(
      "Overview of performance, transactions, and inventory.",
    );
    expect(getPageDescription("/admin/dashboard")).toBe(
      "Overview of performance, transactions, and inventory.",
    );
  });

  it("returns page descriptions for consolidated header routes", () => {
    expect(getPageDescription("/pawn-transactions")).toBe(
      "View and manage all pawn transaction records",
    );
    expect(getPageDescription("/admin/pawn-transactions")).toBe(
      "View and manage all pawn transaction records",
    );
    expect(getPageDescription("/inventory/pawned-items")).toBe(
      "Comprehensive list of all active, redeemed, and expired pawn contracts across your branch.",
    );
    expect(getPageDescription("/inventory/qr-replacements")).toBe(
      "Comprehensive list of all QR replacement requests across all branches.",
    );
    expect(getPageDescription("/expiration-monitoring")).toBe(
      "Track contracts nearing expiration and overdue items",
    );
    expect(getPageDescription("/branch-overview")).toBe(
      "Create, edit, and manage all pawnshop branches.",
    );
    expect(getPageDescription("/branch-finance")).toBe(
      "Review branch fund requests, transfer approved funds, and track transfer history from live backend data.",
    );
    expect(getPageDescription("/admin/branch-finance")).toBe(
      "Request fund transfers or expense approvals from Super Admin and monitor status in real time.",
    );
  });

  it("returns branch-aware device descriptions", () => {
    expect(getPageDescription("/devices", { branchName: "All Branches" })).toBe(
      "Manage authorized devices for all branches",
    );
    expect(getPageDescription("/devices", { branchName: "Main Branch" })).toBe(
      "Manage authorized devices for Main Branch",
    );
  });

  it("does not return a description on the employee dashboard route", () => {
    expect(getPageDescription("/employee/dashboard")).toBeNull();
  });

  it("does not return a description on customer routes", () => {
    expect(getPageDescription("/customers")).toBeNull();
    expect(getPageDescription("/admin/customers")).toBeNull();
  });

  it("does not return a description on unrelated routes", () => {
    expect(getPageDescription("/settings")).toBeNull();
  });
});
