"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { TransactionActions } from "./_components/transaction-actions";
import { api } from "@/lib/api";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import { RenewModal } from "./_components/renew-modal";
import { NewPawnModal } from "./_components/new-pawn-modal";
import { BuyBackModal } from "./_components/buy-back-modal";
import { SalesTransferModal } from "./_components/sales-transfer-modal";
import { MoaModal } from "./_components/moa-modal";
import { DailyBalanceConfirmation } from "@/components/shared/daily-balance-confirmation";
import { TransactionDetailsModal } from "@/components/shared/transaction-details-modal";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";

type PurposeType =
  | "Start"
  | "Buy Back"
  | "Renew"
  | "Sold Item"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer";

type FilterType = "All" | "Renew" | "Sales / Transfer" | "Buy Back";

const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Sales / Transfer": "Sold Item",
  "Buy Back": "Buy Back",
};

interface TransactionRow {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
  details: string;
  date: string;
  time: string;
  cashIn: string;
  cashOut: string;
  returnVal: string;
  unit: string;
  unitCode: string;
  pawn: string;
  storage: string;
  customerName?: string;
  customerAddress?: string;
  profilePhoto?: string;
  idPhoto?: string;
  relatedPawnedItemId?: string | null;
  relatedSaleItemId?: string | null;
}

interface ApiTransaction {
  transaction_no: string;
  branch: string | null;
  purpose: string;
  details?: string | null;
  transaction_date: string;
  transaction_time: string;
  cash_in: number | string | null;
  cash_out: number | string | null;
  return_amount?: number | string | null;
  unit: string | null;
  unit_code: string | null;
  pawn_amount?: number | string | null;
  storage_fee?: number | string | null;
  profile_photo?: string | null;
  id_photo?: string | null;
  related_pawned_item_id?: string | null;
  related_sale_item_id?: string | null;
}

interface TransactionsResponse {
  stats?: typeof DEFAULT_STATS;
  transactions: ApiTransaction[];
}

const DEFAULT_STATS = {
  pawnedToday: 0,
  buyBack: 0,
  renewed: 0,
  soldItem: 0,
  startingBalance: 0,
  endingBalance: 0,
};

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  return {
    transactionNo: transaction.transaction_no,
    branch: transaction.branch ?? "",
    purpose: transaction.purpose as PurposeType,
    details: transaction.details ?? "",
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    cashIn: String(transaction.cash_in ?? 0),
    cashOut: String(transaction.cash_out ?? 0),
    returnVal: String(transaction.return_amount ?? 0),
    unit: transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: String(transaction.pawn_amount ?? 0),
    storage: String(transaction.storage_fee ?? 0),
    customerName: (transaction as any).pawned_item?.customer?.full_name,
    customerAddress: (transaction as any).pawned_item?.customer?.address,
    profilePhoto: transaction.profile_photo ?? undefined,
    idPhoto: transaction.id_photo ?? undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
  };
}

