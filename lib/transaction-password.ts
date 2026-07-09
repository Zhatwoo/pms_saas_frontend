export const TRANSACTION_PASSWORD_VERIFY_MESSAGE = "Please enter password to verify.";

export function isTransactionPasswordError(message: string | null | undefined): boolean {
  if (!message) return false;

  const normalized = message.toLowerCase();
  return (
    normalized.includes("password") ||
    normalized.includes("authorization") ||
    normalized.includes("security verification")
  );
}

export const transactionPasswordErrorClass =
  "mt-1 whitespace-nowrap text-[10px] font-semibold text-red-500 sm:text-xs";

export function transactionPasswordInputClass(hasError: boolean, baseClass: string): string {
  if (!hasError) return baseClass;

  return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500/10`;
}
