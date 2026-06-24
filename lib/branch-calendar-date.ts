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
