"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
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

export function SellsTransferModal({ isOpen, onClose, branchName, onSuccess, initialItem }: SellsTransferModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<BranchApiItem[]>([]);
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

  const { user } = useAuth();
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
            sellTransfer: "Sales",
            targetBranchId: "",
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

    const fetchBranches = async () => {
      try {
        const response = await api.get<BranchApiItem[]>("/branches");
        setBranches(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    const timeout = setTimeout(fetchItems, 300);
    fetchBranches();
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
    (form.sellTransfer === "Sales" 
      ? (form.firstName && form.lastName && form.address && form.barangay && form.city && form.region && form.contactNo && form.priceSold)
      : (form.targetBranchId)
    )
  );

  const handleConfirmAction = async () => {
    if (isProcessingRef.current) return;
    if (!selectedItem || !isFormValid) return;
    try {
      isProcessingRef.current = true;
      setIsConfirming(true);
      
      // Verify Password
      await api.post("/auth/verify-password", { password: form.password });
 
      if (form.sellTransfer === "Sales") {
        // 1. Create/Ensure Customer in Customer Management
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

        // 2. Mark as Sold (Backend handles transaction creation for Sold Item)
        await api.post(`/inventory/for-sale/${selectedItem.id}/mark-sold`, {
          sold_price: Number(form.priceSold || 0),
          branch_id: selectedBranch?.id,
          customer_id: customer?.id // Pass the linked customer ID
        });

        toast.success("Item marked as sold successfully!");
      } else {
        // TRANSFER LOGIC
        const targetBranch = branches.find(b => b.id === form.targetBranchId);
        const targetBranchName = getBranchName(targetBranch);
        
        // 1. Update Branch in Inventory
        await api.put(`/inventory/for-sale/${selectedItem.id}`, {
          branch_id: form.targetBranchId,
          branch: targetBranchName
        });

        // 2. Create Transaction Log for Transfer
        await api.post("/transactions", {
          purpose: "Transfer Item",
          cash_in: 0,
          cash_out: 0,
          unit: selectedItem.unit,
          unit_code: selectedItem.unitId,
          details: `Item transferred from ${branchName} to ${targetBranchName} | Included: ${form.itemIncluded} | Processed by: ${user?.fullName || 'Admin'}`,
          branch: branchName
        });

        toast.success(`Item transferred to ${targetBranchName} successfully!`);
      }

      if (onSuccess) onSuccess();
      onClose();
      toast.success("Item marked for sales transfer successfully!");
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to process Sales/Transfer transaction."));
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
        className="relative w-full max-w-7xl h-[90vh] flex flex-col bg-white dark:bg-background rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white shrink-0 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-emerald-300 shadow-inner border border-emerald-700/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90 dark:text-emerald-400">
                  {branchName}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white leading-none">
                  {isItemLocked ? "Sell Item" : "Sells / Transfer"}
                </h1>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close Sells Transfer modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          
          {/* Left Side: Inventory & Selection Details */}
          <div className="w-full xl:w-[60%] border-r border-emerald-50 dark:border-border p-4 sm:p-6 xl:p-8 flex flex-col gap-8 bg-emerald-50/30 dark:bg-surface-secondary dark:bg-surface-secondary overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-emerald-600 rounded-full" />
                  <h3 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[2px]">
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
                      className="w-full max-w-xs bg-white dark:bg-surface border border-emerald-100 dark:border-border-subtle rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 ring-emerald-500/10 outline-none transition-all"
                    />
                    <div className="absolute right-3 top-2 text-emerald-200">
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
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-text-tertiary sm:grid-cols-4">
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
                      <thead className="sticky top-0 bg-emerald-50 z-10">
                        <tr>
                          {["UnitID", "Unit", "Serial #", "Included", "Condition", "Memory", "Barcode ID"].map((h) => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black text-emerald-900 uppercase tracking-widest border-b border-emerald-100 dark:border-border-subtle">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <span className="anim-loading h-6 w-6 border-emerald-500/50 border-t-emerald-600 rounded-full" />
                                <span className="text-[10px] text-emerald-900 font-bold uppercase tracking-widest">Loading items...</span>
                              </div>
                            </td>
                          </tr>
                        ) : items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[10px] text-emerald-900 font-bold uppercase tracking-widest">
                              No items available for sale.
                            </td>
                          </tr>
                        ) : (
                          items.map(item => (
                            <tr 
                              key={item.id} 
                              onClick={() => setSelectedItem(item)}
                              className={`cursor-pointer transition-colors group ${selectedItem?.id === item.id ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-emerald-600/10'}`}
                            >
                              <td className={`px-4 py-3 text-xs font-black ${selectedItem?.id === item.id ? 'text-white' : 'text-emerald-700'}`}>{item.unitId}</td>
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
                    <h4 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[2px]">Transaction Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status:</span>
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{form.status}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4 group">
                      <span className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter shrink-0">
                        {isItemLocked ? "Transaction:" : "Sell / Transfer:"}
                      </span>
                      <div className="flex-1 border-b border-dashed border-emerald-100 dark:border-border-subtle dark:border-border-subtle" />
                      {isItemLocked ? (
                        <div className="min-w-[140px] rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-left text-xs font-black text-emerald-800 dark:border-border-subtle dark:bg-emerald-500/10 dark:text-emerald-300">
                          Sell
                        </div>
                      ) : (
                        <div className="relative flex items-center rounded-xl border border-emerald-100 dark:border-border-subtle dark:border-border-subtle bg-white dark:bg-surface dark:bg-surface transition-all focus-within:ring-4 ring-emerald-500/10 min-w-[140px]">
                          <select 
                            name="sellTransfer"
                            value={form.sellTransfer}
                            onChange={handleChange}
                            className="w-full bg-transparent border-none text-left text-xs font-black text-emerald-950 dark:text-white dark:text-white pl-4 pr-8 py-2 cursor-pointer appearance-none outline-none focus:ring-0"
                          >
                            <option value="Sales">Sell</option>
                            <option value="Transfer">Transfer</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <DetailInput label="Item Included" name="itemIncluded" value={form.itemIncluded} onChange={handleChange} placeholder={selectedItem?.included || "Specify items..."} />
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-emerald-100 dark:border-border-subtle">
                       <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">SRP:</span>
                       <span className="text-lg font-black text-emerald-950 dark:text-white">₱ {Number(selectedItem?.srp || 0).toLocaleString()}</span>
                    </div>
                    {form.sellTransfer === "Sales" ? (
                      <DetailInput label="Price Sold" name="priceSold" value={form.priceSold} onChange={handleChange} type="number" prefix="₱" highlight />
                    ) : (
                      <div className="flex items-center justify-between gap-4 group">
                        <span className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter shrink-0">To Branch:</span>
                        <div className="flex-1 border-b border-dashed border-emerald-100 dark:border-border-subtle" />
                        <div className="relative flex items-center rounded-xl border border-emerald-100 dark:border-border-subtle bg-white dark:bg-surface transition-all focus-within:ring-4 ring-emerald-500/10 min-w-[140px]">
                          <select 
                            name="targetBranchId"
                            value={form.targetBranchId}
                            onChange={handleChange}
                            className="w-full bg-transparent border-none text-left text-xs font-black text-emerald-950 dark:text-white pl-4 pr-8 py-2 cursor-pointer appearance-none outline-none focus:ring-0"
                          >
                            <option value="">— Select Branch —</option>
                            {branches
                              .filter(b => b.id !== selectedBranch?.id)
                              .map(b => (
                                <option key={b.id} value={b.id}>{getBranchName(b)}</option>
                              ))
                            }
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className="bg-emerald-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl shadow-emerald-900/20">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Quick Summary</p>
                     <p className="text-xl font-black leading-tight tracking-tight">{selectedItem?.unit || "Select an item..."}</p>
                     <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{selectedItem?.unitId || "---"}</p>
                  </div>
                  <div className="pt-8 text-right border-t border-white/10 mt-8">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                       {form.sellTransfer === "Sales" ? "Total Transaction Value" : "Transfer Value (Market)"}
                     </p>
                     <p className="text-4xl font-black tracking-tighter">
                       ₱ {Number(form.sellTransfer === "Sales" ? form.priceSold : (selectedItem?.srp || 0)).toLocaleString()}
                     </p>
                  </div>
               </div>
            </div>
          </div>

           {/* Right Side: Information Panel */}
          <div className="flex-1 p-4 sm:p-6 xl:p-8 overflow-y-auto">
            {form.sellTransfer === "Sales" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-950 dark:text-white uppercase tracking-tight">Buyer&apos;s Information</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Please fill in current details</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
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
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
                </div>
                <div className="space-y-2 max-w-sm">
                   <h3 className="text-2xl font-black text-emerald-950 dark:text-white uppercase tracking-tight">Internal Transfer</h3>
                   <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                     Moving an item between branches does not record any cash movement. 
                     The item will be deducted from <strong>{branchName}</strong> and added to the target branch inventory.
                   </p>
                </div>
                <div className="w-full p-6 rounded-2xl border-2 border-dashed border-emerald-100 dark:border-border bg-emerald-50/30 dark:bg-surface-secondary text-left space-y-4">
                   <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Movement Summary</p>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase">From:</span>
                      <span className="text-xs font-black text-emerald-950 dark:text-white">{branchName}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase">To:</span>
                      <span className="text-xs font-black text-emerald-600">
                        {form.targetBranchId ? getBranchName(branches.find(b => b.id === form.targetBranchId)) : "Select Destination..."}
                      </span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-emerald-50 bg-white dark:bg-surface flex flex-col sm:flex-row items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-8 w-full sm:w-auto">
             <button 
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-zinc-800 transition-colors"
              >
                Cancel Process
              </button>
              <div className="h-10 w-px bg-zinc-100 dark:bg-surface-hover hidden sm:block" />
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-40">
                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter ml-1">Password</label>
                    <input
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      type="password"
                      className="w-full rounded-xl border-2 border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-950 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none placeholder:text-zinc-300"
                    />
                  </div>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-emerald-50">
             <div className="text-right">
                <p className="text-[9px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[0.2em] leading-none mb-1">
                  {form.sellTransfer === "Sales" ? "Sale Price" : "SRP Value"}
                </p>
                <p className="text-3xl font-black text-emerald-950 dark:text-white tracking-tighter">
                  ₱ {Number(form.sellTransfer === "Sales" ? form.priceSold : (selectedItem?.srp || 0)).toLocaleString()}
                </p>
             </div>
              <button 
              disabled={!isFormValid || isConfirming}
              onClick={handleConfirmAction}
              className={`flex items-center justify-center gap-3 px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] ${isFormValid ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30' : 'bg-zinc-100 dark:bg-surface-hover text-zinc-300 cursor-not-allowed'}`}
             >
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <span className="anim-loading h-5 w-5 border-white/30 border-t-white rounded-full" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    Confirm & Print
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
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
      <span className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter shrink-0">{label}:</span>
      <div className="flex-1 border-b border-dashed border-emerald-100 dark:border-border-subtle dark:border-border-subtle" />
      <div className={`relative flex items-center rounded-xl border border-emerald-100 dark:border-border-subtle bg-white dark:bg-surface transition-all focus-within:ring-4 ring-emerald-500/10 ${highlight ? 'min-w-[140px]' : 'min-w-[120px]'}`}>
        {prefix && <span className="pl-3 text-[10px] font-black text-emerald-400">{prefix}</span>}
        <input 
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-transparent px-3 py-1.5 text-xs font-black text-emerald-950 dark:text-white outline-none ${highlight ? 'text-right' : ''}`}
        />
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, type = "text", bg = "bg-white dark:bg-surface", size = "md" }: { 
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
      {label && <label className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter ml-1">{label}</label>}
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        className={`w-full rounded-xl border border-emerald-100 dark:border-border-subtle ${bg} ${size === 'sm' ? 'py-2' : 'py-3'} px-4 text-xs font-black text-emerald-950 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 placeholder:font-medium`}
      />
    </div>
  );
}
