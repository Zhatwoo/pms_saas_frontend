/** Map MOA canvas field keys → New Pawn form inputs. */

import type { MoaDesignBlob } from "./design-blob";
import { JEWELRY_FIELD_OPTIONS, JEWELRY_FORM_FIELD_KEYS } from "./jewelry-fields";

export type MoaFormFieldRequirement = {
  label: string;
  isBlank: () => boolean;
};

type UnitFieldKey = "brandModel" | "itemsIncluded" | "condition" | "serialNo" | "memory" | "remarks";
type FinancialFieldKey = "amount" | "storageFee" | "parkingFee" | "netProceeds";

export type VisibleMoaFormInput = {
  unitName: string;
  brand: string;
  model: string;
  serialNumber: string;
  itemsIncluded: string;
  condition: string;
  conditionSpecify: string;
  memory: string;
  remarks: string;
  amount: string;
  purchasedDate: string;
  itemType: string;
  metalType: string;
  karat: string;
  weightGrams: string;
  stoneType: string;
  stoneCarat: string;
  hallmarkStamp: string;
  customMoaValues: Record<string, string>;
};

export type BuildVisibleMoaFormRequirementsOptions = {
  form: VisibleMoaFormInput;
  usesCanvasFields: boolean;
  canvasFieldKeys: ReadonlySet<string>;
  canvasFieldLabels: ReadonlyMap<string, string>;
  activeUnitFields: readonly string[];
  activeFinancialFields: readonly string[];
  activeCustomFields: ReadonlyArray<{ id: string; label: string }>;
  activeMoaLabels: Record<string, string | undefined>;
  amountFieldLabel: string;
};

function isBlankText(value: string | undefined | null): boolean {
  return !String(value ?? "").trim();
}

function canvasLabel(
  canvasFieldLabels: ReadonlyMap<string, string>,
  activeMoaLabels: Record<string, string | undefined>,
  fieldKey: string,
  fallback: string,
): string {
  return canvasFieldLabels.get(fieldKey) ?? activeMoaLabels[fieldKey] ?? fallback;
}

function showUnitField(
  field: UnitFieldKey,
  usesCanvasFields: boolean,
  canvasFieldKeys: ReadonlySet<string>,
  activeUnitFields: readonly string[],
): boolean {
  return usesCanvasFields ? canvasFieldKeys.has(field) : activeUnitFields.includes(field);
}

function showFinancialField(
  field: FinancialFieldKey,
  usesCanvasFields: boolean,
  canvasFieldKeys: ReadonlySet<string>,
  activeFinancialFields: readonly string[],
): boolean {
  if (!usesCanvasFields) return activeFinancialFields.includes(field);
  if (field === "amount") return canvasHasAmountField(canvasFieldKeys);
  return canvasFieldKeys.has(field);
}

