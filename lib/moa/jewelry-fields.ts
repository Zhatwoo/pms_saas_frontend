/** Jewelry item description fields for MOA / Slip Edit and New Pawn. */

export type JewelryFieldKey =
  | "itemType"
  | "metalType"
  | "karat"
  | "weightGrams"
  | "stoneType"
  | "stoneCarat"
  | "hallmarkStamp"
  | "condition"
  | "appraisedValue";

export type JewelryFormFieldKey = Exclude<
  JewelryFieldKey,
  "condition" | "appraisedValue"
>;

export const JEWELRY_FIELD_OPTIONS: Array<{
  key: JewelryFieldKey;
  label: string;
  /** Label used in `[MOA Fields]` remarks metadata. */
  persistLabel: string;
}> = [
  { key: "itemType", label: "Item Type", persistLabel: "Item Type" },
  { key: "metalType", label: "Metal Type", persistLabel: "Metal Type" },
  { key: "karat", label: "Karat", persistLabel: "Karat" },
  { key: "weightGrams", label: "Weight (grams)", persistLabel: "Weight (grams)" },
  { key: "stoneType", label: "Stone Type", persistLabel: "Stone Type" },
  { key: "stoneCarat", label: "Stone Carat", persistLabel: "Stone Carat" },
  { key: "hallmarkStamp", label: "Hallmark/Stamp", persistLabel: "Hallmark/Stamp" },
  { key: "condition", label: "Condition", persistLabel: "Condition" },
  { key: "appraisedValue", label: "Appraised Value", persistLabel: "Appraised Value" },
];

export const JEWELRY_FORM_FIELD_KEYS: JewelryFormFieldKey[] = [
  "itemType",
  "metalType",
  "karat",
  "weightGrams",
  "stoneType",
  "stoneCarat",
  "hallmarkStamp",
];

export function isJewelryCategory(category?: string | null): boolean {
  return /jewel/i.test(String(category ?? "").trim());
}

/** Map persisted `[MOA Fields]` keys (label or field key) to jewelry field keys. */
export function readJewelryFieldValues(
  persisted: Record<string, string>,
  overrides: Partial<Record<JewelryFieldKey, string>> = {},
): Record<JewelryFieldKey, string> {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const direct = persisted[key];
      if (direct != null && String(direct).trim()) return String(direct).trim();
      const found = Object.entries(persisted).find(
        ([entryKey]) => entryKey.trim().toLowerCase() === key.trim().toLowerCase(),
      );
      if (found?.[1]?.trim()) return found[1].trim();
    }
    return "";
  };

  return {
    itemType: overrides.itemType ?? pick("itemType", "Item Type"),
    metalType: overrides.metalType ?? pick("metalType", "Metal Type"),
    karat: overrides.karat ?? pick("karat", "Karat"),
    weightGrams: overrides.weightGrams ?? pick("weightGrams", "Weight (grams)", "Weight"),
    stoneType: overrides.stoneType ?? pick("stoneType", "Stone Type"),
    stoneCarat: overrides.stoneCarat ?? pick("stoneCarat", "Stone Carat"),
    hallmarkStamp: overrides.hallmarkStamp ?? pick("hallmarkStamp", "Hallmark/Stamp", "Hallmark"),
    condition: overrides.condition ?? pick("condition", "Condition"),
    appraisedValue: overrides.appraisedValue ?? pick("appraisedValue", "Appraised Value"),
  };
}

export function buildJewelryPersistEntries(
  values: Partial<Record<JewelryFormFieldKey, string>>,
): Array<{ label: string; value: string }> {
  return JEWELRY_FORM_FIELD_KEYS.map((key) => {
    const option = JEWELRY_FIELD_OPTIONS.find((field) => field.key === key);
    return {
      label: option?.persistLabel ?? key,
      value: String(values[key] ?? "").trim(),
    };
  }).filter((entry) => entry.value);
}

/** Default canvas positions when inserting the full jewelry block at once. */
export function jewelryFieldInsertLayout(
  startX = 40,
  startY = 380,
  rowHeight = 34,
): Array<{ key: JewelryFieldKey; label: string; x: number; y: number }> {
  return JEWELRY_FIELD_OPTIONS.map((field, index) => ({
    key: field.key,
    label: field.label,
    x: startX,
    y: startY + index * rowHeight,
  }));
}
