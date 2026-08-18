const REMEMBERED_EMAIL_KEY = "pms_remembered_email";

export function loadRememberedEmail(): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Persist email only. Never store passwords. */
export function persistRememberedEmail(email: string, remember: boolean): void {
  if (typeof window === "undefined") return;

  try {
    const trimmed = email.trim();
    if (remember && trimmed) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmed);
      return;
    }
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
