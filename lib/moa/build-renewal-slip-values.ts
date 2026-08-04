/** Map renew-transaction data → MOA field values for Pawn Renewal Slip (no sample hardcoding). */

import type { MoaDesignBlob } from "./design-blob";
import { cloneMoaDesignBlob } from "./design-blob";
import type { MoaFieldValueContext } from "./resolve-field-values";

export type RenewalSlipShopInfo = {
  shopName?: string;
  shopAddress?: string;
  phoneNumber?: string;
  email?: string;
};

export type RenewalSlipSource = {
  customerName: string;
  customerAddress?: string;
  contactNo?: string;
  idPresented?: string;
  unitCode: string;
  brandModel: string;
  serialNo?: string;
  itemsIncluded?: string;
  condition?: string;
  memory?: string;
  remarks?: string;
  category?: string;
  /** Original pawn / purchased date (display). */
  purchasedDate: string;
  /** Previous maturity before this renewal (display). */
  prevMaturityDate?: string;
  /** New maturity after renewal (display). */
  maturityDate?: string;
  /** New expiry after renewal (display). */
  expiryDate?: string;
  principalAmount: number;
  interestPaid: number;
  serviceFee?: number;
  otherCharges?: number;
  storageFee?: number | string;
  parkingFee?: number | string;
  periodsRenewed?: number;
  processedBy?: string;
  renewalSlipNo?: string;
  transactionNo?: string;
  /** Date/time shown on the slip (defaults to now when omitted). */
  dateTimeDisplay?: string;
  shop?: RenewalSlipShopInfo | null;
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

/** Build field context from live renew modal / inventory data. */
export function buildRenewalSlipFieldValues(
  source: RenewalSlipSource,
): MoaFieldValueContext {
  const principal = Number(source.principalAmount) || 0;
  const interestPaid = Number(source.interestPaid) || 0;
  const serviceFee = Number(source.serviceFee) || 0;
  const otherCharges = Number(source.otherCharges) || 0;
  const totalPaid = interestPaid + serviceFee + otherCharges;

  const storageFee =
    source.storageFee === undefined || source.storageFee === null
      ? ""
      : typeof source.storageFee === "number"
        ? formatMoney(source.storageFee)
        : displayText(String(source.storageFee));
  const parkingFee =
    source.parkingFee === undefined || source.parkingFee === null
      ? ""
      : typeof source.parkingFee === "number"
        ? formatMoney(source.parkingFee)
        : displayText(String(source.parkingFee));

  const customerName = displayText(source.customerName);
  const unitCode = displayText(source.unitCode);
  const brandModel = displayText(source.brandModel);
  const dateTime = formatDateTime(source.dateTimeDisplay);

  return {
    customerName,
    customerAddress: displayText(source.customerAddress),
    contactNo: displayText(source.contactNo),
    idPresented: displayText(source.idPresented),
    unitCode,
    purchasedDate: displayText(source.purchasedDate) || dateTime,
    maturityDate: displayText(source.maturityDate),
    expiryDate: displayText(source.expiryDate),
    sellerName: customerName,
    amount: formatMoney(principal),
    storageFee,
    parkingFee,
    netProceeds: formatMoney(principal),
    brandModel,
    itemsIncluded: displayText(source.itemsIncluded),
    condition: displayText(source.condition),
    serialNo: displayText(source.serialNo),
    memory: displayText(source.memory),
    remarks: displayText(source.remarks),
    shopName: displayText(source.shop?.shopName),
    shopAddress: displayText(source.shop?.shopAddress),
    phoneNumber: displayText(source.shop?.phoneNumber),
    email: displayText(source.shop?.email),
    processedBy: displayText(source.processedBy),
    renewalSlipNo: displayText(source.renewalSlipNo),
    transactionNo: displayText(source.transactionNo),
    prevMaturityDate: displayText(source.prevMaturityDate),
    interestPaid: formatMoney(interestPaid),
    serviceFee: formatMoney(serviceFee),
    otherCharges: formatMoney(otherCharges),
    totalAmountPaid: formatMoney(totalPaid),
    customValues: {
      renewalSlipNo: displayText(source.renewalSlipNo),
      transactionNo: displayText(source.transactionNo),
      prevMaturityDate: displayText(source.prevMaturityDate),
      purchasedDate: displayText(source.purchasedDate) || dateTime,
      interestPaid: formatMoney(interestPaid),
      serviceFee: formatMoney(serviceFee),
      otherCharges: formatMoney(otherCharges),
      totalAmountPaid: formatMoney(totalPaid),
      originalLoanAmount: formatMoney(principal),
      periodsRenewed:
        source.periodsRenewed != null ? String(source.periodsRenewed) : "",
    },
  };
}

const PAYMENT_ROW_ALIASES: Record<string, keyof MoaFieldValueContext | string> = {
  "original loan amount": "amount",
  "interest paid": "interestPaid",
  "service fee": "serviceFee",
  "other charges": "otherCharges",
  "total amount paid": "totalAmountPaid",
};

/**
 * Fill DESCRIPTION|AMOUNT table cells from renewal field values (by row label).
 * Leaves unknown labels unchanged.
 */
export function applyRenewalPaymentTableAmounts(
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
