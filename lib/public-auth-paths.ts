export const PUBLIC_AUTH_API_PATHS = [
  "/auth/login",
  "/auth/logout",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/signup/branches",
  "/branches/public",
  "/inventory/public/for-sale",
  "/devices/request-authorization",
  "/contact",
] as const;

export function isPublicAuthApiPath(path: string): boolean {
  const pathname = path.split("?")[0];
  if (PUBLIC_AUTH_API_PATHS.includes(pathname as (typeof PUBLIC_AUTH_API_PATHS)[number])) {
    return true;
  }
  return (
    pathname.startsWith("/pawn-tickets/public/") ||
    pathname.startsWith("/inventory/public/for-sale/")
  );
}
