/** Map buy-back transaction data → MOA field values for Buy Back Slip. */

import type { MoaDesignBlob } from "./design-blob";
import { cloneMoaDesignBlob } from "./design-blob";
import type { MoaFieldValueContext } from "./resolve-field-values";

export type BuyBackSlipShopInfo = {
  shopName?: string;
  shopAddress?: string;
  phoneNumber?: string;
  email?: string;
};

export type BuyBackSlipSource = {
  customerName: string;
  customerAddress?: string;
  contactNo?: string;
  idPresented?: string;
  unitCode: string;
  brandModel: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  condition?: string;
  category?: string;
  /** Original pawn date (display). */
  pawnDate?: string;
  originalLoanAmount: number;
  buyBackPrice: number;
  processingFee?: number;
  otherCharges?: number;
  processedBy?: string;
  buyBackSlipNo?: string;
  /** Date/time shown on the slip (defaults to now when omitted). */
  dateTimeDisplay?: string;
  shop?: BuyBackSlipShopInfo | null;
};

function displayText(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "---" || raw === "—") return "";
  return raw;
}

function formatMoney(value: number | string | null | undefined): string {
  const n =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n)) return "";
  return `₱ ${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value?: string): string {
  if (value && displayText(value)) return displayText(value);
  return new Date().toLocaleString("en-PH", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build field context from live buy-back modal data. */
export function buildBuyBackSlipFieldValues(
  source: BuyBackSlipSource,
): MoaFieldValueContext {
  const originalLoan = Number(source.originalLoanAmount) || 0;
  const buyBackPrice = Number(source.buyBackPrice) || 0;
  const processingFee = Number(source.processingFee) || 0;
  const otherCharges = Number(source.otherCharges) || 0;
  const totalPaid = buyBackPrice + processingFee + otherCharges;

  const customerName = displayText(source.customerName);
  const unitCode = displayText(source.unitCode);
  const brandModel = displayText(source.brandModel);
  const dateTime = formatDateTime(source.dateTimeDisplay);
  const slipNo =
    displayText(source.buyBackSlipNo) ||
    (unitCode ? `BB-${unitCode}` : "");

  return {
    customerName,
    customerAddress: displayText(source.customerAddress),
    contactNo: displayText(source.contactNo),
    idPresented: displayText(source.idPresented),
    unitCode,
    purchasedDate: displayText(source.pawnDate) || dateTime,
    maturityDate: "",
    expiryDate: "",
    sellerName: customerName,
    amount: formatMoney(originalLoan),
    storageFee: "",
    parkingFee: "",
    netProceeds: formatMoney(buyBackPrice),
    brandModel,
    brand: displayText(source.brand),
    model: displayText(source.model),
    itemsIncluded: "",
    condition: displayText(source.condition),
    serialNo: displayText(source.serialNo),
    memory: "",
    remarks: "",
    shopName: displayText(source.shop?.shopName),
    shopAddress: displayText(source.shop?.shopAddress),
    phoneNumber: displayText(source.shop?.phoneNumber),
    email: displayText(source.shop?.email),
    processedBy: displayText(source.processedBy),
    buyBackSlipNo: slipNo,
    buyBackPrice: formatMoney(buyBackPrice),
    processingFee: formatMoney(processingFee),
    otherCharges: formatMoney(otherCharges),
    totalAmountPaid: formatMoney(totalPaid),
    customValues: {
      buyBackSlipNo: slipNo,
      pawnTicketNo: unitCode,
      purchasedDate: dateTime,
      buyBackPrice: formatMoney(buyBackPrice),
      processingFee: formatMoney(processingFee),
      otherCharges: formatMoney(otherCharges),
      totalAmountPaid: formatMoney(totalPaid),
      originalLoanAmount: formatMoney(originalLoan),
    },
  };
}

const PAYMENT_ROW_ALIASES: Record<string, keyof MoaFieldValueContext | string> = {
  "buy back price": "buyBackPrice",
  "processing fee (if any)": "processingFee",
  "processing fee": "processingFee",
  "other charges": "otherCharges",
  "total amount paid": "totalAmountPaid",
};

/**
 * Fill DESCRIPTION|AMOUNT table cells from buy-back field values (by row label).
 */
export function applyBuyBackPaymentTableAmounts(
  design: MoaDesignBlob,
  values: MoaFieldValueContext,
): MoaDesignBlob {
  const next = cloneMoaDesignBlob(design);
  const lookup = (label: string): string => {
    const key = PAYMENT_ROW_ALIASES[label.trim().toLowerCase()];
    if (!key) return "";
    const fromCustom = values.customValues?.[key];
    if (fromCustom && String(fromCustom).trim()) return String(fromCustom);
    const direct = (values as Record<string, unknown>)[key];
    return typeof direct === "string" ? direct : "";
  };

  next.elements = next.elements.map((el) => {
    if (el.kind !== "table" || !Array.isArray(el.tableData) || el.tableData.length < 2) {
      return el;
    }
    const tableData = el.tableData.map((row, rowIndex) => {
      if (!Array.isArray(row) || row.length < 2) return row;
      if (rowIndex === 0) return row;
      const label = String(row[0] ?? "");
      const amount = lookup(label);
      if (!amount) return row;
      return [row[0], amount, ...row.slice(2)];
    });
    return { ...el, tableData };
  });

  return next;
}
