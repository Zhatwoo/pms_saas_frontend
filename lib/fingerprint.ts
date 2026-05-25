import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedVisitorId: string | null = null;

/**
 * Returns a stable browser/device fingerprint using FingerprintJS.
 * Result is cached for the lifetime of the page so multiple callers
 * don't trigger redundant loads.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;

  const fp = await FingerprintJS.load();
  const result = await fp.get();
  cachedVisitorId = result.visitorId;
  return cachedVisitorId;
}
