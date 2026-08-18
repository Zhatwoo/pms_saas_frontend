import { getProfileSettingsPath } from "@/lib/profile-navigation";

describe("getProfileSettingsPath", () => {
  it("returns super admin settings for main app routes", () => {
    expect(getProfileSettingsPath("/dashboard")).toBe("/settings");
    expect(getProfileSettingsPath("/pawn-transactions")).toBe("/settings");
  });

  it("returns admin settings for admin routes", () => {
    expect(getProfileSettingsPath("/admin/dashboard")).toBe("/admin/settings");
    expect(getProfileSettingsPath("/admin/customers")).toBe("/admin/settings");
  });

  it("returns employee settings for employee routes", () => {
    expect(getProfileSettingsPath("/employee/dashboard")).toBe("/employee/settings");
    expect(getProfileSettingsPath("/employee/pawn-transaction")).toBe("/employee/settings");
  });
});
