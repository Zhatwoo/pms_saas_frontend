"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getTransactionDateTimeFields } from "@/lib/time";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";
import {
  isTransactionPasswordError,
  TRANSACTION_PASSWORD_VERIFY_MESSAGE,
  transactionPasswordErrorClass,
  transactionPasswordInputClass,
} from "@/lib/transaction-password";

function Tag({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function Search({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function Wallet({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M16 10h4" />
    </svg>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface ReserveLayawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  branchId: string;
  branchName: string;
}

interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  category: string;
  branch: string;
  availableDate: string;
  price: number;
  status: "Available" | "Reserved" | "Sold";
}

function formatCurrency(value: number) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ReserveLayawayModal({ isOpen, onClose, onSuccess, branchId, branchName }: ReserveLayawayModalProps) {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();

  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNo: "",
    address: "",
    downpayment: "",
    terms: "30 days",
    password: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const branchQ = selectedBranch?.id !== "__all__" ? `&branch=${selectedBranch.id}` : "";
        const response = await api.get<{ items: any[] }>(`/inventory/for-sale?status=Available&search=${searchQuery}&limit=100${branchQ}`);
        const mapped = (response.items || []).map((item) => ({
          id: item.id,
          itemId: item.itemId || item.id,
          itemName: item.itemName || "Untitled Item",
          description: item.description || item.details || "",
          category: item.category || "",
          branch: item.branch || branchName,
          availableDate: item.availableDate || item.available_date || "",
          price: Number(item.price || 0),
          status: item.status || "Available",
        }));
        setItems(mapped);
      } catch (fetchError) {
        console.error("Failed to fetch items for reserve/layaway:", fetchError);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = window.setTimeout(fetchItems, 250);
    return () => window.clearTimeout(timeout);
  }, [isOpen, searchQuery, selectedBranch?.id, branchName]);

  const downpaymentValue = Number(form.downpayment || 0);
  const selectedPrice = selectedItem?.price || 0;
  const remainingBalance = Math.max(selectedPrice - downpaymentValue, 0);
  const isFormValid = Boolean(
    selectedItem &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.contactNo.trim() &&
      form.address.trim() &&
      form.downpayment.trim() &&
      form.password.trim(),
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === "contactNo") {
      setForm(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }));
      return;
    }
    
    if (name === "downpayment" || type === "number") {
      setForm(prev => ({ ...prev, [name]: value.replace(/[^0-9.]/g, "") }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmRequest = () => {
    if (!selectedItem) return;

    setError(null);

    if (!isFormValid) {
      setError("Please complete the customer details and downpayment.");
      return;
    }

    if (downpaymentValue <= 0 || Number.isNaN(downpaymentValue)) {
      setError("Please enter a valid downpayment.");
      return;
    }

    if (!form.password.trim()) {
      setError(TRANSACTION_PASSWORD_VERIFY_MESSAGE);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;

    setError(null);

    if (!isFormValid) {
      setError("Please complete the customer details and downpayment.");
      return;
    }

    if (downpaymentValue <= 0 || Number.isNaN(downpaymentValue)) {
      setError("Please enter a valid downpayment.");
      return;
    }

    if (!form.password.trim()) {
      setError(TRANSACTION_PASSWORD_VERIFY_MESSAGE);
      return;
    }

    setIsConfirming(true);
    try {
      await api.post("/auth/verify-password", { password: form.password });

      const customerName = `${form.firstName} ${form.middleName ? `${form.middleName} ` : ""}${form.lastName}`.replace(/\s+/g, " ").trim();
      
      const detailsObject = {
        customer: customerName,
        contact: form.contactNo,
        address: form.address,
        itemReserved: selectedItem.itemName,
        price: selectedPrice,
        downpayment: downpaymentValue,
        remainingBalance,
        terms: form.terms,
        status: "RESERVED / PARTIALLY_PAID",
        processedBy: user?.fullName || "Admin",
      };

      await api.post("/transactions", {
        ...getTransactionDateTimeFields(),
        purpose: "Reserve / Layaway",
        branch_id: branchId,
        branch: branchName,
        cash_in: downpaymentValue,
        cash_out: 0,
        unit: selectedItem.itemName,
        unit_code: selectedItem.itemId,
        details: JSON.stringify(detailsObject),
        related_sale_item_id: selectedItem.id,
        layaway: {
          customerFirstName: form.firstName.trim(),
          customerMiddleName: form.middleName.trim() || null,
          customerLastName: form.lastName.trim(),
          customerFullName: customerName,
          customerContactNumber: form.contactNo.trim(),
          customerAddress: form.address.trim(),
          itemName: selectedItem.itemName,
          itemCode: selectedItem.itemId,
          itemPrice: selectedPrice,
          downpayment: downpaymentValue,
          remainingBalance,
          terms: form.terms.trim(),
          processedByName: user?.fullName || "Admin",
        },
      });

      onSuccess?.();
      onClose();
      toast.success("Reserve / Layaway transaction recorded successfully!");
      setIsConfirmOpen(false);
    } catch (confirmError: any) {
      const msg = confirmError?.message || "Failed to process reserve / layaway transaction.";
      setError(msg);
      toast.error(msg);
      setIsConfirmOpen(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedStatusChip = useMemo(() => {
    if (!selectedItem) return "Awaiting Selection";
    if (remainingBalance <= 0) return "Completed";
    if (downpaymentValue > 0) return "Partially Paid";
    return "Reserved";
  }, [downpaymentValue, remainingBalance, selectedItem]);

  if (!isOpen) return null;

  const passwordFieldError = isTransactionPasswordError(error) ? error : null;
  const footerError = error && !passwordFieldError ? error : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-brand-green/40 backdrop-blur-md transition-opacity no-print" onClick={onClose} />
      <div
        className="relative z-10 flex h-[calc(100dvh-2rem)] min-h-0 w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-green/20 animate-in fade-in zoom-in-95 duration-300 dark:bg-background dark:shadow-black/40 sm:h-[90vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative z-30 shrink-0 bg-gradient-to-r from-brand-green via-brand-green to-brand-green px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-green/50 bg-brand-green text-pawn-gold shadow-inner">
                <Tag />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-pawn-gold/90 dark:text-pawn-gold">
                  {branchName} | Available Inventory
                </p>
                <h1 className="mt-1 text-2xl font-black leading-none tracking-tight text-white">
                  Reserve / Layaway
                </h1>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-brand-green transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close Reserve / Layaway modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className={`flex min-h-0 w-full flex-col border-r border-brand-green/10 bg-brand-green/5 dark:border-border dark:bg-surface-secondary lg:w-[420px] lg:shrink-0 ${selectedItem ? "max-lg:hidden" : "flex-1"}`}>
            <div className="sticky top-0 z-20 shrink-0 space-y-4 border-b border-brand-green/20 bg-brand-green/10 p-4 backdrop-blur-md dark:border-border dark:bg-surface-secondary sm:p-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-green/40 dark:text-pawn-gold">
                  Search Available Item
                </h3>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Name, Unit Code, Price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-brand-green/20 bg-white pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-brand-green dark:border-border-subtle dark:bg-surface dark:text-white"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green/30 transition-colors group-focus-within:text-brand-green" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
              {isLoading ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green/20 border-t-transparent dark:border-border0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/40 dark:text-pawn-gold">
                    Loading available items...
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-green/20 bg-white p-6 text-center shadow-sm dark:border-border-subtle dark:bg-surface">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green/40">
                    <Tag className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-brand-green/60 dark:text-zinc-200">No available items found</p>
                  <p className="mt-1 text-[10px] uppercase tracking-tighter text-brand-green/30 dark:text-zinc-400">
                    Try a different unit code or item name
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setForm((prev) => ({ ...prev, downpayment: prev.downpayment || String(Math.round(item.price * 0.2)) }));
                    }}
                    className={`mb-3 w-full rounded-2xl border p-4 text-left transition-all ${
                      selectedItem?.id === item.id
                        ? "border-brand-green bg-brand-green/10 shadow-lg shadow-brand-green/10 dark:bg-brand-green/30"
                        : "border-brand-green/20 bg-white hover:border-brand-green/30 hover:bg-brand-green/10 dark:border-border-subtle dark:bg-surface dark:hover:bg-surface-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-brand-green dark:text-pawn-gold">{item.itemId}</p>
                        <h4 className="mt-1 truncate text-sm font-bold text-zinc-900 dark:text-white">{item.itemName}</h4>
                        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">{item.description || "No description available."}</p>
                      </div>
                      <div className="rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-green dark:border-brand-green/30 dark:bg-brand-green/20 dark:text-pawn-gold">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-surface-secondary ${selectedItem ? "flex" : "hidden lg:flex"}`}>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="mb-4 inline-flex items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/20 dark:border-brand-green/40 dark:bg-brand-green/20 dark:text-pawn-gold dark:hover:bg-brand-green/30 lg:hidden"
                >
                  ← Change Item
                </button>
              )}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-border-subtle">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-green/70 dark:text-pawn-gold">Reserve Details</p>
                  <h2 className="mt-1 text-xl font-black text-zinc-900 dark:text-white">
                    {selectedItem ? selectedItem.itemName : "Select an item to start"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-300">
                    Reservation with partial payment. The item stays on hold until the balance is fully settled.
                  </p>
                </div>
                <div className="rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green dark:border-brand-green/30 dark:bg-brand-green/20 dark:text-pawn-gold">
                  {selectedStatusChip}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Item Price</p>
                  <p className="mt-2 text-lg font-black text-zinc-900 dark:text-white">{selectedItem ? formatCurrency(selectedPrice) : "₱0.00"}</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Downpayment</p>
                  <p className="mt-2 text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(downpaymentValue || 0)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Remaining Balance</p>
                  <p className="mt-2 text-lg font-black text-zinc-900 dark:text-white">{selectedItem ? formatCurrency(remainingBalance) : "₱0.00"}</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Hold Status</p>
                  <p className="mt-2 text-lg font-black text-zinc-900 dark:text-white">Reserved</p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-zinc-100 bg-zinc-50 p-5 dark:border-border-subtle dark:bg-surface">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-brand-green" />
                  <h3 className="text-sm font-black uppercase tracking-[0.28em] text-zinc-700 dark:text-zinc-200">Layaway Rules</h3>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { title: "RESERVED", note: "Item is held for the customer." },
                    { title: "PARTIALLY_PAID", note: "Downpayment has been recorded." },
                    { title: "COMPLETED", note: "Full balance has been paid." },
                    { title: "CANCELLED", note: "Reservation was not completed." },
                  ].map((rule) => (
                    <div key={rule.title} className="rounded-2xl border border-white bg-white p-4 shadow-sm dark:border-border-subtle dark:bg-surface-secondary">
                      <p className="text-xs font-black text-brand-green dark:text-pawn-gold">{rule.title}</p>
                      <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-300">{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Customer Information</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="Contact number" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="terms" value={form.terms} onChange={handleChange} placeholder="Terms e.g. 30 days" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>
                  <textarea name="address" value={form.address} onChange={handleChange} placeholder="Customer address" rows={4} className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                </div>

                <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Payment & Approval</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Downpayment</label>
                      <input name="downpayment" value={form.downpayment} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-brand-green dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Remaining Balance</label>
                      <div className="flex h-[46px] items-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-sm font-black text-zinc-900 dark:border-border-subtle dark:bg-surface-secondary dark:text-white">
                        {selectedItem ? formatCurrency(remainingBalance) : "₱0.00"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-border-subtle dark:bg-surface-secondary">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                      <Clock className="text-brand-green" />
                      <p className="text-sm font-bold">This item is held until the customer pays the full balance.</p>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-300">
                      Reserve / Layaway records the downpayment first. The item should remain on hold until the layaway is fully settled.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            <div className="relative z-30 shrink-0 border-t border-zinc-100 bg-zinc-50 p-4 dark:border-border-subtle dark:bg-surface sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-zinc-500 dark:text-zinc-300">
                  <span className="font-black uppercase tracking-[0.24em] text-zinc-400">Content summary:</span> Hold the item, record a downpayment, and keep the balance visible until completion.
                </div>
                <div className="flex items-end gap-3">
                  <div className="w-52">
                    <label className="mb-1 block text-[9px] font-black text-brand-green/40 dark:text-pawn-gold uppercase tracking-[0.2em]">Password</label>
                    <input
                      name="password"
                      value={form.password}
                      onChange={(e) => {
                        handleChange(e);
                        if (passwordFieldError) setError(null);
                      }}
                      type="password"
                      placeholder="••••••••"
                      className={transactionPasswordInputClass(
                        Boolean(passwordFieldError),
                        "h-10 w-full rounded-lg border border-brand-green/20 dark:border-border-subtle bg-slate-50 dark:bg-surface-secondary px-3 text-sm text-text-primary outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all placeholder:text-text-muted",
                      )}
                    />
                    {passwordFieldError && (
                      <p className={transactionPasswordErrorClass}>{passwordFieldError}</p>
                    )}
                  </div>
                  <button onClick={onClose} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-border-subtle dark:bg-surface-secondary dark:text-zinc-200">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRequest}
                    disabled={isConfirming || !selectedItem || !isFormValid}
                    className="rounded-2xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConfirming ? "Processing..." : "Create Reserve / Layaway"}
                  </button>
                </div>
              </div>
              {footerError && <p className="mt-3 text-xs font-semibold text-rose-600">{footerError}</p>}
            </div>
          </div>
        </div>
      </div>
      <TransactionConfirmModal
        isOpen={isConfirmOpen}
        title="Create reserve / layaway?"
        message="This will record the downpayment, hold the item, and create a reserve / layaway transaction permanently."
        details={selectedItem ? [
          { label: "Customer", value: `${form.firstName} ${form.lastName}`.trim() || "—" },
          { label: "Item", value: selectedItem.itemName },
          { label: "Item Code", value: selectedItem.itemId },
          { label: "Downpayment", value: formatCurrency(downpaymentValue) },
          { label: "Remaining Balance", value: formatCurrency(remainingBalance) },
        ] : []}
        confirmLabel="Yes, Create Reserve / Layaway"
        isLoading={isConfirming}
        onClose={() => {
          if (!isConfirming) setIsConfirmOpen(false);
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
