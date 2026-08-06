/** Resolve MOA canvas fieldKey / header fields from New Pawn + shop data. */

import { JEWELRY_FIELD_OPTIONS } from "./jewelry-fields";

function resolveCustomFieldValue(
  fieldKey: string,
  customValues?: Record<string, string>,
): string | undefined {
  if (!customValues) return undefined;

  const direct = customValues[fieldKey];
  if (direct != null && String(direct).trim()) return String(direct).trim();

  const jewelry = JEWELRY_FIELD_OPTIONS.find((field) => field.key === fieldKey);
  if (jewelry) {
    const byLabel = customValues[jewelry.persistLabel];
    if (byLabel != null && String(byLabel).trim()) return String(byLabel).trim();
  }

  const caseInsensitive = Object.entries(customValues).find(
    ([key]) => key.trim().toLowerCase() === fieldKey.trim().toLowerCase(),
  );
  if (caseInsensitive?.[1]?.trim()) return caseInsensitive[1].trim();

  return undefined;
}

export type MoaFieldValueContext = {
  customerName: string;
  customerAddress: string;
  contactNo: string;
  idPresented: string;
  unitCode: string;
  purchasedDate: string;
  maturityDate: string;
  expiryDate: string;
  sellerName: string;
  amount: string;
  storageFee: string;
  parkingFee: string;
  netProceeds: string;
  brandModel: string;
  brand?: string;
  model?: string;
  itemsIncluded: string;
  condition: string;
  serialNo: string;
  memory: string;
  remarks: string;
  itemType?: string;
  metalType?: string;
  karat?: string;
  weightGrams?: string;
  stoneType?: string;
  stoneCarat?: string;
  hallmarkStamp?: string;
  shopName: string;
  shopAddress: string;
  phoneNumber: string;
  email: string;
  /** Employee who processed the transaction (fills representative/processed-by fields). */
  processedBy?: string;
  /** Display interest rate, e.g. "5% / 10 days". */
  interestRate?: string;
  /** Optional ID number from form custom fields. */
  idNumber?: string;
  /** Optional witness name (blank line if omitted). */
  witnessName?: string;
  /** Pawn Renewal Slip — slip / transaction identifiers. */
  renewalSlipNo?: string;
  transactionNo?: string;
  /** Maturity before the current renewal. */
  prevMaturityDate?: string;
  /** Renewal payment breakdown (also used to fill payment tables). */
  interestPaid?: string;
  serviceFee?: string;
  otherCharges?: string;
  totalAmountPaid?: string;
  customValues?: Record<string, string>;
};

function splitBrandModel(
  brandModel: string,
  explicitBrand?: string,
  explicitModel?: string,
): { brand: string; model: string } {
  const brand = String(explicitBrand ?? "").trim();
  const model = String(explicitModel ?? "").trim();
  if (brand || model) return { brand, model };

  const raw = String(brandModel || "").trim();
  if (!raw || raw === "—" || raw === "---") return { brand: "", model: "" };
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return { brand: parts[0], model: parts[0] };
  return { brand: parts[0], model: parts.slice(1).join(" ") };
}

function agreementDateParts(purchasedDate: string): {
  agreementDay: string;
  agreementMonth: string;
  agreementYear: string;
  agreementDate: string;
  agreementDateLong: string;
} {
  const d = purchasedDate ? new Date(purchasedDate) : new Date();
  const valid = !Number.isNaN(d.getTime()) ? d : new Date();
  const day = String(valid.getDate());
  const month = valid.toLocaleDateString("en-US", { month: "long" });
  const year = String(valid.getFullYear());
  const agreementDate = valid.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return {
    agreementDay: day,
    agreementMonth: month,
    agreementYear: year,
    agreementDate,
    agreementDateLong: `${day} day of ${month}, ${year}`,
  };
}

