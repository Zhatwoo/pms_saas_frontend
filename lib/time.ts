export function formatTimeWithAmPm(time: string): string {
  if (!time) return "";

  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return time;

  const hour = Number(match[1]);
  const minute = match[2];

  if (Number.isNaN(hour) || hour < 0 || hour > 23) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}
