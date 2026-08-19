import { PUBLIC_AUTH_API_PATHS, isPublicAuthApiPath } from "@/lib/public-auth-paths";

describe("PUBLIC_AUTH_API_PATHS", () => {
  it("includes forgot-password and reset-password routes used by the login modal", () => {
    expect(PUBLIC_AUTH_API_PATHS).toEqual(
      expect.arrayContaining(["/auth/forgot-password", "/auth/reset-password"]),
    );
  });

  it("treats public QR ticket lookups as unauthenticated API paths", () => {
    expect(isPublicAuthApiPath("/pawn-tickets/public/SALE-123456")).toBe(true);
    expect(isPublicAuthApiPath("/inventory/public/for-sale/SALE-123456")).toBe(
      true,
    );
  });
});
