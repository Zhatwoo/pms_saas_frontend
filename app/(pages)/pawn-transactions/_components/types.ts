export type PurposeType =
  | "Start"
  | "Buy Back"
  | "Buy Out"
  | "Renew"
  | "Sold Item"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer";

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
  customerAddress: string;
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
  serialNumber?: string;
  itemsIncluded?: string;
  condition?: string;
  category?: string;
  memoryStorage?: string;
  remarks?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
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
  "Pawn",
  "Renew",
  "Buy Back",
  "Buy Out",
  "Sold Item",
  "Fund Transfer",
  "Cash Transfer",
];
