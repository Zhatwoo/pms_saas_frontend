export interface RewardFormState {
  name: string;
  description: string;
  reward_type: string;
  reward_value: string;
  required_transaction_count: string;
  required_total_amount: string;
  transaction_type: string;
  is_active: boolean;
  promo_start_at: string;
  promo_end_at: string;
}

export const REWARD_AMOUNT_STEP_PRESETS = [10, 100, 1000, 10000, 100000, 1000000] as const;
export const REWARD_PERCENT_STEP_PRESETS = [1, 5, 10, 25, 50] as const;
export const REWARD_TRANSACTION_STEP_PRESETS = [1, 5, 10, 50, 100] as const;

export function parseRewardNumericInput(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned || cleaned === ".") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeRewardNumericInput(value: string): string {
  const parsed = parseRewardNumericInput(value);
  if (Number.isInteger(parsed)) return String(parsed);
  return String(parsed);
}

export function formatRewardAmountInput(value: string | number): string {
  const amount = typeof value === "number" ? value : parseRewardNumericInput(value);
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRewardIntegerInput(value: string | number): string {
  const amount = typeof value === "number" ? value : parseRewardNumericInput(value);
  return Math.round(amount).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export function adjustRewardNumericValue(
  current: string,
  direction: 1 | -1,
  step: number,
  min = 0,
): string {
  const safeStep = Math.max(0, step);
  if (safeStep === 0) return normalizeRewardNumericInput(current);

  const next = Math.max(min, parseRewardNumericInput(current) + direction * safeStep);
  return normalizeRewardNumericInput(String(next));
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatPromoDuration(
  promoStartAt?: string | null,
  promoEndAt?: string | null,
): string | null {
  const start = promoStartAt ? toDateInputValue(promoStartAt) : "";
  const end = promoEndAt ? toDateInputValue(promoEndAt) : "";

  if (start && end) {
    return `${start} to ${end}`;
  }

  if (start) {
    return `Starts ${start}`;
  }

  if (end) {
    return `Ends ${end}`;
  }

  return null;
}

export function buildRewardPayload(form: RewardFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    reward_type: form.reward_type,
    reward_value: parseRewardNumericInput(form.reward_value),
    required_transaction_count:
      Math.max(1, Math.round(parseRewardNumericInput(form.required_transaction_count))) || 1,
    required_total_amount: parseRewardNumericInput(form.required_total_amount),
    transaction_type: form.transaction_type || undefined,
    is_active: form.is_active,
    promo_start_at: form.promo_start_at || undefined,
    promo_end_at: form.promo_end_at || undefined,
  };
}

export function validateRewardForm(form: RewardFormState): string | null {
  if (!form.name.trim()) {
    return "Reward name is required";
  }

  if (form.promo_start_at && form.promo_end_at && form.promo_start_at > form.promo_end_at) {
    return "Promo start date must be on or before the end date";
  }

  return null;
}
