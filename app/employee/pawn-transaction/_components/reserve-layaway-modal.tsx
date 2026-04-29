"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDateToYMD } from "@/lib/time";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";

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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        purpose: "Reserve / Layaway",
        transaction_date: formatDateToYMD(),
        transaction_time: new Date().toTimeString().slice(0, 8),
        branch_id: branchId,
        branch: branchName,
        cash_in: downpaymentValue,
        cash_out: 0,
        unit: selectedItem.itemName,
        unit_code: selectedItem.itemId,
        details: detailsObject,
        related_sale_item_id: selectedItem.id,
      });

      onSuccess?.();
      onClose();
      toast.success("Reserve / Layaway transaction recorded successfully!");
    } catch (confirmError: any) {
      const msg = confirmError?.message || "Failed to process reserve / layaway transaction.";
      setError(msg);
      toast.error(msg);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div
        className="relative z-10 flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-emerald-900/20 animate-in fade-in zoom-in-95 duration-300 dark:bg-surface dark:shadow-black/40"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-700/50 bg-emerald-800 text-emerald-300 shadow-inner">
                <Tag />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90 dark:text-emerald-400">
                  {branchName} | Available Inventory
                </p>
                <h1 className="mt-1 text-2xl font-black leading-none tracking-tight text-white">
                  Reserve / Layaway
                </h1>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close Reserve / Layaway modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <div className="flex w-full shrink-0 flex-col border-r border-emerald-50 bg-emerald-50/30 dark:border-border dark:bg-surface-secondary lg:w-[420px]">
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Search className="text-emerald-600/40 dark:text-emerald-400/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400">
                  Search Available Item
                </h3>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Name, Unit Code, Price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-emerald-100 bg-white pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-emerald-500 dark:border-border-subtle dark:bg-surface dark:text-white"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-200 transition-colors group-focus-within:text-emerald-500" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
              {isLoading ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-50 border-t-transparent dark:border-border0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/40 dark:text-emerald-400">
                    Loading available items...
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-100 bg-white p-6 text-center shadow-sm dark:border-border-subtle dark:bg-surface">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-200">
                    <Tag className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-emerald-900/60 dark:text-zinc-200">No available items found</p>
                  <p className="mt-1 text-[10px] uppercase tracking-tighter text-emerald-900/30 dark:text-zinc-400">
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
                        ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:bg-emerald-950/40"
                        : "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-border-subtle dark:bg-surface dark:hover:bg-surface-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{item.itemId}</p>
                        <h4 className="mt-1 truncate text-sm font-bold text-zinc-900 dark:text-white">{item.itemName}</h4>
                        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">{item.description || "No description available."}</p>
                      </div>
                      <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-surface-secondary">
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-border-subtle">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-700/70 dark:text-emerald-400">Reserve Details</p>
                  <h2 className="mt-1 text-xl font-black text-zinc-900 dark:text-white">
                    {selectedItem ? selectedItem.itemName : "Select an item to start"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-300">
                    Reservation with partial payment. The item stays on hold until the balance is fully settled.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
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
                  <ShieldCheck className="text-emerald-600" />
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
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{rule.title}</p>
                      <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-300">{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Customer Information</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="Contact number" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                    <input name="terms" value={form.terms} onChange={handleChange} placeholder="Terms e.g. 30 days" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>
                  <textarea name="address" value={form.address} onChange={handleChange} placeholder="Customer address" rows={4} className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                </div>

                <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-border-subtle dark:bg-surface">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Payment & Approval</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Downpayment</label>
                      <input name="downpayment" value={form.downpayment} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
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
                      <Clock className="text-emerald-600" />
                      <p className="text-sm font-bold">This item is held until the customer pays the full balance.</p>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-300">
                      Reserve / Layaway records the downpayment first. The item should remain on hold until the layaway is fully settled.
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Password</label>
                    <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Enter password to confirm" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:border-border-subtle dark:bg-surface-secondary dark:text-white" />
                  </div>

                  {error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-zinc-100 bg-zinc-50 p-5 dark:border-border-subtle dark:bg-surface">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-zinc-500 dark:text-zinc-300">
                  <span className="font-black uppercase tracking-[0.24em] text-zinc-400">Content summary:</span> Hold the item, record a downpayment, and keep the balance visible until completion.
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-border-subtle dark:bg-surface-secondary dark:text-zinc-200">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming || !selectedItem || !isFormValid}
                    className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConfirming ? "Processing..." : "Create Reserve / Layaway"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
