/**
 * Gadget Pawn Interest Rules:
 * - 0 to 5 days: 5%
 * - 6 to 10 days: 10% (1st Maturity)
 * - 11 to 20 days: 20% (2nd Maturity)
 * - 21 to 30 days: 30% (3rd Maturity / Expiry)
 * - 31 to 34 days: 40% (Grace Period)
 * - 35+ days: Expired
 */

export function calculateGadgetInterest(pawnAmount: number, transactionDate: string): { 
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
  
  let percentage = 0;
  let isExpired = false;

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
