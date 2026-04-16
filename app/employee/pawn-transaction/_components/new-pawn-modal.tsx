"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { MoaModal } from "./moa-modal";

interface NewPawnModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  branchAdminName?: string;
  loggedInUserName?: string;
}

export function NewPawnModal({ 
  isOpen, 
  onClose, 
  branchId, 
  branchName, 
  branchAddress,
  branchPhone,
  branchAdminName, 
  loggedInUserName 
}: NewPawnModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    barangay: "",
    city: "",
    province: "",
    contactNo: "",
    email: "",
    idPresented: "",
    unitCode: "",
    unitName: "",
    category: "",
    serialNumber: "",
    itemsIncluded: "",
    condition: "",
    memory: "",
    remarks: "",
    amount: "",
    purchasedDate: "",
    storageFee: false,
    storageFeeAmount: "",
    profilePhoto: null as string | null,
    idPhoto: null as string | null,
  });

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isMoaOpen, setIsMoaOpen] = useState(false);

  // Auto-generate Unit Code when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchNextCode = async () => {
        try {
          const { unitCode } = await api.get<{ unitCode: string }>("/pawn-tickets/next-unit-code");
          if (unitCode) {
            setForm(prev => ({ ...prev, unitCode }));
          }
        } catch (error) {
          console.error("Failed to fetch next unit code:", error);
          // Fallback to a placeholder if API fails
          setForm(prev => ({ ...prev, unitCode: "PENDING-jclb-xxxxx" }));
        }
      };
      fetchNextCode();
    }
  }, [isOpen]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, type, value } = target;
    const checked = "checked" in target ? target.checked : false;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Reset QR if key fields change
    if (["unitCode", "unitName", "serialNumber"].includes(name)) {
      setQrUrl(null);
    }
  };

  const handleReset = useCallback(() => {
    setForm({
      firstName: "",
      middleName: "",
      lastName: "",
      address: "",
      barangay: "",
      city: "",
      province: "",
      contactNo: "",
      email: "",
      idPresented: "",
      unitCode: "",
      unitName: "",
      category: "",
      serialNumber: "",
      itemsIncluded: "",
      condition: "",
      memory: "",
      remarks: "",
      amount: "",
      purchasedDate: "",
      storageFee: false,
      storageFeeAmount: "",
      profilePhoto: null,
      idPhoto: null,
    });
    setQrUrl(null);
    setPassword("");
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  const handleGenerateQR = () => {
    // Required fields for QR generation
    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      address: "Street Address",
      barangay: "Barangay",
      city: "City",
      contactNo: "Contact Number",
      idPresented: "ID Type",
      unitCode: "Unit Code",
      unitName: "Unit Name",
      category: "Category",
      amount: "Loan Amount",
      purchasedDate: "Purchased Date"
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (!form[key as keyof typeof form]) {
        setErrorMessage(`${label} is required before generating QR.`);
        return;
      }
    }

    setErrorMessage(null);
    const fullName = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const qrData = [
      fullName && `Customer:${fullName}`,
      form.contactNo && `Tel:${form.contactNo}`,
      form.address && `Addr:${form.address}`,
      form.unitCode && `Code:${form.unitCode}`,
      form.unitName && `Item:${form.unitName}`,
      form.category && `Cat:${form.category}`,
      form.serialNumber && `SN:${form.serialNumber}`,
      form.amount && `Loan:P${form.amount}`,
      `Branch:${branchName}`
    ]
      .filter(Boolean)
      .join(" | ");

    setIsGeneratingQR(true);
    const encoded = encodeURIComponent(qrData);
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=200x200&color=065f46&bgcolor=f0fdf4&margin=2`;
    setQrUrl(url);
    setIsGeneratingQR(false);
  };

  const handleGenerateTicket = async () => {
    setErrorMessage(null);

    if (!branchId || branchId === "__all__") {
      setErrorMessage("Select a valid branch before generating a ticket.");
      return;
    }

    // 1. Check all required fields - Customer
    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      address: "Street Address",
      barangay: "Barangay",
      city: "City",
      contactNo: "Contact Number",
      idPresented: "ID Type",
      unitCode: "Unit Code",
      unitName: "Unit Name",
      category: "Category",
      amount: "Loan Amount",
      purchasedDate: "Purchased Date"
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (!form[key as keyof typeof form]) {
        setErrorMessage(`${label} is required.`);
        return;
      }
    }

    // 2. Check QR Code
    if (!qrUrl) {
      setErrorMessage("Please generate a QR Code first before generating the ticket.");
      return;
    }

    // 3. Verify Password
    if (!password) {
      setErrorMessage("Please enter your password to authorize this transaction.");
      return;
    }

    setIsSaving(true);
    try {
      // Verify password with API
      const response = await api.post("/auth/verify-password", { password });
      if (!response) {
        throw new Error("Invalid password. Please try again.");
      }

      // If password is correct, open MOA
      setIsMoaOpen(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Security verification failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmMoa = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    const amountValue = Number(form.amount || 0);
    const storageAmount = form.storageFee ? Number(form.storageFeeAmount || 0) : 0;
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ").trim();

    try {
      await api.post('/pawn-tickets', {
        branchId,
        branchName,
        customer: {
          fullName,
          address: form.address.trim(),
          barangay: form.barangay.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          contactNumber: form.contactNo.trim(),
          email: form.email.trim(),
          idPresented: form.idPresented,
        },
        item: {
          unitCode: form.unitCode.trim(),
          unitName: form.unitName.trim(),
          category: form.category.trim(),
          serialNumber: form.serialNumber.trim(),
          itemsIncluded: form.itemsIncluded.trim(),
          condition: form.condition,
          memoryStorage: form.memory.trim(),
          remarks: form.remarks.trim(),
          amount: amountValue,
          purchasedDate: form.purchasedDate,
          qrCode: qrUrl || undefined,
          profilePhoto: form.profilePhoto || undefined,
          idPhoto: form.idPhoto || undefined,
        },
        transaction: {
          pawnAmount: amountValue,
          storageFee: storageAmount,
          returnAmount: 0,
          details: [form.itemsIncluded.trim(), form.idPresented].filter(Boolean).join(' | '),
        },
      });

      setIsMoaOpen(false);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
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
          
          <button onClick={handleReset} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-400 group-hover:text-zinc-900">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* QR Code Generator Section */}
            <div className="rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm border border-emerald-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">QR Code Generator</h3>
                  {errorMessage && errorMessage.includes("before generating QR") ? (
                    <p className="text-[11px] font-bold text-red-500 animate-pulse">{errorMessage}</p>
                  ) : (
                    <p className="text-xs font-medium text-emerald-700/70">Generate a unique QR code for this pawn item using Unit Code, Serial No., and Barcode ID.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                {/* Generated QR Preview */}
                {qrUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={qrUrl}
                      alt="Generated QR Code"
                      width={100}
                      height={100}
                      className="rounded-xl border-2 border-emerald-200 shadow-md bg-white p-1 animate-in fade-in zoom-in duration-300"
                      onError={() => setQrUrl(null)}
                    />
                    <button
                      type="button"
                      onClick={() => setQrUrl(null)}
                      className="text-[10px] font-bold text-red-500 underline hover:text-red-700 transition-colors"
                    >
                      Reset QR
                    </button>
                  </div>
                )}

                {!qrUrl && (
                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={isGeneratingQR}
                    className="w-full sm:w-auto rounded-xl bg-emerald-700 px-8 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 active:scale-95 transition-all uppercase tracking-wider disabled:opacity-60 flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                      <path d="M14 14h3v3m0 4h4v-4m-4 0v-3h4" />
                    </svg>
                    {isGeneratingQR ? "Generating..." : "Generate QR Code"}
                  </button>
                )}
              </div>
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

                  <Input label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" placeholder="example@email.com" />

                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">ID Presented</label>
                    <select
                      name="idPresented"
                      value={form.idPresented}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">— Select ID Type —</option>
                      <optgroup label="Government IDs">
                        <option value="PhilSys / National ID">PhilSys / National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver&apos;s License</option>
                        <option value="SSS ID">SSS ID</option>
                        <option value="GSIS ID">GSIS ID</option>
                        <option value="PRC ID">PRC ID</option>
                        <option value="Voter's ID">Voter&apos;s ID</option>
                        <option value="PhilHealth ID">PhilHealth ID</option>
                        <option value="Pag-IBIG ID">Pag-IBIG ID</option>
                        <option value="Senior Citizen ID">Senior Citizen ID</option>
                        <option value="PWD ID">PWD ID</option>
                        <option value="Postal ID">Postal ID</option>
                        <option value="NBI Clearance">NBI Clearance</option>
                        <option value="Police Clearance">Police Clearance</option>
                        <option value="Barangay ID">Barangay ID</option>
                        <option value="OFW ID">OFW ID</option>
                        <option value="UMID">UMID</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="Company ID">Company ID</option>
                        <option value="School ID">School ID</option>
                        <option value="No ID / None">No ID / None — Take Customer Photo</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Camera capture when No ID selected */}
                  {form.idPresented === "No ID / None" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">⚠ No ID — Capture Customer Photo</span>
                      </div>
                      <div className="w-48">
                        <PhotoUpload 
                          label="Customer Photo" 
                          onCapture={(data) => setForm(prev => ({ ...prev, profilePhoto: data }))}
                        />
                      </div>
                    </div>
                  )}

                  {form.idPresented !== "No ID / None" && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Verification Photos</span>
                       <div className="grid grid-cols-2 gap-3">
                        <PhotoUpload 
                          label="Front View" 
                          onCapture={(data) => setForm(prev => ({ ...prev, profilePhoto: data }))}
                        />
                        <PhotoUpload 
                          label="Serial No / ID" 
                          onCapture={(data) => setForm(prev => ({ ...prev, idPhoto: data }))}
                        />
                      </div>
                    </div>
                  )}
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
                    <Input 
                      label="Unit Code" 
                      name="unitCode" 
                      value={form.unitCode} 
                      onChange={handleChange} 
                      bg="bg-zinc-200" 
                      readOnly={true}
                    />
                    <Input label="Unit Name" name="unitName" value={form.unitName} onChange={handleChange} bg="bg-zinc-100" />
                  </div>

                  <Input label="Category" name="category" value={form.category} onChange={handleChange} bg="bg-zinc-100" />

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

                  <Input label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} bg="bg-zinc-100" />

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
              onClick={handleReset}
              className="px-4 py-2 text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <div className="h-10 w-px bg-zinc-100 hidden sm:block" />
            <div className="flex flex-col sm:flex-row gap-4 flex-1 sm:flex-none">
              {/* Password — entered by the logged-in employee */}
              <div className="min-w-[200px] space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Security Password Verification
                  {loggedInUserName && (
                    <span className="ml-1 text-emerald-600 normal-case font-bold">({loggedInUserName})</span>
                  )}
                </label>
                <div className="relative flex items-center rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent px-4 py-2 text-sm font-bold text-zinc-900 outline-none placeholder:text-zinc-300"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Total Loan Amount</p>
                <p className="text-2xl font-black text-emerald-900 tracking-tighter">₱ {Number(form.amount || 0).toLocaleString()}</p>
             </div>
             
             {qrUrl && (
               <button
                 type="button"
                 onClick={handleGenerateTicket}
                 disabled={isSaving}
                 className="bg-emerald-700 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 text-white font-black px-8 py-4 rounded-xl shadow-xl shadow-emerald-700/20 transition-all active:scale-[0.98] text-lg uppercase tracking-tight flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
               >
                 {isSaving ? 'Processing...' : 'Generate Ticket'}
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
               </button>
             )}
          </div>
          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <MoaModal 
        isOpen={isMoaOpen}
        onClose={() => setIsMoaOpen(false)}
        onConfirm={handleConfirmMoa}
        data={{
          ...form,
          storageFee: form.storageFeeAmount,
          idPresented: form.idPresented || "",
          branchName: branchName || "Pasig branch",
          branchAddress: branchAddress || "",
          branchPhone: branchPhone || ""
        }}
        isLoading={isSaving}
      />
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
  size = "md",
  readOnly = false
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
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
      <div className={`relative flex items-center rounded-xl border border-zinc-200 ${bg} focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all ${readOnly ? 'opacity-70 bg-zinc-100' : ''}`}>
        {prefix && <span className="pl-4 text-zinc-400 font-bold">{prefix}</span>}
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          readOnly={readOnly}
          className={`w-full bg-transparent ${prefix ? 'pl-2' : 'px-4'} ${size === 'sm' ? 'py-2' : 'py-3'} text-sm font-bold text-zinc-900 outline-none placeholder:text-zinc-300 ${readOnly ? 'cursor-not-allowed select-none' : ''}`}
        />
      </div>
    </div>
  );
}

function PhotoUpload({ label, onCapture }: { label: string; onCapture?: (dataUrl: string | null) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = useCallback(async () => {
    setCameraError("");
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch {
      setCameraError("Camera access denied or not available. Please allow camera permissions.");
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsStreaming(false);
    setCameraOpen(false);
    setCameraError("");
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPhoto(dataUrl);
    if (onCapture) onCapture(dataUrl);
    stopCamera();
  }, [stopCamera, onCapture]);

  const retake = () => {
    setPhoto(null);
    if (onCapture) onCapture(null);
    openCamera();
  };

  return (
    <>
      {/* Thumbnail / Placeholder */}
      <div
        onClick={photo ? undefined : openCamera}
        className={`aspect-[4/3] rounded-2xl border-2 border-dashed bg-white flex flex-col items-center justify-center text-center p-4 transition-all group relative overflow-hidden
          ${ photo ? "border-emerald-400 cursor-default" : "border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer" }`}
      >
        {photo ? (
          <>
            <img src={photo} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
              <button
                type="button"
                onClick={retake}
                className="bg-white text-emerald-700 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow hover:bg-emerald-50 transition"
              >
                Retake
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mb-2 group-hover:bg-emerald-100 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400 group-hover:text-emerald-600 transition-colors">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">{label}</p>
          </>
        )}
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={stopCamera}>
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-800">
              <p className="text-xs font-black text-white uppercase tracking-widest">{label} — Camera</p>
              <button onClick={stopCamera} className="text-zinc-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Stream / Error */}
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm font-bold text-red-300">{cameraError}</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}

              {/* Viewfinder corners */}
              {isStreaming && !cameraError && (
                <>
                  <span className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <span className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <span className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <span className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 py-4 bg-zinc-800">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2 rounded-xl bg-zinc-700 text-xs font-black text-zinc-300 hover:bg-zinc-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="w-14 h-14 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                title="Capture photo"
              >
                <span className="w-10 h-10 rounded-full bg-emerald-600 block" />
              </button>
              <div className="w-[76px]" />{/* spacer */}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
