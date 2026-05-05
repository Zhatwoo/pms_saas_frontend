export function calculateGadgetInterest(amount: number, pawnDate: string | Date | null) {
  if (!pawnDate) return { percentage: 0, interestAmount: 0, totalAmount: amount, daysPassed: 0 };
  
  const start = new Date(pawnDate);
  const now = new Date();
  
  // Set times to midnight for accurate day difference
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - start.getTime();
  let daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include Day 1
  if (daysPassed < 0) daysPassed = 0;
  
  let percentage = 5; 
  
  if (daysPassed > 30) {
    percentage = 40;
  } else if (daysPassed > 20) {
    percentage = 30;
  } else if (daysPassed > 10) {
    percentage = 20;
  } else if (daysPassed > 5) {
    percentage = 10;
  }
  
  const interestAmount = amount * (percentage / 100);
  
  return {
    percentage,
    interestAmount,
    totalAmount: amount + interestAmount,
    daysPassed
  };
}
