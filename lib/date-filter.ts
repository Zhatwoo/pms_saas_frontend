export const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

export function getCurrentMonthString(referenceDate = new Date()) {
  return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
}

export function generateRecentYears(count = 5, referenceDate = new Date()) {
  const current = referenceDate.getFullYear();
  return Array.from({ length: count }, (_, index) => (current - index).toString());
}

export function parseMonthlyDate(monthlyDate: string) {
  const [year, month] = monthlyDate.split("-");
  return { year, month };
}

export function buildMonthlyDate(year: string, month: string) {
  return `${year}-${month}`;
}

export function clampMonthlyDate(monthlyDate: string, maxMonth = getCurrentMonthString()) {
  const { year, month } = parseMonthlyDate(monthlyDate);
  const [maxYear, maxMonthValue] = maxMonth.split("-");

  if (year > maxYear) {
    return maxMonth;
  }

  if (year === maxYear && month > maxMonthValue) {
    return buildMonthlyDate(year, maxMonthValue);
  }

  return monthlyDate;
}

export function getAvailableMonthsForYear(
  year: string,
  maxMonth = getCurrentMonthString(),
) {
  const [maxYear, maxMonthValue] = maxMonth.split("-");
  const monthLimit = year === maxYear ? maxMonthValue : "12";

  return MONTH_OPTIONS.filter((option) => option.value <= monthLimit);
}

export function monthlyDateToRange(monthlyDate: string) {
  const { year, month } = parseMonthlyDate(monthlyDate);
  const end = new Date(parseInt(year, 10), parseInt(month, 10), 0);
  const startStr = `${year}-${month}-01`;
  const endStr = `${year}-${month}-${String(end.getDate()).padStart(2, "0")}`;

  return { startDate: startStr, endDate: endStr };
}
