"use client";

import { useState, useMemo, useEffect, type ChangeEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";

interface SalesTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  branchName: string;
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

export function SalesTransferModal({ isOpen, onClose, branchName, onSuccess }: SalesTransferModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address1: "",
    address2: "",
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

  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const branchQ = selectedBranch?.id !== "__all__" ? `&branch=${selectedBranch.id}` : "";
        const response = await api.get<{ items: any[] }>(`/inventory/for-sale?status=Available&search=${searchQuery}&limit=100${branchQ}`);
        const mapped = (response.items || []).map(item => ({
          id: item.id,
          unitId: item.itemId || item.id,
          unit: item.itemName,
          serialNumber: "---",
          included: "---",
          condition: "---",
          memory: "---",
          barcodeId: "---",
          srp: String(item.price || 0)
        }));
        setItems(mapped);
      } catch (err) {
        console.error("Failed to fetch inventory items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, searchQuery, selectedBranch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };


  const isFormValid = Boolean(
    selectedItem &&
    form.firstName &&
    form.lastName &&
    form.address1 &&
    form.address2 &&
    form.contactNo &&
    form.priceSold &&
    form.password
  );

  const handleConfirmAction = async () => {
    if (!selectedItem || !isFormValid) return;
    try {
      setIsConfirming(true);
      
      // Verify Password
      await api.post("/auth/verify-password", { password: form.password });

      // Create Transaction
      const purpose = form.sellTransfer === "Sales" ? "Sold Item" : "Sales / Transfer";
      const detailsStr = `Customer: ${form.firstName} ${form.lastName} | Address: ${form.address1}, ${form.address2} | Contact: ${form.contactNo} | Included: ${form.itemIncluded} | Processed by: ${user?.fullName || 'Admin'}`;
      
      await api.post("/transactions", {
        purpose: purpose,
        cash_in: Number(form.priceSold || 0),
        cash_out: 0,
        unit: selectedItem.unit,
        unit_code: selectedItem.unitId,
        details: detailsStr,
        branch: branchName
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to process Sales/Transfer transaction.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-zinc-900">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div 
        className="relative w-full max-w-7xl h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-emerald-50 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">Sales / Transfer</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{branchName}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-900/40 hover:text-emerald-900">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Side: Inventory & Selection Details */}
          <div className="w-[60%] border-r border-emerald-50 p-8 flex flex-col gap-8 bg-slate-50/30 overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-emerald-600 rounded-full" />
                  <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Select Inventory Item</h3>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search Unit ID / Serial..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-white border border-emerald-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 ring-emerald-500/10 outline-none transition-all"
                  />
                  <div className="absolute right-3 top-2 text-emerald-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </div>
                </div>
              </div>

              {/* Inventory Table Container */}
              <div className="rounded-2xl border border-emerald-100 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-emerald-50 z-10">
                      <tr>
                        {["UnitID", "Unit", "Serial #", "Included", "Condition", "Memory", "Barcode ID"].map((h) => (
                          <th key={h} className="px-4 py-3 text-[10px] font-black text-emerald-900 uppercase tracking-widest border-b border-emerald-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[10px] text-emerald-900 font-bold uppercase tracking-widest">
                            Loading items...
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
                            className={`cursor-pointer transition-colors group ${selectedItem?.id === item.id ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/50'}`}
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
            </div>

            {/* Selection Specifics */}
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-emerald-400 rounded-full" />
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Transaction Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status:</span>
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{form.status}</div>
                    </div>
                    <div className="flex items-center justify-between gap-4 group">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Sell / Transfer:</span>
                      <div className="flex-1 border-b border-dashed border-emerald-100" />
                      <div className="relative flex items-center rounded-xl border border-emerald-100 bg-white transition-all focus-within:ring-4 ring-emerald-500/10 min-w-[140px]">
                        <select 
                          name="sellTransfer"
                          value={form.sellTransfer}
                          onChange={handleChange}
                          className="w-full bg-transparent border-none text-left text-xs font-black text-emerald-950 pl-4 pr-8 py-2 cursor-pointer appearance-none outline-none focus:ring-0"
                        >
                          <option value="Sales">Sell</option>
                          <option value="Transfer">Transfer</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                    <DetailInput label="Item Included" name="itemIncluded" value={form.itemIncluded} onChange={handleChange} placeholder={selectedItem?.included || "Specify items..."} />
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-emerald-100">
                       <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">SRP:</span>
                       <span className="text-lg font-black text-emerald-950">₱ {Number(selectedItem?.srp || 0).toLocaleString()}</span>
                    </div>
                    <DetailInput label="Price Sold" name="priceSold" value={form.priceSold} onChange={handleChange} type="number" prefix="₱" highlight />
                  </div>
               </div>

               <div className="bg-emerald-950 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl shadow-emerald-900/20">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Quick Summary</p>
                     <p className="text-xl font-black leading-tight tracking-tight">{selectedItem?.unit || "Select an item..."}</p>
                     <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{selectedItem?.unitId || "---"}</p>
                  </div>
                  <div className="pt-8 text-right border-t border-white/10 mt-8">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Transaction Value</p>
                     <p className="text-4xl font-black tracking-tighter">₱ {Number(form.priceSold || 0).toLocaleString()}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Side: Buyer's Information */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Buyer's Information</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Please fill in current details</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid grid-cols-3 gap-3">
                  <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
                  <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
                  <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Current Address</p>
                   <div className="grid gap-3">
                      <Input label="" placeholder="Block / Lot / Street / Brgy" name="address1" value={form.address1} onChange={handleChange} />
                      <Input label="" placeholder="Municipality / Province / City" name="address2" value={form.address2} onChange={handleChange} />
                   </div>
                </div>

                <Input label="Contact Number" name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="09XX-XXX-XXXX" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-emerald-50 bg-white flex flex-col sm:flex-row items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-8 w-full sm:w-auto">
             <button 
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-zinc-800 transition-colors"
              >
                Cancel Process
              </button>
              <div className="h-10 w-px bg-zinc-100 hidden sm:block" />
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-40">
                  <Input label="Password" name="password" value={form.password} onChange={handleChange} type="password" size="sm" bg="bg-slate-50" placeholder="••••••••" />
                </div>
              </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-emerald-50">
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1">Final Amount</p>
                <p className="text-3xl font-black text-emerald-950 tracking-tighter">₱ {Number(form.priceSold || 0).toLocaleString()}</p>
             </div>
             <button 
              disabled={!isFormValid || isConfirming}
              onClick={handleConfirmAction}
              className={`flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-tight transition-all active:scale-[0.98] ${isFormValid ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30' : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}`}
             >
                {isConfirming ? "Processing..." : "Confirm & Print"}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
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
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">{label}:</span>
      <div className="flex-1 border-b border-dashed border-emerald-100" />
      <div className={`relative flex items-center rounded-xl border border-emerald-100 bg-white transition-all focus-within:ring-4 ring-emerald-500/10 ${highlight ? 'min-w-[140px]' : 'min-w-[120px]'}`}>
        {prefix && <span className="pl-3 text-[10px] font-black text-emerald-400">{prefix}</span>}
        <input 
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className={`w-full bg-transparent px-3 py-1.5 text-xs font-black text-emerald-950 outline-none ${highlight ? 'text-right' : ''}`}
        />
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, type = "text", bg = "bg-white", size = "md" }: { 
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
      {label && <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        className={`w-full rounded-xl border border-emerald-100 ${bg} ${size === 'sm' ? 'py-2' : 'py-3'} px-4 text-xs font-bold text-emerald-950 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none placeholder:text-zinc-300 placeholder:font-medium`}
      />
    </div>
  );
}
