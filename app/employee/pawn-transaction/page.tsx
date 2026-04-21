"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TransactionActions } from "./_components/transaction-actions";
import { api } from "@/lib/api";
import { PaginationFooter } from "@/components/shared/pagination";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable } from "./_components/transaction-table";
import { RenewModal } from "./_components/renew-modal";
import { NewPawnModal } from "./_components/new-pawn-modal";
import { RedeemModal } from "./_components/redeem-modal";
import { BuyBackModal } from "./_components/buy-back-modal";
import { SalesTransferModal } from "./_components/sales-transfer-modal";
import { MoaModal } from "./_components/moa-modal";
import { DailyBalanceConfirmation } from "@/components/shared/daily-balance-confirmation";
import { TransactionDetailsModal } from "@/components/shared/transaction-details-modal";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";
import { Role } from "@/types";
import { calculateGadgetInterest } from "@/lib/interest";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type PurposeType =
  | "Start"
  | "Buy Back"
  | "Renew"
  | "Sold Item"
  | "Pawn"
  | "Fund Transfer"
  | "Cash Transfer";

type FilterType = "All" | "Renew" | "Sales / Transfer" | "Redeem" | "Buy Back";

const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Sales / Transfer": "Sold Item",
  "Redeem": "Pawn",
  "Buy Back": "Buy Back",
};

interface TransactionRow {
  transactionNo: string;
  purpose: PurposeType;
  buyBack: string;
  percentage: string;
  buyOut: string;
  sold: string;
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
  qr_code?: string | null;
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
  redeemed: 0,
  transfer: 0,
  startingBalance: 0,
  endingBalance: 0,
};

