import { PUBLIC_AUTH_API_PATHS } from "@/lib/public-auth-paths";

describe("PUBLIC_AUTH_API_PATHS", () => {
  it("includes forgot-password and reset-password routes used by the login modal", () => {
    expect(PUBLIC_AUTH_API_PATHS).toEqual(
      expect.arrayContaining(["/auth/forgot-password", "/auth/reset-password"]),
    );
  });
});
