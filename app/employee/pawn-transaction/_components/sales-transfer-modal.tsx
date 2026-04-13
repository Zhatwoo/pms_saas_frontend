"use client";

import { useState, useMemo, type ChangeEvent } from "react";

interface SalesTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", unitId: "10-JCLB-10679", unit: "REALME C75 5G", serialNumber: "6HPB0J8XZ...", included: "Unit, Case", condition: "FAIR W/...", memory: "256/8+8", barcodeId: "100639", srp: "12500" },
  { id: "2", unitId: "10-JCLB-10687", unit: "Oppo A18 CP...", serialNumber: "6TWCD6WK...", included: "Unit, Charge...", condition: "FAIR SC...", memory: "128/4+4", barcodeId: "100638", srp: "8500" },
  { id: "3", unitId: "10-JCLB-10979", unit: "Xiaomi REDM...", serialNumber: "606901V551...", included: "Unit, Charge...", condition: "FAIR CON", memory: "256/8+4", barcodeId: "100680", srp: "9200" },
  { id: "4", unitId: "11201", unit: "Xiaomi REDM...", serialNumber: "C22229C9", included: "Unit, Case", condition: "FAIR SC...", memory: "128/4", barcodeId: "100687", srp: "7800" },
  { id: "5", unitId: "11227", unit: "Xiaomi POCO...", serialNumber: "51207/64VC...", included: "Unit, Case", condition: "FAIR SC...", memory: "128/6", barcodeId: "100685", srp: "11500" },
  { id: "6", unitId: "11229", unit: "Samsung SM...", serialNumber: "OY603NHY...", included: "Remote,...", condition: "FAIR M...", memory: "100692", barcodeId: "", srp: "15000" },
];

export function SalesTransferModal({ isOpen, onClose, branchName }: SalesTransferModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
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
    processedBy: "",
    password: "",
  });

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return MOCK_INVENTORY.filter(item => 
      item.unitId.toLowerCase().includes(q) || 
      item.unit.toLowerCase().includes(q) || 
      item.serialNumber.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-7xl h-[90vh] overflow-hidden rounded-3xl border border-emerald-500/20 bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-8 py-5 border-b border-emerald-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-tight leading-none">Sales / Transfer</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">{branchName}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-400 group-hover:text-zinc-900">
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
                      {filteredItems.map(item => (
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
                      ))}
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
                    <DetailInput label="Sell / Transfer" name="sellTransfer" value={form.sellTransfer} onChange={handleChange} />
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

                <div className="aspect-video rounded-3xl border-2 border-dashed border-emerald-100 bg-emerald-50/30 flex flex-col items-center justify-center text-center p-6 group hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer">
                   <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                   </div>
                   <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Upload Customer ID</h5>
                   <p className="text-[9px] font-bold text-emerald-400 mt-1 uppercase tracking-tight">Front & Back View Needed</p>
                </div>
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
                <div className="w-48">
                  <Input label="Processed By" name="processedBy" value={form.processedBy} onChange={handleChange} size="sm" bg="bg-slate-50" placeholder="Admin Name" />
                </div>
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
              disabled={!selectedItem}
              className={`flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-tight transition-all active:scale-[0.98] ${selectedItem ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30' : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}`}
             >
                Confirm & Print
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
