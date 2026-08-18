/** Role-aware profile/settings route used by the header avatar control. */
export function getProfileSettingsPath(pathname: string): string {
  if (pathname.startsWith("/admin")) {
    return "/admin/settings";
  }

  if (pathname.startsWith("/employee")) {
    return "/employee/settings";
  }

  return "/settings";
}
