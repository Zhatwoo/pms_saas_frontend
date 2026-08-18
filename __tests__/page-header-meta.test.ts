import { getPageDescription, getPageTitle } from "@/lib/page-header-meta";

describe("getPageTitle", () => {
  it("returns Dashboard for the root dashboard route", () => {
    expect(getPageTitle("/dashboard")).toBe("Dashboard");
  });

  it("maps custom segment titles", () => {
    expect(getPageTitle("/customers/view_user")).toBe("View Customer");
    expect(getPageTitle("/users")).toBe("Employees");
  });
});

describe("getPageDescription", () => {
  it("returns the dashboard overview copy on the super admin dashboard route", () => {
    expect(getPageDescription("/dashboard")).toBe(
      "Overview of performance, transactions, and inventory.",
    );
    expect(getPageDescription("/dashboard/")).toBe(
      "Overview of performance, transactions, and inventory.",
    );
  });

  it("does not return a description on other dashboard routes", () => {
    expect(getPageDescription("/admin/dashboard")).toBeNull();
    expect(getPageDescription("/employee/dashboard")).toBeNull();
  });

  it("does not return a description on non-dashboard routes", () => {
    expect(getPageDescription("/pawn-transactions")).toBeNull();
  });
});
