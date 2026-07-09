"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PhilippineAddressFields } from "@/components/shared/philippine-address-fields";

interface SellsTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  branchName: string;
  initialItem?: InitialInventoryItem;
  compactTablet?: boolean;
}

interface InventoryItem {
  id: string;
  unitId: string;
  unit: string;
  serialNumber: string;
  included: string;
  condition: string;
  memory: string;
  barcodeId: string;
  srp: string;
}

interface InitialInventoryItem {
  id: string;
  unitId: string;
  unit: string;
  srp: string;
  serialNumber?: string;
  included?: string;
  condition?: string;
  memory?: string;
  barcodeId?: string;
}

interface ForSaleApiItem {
  id: string;
  itemId?: string;
  itemName?: string;
  price?: number | string;
}

interface BranchApiItem {
  id: string;
  branch_name?: string;
  name?: string;
}

interface CustomerResponse {
  id?: string;
}

function normalizeInventoryItem(item: InitialInventoryItem): InventoryItem {
  return {
    id: item.id,
    unitId: item.unitId,
    unit: item.unit,
    serialNumber: item.serialNumber || "---",
    included: item.included || "---",
    condition: item.condition || "---",
    memory: item.memory || "---",
    barcodeId: item.barcodeId || "---",
    srp: item.srp,
  };
}

