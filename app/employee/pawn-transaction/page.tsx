"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { TransactionActions, type FilterType } from "./_components/transaction-actions";
import { api } from "@/lib/api";
import { PaginationFooter } from "@/components/shared/pagination";
import { TransactionStats } from "./_components/transaction-stats";
import { TransactionTable, type TransactionRow, type PurposeType } from "./_components/transaction-table";
import { RenewModal } from "./_components/renew-modal";
import { NewPawnModal } from "./_components/new-pawn-modal";
import { RedeemModal } from "./_components/redeem-modal";
import { BuyBackModal } from "./_components/buy-back-modal";
import { SalesTransferModal } from "./_components/sales-transfer-modal";
import { MoaModal } from "./_components/moa-modal";
import { ActionButton } from "@/components/shared/action-button";
import { DailyBalanceConfirmation } from "@/components/shared/daily-balance-confirmation";
import { TransactionDetailsModal } from "@/components/shared/transaction-details-modal";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";
import { Role } from "@/types";
import { calculateGadgetInterest } from "@/lib/interest";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Sales / Transfer": "Sold Item",
  "Redeem": "Redeem",
  "Buy Back": "Buy Back",
  "Pawn": "Pawn",
  "Start": "Start",
  "Buy Out": "Buy Out",
  "Sold Item": "Sold Item",
};

const downloadIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const printerIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);



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
  pawned_item?: PawnedItemJoin | PawnedItemJoin[] | null;
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

interface PawnedItemJoin {
  qr_code?: string | null;
  serial_number?: string | null;
  items_included?: string | null;
  condition?: string | null;
  category?: string | null;
  memory_storage?: string | null;
  remarks?: string | null;
  id_presented?: string | null;
  customer?: {
    full_name?: string | null;
    address?: string | null;
    barangay?: string | null;
    city?: string | null;
    region?: string | null;
    contact_number?: string | null;
    middle_name?: string | null;
  } | null;
}

function resolvePawnedItem(raw: unknown): PawnedItemJoin | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw as PawnedItemJoin;
}

function toTransactionRow(transaction: ApiTransaction): TransactionRow {
  const pawnAmount = Number(transaction.pawn_amount || 0);
  const calculations = calculateGadgetInterest(pawnAmount, transaction.transaction_date);

  const isBuyBackAction = transaction.purpose === "Buy Back";
  const isPawnAction = transaction.purpose === "Pawn";

  const item = resolvePawnedItem(transaction.pawned_item);
  // Support both object and array response for customer
  const customerRaw = item?.customer;
  const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;

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
    customerName: customer?.full_name ?? undefined,
    customerAddress: customer?.address ?? undefined,
    customerBarangay: customer?.barangay ?? undefined,
    customerCity: customer?.city ?? undefined,
    customerRegion: customer?.region ?? undefined,
    customerPhone: customer?.contact_number ?? undefined,
    customerMiddleName: customer?.middle_name ?? undefined,
    idPresented: item?.id_presented ?? undefined,
    qrCode: item?.qr_code ?? undefined,
    serialNumber: item?.serial_number ?? undefined,
    itemsIncluded: item?.items_included ?? undefined,
    condition: item?.condition ?? undefined,
    category: item?.category ?? undefined,
    memoryStorage: item?.memory_storage ?? undefined,
    remarks: item?.remarks ?? undefined,
    relatedPawnedItemId: transaction.related_pawned_item_id ?? undefined,
    relatedSaleItemId: transaction.related_sale_item_id ?? undefined,
    details: transaction.details ?? undefined,
  };
}

