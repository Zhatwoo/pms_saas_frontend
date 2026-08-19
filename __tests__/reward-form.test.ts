import {
  adjustRewardNumericValue,
  buildRewardPayload,
  formatPromoDuration,
  formatRewardAmountInput,
  formatRewardIntegerInput,
  isRewardPromoValidationError,
  normalizeRewardNumericInput,
  parseRewardNumericInput,
  rewardsApiSupportsPromoDuration,
  toDateInputValue,
  validateRewardForm,
  type RewardFormState,
} from "@/lib/reward-form";

describe("reward form helpers", () => {
  const baseForm: RewardFormState = {
    name: "Bronze Tier",
    description: "Short promo copy",
    reward_type: "cashback",
    reward_value: "100",
    required_transaction_count: "5",
    required_total_amount: "0",
    transaction_type: "",
    is_active: true,
    promo_start_at: "2026-08-01",
    promo_end_at: "2026-08-31",
  };

  it("builds reward payloads with description and promo duration", () => {
    expect(buildRewardPayload(baseForm)).toEqual({
      name: "Bronze Tier",
      description: "Short promo copy",
      reward_type: "cashback",
      reward_value: 100,
      required_transaction_count: 5,
      required_total_amount: 0,
      transaction_type: undefined,
      is_active: true,
      promo_start_at: "2026-08-01",
      promo_end_at: "2026-08-31",
    });
  });

  it("omits promo fields when the API does not support them", () => {
    expect(buildRewardPayload(baseForm, { includePromo: false })).toEqual({
      name: "Bronze Tier",
      description: "Short promo copy",
      reward_type: "cashback",
      reward_value: 100,
      required_transaction_count: 5,
      required_total_amount: 0,
      transaction_type: undefined,
      is_active: true,
    });
  });

  it("detects legacy reward APIs without promo duration fields", () => {
    expect(rewardsApiSupportsPromoDuration([])).toBe(true);
    expect(
      rewardsApiSupportsPromoDuration([
        { id: "1", name: "Legacy", promo_start_at: null, promo_end_at: null },
      ]),
    ).toBe(true);
    expect(
      rewardsApiSupportsPromoDuration([{ id: "1", name: "Legacy" }]),
    ).toBe(false);
  });

  it("detects promo validation errors from older backends", () => {
    expect(
      isRewardPromoValidationError(
        "Validation failed — promo_start_at: property promo_start_at should not exist; promo_end_at: property promo_end_at should not exist",
      ),
    ).toBe(true);
    expect(isRewardPromoValidationError("Validation failed — name: name should not be empty")).toBe(
      false,
    );
  });

  it("formats promo duration labels", () => {
    expect(formatPromoDuration("2026-08-01T00:00:00.000Z", "2026-08-31T23:59:59.999Z")).toBe(
      "2026-08-01 to 2026-08-31",
    );
    expect(formatPromoDuration(null, null)).toBeNull();
  });

  it("validates promo date order", () => {
    expect(validateRewardForm(baseForm)).toBeNull();
    expect(
      validateRewardForm({
        ...baseForm,
        promo_start_at: "2026-09-01",
        promo_end_at: "2026-08-01",
      }),
    ).toBe("Promo start date must be on or before the end date");
  });

  it("normalizes API dates for date inputs", () => {
    expect(toDateInputValue("2026-08-18T15:30:00.000Z")).toBe("2026-08-18");
  });

  it("parses comma-formatted numeric inputs for payloads", () => {
    expect(
      buildRewardPayload({
        ...baseForm,
        reward_value: "1,000.50",
        required_transaction_count: "1,000",
        required_total_amount: "10,000.00",
      }),
    ).toEqual({
      ...buildRewardPayload(baseForm),
      reward_value: 1000.5,
      required_transaction_count: 1000,
      required_total_amount: 10000,
    });
  });

  it("formats reward amounts with thousands separators and decimals", () => {
    expect(formatRewardAmountInput("1000000")).toBe("1,000,000.00");
    expect(formatRewardIntegerInput("5000")).toBe("5,000");
  });

  it("adjusts values using selected preset steps without going below min", () => {
    expect(adjustRewardNumericValue("100", 1, 1000, 0)).toBe("1100");
    expect(adjustRewardNumericValue("50", -1, 100, 0)).toBe("0");
    expect(adjustRewardNumericValue("3", -1, 5, 1)).toBe("1");
  });

  it("normalizes typed numeric strings", () => {
    expect(normalizeRewardNumericInput("1,250.75")).toBe("1250.75");
    expect(parseRewardNumericInput("10,000.00")).toBe(10000);
  });
});