function getBranchName(branch?: BranchApiItem) {
  return branch?.branch_name || branch?.name || "Other Branch";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SellsTransferModal({ isOpen, onClose, branchName, onSuccess, initialItem, compactTablet = false }: SellsTransferModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branches] = useState<BranchApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    barangay: "",
    city: "",
    region: "",
    targetBranchId: "",
    contactNo: "",
    priceSold: "",
    sellTransfer: "Sales",
    status: "Available",
    itemIncluded: "",
    password: "",
  });

  const { selectedBranch } = useBranch();
  const [isConfirming, setIsConfirming] = useState(false);
  const isProcessingRef = useRef(false);
  const initialItemId = initialItem?.id;
  const initialItemUnitId = initialItem?.unitId;
  const initialItemUnit = initialItem?.unit;
  const initialItemSrp = initialItem?.srp;
  const isItemLocked = Boolean(initialItem);

  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        if (initialItem) {
          const normalizedInitialItem = normalizeInventoryItem(initialItem);
          setSelectedItem(normalizedInitialItem);
          setItems([normalizedInitialItem]);
          setSearchQuery("");
          setForm(prev => ({
            ...prev,
            priceSold: normalizedInitialItem.srp,
            itemIncluded: normalizedInitialItem.included === "---" ? "" : normalizedInitialItem.included,
          }));
          return;
        }

        const branchQ = selectedBranch?.id !== "__all__" ? `&branch=${selectedBranch.id}` : "";
        const response = await api.get<{ items: ForSaleApiItem[] }>(`/inventory/for-sale?status=Available&search=${searchQuery}&limit=100${branchQ}`);
        const mapped = (response.items || []).map(item => ({
          id: item.id,
          unitId: item.itemId || item.id,
          unit: item.itemName || "Unnamed item",
          serialNumber: "---",
          included: "---",
          condition: "---",
          memory: "---",
          barcodeId: "---",
          srp: String(item.price || 0)
        }));

        setSelectedItem(null);
        setItems(mapped);
      } catch (err) {
        console.error("Failed to fetch inventory items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, searchQuery, selectedBranch, initialItem, initialItemId, initialItemUnitId, initialItemUnit, initialItemSrp]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === "contactNo") {
      setForm(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }));
      return;
    }
    
    if (name === "priceSold" || type === "number") {
      setForm(prev => ({ ...prev, [name]: value.replace(/[^0-9.]/g, "") }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };


  const isFormValid = Boolean(
    selectedItem &&
    form.password &&
    form.firstName &&
    form.lastName &&
    form.address &&
    form.barangay &&
    form.city &&
    form.region &&
    form.contactNo &&
    form.priceSold
  );

  const handleConfirmAction = async () => {
    if (isProcessingRef.current) return;
    if (!selectedItem || !isFormValid) return;
    try {
      isProcessingRef.current = true;
      setIsConfirming(true);
      
      // Verify Password
      await api.post("/auth/verify-password", { password: form.password });
 
      console.log("Creating customer record for buyer...");
      const customer = await api.post<CustomerResponse>("/customers", {
        full_name: `${form.firstName} ${form.middleName ? form.middleName + ' ' : ''}${form.lastName}`,
        address: form.address,
        barangay: form.barangay,
        city: form.city,
        region: form.region,
        contact_number: form.contactNo,
        branch_id: selectedBranch?.id !== "__all__" ? selectedBranch?.id : undefined
      });

      await api.post(`/inventory/for-sale/${selectedItem.id}/mark-sold`, {
        sold_price: Number(form.priceSold || 0),
        branch_id: selectedBranch?.id,
        customer_id: customer?.id
      });

      toast.success("Item marked as sold successfully!");

      if (onSuccess) onSuccess();
      onClose();
      toast.success("Sale transaction completed successfully!");
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to process sale transaction."));
    } finally {
      setIsConfirming(false);
      isProcessingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity no-print" onClick={onClose} />
      <div 
        className={`relative w-full max-w-7xl h-[90vh] flex flex-col bg-white dark:bg-background rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10 ${compactTablet ? "md:h-[calc(100dvh-4rem)] md:max-w-6xl lg:h-[88vh] xl:max-w-7xl" : "md:h-[calc(100dvh-3rem)] lg:h-[90vh]"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-4 py-3 sm:px-6 sm:py-5 text-white shrink-0 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-800 flex items-center justify-center text-emerald-300 shadow-inner border border-emerald-700/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
                </svg>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300/90 dark:text-emerald-400 truncate">
                  {branchName}
                </p>
                <h1 className="mt-0.5 text-sm sm:text-2xl font-black tracking-tight text-white leading-none truncate">
                  {isItemLocked ? "Sell Item" : "Sells"}
                </h1>
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close Sells Transfer modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
          
          {/* Left Side: Inventory & Selection Details */}
          <div className="flex w-full flex-col gap-8 border-emerald-50 bg-emerald-50/30 p-4 dark:border-border dark:bg-surface-secondary sm:p-6 xl:w-[60%] xl:overflow-y-auto xl:border-r xl:p-8">
            
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-emerald-600 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[2px] text-emerald-800/70 dark:text-emerald-300">
                    {isItemLocked ? "Selected Inventory Item" : "Select Inventory Item"}
                  </h3>
                </div>
                {!isItemLocked && (
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search Unit ID / Serial..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:max-w-xs bg-white dark:bg-surface-secondary border border-emerald-100 dark:border-border-subtle rounded-xl px-4 py-2 text-xs font-bold text-text-primary dark:text-white placeholder:text-text-muted focus:ring-4 ring-emerald-500/10 outline-none transition-all"
                    />
                    <div className="absolute right-3 top-2 text-emerald-500 dark:text-emerald-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    </div>
                  </div>
                )}
              </div>

              {isItemLocked && selectedItem ? (
                <div className="rounded-2xl border border-border-main bg-surface p-4 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 rounded-xl bg-emerald-900 p-4 text-white shadow-inner sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Ready to Sell</p>
                      <p className="mt-1 text-xl font-black leading-tight text-white">{selectedItem.unit}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">{selectedItem.unitId}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Sale Price</p>
                      <p className="mt-1 text-2xl font-black text-white">&#8369; {Number(selectedItem.srp || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300 sm:grid-cols-4">
                    <div>
                      <p>Included</p>
                      <p className="mt-1 text-xs text-text-primary">{selectedItem.included}</p>
                    </div>
                    <div>
                      <p>Condition</p>
                      <p className="mt-1 text-xs text-text-primary">{selectedItem.condition}</p>
                    </div>
                    <div>
                      <p>Memory</p>
                      <p className="mt-1 text-xs text-text-primary">{selectedItem.memory}</p>
                    </div>
                    <div>
                      <p>Barcode ID</p>
                      <p className="mt-1 text-xs text-text-primary">{selectedItem.barcodeId}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 dark:border-border-subtle bg-white dark:bg-surface overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[350px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-emerald-50 dark:bg-surface-secondary">
                        <tr>
                          {["UnitID", "Unit", "Serial #", "Included", "Condition", "Memory", "Barcode ID"].map((h) => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-emerald-100 text-emerald-800 dark:border-border-subtle dark:text-emerald-300">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 dark:divide-border-subtle">
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <span className="anim-loading h-6 w-6 border-emerald-500/50 border-t-emerald-600 rounded-full" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">Loading items...</span>
                              </div>
                            </td>
                          </tr>
                        ) : items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                              No items available for sale.
                            </td>
                          </tr>
                        ) : (
                          items.map(item => (
                            <tr 
                              key={item.id} 
                              onClick={() => setSelectedItem(item)}
                              className={`cursor-pointer transition-colors group ${selectedItem?.id === item.id ? "bg-emerald-600 text-white" : "hover:bg-emerald-50 dark:hover:bg-emerald-600/10 dark:text-zinc-200"}`}
                            >
                              <td className={`px-4 py-3 text-xs font-black ${selectedItem?.id === item.id ? "text-white" : "text-emerald-700 dark:text-emerald-300"}`}>{item.unitId}</td>
                              <td className="px-4 py-3 text-xs font-bold leading-tight">{item.unit}</td>
                              <td className="px-4 py-3 text-[10px] font-mono opacity-80">{item.serialNumber}</td>
                              <td className="px-4 py-3 text-[10px] font-bold opacity-80">{item.included}</td>
                              <td className="px-4 py-3 text-[10px] font-bold opacity-80">{item.condition}</td>
                              <td className="px-4 py-3 text-[10px] font-bold opacity-80">{item.memory}</td>
                              <td className="px-4 py-3 text-[10px] font-bold opacity-80">{item.barcodeId}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Selection Specifics */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-400 rounded-full" />
                  <h4 className="text-[10px] font-black uppercase tracking-[2px] text-emerald-800/70 dark:text-emerald-300">Transaction Details</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300">Status:</span>
                    <div className="rounded-lg bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{form.status}</div>
                  </div>
                  <div className="flex items-center justify-between gap-4 group">
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-tighter text-emerald-800/70 dark:text-emerald-300">
                      Transaction:
                    </span>
                    <div className="flex-1 border-b border-dashed border-emerald-100 dark:border-border-subtle dark:border-border-subtle" />
                    <div className="min-w-[140px] rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-left text-xs font-black text-emerald-800 dark:border-border-subtle dark:bg-emerald-500/10 dark:text-emerald-300">
                      Sell
                    </div>
                  </div>
                  <DetailInput label="Item Included" name="itemIncluded" value={form.itemIncluded} onChange={handleChange} placeholder={selectedItem?.included || "Specify items..."} />
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-emerald-100 dark:border-border-subtle">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800/70 dark:text-emerald-300">SRP:</span>
                    <span className="text-lg font-black text-emerald-950 dark:text-white">₱ {Number(selectedItem?.srp || 0).toLocaleString()}</span>
                  </div>
                  {form.sellTransfer === "Sales" ? (
                    <DetailInput label="Price Sold" name="priceSold" value={form.priceSold} onChange={handleChange} type="number" prefix="₱" highlight />
                  ) : (
                    <div className="flex items-center justify-between gap-4 group">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-tighter text-emerald-800/70 dark:text-emerald-300">To Branch:</span>
                      <div className="flex-1 border-b border-dashed border-emerald-100 dark:border-border-subtle" />
                      <div className="relative flex min-w-[140px] items-center rounded-xl border border-emerald-100 bg-white transition-all focus-within:ring-4 ring-emerald-500/10 dark:border-border-subtle dark:bg-surface-secondary">
                        <select
                          name="targetBranchId"
                          value={form.targetBranchId}
                          onChange={handleChange}
                          className="w-full bg-transparent border-none text-left text-xs font-black text-emerald-950 dark:text-white pl-4 pr-8 py-2 cursor-pointer appearance-none outline-none focus:ring-0"
                        >
                          <option value="">— Select Branch —</option>
                          {branches
                            .filter((b) => b.id !== selectedBranch?.id)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {getBranchName(b)}
                              </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer's Information — always visible on mobile, inside left panel */}
              {form.sellTransfer === "Sales" && (
                <div className="space-y-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5 dark:border-white/5 dark:bg-black/20 xl:hidden">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-emerald-950 dark:text-white">Buyer&apos;s Information</h3>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300">Please fill in current details</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
                      <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
                      <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
                    </div>

                    <PhilippineAddressFields
                      value={{
                        address: form.address,
                        barangay: form.barangay,
                        city: form.city,
                        region: form.region,
                      }}
                      onFieldChange={(field, val) => setForm(prev => ({ ...prev, [field]: val }))}
                    />

                    <Input label="Contact Number" name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="09XX-XXX-XXXX" />
                  </div>
                </div>
              )}
            </div>
          </div>

           {/* Right Side: Buyer's Information Panel (desktop xl+ only) */}
          <div className={`min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8 hidden xl:block`}>
            {form.sellTransfer === "Sales" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-950 dark:text-white uppercase tracking-tight">Buyer&apos;s Information</h3>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300">Please fill in current details</p>
                    </div>
                  </div>
                </div>

                <div className={compactTablet ? "grid gap-4 md:max-xl:gap-4" : "grid gap-6"}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
                    <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
                    <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
                  </div>

                  <PhilippineAddressFields
                    value={{
                      address: form.address,
                      barangay: form.barangay,
                      city: form.city,
                      region: form.region,
                    }}
                    onFieldChange={(field, val) => setForm(prev => ({ ...prev, [field]: val }))}
                  />

                  <Input label="Contact Number" name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="09XX-XXX-XXXX" />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
                </div>
                <div className="space-y-2 max-w-sm">
                   <h3 className="text-2xl font-black text-emerald-950 dark:text-white uppercase tracking-tight">Internal Transfer</h3>
                   <p className="text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-300">
                     Moving an item between branches does not record any cash movement.
                     The item will be deducted from <strong>{branchName}</strong> and added to the target branch inventory.
                   </p>
                </div>
                <div className="w-full p-6 rounded-2xl border-2 border-dashed border-emerald-100 dark:border-border bg-emerald-50/30 dark:bg-surface-secondary text-left space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Movement Summary</p>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-300">From:</span>
                      <span className="text-xs font-black text-emerald-950 dark:text-white">{branchName}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-300">To:</span>
                      <span className="text-xs font-black text-emerald-600">
                        {form.targetBranchId ? getBranchName(branches.find((b) => b.id === form.targetBranchId)) : "Select Destination..."}
                      </span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`shrink-0 border-t border-emerald-50 bg-white dark:border-border-subtle dark:bg-surface ${compactTablet ? "md:px-6" : ""}`}>
          <div className="flex items-end gap-2 p-3 sm:gap-4 sm:px-6 sm:py-4 lg:gap-6 lg:px-8 lg:py-5">
            <div className="flex min-w-0 flex-1 items-end gap-2 sm:gap-4">
              <div className="w-[min(38%,8.5rem)] shrink-0 sm:w-40">
                <label className="mb-1 block text-[9px] font-bold uppercase tracking-tighter text-emerald-800/70 dark:text-emerald-300">Password</label>
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  type="password"
                  className="h-10 w-full rounded-lg border border-emerald-100 bg-slate-50 px-3 text-xs font-bold text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-border-subtle dark:bg-surface-secondary dark:text-white dark:placeholder:text-zinc-600"
                />
              </div>

              <div className="hidden h-10 w-px shrink-0 bg-zinc-100 dark:bg-surface-hover sm:block" />

              <div className="min-w-0 shrink-0 text-left">
                <p className="mb-1 text-[8px] font-black uppercase leading-none tracking-[0.15em] text-emerald-800/70 dark:text-emerald-300 sm:text-[9px]">
                  {form.sellTransfer === "Sales" ? "Sale Price" : "SRP Value"}
                </p>
                <p className="text-base font-black tracking-tighter text-emerald-950 dark:text-white sm:text-lg lg:text-2xl">
                  ₱ {Number(form.sellTransfer === "Sales" ? form.priceSold : (selectedItem?.srp || 0)).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              disabled={!isFormValid || isConfirming}
              onClick={handleConfirmAction}
              className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[9px] font-black uppercase tracking-wide transition-all active:scale-[0.98] sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-[10px] ${isFormValid ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700" : "cursor-not-allowed bg-zinc-100 text-zinc-300 dark:bg-surface-hover"}`}
            >
              {isConfirming ? (
                <div className="flex items-center gap-1.5">
                  <span className="anim-loading h-3.5 w-3.5 rounded-full border-white/30 border-t-white" />
                  <span className="hidden sm:inline">Processing...</span>
                </div>
              ) : (
                <>
                  Confirm &amp; Print
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailInput({ label, name, value, onChange, placeholder, type = "text", prefix, highlight }: { 
  label: string; 
  name: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 group">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-tighter text-emerald-800/70 dark:text-emerald-300">{label}:</span>
      <div className="flex-1 border-b border-dashed border-emerald-100 dark:border-border-subtle" />
      <div className={`relative flex items-center rounded-xl border border-emerald-100 bg-white transition-all focus-within:ring-4 ring-emerald-500/10 dark:border-border-subtle dark:bg-surface-secondary ${highlight ? "min-w-[140px]" : "min-w-[120px]"}`}>
        {prefix && <span className="pl-3 text-[10px] font-black text-emerald-600 dark:text-emerald-300">{prefix}</span>}
        <input 
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-transparent px-3 py-1.5 text-xs font-black text-emerald-950 outline-none placeholder:text-zinc-400 placeholder:font-medium dark:text-white dark:placeholder:text-zinc-500 ${highlight ? "text-right" : ""}`}
        />
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, type = "text", bg = "bg-white dark:bg-surface-secondary", size = "md" }: { 
  label: string; 
  name: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  type?: string;
  bg?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="ml-1 text-[10px] font-bold uppercase tracking-tighter text-emerald-800/70 dark:text-emerald-300">{label}</label>}
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        className={`w-full rounded-xl border border-emerald-100 dark:border-border-subtle ${bg} ${size === "sm" ? "py-2" : "py-3"} px-4 text-xs font-black text-emerald-950 outline-none transition-all placeholder:font-medium placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:text-white dark:placeholder:text-zinc-500`}
      />
    </div>
  );
}
