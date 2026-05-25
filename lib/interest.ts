export interface InterestRateGroup {
  id: string;
  name: string;
  categories: string[];
  first5Days: number;
  day10: number;
  day20Additional: number;
  day30Additional: number;
  gracePeriodAdditional: number;
  defaultDuration: number;
  gracePeriodDuration: number;
  first5DaysLimit?: number;
  day10Limit?: number;
  day20Limit?: number;
  first5DaysStart?: number;
  day10Start?: number;
  day20Start?: number;
  day30Start?: number;
  gracePeriodStart?: number;
}

export interface InterestRateScheduleItem {
  label: string;
  startDay: number;
  endDay: number;
  percentage: number;
}

const DEFAULT_INTEREST_GROUP: InterestRateGroup = {
  id: "default-gadgets",
  name: "Default Gadgets",
  categories: ["Smartphone", "Laptop & PC", "Gaming Console"],
  first5Days: 5,
  first5DaysLimit: 5,
  day10: 10,
  day10Limit: 10,
  day20Additional: 10,
  day20Limit: 20,
  day30Additional: 10,
  gracePeriodAdditional: 10,
  defaultDuration: 30,
  gracePeriodDuration: 4,
  first5DaysStart: 1,
  day10Start: 6,
  day20Start: 11,
  day30Start: 21,
  gracePeriodStart: 31,
};

function parseInterestRatesFromStorage(): InterestRateGroup[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("interest_rates");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored interest rates", error);
    return [];
  }
}

export function findInterestRateGroup(category?: string): InterestRateGroup | null {
  if (!category) return null;
  const groups = parseInterestRatesFromStorage();
  return groups.find((group) => group.categories?.includes(category)) ?? null;
}

function normalizeGroup(group: InterestRateGroup): InterestRateGroup {
  return {
    ...group,
    first5DaysLimit: group.first5DaysLimit ?? 5,
    day10Limit: group.day10Limit ?? 10,
    day20Limit: group.day20Limit ?? 20,
    first5DaysStart: group.first5DaysStart ?? 1,
    day10Start: group.day10Start ?? (group.first5DaysLimit ?? 5) + 1,
    day20Start: group.day20Start ?? (group.day10Limit ?? 10) + 1,
    day30Start: group.day30Start ?? (group.day20Limit ?? 20) + 1,
    gracePeriodStart: group.gracePeriodStart ?? (group.defaultDuration ?? 30) + 1,
  };
}

export function getInterestRateSchedule(category?: string): InterestRateScheduleItem[] {
  const group = findInterestRateGroup(category);
  const config = group ? normalizeGroup(group) : DEFAULT_INTEREST_GROUP;

  const limit1 = config.first5DaysLimit ?? 5;
  const rate1 = config.first5Days;
  const start1 = config.first5DaysStart ?? 1;

  const limit2 = config.day10Limit ?? 10;
  const rate2 = config.day10;
  const start2 = config.day10Start ?? limit1 + 1;

  const limit3 = config.day20Limit ?? 20;
  const rate3 = rate2 + (config.day20Additional ?? 10);
  const start3 = config.day20Start ?? limit2 + 1;

  const limit4 = config.defaultDuration;
  const rate4 = rate3 + (config.day30Additional ?? 10);
  const start4 = config.day30Start ?? limit3 + 1;

  const graceDuration = config.gracePeriodDuration;
  const rate5 = rate4 + (config.gracePeriodAdditional ?? 10);
  const start5 = config.gracePeriodStart ?? limit4 + 1;

  return [
    { label: "Initial Period", startDay: start1, endDay: limit1, percentage: rate1 },
    { label: "1st Maturity", startDay: start2, endDay: limit2, percentage: rate2 },
    { label: "2nd Maturity", startDay: start3, endDay: limit3, percentage: rate3 },
    { label: "3rd Maturity (Expiry Date)", startDay: start4, endDay: limit4, percentage: rate4 },
    { label: "Grace Period", startDay: start5, endDay: limit4 + graceDuration, percentage: rate5 },
  ];
}

export function calculateGadgetInterest(amount: number, pawnDate: string | Date | null, category?: string) {
  if (!pawnDate) return { percentage: 0, interestAmount: 0, totalAmount: amount, daysPassed: 0 };

  const start = new Date(pawnDate);
  const now = new Date();

  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - start.getTime();
  let daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  if (daysPassed < 0) daysPassed = 0;

  const activeGroup = findInterestRateGroup(category);

  let percentage = 5;
  let interestAmount = 0;
  let totalAmount = amount;

  if (activeGroup) {
    const group = normalizeGroup(activeGroup);
    const first5DaysLimit = group.first5DaysLimit ?? 5;
    const day10Limit = group.day10Limit ?? 10;
    const day20Limit = group.day20Limit ?? 20;
    const defaultDuration = group.defaultDuration;
    const graceDuration = group.gracePeriodDuration ?? 4;

    const first5Days = group.first5Days;
    const day10 = group.day10;
    const day20 = day10 + (group.day20Additional ?? 10);
    const day30 = day20 + (group.day30Additional ?? 10);
    const graceRate = day30 + (group.gracePeriodAdditional ?? 10);

    if (daysPassed > defaultDuration + graceDuration) {
      percentage = graceRate;
    } else if (daysPassed > defaultDuration) {
      percentage = graceRate;
    } else if (daysPassed > day20Limit) {
      percentage = day30;
    } else if (daysPassed > day10Limit) {
      percentage = day20;
    } else if (daysPassed > first5DaysLimit) {
      percentage = day10;
    } else {
      percentage = first5Days;
    }
  } else {
    if (daysPassed > 30) {
      percentage = 40;
    } else if (daysPassed > 20) {
      percentage = 30;
    } else if (daysPassed > 10) {
      percentage = 20;
    } else if (daysPassed > 5) {
      percentage = 10;
    }
  }

  interestAmount = amount * (percentage / 100);
  totalAmount = amount + interestAmount;

  return {
    percentage,
    interestAmount,
    totalAmount,
    daysPassed,
  };
}
