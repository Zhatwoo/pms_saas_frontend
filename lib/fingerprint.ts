import FingerprintJS from "@fingerprintjs/fingerprintjs";

// Persisted so a device stays bound to the same fingerprint across sessions/days.
// Without this, FingerprintJS's visitorId can drift and the device gets treated as
// new on every login, forcing repeated device-authorization prompts.
const STORAGE_KEY = "pms_device_fingerprint";

let cachedVisitorId: string | null = null;

function readStoredFingerprint(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeFingerprint(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage unavailable (e.g. private mode); fall back to per-session value.
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;

  const stored = readStoredFingerprint();
  if (stored) {
    cachedVisitorId = stored;
    return stored;
  }

  const fp = await FingerprintJS.load();
  const result = await fp.get();
  cachedVisitorId = result.visitorId;
  storeFingerprint(cachedVisitorId);
  return cachedVisitorId;
}
