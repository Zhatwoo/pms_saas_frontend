export function calculateGadgetInterest(amount: number, pawnDate: string | Date | null, category?: string) {
  if (!pawnDate) return { percentage: 0, interestAmount: 0, totalAmount: amount, daysPassed: 0 };
  
  const start = new Date(pawnDate);
  const now = new Date();
  
  // Set times to midnight for accurate day difference
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - start.getTime();
  let daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include Day 1
  if (daysPassed < 0) daysPassed = 0;
  
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

  // Find the group matching the category
  const activeGroup = groups.find(g => g.categories && g.categories.includes(category));

  let percentage = 5;
  let defaultDuration = 30;
  let graceDuration = 4; // 31-34 days

  if (activeGroup) {
    defaultDuration = activeGroup.defaultDuration ?? 30;
    graceDuration = activeGroup.gracePeriodDuration ?? 4;

    const first5Days = activeGroup.first5Days ?? 5;
    const day10 = activeGroup.day10 ?? 10;
    const day20 = day10 + (activeGroup.day20Additional ?? 10);
    const day30 = day20 + (activeGroup.day30Additional ?? 10);
    const graceRate = day30 + (activeGroup.gracePeriodAdditional ?? 10);

    if (daysPassed > defaultDuration + graceDuration) {
      percentage = graceRate; // Forfeited/Expired
    } else if (daysPassed > defaultDuration) {
      percentage = graceRate;
    } else if (daysPassed > 20) {
      percentage = day30;
    } else if (daysPassed > 10) {
      percentage = day20;
    } else if (daysPassed > 5) {
      percentage = day10;
    } else {
      percentage = first5Days;
    }
  } else {
    // Default fallback
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
  
  const interestAmount = amount * (percentage / 100);
  
  return {
    percentage,
    interestAmount,
    totalAmount: amount + interestAmount,
    daysPassed
  };
}
