import {
  getPhCalendarDateString,
  getPhWallClockTimeString,
} from "@/lib/branch-calendar-date";

export function formatTimeWithAmPm(time: string): string {
  if (!time) return "";

  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return time;

  const hour = Number(match[1]);
  const minute = match[2];
  const second = match[3];

  if (Number.isNaN(hour) || hour < 0 || hour > 23) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const secondPart = second ? `:${second}` : "";

  return `${displayHour}:${minute}${secondPart} ${suffix}`;
}

/** PH business calendar date (YYYY-MM-DD), aligned with backend. */
export function formatDateToYMD(date: Date = new Date()): string {
  return getPhCalendarDateString(date);
}

/** Capture wall-clock date/time at transaction submit (Asia/Manila). */
export function getTransactionDateTimeFields(date: Date = new Date()) {
  return {
    transaction_date: getPhCalendarDateString(date),
    transaction_time: getPhWallClockTimeString(date),
  };
}
