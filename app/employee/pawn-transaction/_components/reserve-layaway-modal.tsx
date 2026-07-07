"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getTransactionDateTimeFields } from "@/lib/time";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";

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
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity no-print" onClick={onClose} />
      <div
        className="relative z-10 flex h-[95vh] sm:h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl shadow-emerald-900/20 animate-in fade-in zoom-in-95 duration-300 dark:bg-background dark:shadow-black/40"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-4 py-3 sm:px-6 sm:py-5 text-white">
          <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-emerald-700/50 bg-emerald-800 text-emerald-300 shadow-inner shrink-0">
                  <Tag />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300/90 truncate">
                    <span className="truncate">{branchName}</span>
                    <span className="hidden sm:inline"> | Available Inventory</span>
                  </p>
                  <h1 className="mt-0.5 text-sm sm:text-xl font-black leading-none tracking-tight text-white truncate">
                    Reserve / Layaway
                  </h1>
                </div>
              </div>

            <button
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white"
              aria-label="Close Reserve / Layaway modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content — single scroll on mobile, side-by-side on lg+ */}
        <div className="flex flex-1 overflow-y-auto flex-col lg:flex-row lg:overflow-hidden">

          {/* Left: Item search panel */}
          <div className="flex w-full shrink-0 flex-col border-b border-emerald-50 bg-emerald-50/30 dark:border-border dark:bg-surface-secondary lg:w-[380px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Search className="text-emerald-600/40 dark:text-emerald-400/40 shrink-0" />
                <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
                  Search Available Item
                </h3>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Name, Unit Code, Price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border-2 border-emerald-100 bg-white pl-10 pr-4 text-xs font-medium outline-none transition-all focus:border-emerald-500 dark:border-border-subtle dark:bg-surface dark:text-white"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200 transition-colors group-focus-within:text-emerald-500" />
              </div>
            </div>

            {/* Item list — limited height on mobile to avoid pushing content off screen */}
            <div className="max-h-52 lg:max-h-none lg:flex-1 overflow-y-auto px-3 pb-4 sm:px-4">
              {isLoading ? (
                <div className="flex h-24 flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-50 border-t-transparent" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/40 dark:text-emerald-400">
                    Loading...
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-100 bg-white p-4 text-center shadow-sm dark:border-border-subtle dark:bg-surface">
                  <Tag className="h-5 w-5 text-emerald-200 mb-2" />
                  <p className="text-xs font-bold text-emerald-900/60 dark:text-zinc-200">No available items found</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-tighter text-emerald-900/30 dark:text-zinc-400">
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
                    className={`mb-2 w-full rounded-xl border p-3 text-left transition-all ${
                      selectedItem?.id === item.id
                        ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/40"
                        : "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-border-subtle dark:bg-surface dark:hover:bg-surface-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{item.itemId}</p>
                        <h4 className="mt-0.5 truncate text-xs font-bold text-zinc-900 dark:text-white">{item.itemName}</h4>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500 dark:text-zinc-400">{item.description || "No description available."}</p>
                      </div>
                      <div className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Details + Form */}
          <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">

              {/* Item header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-border-subtle">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-700/70 dark:text-emerald-400">Reserve Details</p>
                  <h2 className="mt-0.5 text-sm sm:text-base font-black text-zinc-900 dark:text-white truncate">
                    {selectedItem ? selectedItem.itemName : "Select an item to start"}
                  </h2>
                  <p className="mt-1 text-[11px] leading-5 text-zinc-500 dark:text-zinc-300">
                    Reservation with partial payment. The item stays on hold until the balance is fully settled.
                  </p>
                </div>
                <div className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
                  {selectedStatusChip}
                </div>
              </div>

              {/* Stat cards */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Item Price", value: selectedItem ? formatCurrency(selectedPrice) : "₱0.00" },
                  { label: "Downpayment", value: formatCurrency(downpaymentValue || 0) },
                  { label: "Remaining", value: selectedItem ? formatCurrency(remainingBalance) : "₱0.00" },
                  { label: "Hold Status", value: "Reserved" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-border-subtle dark:bg-surface">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
                    <p className="mt-1 text-sm font-black text-zinc-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Layaway rules */}
              <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 sm:p-4 dark:border-border-subtle dark:bg-surface">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="text-emerald-600 shrink-0" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-700 dark:text-zinc-200">Layaway Rules</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { title: "RESERVED", note: "Item is held for the customer." },
                    { title: "PARTIALLY PAID", note: "Downpayment has been recorded." },
                    { title: "COMPLETED", note: "Full balance has been paid." },
                    { title: "CANCELLED", note: "Reservation was not completed." },
                  ].map((rule) => (
                    <div key={rule.title} className="rounded-xl border border-white bg-white p-2.5 shadow-sm dark:border-border-subtle dark:bg-surface-secondary">
                      <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase">{rule.title}</p>
                      <p className="mt-1 text-[10px] leading-4 text-zinc-500 dark:text-zinc-300">{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer + Payment forms */}
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {/* Customer Info */}
                <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-border-subtle dark:bg-surface">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-3">Customer Information</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="Contact number" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="terms" value={form.terms} onChange={handleChange} placeholder="Terms e.g. 30 days" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>
                  <textarea name="address" value={form.address} onChange={handleChange} placeholder="Customer address" rows={3} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                </div>

                {/* Payment & Approval */}
                <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-border-subtle dark:bg-surface">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-3">Payment &amp; Approval</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Downpayment</label>
                      <input name="downpayment" value={form.downpayment} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Remaining Balance</label>
                      <div className="flex h-[34px] items-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-black text-zinc-900 dark:border-border-subtle dark:bg-surface-secondary dark:text-white">
                        {selectedItem ? formatCurrency(remainingBalance) : "₱0.00"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3 dark:border-border-subtle dark:bg-surface-secondary">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                      <Clock className="text-emerald-600 shrink-0" />
                      <p className="text-[11px] font-bold">Item held until full balance is paid.</p>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-zinc-500 dark:text-zinc-300">
                      Records the downpayment first. The item stays on hold until the layaway is fully settled.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-zinc-100 bg-zinc-50 dark:border-border-subtle dark:bg-surface">
              <div className="px-4 py-3 sm:px-5">
                {/* Row 1: Password + Cancel */}
                <div className="flex items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="mb-1 block text-[9px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[0.2em]">Password</label>
                    <input
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      type="password"
                      placeholder="••••••••"
                      className="h-9 w-full rounded-lg border border-emerald-100 dark:border-border-subtle bg-slate-50 dark:bg-surface-secondary px-3 text-xs text-text-primary outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-text-muted"
                    />
                  </div>
                  <button
                    onClick={onClose}
                    className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-border-subtle dark:bg-surface-secondary dark:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRequest}
                    disabled={isConfirming || !selectedItem || !isFormValid}
                    className="shrink-0 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                  >
                    {isConfirming ? "Processing..." : "Create Reserve / Layaway"}
                  </button>
                </div>
                {error && <p className="mt-2 text-[10px] font-semibold text-rose-600">{error}</p>}
              </div>
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
