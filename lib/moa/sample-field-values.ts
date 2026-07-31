/** Sample field values for Settings MOA view-only preview (mirrors New Pawn). */

import type { MoaFieldValueContext } from "./resolve-field-values";

export type MoaShopPreviewInfo = {
  shopName?: string;
  shopAddress?: string;
  phoneNumber?: string;
  email?: string;
};

/** Demo customer / ticket values so Edit Mode preview matches New Pawn layout. */
export function createSampleMoaFieldValues(
  shop: MoaShopPreviewInfo = {},
): MoaFieldValueContext {
  const today = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  const maturity = new Date(today);
  maturity.setDate(maturity.getDate() + 10);
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 34);

  return {
    customerName: "JUAN DELA CRUZ",
    customerAddress: "123 Sample St., Quezon City",
    contactNo: "0917 000 0000",
    idPresented: "PhilSys / Driver's License",
    unitCode: "SAMPLE-001",
    purchasedDate: fmt(today),
    maturityDate: fmt(maturity),
    expiryDate: fmt(expiry),
    sellerName: "JUAN DELA CRUZ",
    amount: "₱10,000.00",
    storageFee: "₱200.00",
    parkingFee: "₱0.00",
    netProceeds: "₱10,000.00",
    brandModel: "Sample Brand / Model",
    itemsIncluded: "Charger, Box",
    condition: "Good",
    serialNo: "SN-SAMPLE-12345",
    memory: "128GB",
    remarks: "Preview sample — not a real transaction",
    shopName: shop.shopName || "Shop Name",
    shopAddress: shop.shopAddress || "",
    phoneNumber: shop.phoneNumber || "",
    email: shop.email || "",
    processedBy: "MARIA SANTOS",
  };
}