/** Required inputs that are currently visible on the New Pawn form (MOA-driven). */
export function buildVisibleMoaFormRequirements(
  options: BuildVisibleMoaFormRequirementsOptions,
): MoaFormFieldRequirement[] {
  const {
    form,
    usesCanvasFields,
    canvasFieldKeys,
    canvasFieldLabels,
    activeUnitFields,
    activeFinancialFields,
    activeCustomFields,
    activeMoaLabels,
    amountFieldLabel,
  } = options;

  const requirements: MoaFormFieldRequirement[] = [];
  const push = (label: string, isBlank: () => boolean) => {
    requirements.push({ label, isBlank });
  };

  if (showUnitField("brandModel", usesCanvasFields, canvasFieldKeys, activeUnitFields)) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "brandModel", "Item Description"), () =>
      isBlankText(form.unitName),
    );
  }

  if (usesCanvasFields && canvasFieldKeys.has("brand")) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "brand", "Brand"), () =>
      isBlankText(form.brand),
    );
  }

  if (usesCanvasFields && canvasFieldKeys.has("model")) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "model", "Model"), () =>
      isBlankText(form.model),
    );
  }

  for (const key of JEWELRY_FORM_FIELD_KEYS) {
    if (usesCanvasFields && canvasFieldKeys.has(key)) {
      const label =
        JEWELRY_FIELD_OPTIONS.find((field) => field.key === key)?.label ?? key;
      push(label, () => isBlankText(form[key]));
    }
  }

  if (showUnitField("serialNo", usesCanvasFields, canvasFieldKeys, activeUnitFields)) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "serialNo", "Serial Number"), () =>
      isBlankText(form.serialNumber),
    );
  }

  if (showUnitField("itemsIncluded", usesCanvasFields, canvasFieldKeys, activeUnitFields)) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "itemsIncluded", "Items Included"), () =>
      isBlankText(form.itemsIncluded),
    );
  }

  if (showUnitField("condition", usesCanvasFields, canvasFieldKeys, activeUnitFields)) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "condition", "Condition"), () => {
      if (isBlankText(form.condition)) return true;
      if (form.condition === "Others" && isBlankText(form.conditionSpecify)) return true;
      return false;
    });
  }

  if (showUnitField("memory", usesCanvasFields, canvasFieldKeys, activeUnitFields)) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "memory", "Memory / Storage"), () =>
      isBlankText(form.memory),
    );
  }

  if (showUnitField("remarks", usesCanvasFields, canvasFieldKeys, activeUnitFields)) {
    push(canvasLabel(canvasFieldLabels, activeMoaLabels, "remarks", "Remarks"), () =>
      isBlankText(form.remarks),
    );
  }

  for (const field of activeCustomFields) {
    push(field.label, () => isBlankText(form.customMoaValues[field.id]));
  }

  if (showFinancialField("amount", usesCanvasFields, canvasFieldKeys, activeFinancialFields)) {
    push(amountFieldLabel, () => !form.amount || Number(form.amount) <= 0);
  }

  const showPurchasedDate = !usesCanvasFields || canvasFieldKeys.has("purchasedDate");
  if (showPurchasedDate) {
    push(
      canvasLabel(canvasFieldLabels, activeMoaLabels, "purchasedDate", "Purchased Date"),
      () => isBlankText(form.purchasedDate),
    );
  }

  return requirements;
}

export function findFirstBlankMoaRequirement(
  requirements: MoaFormFieldRequirement[],
): MoaFormFieldRequirement | null {
  for (const requirement of requirements) {
    if (requirement.isBlank()) return requirement;
  }
  return null;
}

/** Filled automatically at print — no duplicate input on New Pawn. */
export const MOA_AUTO_FILLED_FIELD_KEYS = new Set([
  "unitCode",
  "agreementNo",
  "pawnTicketNo",
  "customerName",
  "customerAddress",
  "contactNo",
  "idPresented",
  "idNumber",
  "sellerName",
  "maturityDate",
  "expiryDate",
  "processedBy",
  "representedBy",
  "interestRate",
  "shopName",
  "shopAddress",
  "phoneNumber",
  "email",
  "signatureBlank",
  "signature",
  "witnessName",
  "renewalSlipNo",
  "transactionNo",
  "prevMaturityDate",
  "interestPaid",
  "serviceFee",
  "otherCharges",
  "totalAmountPaid",
  "agreementDay",
  "agreementMonth",
  "agreementYear",
  "agreementDate",
  "agreementDateLong",
]);

/** One loan amount input backs these canvas keys. */
export const MOA_AMOUNT_FIELD_KEYS = ["amount", "appraisedValue", "originalLoanAmount"] as const;

export function canvasFieldNeedsInput(fieldKey: string): boolean {
  return !MOA_AUTO_FILLED_FIELD_KEYS.has(fieldKey);
}

export function canvasHasAmountField(canvasFieldKeys: ReadonlySet<string>): boolean {
  return MOA_AMOUNT_FIELD_KEYS.some((key) => canvasFieldKeys.has(key));
}

export function collectCanvasFieldLabels(
  design?: MoaDesignBlob | null,
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const el of design?.elements ?? []) {
    if (el.kind !== "moaField" || !el.fieldKey) continue;
    const label = String(el.text ?? "")
      .replace(/:$/, "")
      .trim();
    if (label) map.set(el.fieldKey, label);
  }
  return map;
}

export function resolveAmountFieldLabel(
  canvasLabels: ReadonlyMap<string, string>,
  fallbackLabels: Record<string, string | undefined>,
  canvasFieldKeys: ReadonlySet<string>,
): string {
  if (canvasFieldKeys.has("appraisedValue")) {
    return (
      canvasLabels.get("appraisedValue") ??
      fallbackLabels.amount ??
      "Declared / Appraised Value"
    );
  }
  if (canvasFieldKeys.has("originalLoanAmount")) {
    return canvasLabels.get("originalLoanAmount") ?? fallbackLabels.amount ?? "Loan Amount";
  }
  return canvasLabels.get("amount") ?? fallbackLabels.amount ?? "Amount";
}
