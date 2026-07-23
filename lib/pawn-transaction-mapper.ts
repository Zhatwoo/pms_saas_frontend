import {
  calculateTransactionGadgetInterest,
  findInterestRateGroup,
  parseInterestRateSnapshot,
  type InterestRateGroup,
} from "./interest";

/**
 * Shape returned by `/inventory/pawned/:id` and `/inventory/item/:unitCode`
 * when enriching a transaction row with the underlying pawned-item record
 * for reprint/MOA purposes. Fields are optional because both endpoints
 * return partial/legacy records depending on how the item was created.
 */
export interface EnrichedPawnedItem {
  customerName?: string | null;
  customerAddress?: string | null;
  customerIdPresented?: string | null;
  itemName?: string | null;
  serialNumber?: string | null;
  itemsIncluded?: string | null;
  condition?: string | null;
  memoryStorage?: string | null;
  created_by_user?: {
    full_name?: string | null;
  } | null;
}

/** Shape returned by `/transactions/pawn-source`, keyed off legacy snake_case fields. */
export interface PawnSourceResponse {
  pawned_item?: {
    serial_number?: string | null;
    items_included?: string | null;
    condition?: string | null;
    memory_storage?: string | null;
  } | null;
  created_by_user?: {
    full_name?: string | null;
  } | null;
}

export function resolvePawnedItemJoin<T>(
  raw: T | T[] | null | undefined,
): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export function isLegacyBuyOutTransaction(
  purpose: string,
  details?: string | null,
): boolean {
  return (
    purpose === "Buy Out" ||
    purpose === "Redeem" ||
    (purpose === "Buy Back" &&
      ((details ?? "").includes("Redeemed by") ||
        (details ?? "").includes("Bought out by")))
  );
}

export function isLegacyBuyBackRepurchase(
  purpose: string,
  details?: string | null,
): boolean {
  return purpose === "Buy Back" && (details ?? "").includes("Repurchased by");
}

/** Initial-period rate from the contract snapshot (e.g. 5% for days 1–5). */
export function getFrozenPawnInitialRatePercent(
  interestRateSnapshot?: unknown,
): string | null {
  const snapshot = parseInterestRateSnapshot(interestRateSnapshot);
  if (!snapshot) return null;
  return String(snapshot.first5Days);
}

/** Periodic storage rate from saved amounts (day10 % used on MOA, e.g. 10%). */
export function getFrozenPawnPeriodicRatePercent(
  pawnAmount: number,
  storageFee?: number | string | null,
): string | null {
  const principal = Number(pawnAmount || 0);
  const storage = Number(storageFee ?? 0);
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(storage) ||
    principal <= 0 ||
    storage <= 0
  ) {
    return null;
  }
  return String(Number(((storage / principal) * 100).toFixed(2)));
}

export function getTransactionInterestPercentage(input: {
  pawnAmount: number;
  purpose: string;
  details?: string | null;
  transactionDate: string;
  category?: string | null;
  pawnDate?: string | null;
  storageFee?: number | string | null;
  interestRateSnapshot?: unknown;
}): string {
  const isPawn = input.purpose === "Pawn";
  const isBuyOut = isLegacyBuyOutTransaction(input.purpose, input.details);
  const isBuyBack = isLegacyBuyBackRepurchase(input.purpose, input.details);

  if (!isPawn && !isBuyOut && !isBuyBack) {
    return "0";
  }

  // Completed pawn disbursement: show locked initial-period rate from contract snapshot.
  // Maturity tiers (10%, 20%, …) still apply later on Renew/Buy Out using the same snapshot.
  if (isPawn) {
    const frozenInitialRate = getFrozenPawnInitialRatePercent(
      input.interestRateSnapshot,
    );
    if (frozenInitialRate) {
      return frozenInitialRate;
    }

    // Legacy pawns saved without a snapshot: use the current interest-rate group
    // for this category so the "%" matches the inventory (initial-period rate,
    // e.g. 5%) instead of the storage-fee-derived periodic rate (e.g. 10%).
    const liveGroup = findInterestRateGroup(input.category?.trim() || undefined);
    if (liveGroup && typeof liveGroup.first5Days === "number") {
      return String(liveGroup.first5Days);
    }
  }

  const snapshot = parseInterestRateSnapshot(input.interestRateSnapshot);

  const calculations = calculateTransactionGadgetInterest(input.pawnAmount, {
    transactionDate: input.transactionDate,
    pawnDate: input.pawnDate,
    category: input.category,
    rateGroup: snapshot,
  });

  // Final fallback for legacy pawns with no snapshot and no resolvable category:
  // derive the periodic rate from the saved storage fee.
  if (isPawn && calculations.percentage <= 0) {
    const frozenPeriodicRate = getFrozenPawnPeriodicRatePercent(
      input.pawnAmount,
      input.storageFee,
    );
    if (frozenPeriodicRate) {
      return frozenPeriodicRate;
    }
  }

  return String(calculations.percentage);
}

export function getContractInterestRateGroup(
  category?: string | null,
  interestRateSnapshot?: unknown,
): InterestRateGroup | null {
  return parseInterestRateSnapshot(interestRateSnapshot);
}
