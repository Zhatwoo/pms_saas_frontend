/**
 * Same-day operational cash totals for UI (align with branch-finance ledger rules).
 * Excludes voided rows and journal Start/End markers (zero cash, bookkeeping only).
 */
export type LedgerOperationalRow = {
  id?: string | null;
  purpose?: string | null;
  cash_in?: number | string | null;
  cash_out?: number | string | null;
  voided_at?: string | null;
  unit?: string | null;
  created_at?: string | Date | null;
};

function isInboundFundTransferCashRow(row: LedgerOperationalRow): boolean {
  if (row.voided_at != null && row.voided_at !== "") return false;
  const ci = Number(row.cash_in ?? 0);
  if (!Number.isFinite(ci) || ci <= 0) return false;
  const unit = (row.unit ?? "").toLowerCase().trim();
  const purpose = (row.purpose ?? "").toLowerCase().trim();
  return unit === "fund_transfer" || purpose === "cash transfer";
}

function createdAtMs(value: string | Date | null | undefined): number {
  if (value == null) return 0;
  if (value instanceof Date) return value.getTime();
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Operational cash for pawn "ending balance" cards: same as {@link operationalCashTotals},
 * but rows posted **before** `sessionOpenedAt` are skipped (prior employee shift on the same
 * Manila calendar day after End Day → Start Day). Inbound fund transfers before open are included
 * in that rule — the physical starting count already reflects them.
 */
export function operationalCashTotalsForPawnEnding(
  rows: LedgerOperationalRow[],
  sessionOpenedAtIso?: string | null,
  operationalCutoffAtIso?: string | null,
  sealedTransactionIds?: string[] | null,
): {
  cashIn: number;
  cashOut: number;
  net: number;
} {
  const openMs = sessionOpenedAtIso
    ? new Date(sessionOpenedAtIso).getTime()
    : NaN;
  const cutoffMs = operationalCutoffAtIso
    ? new Date(operationalCutoffAtIso).getTime()
    : NaN;
  const effectiveMs = Math.max(
    Number.isFinite(openMs) ? openMs : 0,
    Number.isFinite(cutoffMs) ? cutoffMs : 0,
  );
  const hasOpen = effectiveMs > 0;
  const sealed = new Set(sealedTransactionIds ?? []);

  let cashIn = 0;
  let cashOut = 0;
  for (const tx of rows) {
    if (tx.voided_at != null && tx.voided_at !== "") continue;
    const p = (tx.purpose ?? "").toLowerCase().trim();
    if (p === "start" || p === "end") continue;
    if (tx.id && sealed.has(tx.id)) continue;

    if (hasOpen && createdAtMs(tx.created_at) < effectiveMs) {
      continue;
    }

    const ci = Number(tx.cash_in ?? 0);
    const co = Number(tx.cash_out ?? 0);
    if (Number.isFinite(ci)) cashIn += ci;
    if (Number.isFinite(co)) cashOut += co;
  }
  return {
    cashIn: Number(cashIn.toFixed(2)),
    cashOut: Number(cashOut.toFixed(2)),
    net: Number((cashIn - cashOut).toFixed(2)),
  };
}

export function operationalCashTotals(rows: LedgerOperationalRow[]): {
  cashIn: number;
  cashOut: number;
  net: number;
} {
  let cashIn = 0;
  let cashOut = 0;
  for (const tx of rows) {
    if (tx.voided_at != null && tx.voided_at !== "") continue;
    const p = (tx.purpose ?? "").toLowerCase().trim();
    if (p === "start" || p === "end") continue;
    const ci = Number(tx.cash_in ?? 0);
    const co = Number(tx.cash_out ?? 0);
    if (Number.isFinite(ci)) cashIn += ci;
    if (Number.isFinite(co)) cashOut += co;
  }
  return {
    cashIn: Number(cashIn.toFixed(2)),
    cashOut: Number(cashOut.toFixed(2)),
    net: Number((cashIn - cashOut).toFixed(2)),
  };
}
