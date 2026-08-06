/** Persist/read MOA extra fields (parking fee, custom fields) embedded in pawn remarks. */

export const MOA_FIELDS_REMARKS_PREFIX = "[MOA Fields] ";

/** Parse `[MOA Fields] Parking fee: 5; Other: x` from pawn item remarks. */
export function parsePersistedMoaValues(
  remarks?: string | null,
): Record<string, string> {
  const metadataLine = String(remarks ?? "")
    .split(/\r?\n/)
    .find((line) => line.startsWith(MOA_FIELDS_REMARKS_PREFIX));
  if (!metadataLine) return {};

  return Object.fromEntries(
    metadataLine
      .slice(MOA_FIELDS_REMARKS_PREFIX.length)
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf(":");
        if (separatorIndex < 0) return [entry, ""];
        return [
          entry.slice(0, separatorIndex).trim(),
          entry.slice(separatorIndex + 1).trim(),
        ];
      }),
  );
}

/** Human-visible remarks without the hidden `[MOA Fields]` metadata line. */
export function stripPersistedMoaFieldsFromRemarks(
  remarks?: string | null,
): string {
  return String(remarks ?? "")
    .split(/\r?\n/)
    .filter((line) => !line.startsWith(MOA_FIELDS_REMARKS_PREFIX))
    .join("\n")
    .trim();
}

function pickMoaNumber(
  values: Record<string, string>,
  labels: string[],
): number {
  for (const label of labels) {
    const direct = values[label];
    if (direct != null && String(direct).trim() !== "") {
      const n = Number(String(direct).replace(/,/g, ""));
      if (Number.isFinite(n)) return n;
    }
    const foundKey = Object.keys(values).find(
      (key) => key.trim().toLowerCase() === label.trim().toLowerCase(),
    );
    if (foundKey) {
      const n = Number(String(values[foundKey]).replace(/,/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

/** Parking fee from form value or remarks metadata (New Pawn persistence). */
export function resolveParkingFeeFromRemarks(
  remarks?: string | null,
  explicitParkingFee?: string | number | null,
): number {
  const explicit = Number(
    typeof explicitParkingFee === "string"
      ? explicitParkingFee.replace(/,/g, "")
      : explicitParkingFee,
  );
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const values = parsePersistedMoaValues(remarks);
  return pickMoaNumber(values, ["Parking fee", "Parking Fee", "parkingFee"]);
}

/** Storage fee from remarks metadata when present. */
export function resolveStorageFeeFromRemarks(
  remarks?: string | null,
  explicitStorageFee?: string | number | null,
): number {
  const explicit = Number(
    typeof explicitStorageFee === "string"
      ? explicitStorageFee.replace(/,/g, "")
      : explicitStorageFee,
  );
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const values = parsePersistedMoaValues(remarks);
  return pickMoaNumber(values, ["Storage fee", "Storage Fee", "storageFee"]);
}

export function formatFeeDisplay(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