export default function EmployeePawnTransactionsPage() {
  const { selectedBranch, branches, canSwitchBranch } = useBranch();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [branchAdminName, setBranchAdminName] = useState("");
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isNewPawnModalOpen, setIsNewPawnModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isBuyBackModalOpen, setIsBuyBackModalOpen] = useState(false);
  const [isSalesTransferModalOpen, setIsSalesTransferModalOpen] = useState(false);
  const [isMoaReprintOpen, setIsMoaReprintOpen] = useState(false);
  const [reprintData, setReprintData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
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
  const [highlightedTransactionNo, setHighlightedTransactionNo] = useState<string | null>(null);
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; type: "starting" | "ending" }>({
    open: false,
    type: "starting",
  });
  const [expectedCash, setExpectedCash] = useState("0");
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; onConfirm: () => void }>({
    open: false,
    onConfirm: () => { },
  });
  const [viewRange, setViewRange] = useState<"daily" | "weekly" | "monthly" | "all">("daily");
  const [currentPage, setCurrentPage] = useState(1);
  const highlightedTransactionRef = useRef<string | null>(null);

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
    let result = allTransactions;

    if (activeFilter !== "All") {
      const targetPurpose = filterToPurpose[activeFilter];
      if (targetPurpose) {
        result = result.filter((t) => t.purpose === targetPurpose);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.transactionNo.toLowerCase().includes(q) ||
          t.purpose.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.unit?.toLowerCase().includes(q) ||
          t.unitCode?.toLowerCase().includes(q) ||
          t.details?.toLowerCase().includes(q)
      );
    }

    if (dateFilter) {
      // API date format is usually YYYY-MM-DD
      result = result.filter((t) => t.date === dateFilter);
    }

    return result;
  }, [allTransactions, activeFilter, searchQuery, dateFilter]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    const transactionNo = searchParams.get("transactionNo");

    if (!transactionNo) {
      return;
    }

    const matchingIndex = filteredTransactions.findIndex((transaction) => transaction.transactionNo === transactionNo);
    if (matchingIndex < 0) {
      return;
    }

    const nextPage = Math.floor(matchingIndex / ITEMS_PER_PAGE) + 1;
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, filteredTransactions, searchParams]);

  useEffect(() => {
    const transactionNo = searchParams.get("transactionNo");
    const shouldHighlight = searchParams.get("highlightTransaction") === "true";

    if (!transactionNo) {
      highlightedTransactionRef.current = null;
      setHighlightedTransactionNo(null);
      return;
    }

    const matchingTransaction = allTransactions.find((transaction) => transaction.transactionNo === transactionNo);
    if (!matchingTransaction) {
      return;
    }

    setSelectedTransaction(matchingTransaction);

    if (shouldHighlight && highlightedTransactionRef.current !== transactionNo) {
      highlightedTransactionRef.current = transactionNo;
      setHighlightedTransactionNo(transactionNo);

      const timeout = window.setTimeout(() => {
        setHighlightedTransactionNo(null);
      }, 4000);

      return () => window.clearTimeout(timeout);
    }
  }, [allTransactions, searchParams]);

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
    const fullName = tx.customerName || "WALK-IN CUSTOMER";
    const names = fullName.split(" ");
    const firstName = names[0];
    const middleName = tx.customerMiddleName || (names.length > 2 ? names.slice(1, -1).join(" ") : "");
    const lastName = names.length > 1 ? names[names.length - 1] : "";

    // Join address components for the MOA
    const fullAddress = [
      tx.customerAddress,
      tx.customerBarangay,
      tx.customerCity,
      tx.customerRegion
    ].filter(Boolean).join(", ");

    setReprintData({
      firstName,
      middleName,
      lastName,
      address: fullAddress,
      contactNo: tx.customerPhone || "",
      unitCode: tx.unitCode,
      unitName: tx.unit,
      category: tx.category || "",
      serialNumber: tx.serialNumber || "",
      itemsIncluded: tx.itemsIncluded || "",
      condition: tx.condition || "",
      memory: tx.memoryStorage || "",
      remarks: tx.remarks || "",
      amount: tx.pawn,
      storageFee: tx.storage,
      purchasedDate: tx.date,
      idPresented: tx.idPresented || "",
      branchName: selectedBranch.name,
      branchAddress: branchInfo?.location || "",
      branchPhone: branchInfo?.phone || "",
      processedBy: tx.details?.match(/Processed [bB]y:\s*([A-Za-z\s]+)/)?.[1]?.trim() || user?.fullName || branchAdminName || "AUTHORIZED PERSONNEL"
    });
    setIsMoaReprintOpen(true);
  }, [allTransactions, selectedBranch, branches, user, branchAdminName]);

  const handleTransactionSuccess = useCallback((_transactionNo?: string) => {
    void fetchTransactionsRef.current();
    window.dispatchEvent(new CustomEvent("transaction_created"));
  }, []);

  return (
    <div className="space-y-3 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-emerald-950 dark:text-white">Pawn Transactions</h1>
        <p className="text-sm text-emerald-900/60 dark:text-zinc-400">
          Live transaction records across all branches with employee-style QR and print access.
        </p>
      </div>

      <TransactionActions
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onRenewClick={() => handleActionWithPassword(() => setIsRenewModalOpen(true))}
        onRedeem={() => handleActionWithPassword(() => setIsRedeemModalOpen(true))}
        onBuyBack={() => handleActionWithPassword(() => setIsBuyBackModalOpen(true))}
        onSalesTransfer={() => handleActionWithPassword(() => setIsSalesTransferModalOpen(true))}
        onNewPawn={() => handleActionWithPassword(openNewPawnForm)}
        onStartDay={async () => {
          try {
            const bal = await api.get<{ startingBalance: number; endingBalance: number }>(
              `/branch-finance/latest-balance`
            );
            setExpectedCash(String(bal?.endingBalance ?? 0));
          } catch {
            setExpectedCash(String(currentStats.endingBalance || 0));
          }
          setBalanceModal({ open: true, type: "starting" });
        }}
        onEndDay={() => {
          setExpectedCash(String(currentStats.endingBalance || 0));
          setBalanceModal({ open: true, type: "ending" });
        }}
      />

      <TransactionStats data={currentStats} />

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
            Search Transactions
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction no, purpose, customer, item, or details"
            className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
          />
        </div>

        <div className="w-48">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
            Purpose Filter
          </label>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as FilterType);
              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
          >
            <option value="All">All Purposes</option>
            <option value="Renew">Renew</option>
            <option value="Sales / Transfer">Sales / Transfer</option>
            <option value="Redeem">Redeem</option>
            <option value="Buy Back">Buy Back</option>
            <option value="Pawn">Pawn</option>
            <option value="Start">Start</option>
            <option value="Buy Out">Buy Out</option>
            <option value="Sold Item">Sold Item</option>
          </select>
        </div>

        <div className="w-48">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
            Date Filter
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500 text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <ActionButton variant="outline" onClick={handleExportCSV}>
            <span className="flex items-center gap-1.5">
              {downloadIcon}
              Export CSV
            </span>
          </ActionButton>
          <ActionButton
            variant="primary"
            className="border-emerald-700 bg-emerald-700 text-amber-400"
            onClick={handlePrintReport}
          >
            <span className="flex items-center gap-1.5">
              {printerIcon}
              Print Report
            </span>
          </ActionButton>
        </div>
      </div>

      <TransactionTable
        isLoading={isLoading}
        data={paginatedTransactions}
        onReprint={handleReprint}
        onViewDetails={setSelectedTransaction}
        highlightedTransactionNo={highlightedTransactionNo}
        viewRange={viewRange}
        onRangeChange={setViewRange}
      />

      <div className="mt-4">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      <TransactionDetailsModal
        isOpen={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <DailyBalanceConfirmation
        isOpen={balanceModal.open}
        type={balanceModal.type}
        currentCash={expectedCash}
        onClose={() => setBalanceModal((p) => ({ ...p, open: false }))}
        onConfirm={async (amt) => {
          try {
            await api.post("/branch-finance/daily-balance", {
              type: balanceModal.type,
              amount: parseFloat(amt) || 0,
            });
            setBalanceModal((p) => ({ ...p, open: false }));
            fetchTransactionsRef.current();
          } catch (err) {
            console.error("Failed to confirm daily balance:", err);
          }
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
          autoPrint={true}
        />
      )}
    </div>
  );
}
