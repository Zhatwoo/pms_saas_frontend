"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmPasswordModal } from "@/components/shared/confirm-password-modal";

type PurposeType = "Start" | "Buy Back" | "Renew" | "Sold Item" | "Pawn";
type FilterType = "All" | "Renew" | "Sales / Transfer" | "Buy Back";

interface TransactionRow {
  transactionNo: string;
  branch: string;
  purpose: PurposeType;
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
}

const filterToPurpose: Record<FilterType, PurposeType | null> = {
  "All": null,
  "Renew": "Renew",
  "Sales / Transfer": "Sold Item",
  "Buy Back": "Buy Back",
};

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
        const data = await api.get<any>(`/transactions?branch=${encodeURIComponent(selectedBranch.name)}`);
        if (data) {
          setCurrentStats(data.stats || {
            pawnedToday: 0, buyBack: 0, renewed: 0, soldItem: 0,
            startingBalance: 0, endingBalance: 0,
          });
          setAllTransactions((data.transactions || []).map((t: any) => ({
            transactionNo: t.transaction_no,
            branch: t.branch,
            purpose: t.purpose,
            date: t.transaction_date,
            time: t.transaction_time,
            cashIn: t.cash_in,
            cashOut: t.cash_out,
            returnVal: t.return_amount,
            unit: t.unit,
            unitCode: t.unit_code,
            pawn: t.pawn_amount,
            storage: t.storage_fee,
            customerName: t.pawned_item?.customer?.full_name,
            customerAddress: t.pawned_item?.customer?.address,
            profilePhoto: t.profile_photo,
            idPhoto: t.id_photo,
          })));
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [selectedBranch]);

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

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "All") return allTransactions;
    const targetPurpose = filterToPurpose[activeFilter];
    if (!targetPurpose) return allTransactions;
    return allTransactions.filter((t) => t.purpose === targetPurpose);
  }, [allTransactions, activeFilter]);

  const handleExportCSV = useCallback(() => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Transaction #", "Purpose", "Date", "Time", "Cash In", "Cash Out", "Return", "Unit", "Unit Code", "Pawn", "Storage"];
    const rows = filteredTransactions.map((r) =>
      [r.transactionNo, r.purpose, r.date, r.time, r.cashIn, r.cashOut, r.returnVal, r.unit, r.unitCode, r.pawn, r.storage].join(",")
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

      <TransactionStats data={currentStats} />
      <TransactionTable 
        data={filteredTransactions} 
        onReprint={handleReprint}
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