// Shared logic imported from @/lib/interest.ts

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  const pawnAmount = Number(transaction.pawn_amount || 0);
  const calculations = calculateGadgetInterest(pawnAmount, transaction.transaction_date);

  // If already a Buy Back transaction, use its actual cash_in as historical value
  // Otherwise, if it's an active Pawn, show the current projected interest
  const isBuyBackAction = transaction.purpose === "Buy Back";
  const isPawnAction = transaction.purpose === "Pawn";

  return {
    transactionNo: transaction.transaction_no,
    purpose: transaction.purpose as PurposeType,
    buyBack: isBuyBackAction 
      ? String(transaction.cash_in ?? 0) 
      : "0",
    percentage: isBuyBackAction || isPawnAction ? String(calculations.percentage) : "0",
    buyOut: "0",
    sold: transaction.purpose === "Sold Item" ? String(transaction.cash_in ?? 0) : "0",
    date: transaction.transaction_date,
    time: transaction.transaction_time,
    cashIn: isPawnAction ? "0" : String(transaction.cash_in ?? 0),
    cashOut: (isBuyBackAction || transaction.purpose === "Sold Item") 
      ? "0" 
      : String(transaction.cash_out ?? 0),
    returnVal: String(transaction.return_amount ?? 0),
    unit: transaction.unit ?? "",
    unitCode: transaction.unit_code ?? "",
    pawn: String(transaction.pawn_amount ?? 0),
    storage: String(transaction.storage_fee ?? 0),
    customerName: (transaction as any).pawned_item?.customer?.full_name,
    customerAddress: (transaction as any).pawned_item?.customer?.address,
    qrCode: (transaction as any).pawned_item?.qr_code || (transaction as any).pawned_item?.[0]?.qr_code || undefined,
    serialNumber: (transaction as any).pawned_item?.serial_number,
    itemsIncluded: (transaction as any).pawned_item?.items_included,
    condition: (transaction as any).pawned_item?.condition,
    category: (transaction as any).pawned_item?.category,
    memoryStorage: (transaction as any).pawned_item?.memory_storage,
    remarks: (transaction as any).pawned_item?.remarks,
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
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isBuyBackModalOpen, setIsBuyBackModalOpen] = useState(false);
  const [isSalesTransferModalOpen, setIsSalesTransferModalOpen] = useState(false);
  const [isMoaReprintOpen, setIsMoaReprintOpen] = useState(false);
  const [reprintData, setReprintData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const [currentStats, setCurrentStats] = useState({
    pawnedToday: 0, 
    buyBack: 0, 
    renewed: 0, 
    soldItem: 0,
    redeemed: 0,
    transfer: 0,
    startingBalance: 0, 
    endingBalance: 0,
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
  const [viewRange, setViewRange] = useState<"daily" | "weekly" | "monthly" | "all">("daily");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    if (selectedBranch.id === "__all__" && !canSwitchBranch) return;

    setIsLoading(true);
    try {
      const data = await api.get<TransactionsResponse>(
        `/transactions?branch=${encodeURIComponent(selectedBranch.id)}&range=${viewRange}`
      );
      if (data) {
        setCurrentStats(data.stats || {
          pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
          redeemed: 0, transfer: 0,
          startingBalance: 0, endingBalance: 0,
        });
        setAllTransactions((data.transactions || []).map(toTransactionRow));
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, viewRange, canSwitchBranch]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const fetchTransactionsRef = useRef(fetchTransactions);
  useEffect(() => {
    fetchTransactionsRef.current = fetchTransactions;
  }, [fetchTransactions]);

  // Realtime subscription for transactions table
  useEffect(() => {
    if (selectedBranch.id === "__all__") return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channelName = `transactions-live-${selectedBranch.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "transactions"
        },
        (payload) => {
          console.log("[Transactions] Realtime event received:", payload);
          const newTx = payload.new as any;
          if (newTx && newTx.branch_id === selectedBranch.id) {
            void fetchTransactionsRef.current();
          } else if (payload.eventType === "DELETE") {
             void fetchTransactionsRef.current();
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Transactions] Realtime subscription status:`, status);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedBranch.id]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "All") return allTransactions;
    const targetPurpose = filterToPurpose[activeFilter];
    if (!targetPurpose) return allTransactions;
    return allTransactions.filter((t) => t.purpose === targetPurpose);
  }, [allTransactions, activeFilter]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredTransactions, currentPage]);

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
    const headers = ["Transaction #", "Purpose", "Date", "Time", "Buy Back", "Buy Out", "Sold", "Cash In", "Cash Out", "Return", "Unit", "Unit Code", "Pawn", "Storage"];
    const rows = filteredTransactions.map((r) =>
      [r.transactionNo, r.purpose, r.date, r.time, r.buyBack, r.buyOut, r.sold, r.cashIn, r.cashOut, r.returnVal, r.unit, r.unitCode, r.pawn, r.storage].join(",")
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
    
    const branchInfo = branches.find(b => b.id === selectedBranch.id);
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
      category: tx.category || "---",
      serialNumber: tx.serialNumber || "---",
      itemsIncluded: tx.itemsIncluded || "---",
      condition: tx.condition || "---",
      memory: tx.memoryStorage || "---",
      remarks: tx.remarks || "---",
      amount: tx.pawn,
      storageFee: tx.storage,
      purchasedDate: tx.date,
      idPresented: "---",
      branchName: selectedBranch.name,
      branchAddress: branchInfo?.location || "",
      branchPhone: branchInfo?.phone || ""
    });
    setIsMoaReprintOpen(true);
  }, [allTransactions]);

  const handleTransactionSuccess = useCallback(() => {
    void fetchTransactionsRef.current();
    window.dispatchEvent(new CustomEvent("transaction_created"));
  }, []);

  return (
    <div className="space-y-3 pb-4">
      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onRenewClick={() => handleActionWithPassword(() => setIsRenewModalOpen(true))}
        onRedeem={() => handleActionWithPassword(() => setIsRedeemModalOpen(true))}
        onBuyBack={() => handleActionWithPassword(() => setIsBuyBackModalOpen(true))}
        onSalesTransfer={() => handleActionWithPassword(() => setIsSalesTransferModalOpen(true))}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
        onNewPawn={() => handleActionWithPassword(openNewPawnForm)}
        onStartDay={() => setBalanceModal({ open: true, type: "starting" })}
        onEndDay={() => setBalanceModal({ open: true, type: "ending" })}
      />

      <TransactionStats data={currentStats} />

            <TransactionTable 
              data={paginatedTransactions} 
              onReprint={handleReprint} 
              onViewDetails={setSelectedTransaction}
              viewRange={viewRange}
              onRangeChange={setViewRange}
            />

            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransactions.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />

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
        onSuccess={handleTransactionSuccess}
        branchName={selectedBranch.name}
        branchId={selectedBranch.id}
      />

      <NewPawnModal
        isOpen={isNewPawnModalOpen}
        onClose={() => setIsNewPawnModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={selectedBranch.id}
        branchName={selectedBranch.name}
        branchAddress={selectedBranch.location}
        branchPhone={selectedBranch.phone}
        branchAdminName={branchAdminName}
        loggedInUserName={user?.fullName}
      />

      <RedeemModal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={selectedBranch.id}
        branchName={selectedBranch.name}
      />

      {/* Buy Back Modal will handle Expired/For-Sale items */}
      <BuyBackModal
        isOpen={isBuyBackModalOpen}
        onClose={() => setIsBuyBackModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        branchId={selectedBranch.id}
        branchName={selectedBranch.name}
      />

      <SalesTransferModal
        isOpen={isSalesTransferModalOpen}
        onClose={() => setIsSalesTransferModalOpen(false)}
        onSuccess={handleTransactionSuccess}
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
