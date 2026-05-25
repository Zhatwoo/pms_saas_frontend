/**
 * Gadget Pawn Interest Rules:
 * - 0 to 5 days: 5%
 * - 6 to 10 days: 10% (1st Maturity)
 * - 11 to 20 days: 20% (2nd Maturity)
 * - 21 to 30 days: 30% (3rd Maturity / Expiry)
 * - 31 to 34 days: 40% (Grace Period)
 * - 35+ days: Expired
 */

export function calculateGadgetInterest(pawnAmount: number, transactionDate: string, category?: string): { 
  percentage: number; 
  interestAmount: number; 
  totalAmount: number;
  daysPassed: number;
  isExpired: boolean;
} {
  const start = new Date(transactionDate);
  const now = new Date();
  
  // Set times to midnight for accurate day difference
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - start.getTime();
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Load custom interest rates from localStorage
  let groups: any[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("interest_rates");
      if (stored) groups = JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse stored interest rates");
    }
  }

  // Find matching group
  const activeGroup = groups.find(g => g.categories && g.categories.includes(category));

  let percentage = 0;
  let isExpired = false;

  if (activeGroup) {
    const defaultDuration = activeGroup.defaultDuration ?? 30;
    const graceDuration = activeGroup.gracePeriodDuration ?? 4;

    const first5DaysLimit = activeGroup.first5DaysLimit ?? 5;
    const day10Limit = activeGroup.day10Limit ?? 10;
    const day20Limit = activeGroup.day20Limit ?? 20;

    const first5Days = activeGroup.first5Days ?? 5;
    const day10 = activeGroup.day10 ?? 10;
    const day20 = day10 + (activeGroup.day20Additional ?? 10);
    const day30 = day20 + (activeGroup.day30Additional ?? 10);
    const graceRate = day30 + (activeGroup.gracePeriodAdditional ?? 10);

    if (daysPassed <= first5DaysLimit) {
      percentage = first5Days;
    } else if (daysPassed <= day10Limit) {
      percentage = day10;
    } else if (daysPassed <= day20Limit) {
      percentage = day20;
    } else if (daysPassed <= defaultDuration) {
      percentage = day30;
    } else if (daysPassed <= defaultDuration + graceDuration) {
      percentage = graceRate;
    } else {
      percentage = graceRate;
      isExpired = true;
    }
  } else {
    // Default fallback
    if (daysPassed <= 5) {
      percentage = 5;
    } else if (daysPassed <= 10) {
      percentage = 10;
    } else if (daysPassed <= 20) {
      percentage = 20;
    } else if (daysPassed <= 30) {
      percentage = 30;
    } else if (daysPassed <= 34) {
      percentage = 40;
    } else {
      percentage = 40; // Max percentage
      isExpired = true;
    }
  }

  const interestAmount = pawnAmount * (percentage / 100);
  const totalAmount = pawnAmount + interestAmount;

  return {
    percentage,
    interestAmount,
    totalAmount,
    daysPassed,
    isExpired
  };
}
