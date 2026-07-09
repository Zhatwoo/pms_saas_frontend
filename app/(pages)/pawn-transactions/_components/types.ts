export type PurposeType =
  | "Start"
  | "End"
  | "Pawn"
  | "Redeem"
  | "Buy Back"
  | "Renew"
  | "Reappraise"
  | "Buy Out"
  | "Sold Item"
  | "Reserve / Layaway"
  | "Fund Transfer"
  | "Cash Transfer"
  | "Transfer Item";

export type TransactionPurposeFilter = "All" | PurposeType;

export interface TransactionBranchOption {
  id: string;
  name: string;
}

export interface TransactionRow {
  id: string;
  transactionNo: string;
  branchId: string;
  branch: string;
  purpose: PurposeType;
  details: string;
  customerName: string;
  createdByName?: string;
  createdByRole?: string;
  customerAddress: string;
  customerBarangay?: string;
  customerCity?: string;
  customerRegion?: string;
  customerPhone?: string;
  customerMiddleName?: string;
  idPresented?: string;
  date: string;
  time: string;
  buyBack: string;
  percentage: string;
  buyOut: string;
  sold: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  notes: string;
  qrCode?: string;
  qr_code?: string;
  serialNumber?: string;
  itemsIncluded?: string;
  condition?: string;
  category?: string;
  memoryStorage?: string;
  remarks?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
  idPhoto?: string;
  buyback_proof?: string | null;
}

export interface TransactionStatsData {
  pawnedToday: number;
  buyBack: number;
  renewed: number;
  soldItem: number;
  startingBalance: number;
  endingBalance: number;
}

export const PURPOSE_OPTIONS: PurposeType[] = [
  "Start",
  "End",
  "Pawn",
  "Redeem",
  "Buy Back",
  "Renew",
  "Reappraise",
  "Buy Out",
  "Sold Item",
  "Reserve / Layaway",
  "Fund Transfer",
  "Cash Transfer",
  "Transfer Item",
];