export default function EmployeePawnTransactionsPage() {
  const { selectedBranch, branches, canSwitchBranch } = useBranch();
  const { user } = useAuth();
  const [branchAdminName, setBranchAdminName] = useState("");
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isNewPawnModalOpen, setIsNewPawnModalOpen] = useState(false);
  const [isBuyBackModalOpen, setIsBuyBackModalOpen] = useState(false);
  const [isSalesTransferModalOpen, setIsSalesTransferModalOpen] = useState(false);
  const [isMoaReprintOpen, setIsMoaReprintOpen] = useState(false);
  const [reprintData, setReprintData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
    startingBalance: 0, endingBalance: 0,
  });
  const [allTransactions, setAllTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; type: "starting" | "ending" }>({
    open: false,
    type: "starting",
  });
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; onConfirm: () => void }>({
    open: false,
    onConfirm: () => { },
  });

  useEffect(() => {
    async function fetchTransactions() {
      if (selectedBranch.id === "__all__" && !canSwitchBranch) return;

      setIsLoading(true);
      try {
        const data = await api.get<TransactionsResponse>(`/transactions?branch=${encodeURIComponent(selectedBranch.id)}`);
        if (data) {
          setCurrentStats(data.stats || {
            pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
            startingBalance: 0, endingBalance: 0,
          });
          setAllTransactions((data.transactions || []).map(toTransactionRow));
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [selectedBranch]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "All") return allTransactions;
    const targetPurpose = filterToPurpose[activeFilter];
    if (!targetPurpose) return allTransactions;
    return allTransactions.filter((t) => t.purpose === targetPurpose);
  }, [allTransactions, activeFilter]);

  useEffect(() => {
    async function fetchBranchAdmin() {
      if (!selectedBranch.id || selectedBranch.id === "__all__") return;
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) return;

      try {
        const data = await api.get<{ users?: { fullName: string; role: string }[]; fullName?: string; role?: string }[]>(
          `/users?branchId=${selectedBranch.id}&role=admin`
        );
        const admins = Array.isArray(data) ? data : [];
        const admin = admins.find((u) => u.role === "admin");
        if (admin?.fullName) setBranchAdminName(admin.fullName);
      } catch {
        // silently fail — admin name stays blank
      }
    }
    void fetchBranchAdmin();
  }, [selectedBranch.id, user]);

  const handleExportCSV = useCallback(() => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Transaction #", "Purpose", "Details", "Date", "Time", "Cash In", "Cash Out", "Return", "Unit", "Unit Code", "Pawn", "Storage"];
    const rows = filteredTransactions.map((r) =>
      [r.transactionNo, r.purpose, r.details, r.date, r.time, r.cashIn, r.cashOut, r.returnVal, r.unit, r.unitCode, r.pawn, r.storage].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${selectedBranch.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions, selectedBranch]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const openNewPawnForm = useCallback(() => {
    setIsNewPawnModalOpen(true);
  }, []);

  const openBuyBackForm = useCallback(() => {
    setIsBuyBackModalOpen(true);
  }, []);

  const handleActionWithPassword = (action: () => void) => {
    setPasswordModal({
      open: true,
      onConfirm: action,
    });
  };

  const handleReprint = useCallback((transactionNo: string) => {
    const tx = allTransactions.find(t => t.transactionNo === transactionNo);
    if (!tx) return;
    
    const branchInfo = branches.find(b => b.name === tx.branch);
    const names = (tx.customerName || "WALK-IN CUSTOMER").split(" ");
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(" ") : "---";

    setReprintData({
      firstName: firstName,
      middleName: "",
      lastName: lastName,
      address: tx.customerAddress || "---",
      contactNo: "---",
      unitCode: tx.unitCode,
      unitName: tx.unit,
      category: "---",
      serialNumber: "---",
      itemsIncluded: "---",
      condition: "---",
      remarks: "---",
      amount: tx.pawn,
      storageFee: tx.storage,
      purchasedDate: tx.date,
      idPresented: "---",
      branchName: tx.branch,
      branchAddress: branchInfo?.location || "",
      branchPhone: branchInfo?.phone || ""
    });
    setIsMoaReprintOpen(true);
  }, [allTransactions]);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-900 leading-tight">Transactions</h1>
        </div>
      </div>

      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onRenewClick={() => handleActionWithPassword(() => setIsRenewModalOpen(true))}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
        onNewPawn={() => handleActionWithPassword(openNewPawnForm)}
        onBuyBack={() => handleActionWithPassword(openBuyBackForm)}
        onSalesTransfer={() => handleActionWithPassword(() => setIsSalesTransferModalOpen(true))}
        onStartDay={() => setBalanceModal({ open: true, type: "starting" })}
        onEndDay={() => setBalanceModal({ open: true, type: "ending" })}
      />

            <TransactionTable data={filteredTransactions} onReprint={handleReprint} onViewDetails={setSelectedTransaction} />

            <TransactionDetailsModal
              isOpen={Boolean(selectedTransaction)}
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
            />

      <DailyBalanceConfirmation
        isOpen={balanceModal.open}
        type={balanceModal.type}
        currentCash={balanceModal.type === "starting" ? "10000" : "25000"}
        onClose={() => setBalanceModal((p) => ({ ...p, open: false }))}
        onConfirm={(amt) => {
          console.log(`Employee confirmed ${balanceModal.type} cash:`, amt);
          setBalanceModal((p) => ({ ...p, open: false }));
        }}
      />

      <ConfirmPasswordModal
        isOpen={passwordModal.open}
        onClose={() => setPasswordModal((p) => ({ ...p, open: false }))}
        onConfirm={async (password) => {
          try {
            await api.post("/auth/verify-password", { password });
            passwordModal.onConfirm();
            return true;
          } catch (err) {
            return false;
          }
        }}
      />

      <RenewModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        branchName={selectedBranch.name}
      />

      <NewPawnModal
        isOpen={isNewPawnModalOpen}
        onClose={() => setIsNewPawnModalOpen(false)}
        branchId={selectedBranch.id}
        branchName={selectedBranch.name}
        branchAddress={selectedBranch.location}
        branchPhone={selectedBranch.phone}
        branchAdminName={branchAdminName}
        loggedInUserName={user?.fullName}
      />

      <BuyBackModal
        isOpen={isBuyBackModalOpen}
        onClose={() => setIsBuyBackModalOpen(false)}
        branchName={selectedBranch.name}
      />

      <SalesTransferModal
        isOpen={isSalesTransferModalOpen}
        onClose={() => setIsSalesTransferModalOpen(false)}
        branchName={selectedBranch.name}
      />

      {reprintData && (
        <MoaModal
          isOpen={isMoaReprintOpen}
          onClose={() => setIsMoaReprintOpen(false)}
          onConfirm={() => setIsMoaReprintOpen(false)}
          data={reprintData}
          isLoading={false}
        />
      )}
    </div>
  );
}
