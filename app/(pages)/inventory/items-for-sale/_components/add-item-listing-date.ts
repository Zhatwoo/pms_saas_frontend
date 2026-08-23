export function getTodayListingDate(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function resolveDefaultListingDate(
  preferred?: string | null,
  today = getTodayListingDate(),
): string {
  const raw = String(preferred ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today) {
    return raw;
  }
  return today;
}
