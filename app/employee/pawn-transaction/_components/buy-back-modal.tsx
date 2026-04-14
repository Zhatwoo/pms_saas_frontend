"use client";

import { useState, useMemo, type ChangeEvent } from "react";

interface BuyBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
}

interface PawnedSearchItem {
  id: string;
  name: string;
  unitCode: string;
  unit: string;
  serialNumber: string;
  itemsIncluded: string;
  condition: string;
  memory: string;
  barcodeId: string;
  category: string;
  purchasedDate: string;
  amount: string;
  storageFee: string;
  contactNumber: string;
  status: string;
}

const MOCK_PAWNED_ITEMS: PawnedSearchItem[] = [
  {
    id: "1",
    name: "Kimberly C.",
    unitCode: "10-JCLB-11369",
    unit: "Samsung A06 SM-A036F/DS",
    serialNumber: "RBY0Z9380EK",
    itemsIncluded: "Unit Only",
    condition: "Fair Scratches/Yellowish LCD",
    memory: "64/4",
    barcodeId: "",
    category: "Cellphones / Tablets",
    purchasedDate: "2026-04-01",
    amount: "1380",
    storageFee: "180",
    contactNumber: "09131896219",
    status: "Active",
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    unitCode: "10-JCLB-11452",
    unit: "iPhone 12 Pro Max",
    serialNumber: "DX12345IMEI",
    itemsIncluded: "Charger, Box",
    condition: "Good",
    memory: "128GB/6GB",
    barcodeId: "BRCODE-159",
    category: "Cellphones / Tablets",
    purchasedDate: "2026-03-28",
    amount: "8500",
    storageFee: "220",
    contactNumber: "09171234567",
    status: "Active",
  },
];

