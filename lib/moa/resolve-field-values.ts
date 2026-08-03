/** Resolve MOA canvas fieldKey / header fields from New Pawn + shop data. */

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
  itemsIncluded: string;
  condition: string;
  serialNo: string;
  memory: string;
  remarks: string;
  shopName: string;
  shopAddress: string;
  phoneNumber: string;
  email: string;
  /** Employee who processed the transaction (fills representative/processed-by fields). */
  processedBy?: string;
  customValues?: Record<string, string>;
};

export function resolveMoaFieldValue(
  fieldKey: string,
  ctx: MoaFieldValueContext,
): string {
  if (ctx.customValues?.[fieldKey]) return ctx.customValues[fieldKey];

  const map: Record<string, string> = {
    customerName: ctx.customerName,
    customerAddress: ctx.customerAddress,
    contactNo: ctx.contactNo,
    idPresented: ctx.idPresented,
    unitCode: ctx.unitCode,
    purchasedDate: ctx.purchasedDate,
    maturityDate: ctx.maturityDate,
    expiryDate: ctx.expiryDate,
    sellerName: ctx.sellerName,
    amount: ctx.amount,
    storageFee: ctx.storageFee,
    parkingFee: ctx.parkingFee,
    netProceeds: ctx.netProceeds,
    brandModel: ctx.brandModel,
    itemsIncluded: ctx.itemsIncluded,
    condition: ctx.condition,
    serialNo: ctx.serialNo,
    memory: ctx.memory,
    remarks: ctx.remarks,
    shopName: ctx.shopName,
    shopAddress: ctx.shopAddress,
    phoneNumber: ctx.phoneNumber,
    email: ctx.email,
    processedBy: ctx.processedBy ?? "",
    representedBy: ctx.processedBy ?? "",
  };

  const value = map[fieldKey];
  return value && String(value).trim() ? String(value) : "—";
}