/** Build the flat lookup map (includes PDF-template aliases). */
export function buildMoaFieldMap(
  ctx: MoaFieldValueContext,
): Record<string, string> {
  const { brand, model } = splitBrandModel(ctx.brandModel, ctx.brand, ctx.model);
  const composedBrandModel =
    ctx.brandModel ||
    [brand, model].filter(Boolean).join(" ").trim();
  const dateParts = agreementDateParts(ctx.purchasedDate);
  const ticket = ctx.unitCode;
  const rep = ctx.processedBy ?? "";

  return {
    customerName: ctx.customerName,
    customerAddress: ctx.customerAddress,
    contactNo: ctx.contactNo,
    idPresented: ctx.idPresented,
    unitCode: ticket,
    purchasedDate: ctx.purchasedDate,
    maturityDate: ctx.maturityDate,
    expiryDate: ctx.expiryDate,
    sellerName: ctx.sellerName,
    amount: ctx.amount,
    storageFee: ctx.storageFee,
    parkingFee: ctx.parkingFee,
    netProceeds: ctx.netProceeds,
    brandModel: composedBrandModel,
    itemsIncluded: ctx.itemsIncluded,
    condition: ctx.condition,
    serialNo: ctx.serialNo,
    memory: ctx.memory,
    remarks: ctx.remarks,
    itemType: ctx.itemType ?? "",
    metalType: ctx.metalType ?? "",
    karat: ctx.karat ?? "",
    weightGrams: ctx.weightGrams ?? "",
    stoneType: ctx.stoneType ?? "",
    stoneCarat: ctx.stoneCarat ?? "",
    hallmarkStamp: ctx.hallmarkStamp ?? "",
    shopName: ctx.shopName,
    shopAddress: ctx.shopAddress,
    phoneNumber: ctx.phoneNumber,
    email: ctx.email,
    processedBy: rep,
    representedBy: rep,
    interestRate: ctx.interestRate ?? "",
    idNumber: ctx.idNumber ?? "",
    witnessName: ctx.witnessName ?? "",
    renewalSlipNo: ctx.renewalSlipNo ?? "",
    transactionNo: ctx.transactionNo ?? "",
    prevMaturityDate: ctx.prevMaturityDate ?? "",
    interestPaid: ctx.interestPaid ?? "",
    serviceFee: ctx.serviceFee ?? "",
    otherCharges: ctx.otherCharges ?? "",
    totalAmountPaid: ctx.totalAmountPaid ?? "",
    signatureBlank: "",
    signature: "",
    // PDF / General MOA aliases
    agreementNo: ticket,
    pawnTicketNo: ticket,
    brand,
    model,
    appraisedValue: ctx.customValues?.appraisedValue || ctx.amount,
    originalLoanAmount: ctx.amount,
    ...dateParts,
  };
}

export function resolveMoaFieldValue(
  fieldKey: string,
  ctx: MoaFieldValueContext,
): string {
  const custom = resolveCustomFieldValue(fieldKey, ctx.customValues);
  if (custom) return custom;

  const map = buildMoaFieldMap(ctx);
  const value = map[fieldKey];
  // Signature line + optional witness stay blank (underline only), not "—"
  if (
    fieldKey === "signatureBlank" ||
    fieldKey === "signature" ||
    fieldKey === "witnessName"
  ) {
    return value && String(value).trim() ? String(value) : "\u00A0";
  }
  return value && String(value).trim() ? String(value) : "—";
}

/** Replace `{{fieldKey}}` tokens in static body/text copy.
 *  Also fills the common legacy blank date sentence from older templates. */
export function fillMoaPlaceholders(
  text: string,
  ctx: MoaFieldValueContext,
): string {
  if (!text) return text;
  let out = text;
  if (out.includes("{{")) {
    out = out.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      const value = resolveMoaFieldValue(key, ctx);
      return value === "—" ? "____" : value;
    });
  }
  // Older saved templates still use underscore blanks for the agreement date.
  if (/day of _{3,}/i.test(out)) {
    const parts = agreementDateParts(ctx.purchasedDate);
    out = out.replace(
      /on the _{2,}\s*day of _{3,},?\s*20_{2,}/gi,
      `on the ${parts.agreementDay} day of ${parts.agreementMonth}, ${parts.agreementYear}`,
    );
  }
  return out;
}
