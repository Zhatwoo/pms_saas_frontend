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
  return PUBLIC_AUTH_API_PATHS.includes(path as (typeof PUBLIC_AUTH_API_PATHS)[number]);
}
