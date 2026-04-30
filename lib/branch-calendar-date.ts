/** PH business calendar day (YYYY-MM-DD), aligned with backend branch-finance logic. */
export function getPhCalendarDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