export function BuyBackModal({ isOpen, onClose, branchName }: BuyBackModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<PawnedSearchItem | null>(null);
  const [adminForm, setAdminForm] = useState({
    processedBy: "",
    password: "",
  });

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MOCK_PAWNED_ITEMS;
    return MOCK_PAWNED_ITEMS.filter((item) =>
      [item.name, item.unitCode, item.unit, item.serialNumber, item.category]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/80 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-7xl h-[90vh] overflow-hidden rounded-2xl border border-emerald-500/20 bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-emerald-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">Buy Back Ticket</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">{branchName}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-400 group-hover:text-zinc-900">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Search & List */}
          <div className="w-1/3 border-r border-emerald-50 bg-slate-50/50 p-6 flex flex-col gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </div>
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Search Item</h3>
              </div>
              
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, Unit Code, Serial..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-300"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-emerald-100">
               {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <p className="text-xs font-bold uppercase tracking-widest">No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 group ${selectedItem?.id === item.id ? 'border-emerald-600 bg-white shadow-xl shadow-emerald-900/5' : 'border-transparent bg-white hover:bg-emerald-50/50 hover:border-emerald-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-black uppercase tracking-tight transition-colors ${selectedItem?.id === item.id ? 'text-emerald-700' : 'text-zinc-400 group-hover:text-emerald-600'}`}>{item.unitCode}</p>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">{item.status}</span>
                    </div>
                    <p className="font-bold text-zinc-900 leading-tight group-hover:text-emerald-950 transition-colors">{item.unit}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-[10px] font-bold text-zinc-500">{item.name}</p>
                       <div className="w-1 h-1 rounded-full bg-zinc-300" />
                       <p className="text-[10px] font-black text-emerald-600">₱ {Number(item.amount).toLocaleString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Details & Actions */}
          <div className="flex-1 bg-white p-8 overflow-y-auto">
            {selectedItem ? (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Redemption Preview</p>
                    <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">{selectedItem.unit}</h2>
                    <p className="text-sm font-bold text-zinc-500">{selectedItem.name} · {selectedItem.contactNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                    <span className="px-4 py-1.5 rounded-full bg-emerald-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20">{selectedItem.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <DetailSection title="Loan & Item Details" icon={(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  )}>
                    <DetailRow label="Principal Amount" value={`₱ ${Number(selectedItem.amount).toLocaleString()}`} highlight />
                    <DetailRow label="Storage Fee" value={`₱ ${Number(selectedItem.storageFee).toLocaleString()}`} color="text-emerald-700" />
                    <DetailRow label="Purchased Date" value={selectedItem.purchasedDate} />
                    <DetailRow label="Category" value={selectedItem.category} />
                    <DetailRow label="Unit Code" value={selectedItem.unitCode} />
                  </DetailSection>

                  <DetailSection title="Physical Specs" icon={(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  )}>
                    <DetailRow label="Serial Number" value={selectedItem.serialNumber} />
                    <DetailRow label="Condition" value={selectedItem.condition} />
                    <DetailRow label="Memory" value={selectedItem.memory} />
                    <DetailRow label="Items Included" value={selectedItem.itemsIncluded} />
                    <DetailRow label="Barcode ID" value={selectedItem.barcodeId || "—"} />
                  </DetailSection>
                </div>

                <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em]">Computation Summary</p>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Principal</span>
                           <span className="font-black text-zinc-800">₱{Number(selectedItem.amount).toLocaleString()}</span>
                        </div>
                        <div className="text-zinc-300 font-light">+</div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Fees</span>
                           <span className="font-black text-zinc-800">₱{Number(selectedItem.storageFee).toLocaleString()}</span>
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Total Due</p>
                      <p className="text-4xl font-black text-emerald-950 tracking-tighter">₱ {(Number(selectedItem.amount) + Number(selectedItem.storageFee)).toLocaleString()}</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-12">
                 <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                 </div>
                 <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mb-2">Select a Transaction</h2>
                 <p className="text-sm font-bold text-zinc-500 max-w-xs uppercase tracking-widest leading-relaxed">Please search and choose a pawned item from the portal to view details.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-emerald-50 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <div className="h-10 w-px bg-zinc-100 hidden sm:block" />
            <div className="flex flex-col sm:flex-row gap-4 flex-1 sm:flex-none">
              <div className="min-w-[180px]">
                <Input label="Processed By" name="processedBy" value={adminForm.processedBy} onChange={(e) => setAdminForm(p => ({...p, processedBy: e.target.value}))} placeholder="Admin Name" size="sm" bg="bg-zinc-50" />
              </div>
              <div className="min-w-[150px]">
                <Input label="Password" name="password" value={adminForm.password} onChange={(e) => setAdminForm(p => ({...p, password: e.target.value}))} type="password" placeholder="••••••••" size="sm" bg="bg-zinc-50" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Net Cash Received</p>
                <p className="text-2xl font-black text-emerald-900 tracking-tighter">₱ {selectedItem ? (Number(selectedItem.amount) + Number(selectedItem.storageFee)).toLocaleString() : '0.00'}</p>
             </div>
            <button 
              disabled={!selectedItem}
              className={`font-black px-8 py-4 rounded-xl shadow-xl transition-all active:scale-[0.98] text-lg uppercase tracking-tight flex items-center gap-3 ${selectedItem ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'}`}
            >
              Confirm Buy Back
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-emerald-50">
        <div className="text-emerald-600">{icon}</div>
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{title}</h4>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">{label}</span>
      <div className="flex-1 mx-3 border-b border-dashed border-zinc-100" />
      <span className={`font-black text-sm tracking-tight ${highlight ? 'text-lg text-emerald-950' : color || 'text-zinc-800'}`}>{value}</span>
    </div>
  );
}

function Input({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  bg = "bg-white",
  prefix,
  size = "md"
}: { 
  label: string; 
  name: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  type?: string;
  bg?: string;
  prefix?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
      <div className={`relative flex items-center rounded-xl border border-zinc-200 ${bg} focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all`}>
        {prefix && <span className="pl-4 text-zinc-400 font-bold">{prefix}</span>}
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          className={`w-full bg-transparent ${prefix ? 'pl-2' : 'px-4'} ${size === 'sm' ? 'py-2' : 'py-3'} text-sm font-bold text-zinc-900 outline-none placeholder:text-zinc-300`}
        />
      </div>
    </div>
  );
}
