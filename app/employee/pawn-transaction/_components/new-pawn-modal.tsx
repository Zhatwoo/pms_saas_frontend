"use client";

import { useState, type ChangeEvent } from "react";

interface NewPawnModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
}

export function NewPawnModal({ isOpen, onClose, branchName }: NewPawnModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    barangay: "",
    city: "",
    province: "",
    contactNo: "",
    idPresented: "",
    unitCode: "",
    unitName: "",
    serialNumber: "",
    itemsIncluded: "",
    condition: "",
    memory: "",
    barcodeId: "",
    remarks: "",
    amount: "",
    purchasedDate: "",
    storageFee: false,
    storageFeeAmount: "",
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, type, value } = target;
    const checked = "checked" in target ? target.checked : false;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">New Pawn Ticket</h1>
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
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Scanner Section */}
            <div className="rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm border border-emerald-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Physical Item Scan</h3>
                  <p className="text-xs font-medium text-emerald-700/70">Scan barcode/QR or take a photo to verify inventory.</p>
                </div>
              </div>
              <button 
                type="button" 
                className="w-full sm:w-auto rounded-xl bg-emerald-700 px-8 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 active:scale-95 transition-all uppercase tracking-wider"
                onClick={() => alert("Scanning from Camera...")}
              >
                Open Scanner
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Customer Details</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
                    <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
                    <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
                  </div>
                  
                  <Input label="Street / Subdivision / Compound" name="address" value={form.address} onChange={handleChange} />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Barangay / District / Locality" name="barangay" value={form.barangay} onChange={handleChange} />
                    <Input label="City / Municipality" name="city" value={form.city} onChange={handleChange} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Province" name="province" value={form.province} onChange={handleChange} />
                    <Input label="Contact No." name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="09XX-XXX-XXXX" />
                  </div>

                  <Input label="ID Presented" name="idPresented" value={form.idPresented} onChange={handleChange} />

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Verification Photos</span>
                    <div className="grid grid-cols-2 gap-3">
                      <PhotoUpload label="Front View" />
                      <PhotoUpload label="Serial No / ID" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Unit Information</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Unit Code" name="unitCode" value={form.unitCode} onChange={handleChange} bg="bg-zinc-100" />
                    <Input label="Unit Name" name="unitName" value={form.unitName} onChange={handleChange} bg="bg-zinc-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Serial Number" name="serialNumber" value={form.serialNumber} onChange={handleChange} bg="bg-zinc-100" />
                    <Input label="Items Included" name="itemsIncluded" value={form.itemsIncluded} onChange={handleChange} bg="bg-zinc-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Condition</label>
                      <select
                        name="condition"
                        value={form.condition}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select Condition</option>
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                    <Input label="Memory" name="memory" value={form.memory} onChange={handleChange} bg="bg-zinc-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Barcode ID" name="barcodeId" value={form.barcodeId} onChange={handleChange} bg="bg-zinc-100" />
                    <Input label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} bg="bg-zinc-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Amount" name="amount" value={form.amount} onChange={handleChange} type="number" bg="bg-zinc-100" prefix="₱" />
                    <Input label="Purchased Date" name="purchasedDate" value={form.purchasedDate} onChange={handleChange} type="date" bg="bg-zinc-100" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center cursor-pointer">
                        <input
                          id="storageFeeModal"
                          name="storageFee"
                          type="checkbox"
                          checked={form.storageFee}
                          onChange={handleChange}
                          className="w-6 h-6 rounded-lg accent-emerald-600 cursor-pointer"
                        />
                      </div>
                      <label htmlFor="storageFeeModal" className="text-sm font-black text-emerald-900 uppercase tracking-tight cursor-pointer">
                        Apply Storage Fee
                      </label>
                    </div>
                    {form.storageFee && (
                      <div className="w-32">
                        <Input label="" name="storageFeeAmount" value={form.storageFeeAmount} onChange={handleChange} type="number" placeholder="0.00" prefix="₱" size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
                <Input label="Processed By" name="adminName" value="" onChange={() => {}} placeholder="Admin Name" size="sm" bg="bg-zinc-50" />
              </div>
              <div className="min-w-[150px]">
                <Input label="Password" name="password" value="" onChange={() => {}} type="password" placeholder="••••••••" size="sm" bg="bg-zinc-50" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total Loan Amount</p>
                <p className="text-2xl font-black text-emerald-900 tracking-tighter">₱ {Number(form.amount || 0).toLocaleString()}</p>
             </div>
            <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-8 py-4 rounded-xl shadow-xl shadow-emerald-700/20 transition-all active:scale-[0.98] text-lg uppercase tracking-tight flex items-center gap-3">
              Generate Ticket
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
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

function PhotoUpload({ label }: { label: string }) {
  return (
    <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 bg-white flex flex-col items-center justify-center text-center p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group">
      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mb-2 group-hover:bg-emerald-100 transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400 group-hover:text-emerald-600 transition-colors">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">{label}</p>
    </div>
  );
}
