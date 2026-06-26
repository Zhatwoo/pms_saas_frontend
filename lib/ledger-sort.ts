import { normalizeWallClockTimeString } from "@/lib/branch-calendar-date";

export type LedgerSortable = {
  id: string;
  date: string;
  time?: string | null;
  createdAt?: string | null;
};

function createdAtMs(value: string | null | undefined): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Manila wall-clock instant for chronological compare (date + normalized time). */
export function ledgerSortInstantMs(entry: LedgerSortable): number {
  const time = normalizeWallClockTimeString(entry.time) ?? "00:00:00";
  const instant = new Date(`${entry.date}T${time}+08:00`).getTime();
  return Number.isFinite(instant) ? instant : 0;
}

export function compareLedgerEntries(
  a: LedgerSortable,
  b: LedgerSortable,
  direction: "asc" | "desc" = "asc",
): number {
  const instantDiff = ledgerSortInstantMs(a) - ledgerSortInstantMs(b);
  if (instantDiff !== 0) {
    return direction === "asc" ? instantDiff : -instantDiff;
  }

  const createdDiff = createdAtMs(a.createdAt) - createdAtMs(b.createdAt);
  if (createdDiff !== 0) {
    return direction === "asc" ? createdDiff : -createdDiff;
  }

  const idDiff = a.id.localeCompare(b.id);
  return direction === "asc" ? idDiff : -idDiff;
}

export function sortLedgerEntries<T extends LedgerSortable>(
  entries: T[],
  direction: "asc" | "desc" = "asc",
): T[] {
  return [...entries].sort((a, b) => compareLedgerEntries(a, b, direction));
}
