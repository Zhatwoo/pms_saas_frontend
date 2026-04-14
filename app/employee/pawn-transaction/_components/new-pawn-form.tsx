"use client";

import { useState, type ChangeEvent } from "react";

interface NewPawnFormProps {
  onCancel: () => void;
}

export function NewPawnForm({ onCancel }: NewPawnFormProps) {
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

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Pawn Transaction</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900">New Pawn Ticket</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Back to Transactions
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Physical Item Scan</h3>
                  <p className="text-xs text-emerald-700">
                    Scan the item&apos;s barcode/QR code or take a picture to verify inventory.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="w-full rounded-xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 active:scale-95 sm:w-auto"
                onClick={() => alert("Scanning from Camera...")}
              >
                Open Scanner
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">Personal Information</h3>
              <p className="text-sm text-zinc-500">Add customer name, address, contact and ID details.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>First Name</span>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Middle Name</span>
                <input
                  name="middleName"
                  value={form.middleName}
                  onChange={handleChange}
                  placeholder="Middle Name"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Last Name</span>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                <span>St./Subdivision/Compd</span>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street / Subdivision / Compound"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Barangay/District/Locality</span>
                <input
                  name="barangay"
                  value={form.barangay}
                  onChange={handleChange}
                  placeholder="Barangay / District / Locality"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>City/Municipality</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City / Municipality"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Province</span>
                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder="Province"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Contact No.</span>
                <input
                  name="contactNo"
                  value={form.contactNo}
                  onChange={handleChange}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>ID</span>
                <input
                  name="idPresented"
                  value={form.idPresented}
                  onChange={handleChange}
                  placeholder="ID Presented"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <span className="text-sm font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Verification Photos</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-white flex flex-col items-center justify-center text-center p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 mb-2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Front View</p>
                  </div>
                  <div className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-white flex flex-col items-center justify-center text-center p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 mb-2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Serial No / ID</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">Unit Information</h3>
              <p className="text-sm text-zinc-500">Enter the item details for the pawn ticket.</p>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Unit Code</span>
                <input
                  name="unitCode"
                  value={form.unitCode}
                  onChange={handleChange}
                  placeholder="Unit Code"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Unit</span>
                <input
                  name="unitName"
                  value={form.unitName}
                  onChange={handleChange}
                  placeholder="Unit"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Serial Number</span>
                <input
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={handleChange}
                  placeholder="Serial Number"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Items Included</span>
                <input
                  name="itemsIncluded"
                  value={form.itemsIncluded}
                  onChange={handleChange}
                  placeholder="Items Included"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Condition</span>
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select Condition</option>
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Memory</span>
                <input
                  name="memory"
                  value={form.memory}
                  onChange={handleChange}
                  placeholder="Memory"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Barcode ID</span>
                <input
                  name="barcodeId"
                  value={form.barcodeId}
                  onChange={handleChange}
                  placeholder="Barcode ID"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Remarks</span>
                <input
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Remarks"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Amount</span>
                <input
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  type="number"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Purchased Date</span>
                <input
                  name="purchasedDate"
                  value={form.purchasedDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
              <div className="flex items-center gap-2">
                <input
                  id="storageFee"
                  name="storageFee"
                  type="checkbox"
                  checked={form.storageFee}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-500"
                />
                <label htmlFor="storageFee" className="text-sm text-zinc-700">
                  Storage Fee
                </label>
              </div>
              {form.storageFee && (
                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Storage Fee Amount</span>
                  <input
                    name="storageFeeAmount"
                    value={form.storageFeeAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    type="number"
                    className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              )}
            </div>

            <button
              type="button"
              className="mt-4 inline-flex justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
