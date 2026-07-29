"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { calculateGadgetInterest } from "@/lib/interest";
import { getContractInterestRateGroup } from "@/lib/pawn-transaction-mapper";
import { formatDateToYMD, getTransactionDateTimeFields } from "@/lib/time";
import { useAuth } from "@/contexts/auth-context";
import { QrScanner } from "@/components/shared/qr-scanner";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { RenewalProofModal } from "@/components/shared/renewal-proof-modal";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";
import {
  isTransactionPasswordError,
  TRANSACTION_PASSWORD_VERIFY_MESSAGE,
  transactionPasswordErrorClass,
  transactionPasswordInputClass,
} from "@/lib/transaction-password";

/* ── Inline SVG Icon Components (replacing lucide-react) ── */
function X({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
}
function Search({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
}
function ArrowRight({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
}
function QrCode({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><path d="M14 14h3v3h-3z"/></svg>);
}
function RotateCcw({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>);
}
function ShieldCheck({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>);
}
function Info({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);
}
function Calendar({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
}
function Tag({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
}
function User({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
}
function Layout({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>);
}
function Lock({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>);
}
function Minus({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>);
}
function Plus({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
}
function AlertCircle({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
}
function TrendingUp({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
}
function Package({ className }: { className?: string }) {
  return (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
}
function Menu({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  branchId: string;
  onSuccess?: () => void;
  initialSearchCode?: string;
  hideSidebar?: boolean;
  compactTablet?: boolean;
}

/** Raw shape of a single item returned by `GET /inventory/pawned`. */
interface PawnedItemApiResponse {
  id: string;
  itemId?: string;
  itemName?: string;
  serialNumber?: string;
  itemsIncluded?: string;
  condition?: string;
  memoryStorage?: string;
  category?: string;
  remarks?: string;
  pawnDate?: string;
  created_at?: string;
  amount?: number | string;
  interestRateSnapshot?: unknown;
  interest_rate_snapshot?: unknown;
  customers?:
    | { full_name?: string; contact_number?: string }
    | { full_name?: string; contact_number?: string }[]
    | null;
}

interface PawnItemDetails {
  id: string;
  name: string;
  unitCode: string;
  unit: string;
  serialNumber: string;
  itemsIncluded: string;
  condition: string;
  memory: string;
  category: string;
  contactNumber: string;
  remarks: string;
  storageFee: string;
  parkingFee: string;
  purchasedDate: string;
  expirationDate: string;
  amount: number;
  interestRateSnapshot?: unknown;
}

export function RenewModal({ isOpen, onClose, branchName, branchId, onSuccess, initialSearchCode, hideSidebar, compactTablet = false }: RenewModalProps) {
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [selectedItem, setSelectedItem] = useState<PawnItemDetails | null>(null);
  const [itemsRenewed, setItemsRenewed] = useState(1);
  const [isRenewActive, setIsRenewActive] = useState(true);
  const [isReappraiseActive, setIsReappraiseActive] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState<number>(0);
  const [adminForm, setAdminForm] = useState({
    approvedBy: "",
    password: "",
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<PawnedItemApiResponse[]>([]);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showMobileItemList, setShowMobileItemList] = useState(true);
  const isProcessingRef = useRef(false);

  // Interest Computation based on selected item
  const interestCalc = useMemo(() => {
    if (!selectedItem) return { percentage: 0, interestAmount: 0, totalAmount: 0, daysPassed: 0 };
    const contractRate = getContractInterestRateGroup(
      selectedItem.category,
      selectedItem.interestRateSnapshot,
    );
    return calculateGadgetInterest(
      selectedItem.amount,
      selectedItem.purchasedDate,
      selectedItem.category,
      contractRate ?? undefined,
    );
  }, [selectedItem]);

  const totalToPay = isReappraiseActive ? newPrincipal : (interestCalc.interestAmount * itemsRenewed);
  const interestDue = interestCalc.interestAmount * itemsRenewed;

  const triggerSearch = async (code: string, preFetchedItem?: PawnedItemApiResponse) => {
    if (!code && !preFetchedItem) return;
    setIsLoading(true);
    setError(null);
    try {
      let item = preFetchedItem;
      if (!item) {
        const response = await api.get<{ items: PawnedItemApiResponse[] }>(`/inventory/pawned?status=Active&search=${code}`);
        if (response.items && response.items.length > 0) {
          item = response.items[0];
        }
      }

      if (item) {
        const customer = Array.isArray(item.customers) ? item.customers[0] : item.customers;
        
        const details = {
          id: item.id,
          name: customer?.full_name || "---",
          unitCode: item.itemId || "---",
          unit: item.itemName || "---",
          serialNumber: item.serialNumber || "---",
          itemsIncluded: item.itemsIncluded || "---",
          condition: item.condition || "---",
          memory: item.memoryStorage || "---",
          category: item.category || "---",
          contactNumber: customer?.contact_number || "---",
          remarks: item.remarks || "---",
          storageFee: "0.00",
          parkingFee: "0.00",
          purchasedDate: item.pawnDate || item.created_at || "---",
          expirationDate: "---",
          amount: Number(item.amount || 0),
          interestRateSnapshot: item.interestRateSnapshot ?? item.interest_rate_snapshot ?? null,
        };
        setSelectedItem(details);
        setNewPrincipal(details.amount);
        setShowMobileItemList(false);
      } else {
        setError("Item not found. Please verify the Unit Code.");
        setSelectedItem(null);
      }
    } catch (err) {
      setError("Failed to fetch item details.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get<{ items: PawnedItemApiResponse[] }>(`/inventory/pawned?status=Active`);
      setInventoryItems(response.items || []);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  const handleSearch = async () => {
    await triggerSearch(searchCode);
  };

  const handleQrScan = (data: string) => {
    setSearchCode(data);
    setIsScannerOpen(false);
    void triggerSearch(data);
  };

  const executeTransaction = async (photoBase64: string | null) => {
    isProcessingRef.current = true;
    setIsLoading(true);
    try {
      const cashIn = totalToPay; 
      await api.post("/transactions", {
        ...getTransactionDateTimeFields(),
        purpose: isReappraiseActive ? "Reappraise" : "Renew",
        branch_id: branchId,
        branch: branchName,
        cash_in: cashIn,
        cash_out: 0,
        unit: selectedItem!.unit,
        unit_code: selectedItem!.unitCode,
        pawn_amount: isReappraiseActive ? newPrincipal : selectedItem!.amount,
        storage_fee: interestCalc.interestAmount * itemsRenewed,
        details: `${isReappraiseActive ? 'Reappraised' : 'Renewed'} for ${itemsRenewed} period(s). ${isReappraiseActive ? `New Principal: ₱${newPrincipal}` : ''} | Processed by: ${adminForm.approvedBy || 'Admin'}`,
        related_pawned_item_id: selectedItem!.id,
        id_photo: photoBase64,
      });

      if (isReappraiseActive && selectedItem!.id) {
        await api.put(`/inventory/pawned/${selectedItem!.id}`, { amount: newPrincipal });
      }

      if (onSuccess) onSuccess();
      onClose();
      toast.success(`Transaction ${isReappraiseActive ? "reappraised" : "renewed"} successfully!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process transaction.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
      setIsProofModalOpen(false);
    }
  };

  const handleProceedRequest = () => {
    if (!selectedItem) return;
    if (!adminForm.password) {
      setError(TRANSACTION_PASSWORD_VERIFY_MESSAGE);
      return;
    }
    setError(null);
    setIsConfirmOpen(true);
  };

  const handleProceed = async () => {
    if (isProcessingRef.current) return;
    if (!selectedItem) return;
    if (!adminForm.password) {
      setError(TRANSACTION_PASSWORD_VERIFY_MESSAGE);
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    try {
      await api.post("/auth/verify-password", { password: adminForm.password });
      if (!isReappraiseActive) {
        setIsConfirmOpen(false);
        setIsProofModalOpen(true);
        setIsLoading(false);
        isProcessingRef.current = false;
      } else {
        await executeTransaction(null);
        setIsConfirmOpen(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process transaction.";
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      isProcessingRef.current = false;
      setIsConfirmOpen(false);
    }
  };

  useEffect(() => {
    if (user?.fullName) {
      setAdminForm(prev => ({ ...prev, approvedBy: user.fullName }));
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && initialSearchCode) {
      setSearchCode(initialSearchCode);
      void triggerSearch(initialSearchCode);
    } else if (!isOpen) {
      setSearchCode("");
      setSelectedItem(null);
      setError(null);
      setIsRenewActive(true);
      setIsReappraiseActive(false);
      setItemsRenewed(1);
      setIsConfirmOpen(false);
      setIsCancelConfirmOpen(false);
    }
    if (isOpen) {
      setIsCancelConfirmOpen(false);
      setShowMobileItemList(true);
      fetchInventory();
    }
  }, [isOpen, initialSearchCode]);


  if (!isOpen) return null;

  const passwordFieldError = isTransactionPasswordError(error) ? error : null;

  const handleRequestClose = () => {
    if (isLoading) return;
    setIsCancelConfirmOpen(true);
  };

  const handleSelectItem = (item: PawnedItemApiResponse) => {
    void triggerSearch(item.itemId ?? "", item);
    setShowMobileItemList(false);
  };

  const handleOpenMobileItemList = () => {
    setShowMobileItemList(true);
  };

  const hideMobileSidebar = Boolean(selectedItem && !showMobileItemList);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-brand-green/40 backdrop-blur-md transition-opacity no-print" onClick={handleRequestClose} />
      <div className={`relative z-10 flex h-[calc(100dvh-1rem)] w-[92vw] max-w-[1200px] min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-green/20 animate-in fade-in zoom-in-95 duration-300 dark:bg-background sm:h-[calc(100dvh-2rem)] ${compactTablet ? "md:h-[calc(100dvh-4rem)] md:max-w-6xl lg:h-[88vh] xl:max-w-7xl" : "md:h-[calc(100dvh-3rem)] lg:h-[90vh]"}`}>

        {/* Top Floating Header */}
        <div className={`relative z-30 shrink-0 bg-gradient-to-r from-brand-green via-brand-green to-brand-green px-4 py-4 text-white sm:px-5 ${compactTablet ? "md:px-5 md:py-4" : "md:px-6 md:py-5"}`}>
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className={`flex items-center gap-3 ${compactTablet ? "md:gap-3" : "md:gap-4"}`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-green/50 bg-brand-green text-pawn-gold shadow-inner ${compactTablet ? "md:h-11 md:w-11" : "md:h-12 md:w-12"}`}>
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-pawn-gold/90 dark:text-pawn-gold">
                  {branchName}
                </p>
                <h1 className={`mt-1 font-black tracking-tight leading-none text-white ${compactTablet ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`}>
                  Renew Transaction
                </h1>
              </div>
            </div>

            <div className={`flex items-center gap-3 ${compactTablet ? "md:gap-3" : "md:gap-4"}`}>
              {!hideSidebar && (
                <div className={`hidden md:flex items-center gap-2 rounded-2xl border border-white/5 bg-black/20 p-1.5 ${compactTablet ? "pr-3" : "pr-4"}`}>
                  <div className={`relative group/search flex-1 ${compactTablet ? "min-w-[220px]" : "min-w-[280px]"}`}>
                    <input 
                      type="text" 
                      placeholder="Type Full Unit Code..."
                      className="w-full h-10 pl-10 pr-4 bg-transparent outline-none text-white text-[11px] font-bold placeholder:text-white/30"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="p-2.5 rounded-xl bg-white/5 text-pawn-gold hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className={`flex h-10 items-center gap-2 rounded-xl bg-brand-green px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110 disabled:opacity-50 ${compactTablet ? "md:px-3" : ""}`}
                  >
                    {isLoading ? <span className="anim-loading h-3 w-3 border-white/30 border-t-white rounded-full" /> : <Search className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </div>
              )}

              <button 
                onClick={handleRequestClose} 
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

          {compactTablet && (
            <div className={`flex min-h-0 flex-1 flex-col overflow-hidden xl:hidden ${hideMobileSidebar ? "" : "md:max-xl:grid md:max-xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
              {!hideSidebar && !hideMobileSidebar && (
                <aside className="flex w-full min-h-0 flex-col overflow-hidden border-r border-brand-green/20 bg-brand-green/5 dark:border-white/5 dark:bg-black/20 md:max-xl:w-[300px]">
                  <div className="sticky top-0 z-20 shrink-0 space-y-3 border-b border-brand-green/20 bg-brand-green/5 p-4 backdrop-blur-md dark:border-white/5 dark:bg-[#0c0f14] md:p-4">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green/70 dark:text-pawn-gold">Active Inventory</h2>
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Search Active Pawn..."
                        className="h-10 w-full rounded-xl border border-brand-green/20 bg-white pl-4 pr-10 text-xs font-bold outline-none transition-all focus:border-brand-green dark:border-white/10 dark:bg-white/5"
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4 pt-0 scrollbar-hide md:max-xl:px-3">
                    {inventoryItems
                      .filter((item) =>
                        (item.itemId || "").toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                        (item.itemName || "").toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                        ((Array.isArray(item.customers) ? item.customers[0]?.full_name : item.customers?.full_name) || "").toLowerCase().includes(sidebarSearch.toLowerCase())
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`cursor-pointer group rounded-2xl border transition-all ${compactTablet ? "p-3 md:max-xl:p-3" : "p-4"} ${
                            selectedItem?.id === item.id
                              ? "border-brand-green bg-brand-green/10 shadow-lg"
                              : "border-brand-green/20 bg-white hover:border-brand-green dark:bg-white/5"
                          }`}
                        >
                          <p className="text-[8px] font-black uppercase tracking-[0.24em] text-brand-green dark:text-pawn-gold">{item.itemId}</p>
                          <h3 className="text-lg font-black leading-none text-brand-green transition-colors group-hover:text-brand-green/70 dark:text-white md:max-xl:text-[17px]">
                            {item.itemName}
                          </h3>
                          <div className="mt-2 h-px bg-brand-green/20 dark:bg-white/5" />
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-[9px] font-bold text-brand-green/70 dark:text-white/40">
                              {Array.isArray(item.customers) ? item.customers[0]?.full_name : item.customers?.full_name || "---"}
                            </span>
                            <span className="text-xs font-black text-brand-green md:max-xl:text-[13px]">₱ {Number(item.amount).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </aside>
              )}

              <section className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-brand-green/5 dark:bg-surface-secondary ${selectedItem && showMobileItemList ? "max-md:hidden md:max-xl:flex" : "flex"}`}>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:max-xl:p-4 scrollbar-hide">
                  {hideMobileSidebar && (
                    <button
                      type="button"
                      onClick={handleOpenMobileItemList}
                      className="mb-3 inline-flex items-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/20 dark:border-brand-green/40 dark:bg-brand-green/20 dark:text-pawn-gold dark:hover:bg-brand-green/30 xl:hidden"
                    >
                      <Menu className="h-4 w-4" />
                      Change Item
                    </button>
                  )}
                  <div className="rounded-2xl border border-brand-green/20 bg-white/85 p-4 shadow-lg shadow-brand-green/5 backdrop-blur-sm dark:border-white/5 dark:bg-black/20">
                    <SectionHeader title="Loan & Item Identity" icon={Info} />
                    <div className="mt-4 grid min-w-0 gap-3 md:max-xl:grid-cols-2">
                      <TabletMetricCard label="Customer Name" value={selectedItem?.name} className="md:max-xl:col-span-2" />
                      <TabletMetricCard label="Unit Code" value={selectedItem?.unitCode} />
                      <TabletMetricCard label="Unit Name" value={selectedItem?.unit} />
                    </div>
                  </div>

                  <div className="mt-4 grid min-w-0 gap-3 md:max-xl:grid-cols-2">
                    <TabletMetricCard
                      label="Principal Amount"
                      value={selectedItem ? `₱ ${selectedItem.amount.toLocaleString()}` : "---"}
                      accent
                    />
                    <TabletMetricCard
                      label="Interest"
                      value={selectedItem ? `₱ ${interestDue.toLocaleString()}` : "---"}
                      accent
                    />
                  </div>

                  <details className="mt-4 min-w-0 rounded-2xl border border-brand-green/20 bg-white/80 p-4 shadow-sm shadow-brand-green/5 dark:border-white/5 dark:bg-black/20">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.22em] text-brand-green/70 dark:text-pawn-gold">
                      <span>View More Details</span>
                      <span className="text-brand-green">+</span>
                    </summary>
                    <div className="mt-4 grid gap-2">
                      <TabletDetailRow label="Contact Number" value={selectedItem?.contactNumber} />
                      <TabletDetailRow label="Remarks" value={selectedItem?.remarks} />
                      <TabletDetailRow label="Storage Fee" value={selectedItem?.storageFee} />
                      <TabletDetailRow label="Parking Fee" value={selectedItem?.parkingFee} />
                      <TabletDetailRow label="Purchased Date" value={selectedItem?.purchasedDate} />
                      <TabletDetailRow label="Expiration Date" value={selectedItem?.expirationDate} />
                      <TabletDetailRow label="Serial No." value={selectedItem?.serialNumber} />
                      <TabletDetailRow label="Items Included" value={selectedItem?.itemsIncluded} />
                      <TabletDetailRow label="Condition" value={selectedItem?.condition} />
                      <TabletDetailRow label="Memory" value={selectedItem?.memory} />
                      <TabletDetailRow label="Category" value={selectedItem?.category} />
                    </div>
                  </details>

                  <div className="mt-4 rounded-2xl border border-white/5 bg-brand-green p-4 shadow-lg shadow-brand-green/10">
                    <SectionHeader title="Transaction Type" icon={Tag} isDark />

                    <div className="mt-3 grid grid-cols-2 gap-2 [&>button]:min-w-0">
                      <ActionToggle
                        label="Renew"
                        isActive={isRenewActive}
                        compact
                        onClick={() => {
                          setIsRenewActive(true);
                          setIsReappraiseActive(false);
                        }}
                        sub="Interest Payment"
                      />
                      <ActionToggle
                        label="ReAppraise"
                        isActive={isReappraiseActive}
                        compact
                        onClick={() => {
                          setIsReappraiseActive(true);
                          setIsRenewActive(false);
                        }}
                        sub="Re-assess Value"
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/5 bg-brand-green p-4 shadow-lg shadow-brand-green/10">
                    <SectionHeader title="Period Settings" icon={Calendar} isDark />

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-brand-green/20 bg-white px-4 py-3 dark:border-white/10 dark:bg-brand-green/30">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-green/70 dark:text-pawn-gold">Items Renewed</p>
                        <p className="text-[7px] font-bold uppercase tracking-tighter text-brand-green/60 dark:text-pawn-gold/60">Extend Multiplier</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setItemsRenewed(Math.max(1, itemsRenewed - 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green transition-all active:scale-90 dark:bg-brand-green/40 dark:text-white hover:bg-brand-green/20 dark:hover:bg-brand-green/50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.2ch] text-center text-2xl font-black text-brand-green dark:text-white">{itemsRenewed}</span>
                        <button
                          onClick={() => setItemsRenewed(itemsRenewed + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green text-white shadow-lg shadow-brand-green/20 transition-all active:scale-90 hover:brightness-110"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>


                </div>

              </section>
            </div>
          )}

          <div className={compactTablet ? "hidden xl:flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row" : "flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row"}>
          {/* Left Sidebar: Active Inventory List */}
          {!hideSidebar && (
            <div className={`w-full flex-col overflow-hidden border-r border-brand-green/20 bg-brand-green/5 dark:border-white/5 dark:bg-black/20 ${hideMobileSidebar ? "hidden xl:flex" : "flex"} ${compactTablet ? "lg:w-64 xl:w-72" : "lg:w-72"}`}>
              <div className={`sticky top-0 z-20 shrink-0 space-y-4 border-b border-brand-green/20 bg-brand-green/5 p-4 backdrop-blur-md dark:border-white/5 dark:bg-[#0c0f14] ${compactTablet ? "md:p-4" : "md:p-5"}`}>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green/70 dark:text-pawn-gold">Active Inventory</h2>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Search Active Pawn..."
                      className="w-full h-11 pl-4 pr-10 bg-white dark:bg-white/5 border border-brand-green/20 dark:border-white/10 rounded-xl outline-none focus:border-brand-green transition-all text-xs font-bold"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                  </div>
               </div>

               <div className={`flex-1 space-y-2 overflow-y-auto p-4 pt-0 scrollbar-hide ${compactTablet ? "md:p-3" : ""}`}>
                  {inventoryItems
                    .filter(item =>
                      (item.itemId || "").toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                      (item.itemName || "").toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                      ((Array.isArray(item.customers) ? item.customers[0]?.full_name : item.customers?.full_name) || "").toLowerCase().includes(sidebarSearch.toLowerCase())
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                          selectedItem?.id === item.id
                            ? 'bg-brand-green/10 border-brand-green shadow-lg'
                            : 'bg-white dark:bg-white/5 border-brand-green/20 hover:border-brand-green'
                        }`}
                      >
                         <p className="text-[9px] font-black text-brand-green dark:text-pawn-gold uppercase tracking-widest">{item.itemId}</p>
                         <h3 className="text-xl font-black text-brand-green dark:text-white group-hover:text-brand-green/70 transition-colors leading-none">{item.itemName}</h3>
                         <div className="h-px bg-brand-green/20 dark:bg-white/5" />
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-brand-green/70 dark:text-white/40">
                              {Array.isArray(item.customers) ? item.customers[0]?.full_name : item.customers?.full_name || "---"}
                            </span>
                            <span className="text-sm font-black text-brand-green">₱ {Number(item.amount).toLocaleString()}</span>
                         </div>
                      </div>
                    ))}
               </div>
            </div>
          )}

          {/* Main Info Area */}
          <div className={`min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-brand-green/5 p-4 scrollbar-hide sm:p-6 dark:bg-surface-secondary ${hideMobileSidebar ? "flex" : "hidden xl:flex"} ${compactTablet ? "lg:flex-row lg:gap-6 lg:p-6" : "lg:flex-row lg:gap-8 lg:p-8"}`}>
            {/* Left Column: Specs */}
            <div className="flex flex-1 flex-col space-y-5">
              {hideMobileSidebar && (
                <button
                  type="button"
                  onClick={handleOpenMobileItemList}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/20 dark:border-brand-green/40 dark:bg-brand-green/20 dark:text-pawn-gold dark:hover:bg-brand-green/30 xl:hidden"
                >
                  <Menu className="h-4 w-4" />
                  Change Item
                </button>
              )}
              <SectionHeader title="Loan & Item Identity" icon={Info} />
              
              <div className="space-y-3 px-1">
                <StaticDetailRow label="Name" value={selectedItem?.name} />
                <StaticDetailRow label="Unit Code" value={selectedItem?.unitCode} />
                <StaticDetailRow label="Unit" value={selectedItem?.unit} />
                <StaticDetailRow label="Serial No." value={selectedItem?.serialNumber} />
                <StaticDetailRow label="Items Included" value={selectedItem?.itemsIncluded} />
                <StaticDetailRow label="Condition" value={selectedItem?.condition} />
                <StaticDetailRow label="Memory" value={selectedItem?.memory} />
                <StaticDetailRow label="Category" value={selectedItem?.category} />
              </div>
            </div>

            {/* Middle Column: Transaction Specs */}
            <div className="flex-1 space-y-5 flex flex-col">
              <SectionHeader title="Additional Records" icon={Layout} />

              <div className="space-y-3 px-1">
                <StaticDetailRow label="Contact Number" value={selectedItem?.contactNumber} />
                <StaticDetailRow label="Remarks" value={selectedItem?.remarks} />
                <StaticDetailRow label="Storage Fee" value={selectedItem?.storageFee} />
                <StaticDetailRow label="Parking Fee" value={selectedItem?.parkingFee} />
                <StaticDetailRow label="Purchased Date" value={selectedItem?.purchasedDate} />
                <StaticDetailRow label="Expiration Date" value={selectedItem?.expirationDate} />
                <div className="pt-3 border-t border-brand-green/20 space-y-1 mt-auto">
                   <p className="text-[9px] font-black text-brand-green/70 dark:text-pawn-gold uppercase tracking-widest">Principal Amount</p>
                   <div className="flex items-center gap-2">
                     <span className="text-2xl font-black text-brand-green dark:text-white">₱ {selectedItem?.amount.toLocaleString() || '0.00'}</span>
                     <div className="px-2 py-0.5 bg-brand-green/10 text-brand-green rounded-full text-[8px] font-black uppercase tracking-tighter border border-brand-green/20">Value Assessed</div>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Action Panel */}
            <div className={`flex w-full shrink-0 flex-col gap-4 bg-brand-green p-5 ${compactTablet ? "lg:w-[300px] xl:w-[320px]" : "lg:w-[320px] xl:w-[340px]"}`}>
               <div className="space-y-3">
                  <SectionHeader title="Transaction Type" icon={Tag} isDark />
                  
                  <div className="grid grid-cols-2 gap-2 [&>button]:min-w-0">
                    <ActionToggle 
                      label="Renew" 
                      isActive={isRenewActive} 
                      onClick={() => {
                        setIsRenewActive(true);
                        setIsReappraiseActive(false);
                      }} 
                      sub="Interest Payment"
                    />
                    <ActionToggle 
                      label="ReAppraise" 
                      isActive={isReappraiseActive} 
                      onClick={() => {
                        setIsReappraiseActive(true);
                        setIsRenewActive(false);
                      }} 
                      sub="Re-assess Value"
                    />
                  </div>
               </div>

               <div className="space-y-3">
                  <SectionHeader title="Period Settings" icon={Calendar} isDark />

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-green/20 bg-white px-4 py-2.5 shadow-lg dark:border-white/10 dark:bg-brand-green/30">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-brand-green/70 dark:text-pawn-gold uppercase tracking-widest">Items Renewed</p>
                      <p className="text-[7px] font-bold text-brand-green/60 dark:text-pawn-gold/60 uppercase tracking-tighter">Extend Multiplier</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setItemsRenewed(Math.max(1, itemsRenewed - 1))}
                        className="w-7 h-7 rounded-lg bg-brand-green/10 dark:bg-brand-green/40 text-brand-green dark:text-white hover:bg-brand-green/20 dark:hover:bg-brand-green/50 flex items-center justify-center transition-all active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-2xl font-black text-brand-green dark:text-white min-w-[1.5ch] text-center">{itemsRenewed}</span>
                      <button
                        onClick={() => setItemsRenewed(itemsRenewed + 1)}
                        className="w-7 h-7 rounded-lg bg-brand-green text-white hover:brightness-110 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-brand-green/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
               </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`relative z-30 shrink-0 border-t border-brand-green/20 bg-white dark:border-border-subtle dark:bg-surface ${compactTablet ? "xl:p-6" : "lg:p-6 xl:p-8"}`}>
          <div className={`flex items-end gap-2 p-3 sm:gap-4 sm:p-5 ${compactTablet ? "md:gap-5" : "lg:gap-6"}`}>
            <div className="flex min-w-0 flex-1 items-end gap-2 sm:gap-4">
              <div className={`w-[min(38%,8.5rem)] shrink-0 ${compactTablet ? "md:w-40" : "sm:w-40"}`}>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-green/70 dark:text-pawn-gold">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={transactionPasswordInputClass(
                      Boolean(passwordFieldError),
                      "h-10 w-full rounded-lg border border-brand-green/20 bg-slate-50 px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 dark:border-border-subtle dark:bg-surface-secondary",
                    )}
                    value={adminForm.password}
                    onChange={(e) => {
                      setAdminForm({ ...adminForm, password: e.target.value });
                      if (passwordFieldError) setError(null);
                    }}
                  />
                  {passwordFieldError && (
                    <p className={transactionPasswordErrorClass}>{passwordFieldError}</p>
                  )}
                </div>
              </div>

              <div className="hidden h-10 w-px shrink-0 bg-zinc-100 dark:bg-surface-hover sm:block" />

              <div className="min-w-0 shrink-0 text-left">
                <p className="mb-1 text-[9px] font-black uppercase leading-none tracking-[0.2em] text-brand-green/70 dark:text-pawn-gold">
                  TOTAL PAYMENT
                </p>
                <p className={`font-black leading-none tracking-tighter text-brand-green dark:text-white ${compactTablet ? "text-xl sm:text-2xl md:text-[2rem]" : "text-xl sm:text-2xl md:text-3xl"}`}>
                  ₱ {totalToPay.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              disabled={isLoading || !selectedItem}
              onClick={handleProceedRequest}
              className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[9px] font-black uppercase tracking-wide transition-all active:scale-[0.98] sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm sm:tracking-wider ${compactTablet ? "md:px-8" : "sm:px-10 md:px-12 md:py-5"} ${isLoading || !selectedItem ? "cursor-not-allowed bg-zinc-100 text-zinc-300 dark:bg-surface-hover" : "bg-brand-green text-white shadow-xl shadow-brand-green/30 hover:brightness-110"}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-1.5">
                  <span className="anim-loading h-4 w-4 rounded-full border-white/30 border-t-white sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Processing...</span>
                </div>
              ) : (
                <>
                  {isReappraiseActive ? "PROCESS REAPPRAISAL" : "PROCESS RENEWAL"}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <QrScanner 
        isOpen={isScannerOpen} 
        onScan={handleQrScan} 
        onClose={() => setIsScannerOpen(false)} 
      />
      <RenewalProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        onConfirm={executeTransaction}
        isLoading={isLoading}
      />
      <ConfirmActionModal
        isOpen={isCancelConfirmOpen}
        title="Cancel renewal?"
        message="Are you sure you want to cancel this renewal transaction? Your progress will not be saved."
        confirmLabel="Yes, Cancel"
        cancelLabel="Continue"
        variant="warning"
        zIndexClass="z-[210]"
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={async () => {
          onClose();
        }}
      />
      <TransactionConfirmModal
        isOpen={isConfirmOpen}
        title={isReappraiseActive ? "Confirm reappraisal?" : "Confirm renewal?"}
        message={
          isReappraiseActive
            ? "This will update the pawn principal and record a reappraisal transaction permanently."
            : "This will record the renewal payment and update the pawn contract permanently."
        }
        details={selectedItem ? [
          { label: "Customer", value: selectedItem.name },
          { label: "Unit", value: selectedItem.unit },
          { label: "Unit Code", value: selectedItem.unitCode },
          { label: "Total Payment", value: `₱ ${totalToPay.toLocaleString()}` },
        ] : []}
        confirmLabel={isReappraiseActive ? "Yes, Process Reappraisal" : "Yes, Process Renewal"}
        isLoading={isLoading}
        onClose={() => {
          if (!isLoading) setIsConfirmOpen(false);
        }}
        onConfirm={handleProceed}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ title, icon: Icon, isDark = false }: { title: string, icon: React.ComponentType<{ className?: string }>, isDark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-brand-green text-pawn-gold' : 'bg-white text-brand-green shadow-sm border border-brand-green/20 dark:bg-surface dark:border-border-subtle'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className={`text-[9px] font-black uppercase tracking-[2px] ${isDark ? 'text-pawn-gold' : 'text-brand-green/70 dark:text-white'}`}>
        {title}
      </h3>
    </div>
  );
}

function StaticDetailRow({ label, value }: { label: string, value: string | number | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 group">
      <span className="text-[10px] font-bold text-brand-green/70 dark:text-white/60 uppercase tracking-tighter whitespace-nowrap shrink-0">
        {label}:
      </span>
      <div className="flex-1 border-b border-brand-green/20 dark:border-border-subtle border-dashed group-hover:border-brand-green/40 transition-colors" />
      <span className="text-[12px] font-black text-brand-green dark:text-white tracking-tight">
        {value || "---"}
      </span>
    </div>
  );
}

function TabletMetricCard({ label, value, className = "", accent = false }: { label: string; value: string | number | undefined; className?: string; accent?: boolean }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-brand-green/20 bg-white/85 p-4 shadow-sm shadow-brand-green/5 dark:border-white/5 dark:bg-black/20 ${className}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-brand-green/70 dark:text-pawn-gold">
        {label}
      </p>
      <p className={`mt-2 truncate leading-tight ${accent ? "text-lg font-black text-brand-green dark:text-white md:max-xl:text-xl" : "text-[13px] font-semibold text-text-primary dark:text-white/80 md:max-xl:text-[14px]"}`}>
        {value || "---"}
      </p>
    </div>
  );
}

function TabletDetailRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-brand-green/20 bg-white px-3 py-2.5 dark:border-white/5 dark:bg-white/5">
      <span className="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.18em] text-brand-green/70 dark:text-white/55">
        {label}
      </span>
      <span className="min-w-0 max-w-[52%] shrink-0 truncate text-right text-[12px] font-bold text-brand-green dark:text-white">
        {value || "---"}
      </span>
    </div>
  );
}

function ActionToggle({ label, isActive, onClick, sub, compact = false }: { label: string, isActive: boolean, onClick: () => void, sub?: string, compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-0 flex-col gap-0.5 rounded-2xl text-left transition-all group ${
        compact ? "p-2.5" : "p-3"
      } ${
        isActive
          ? "border-2 border-pawn-gold bg-brand-green/10 shadow-lg dark:border-pawn-gold dark:bg-brand-green/40"
          : "border border-white/10 bg-white/10 text-white/40 hover:border-pawn-gold/60 dark:border-white/10 dark:bg-surface/5 dark:text-white/40 dark:hover:bg-white/5"
      }`}
    >
      <div className={`mb-1 flex h-3 w-3 items-center justify-center rounded-full border-2 ${isActive ? "border-brand-green dark:border-white" : "border-current"}`}>
        {isActive && <div className="h-1 w-1 rounded-full bg-brand-green dark:bg-white" />}
      </div>
      <p className={`font-black uppercase tracking-tight ${compact ? "text-[9px]" : "text-[10px]"} ${isActive ? "text-brand-green dark:text-white" : "text-current"}`}>{label}</p>
      {sub && <p className={`font-bold leading-none ${compact ? "text-[7px]" : "text-[8px]"} ${isActive ? "text-brand-green/60 dark:text-white/60" : "text-current"}`}>{sub}</p>}
    </button>
  );
}
