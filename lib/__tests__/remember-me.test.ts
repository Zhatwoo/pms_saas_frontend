import { loadRememberedEmail, persistRememberedEmail } from "@/lib/remember-me";

describe("remember-me email persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores the email when remember me is enabled", () => {
    persistRememberedEmail("  admin@quickpawn.test  ", true);

    expect(loadRememberedEmail()).toBe("admin@quickpawn.test");
    expect(window.localStorage.getItem("pms_remembered_email")).toBe(
      "admin@quickpawn.test",
    );
  });

  it("clears the stored email when remember me is disabled", () => {
    persistRememberedEmail("admin@quickpawn.test", true);
    persistRememberedEmail("admin@quickpawn.test", false);

    expect(loadRememberedEmail()).toBe("");
    expect(window.localStorage.getItem("pms_remembered_email")).toBeNull();
  });

  it("does not persist an empty email even when remember me is enabled", () => {
    persistRememberedEmail("   ", true);

    expect(loadRememberedEmail()).toBe("");
  });
});
