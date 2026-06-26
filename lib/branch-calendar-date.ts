/** PH business calendar day (YYYY-MM-DD), aligned with backend branch-finance logic. */
export function getPhCalendarDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Wall-clock HH:mm:ss in Asia/Manila (matches backend `getPhWallClockTimeString`). */
export function getPhWallClockTimeString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("hour").padStart(2, "0")}:${pick("minute").padStart(2, "0")}:${pick("second").padStart(2, "0")}`;
}

const WALL_CLOCK_TIME_RE =
  /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function padWallClockTime(h: string, m: string, s: string): string {
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${(s || "00").padStart(2, "0")}`;
}

/** Normalize DB/API time values to HH:mm:ss (matches backend util). */
export function normalizeWallClockTimeString(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString().slice(11, 19);
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const isoTail = raw.match(/T(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)/);
  if (isoTail) {
    const match = isoTail[1].match(WALL_CLOCK_TIME_RE);
    if (match) {
      return padWallClockTime(match[1], match[2], match[3] ?? "00");
    }
  }

  const direct = raw.match(WALL_CLOCK_TIME_RE);
  if (direct) {
    return padWallClockTime(direct[1], direct[2], direct[3] ?? "00");
  }

  return null;
}
