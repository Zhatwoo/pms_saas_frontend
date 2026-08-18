import {
  getPhCalendarDateString,
  getPhWallClockTimeString,
} from "@/lib/branch-calendar-date";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Display date for the top navigation clock (Asia/Manila business calendar). */
export function formatHeaderDate(date: Date = new Date()): string {
  const [year, month, day] = getPhCalendarDateString(date).split("-");
  const monthIndex = Number(month) - 1;
  const monthLabel = MONTHS_SHORT[monthIndex] ?? month;
  return `${monthLabel} ${Number(day)}, ${year}`;
}

/** Display time for the top navigation clock (12-hour Asia/Manila wall clock). */
export function formatHeaderTime(date: Date = new Date()): string {
  const [hourText, minute, second] = getPhWallClockTimeString(date).split(":");
  const hour24 = Number(hourText);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute}:${second} ${suffix}`;
}

/** Combined date and time string for large header layouts. */
export function formatHeaderDateTime(date: Date = new Date()): string {
  return `${formatHeaderDate(date)}, ${formatHeaderTime(date)}`;
}
