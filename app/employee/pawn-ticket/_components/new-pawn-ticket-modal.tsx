"use client";

import { useEffect, useState, type ChangeEvent } from "react";

export interface PawnTicketFormData {
  unitCode: string;
  purchasedDate: string;
  maturityDate: string;
  expiryDate: string;
  idsPresented: string;
  fullName: string;
  residence: string;
  contactNumber: string;
  email: string;
  amountInWords: string;
  principalAmount: string;
  storageFee: string;
  parkingFee: string;
  netProceeds: string;
  brandModel: string;
  itemsIncluded: string;
  condition: string;
  serialNo: string;
  memoryStorage: string;
}

interface NewPawnTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: PawnTicketFormData) => void;
}

const initialFormState: PawnTicketFormData = {
  unitCode: "",
  purchasedDate: "",
  maturityDate: "",
  expiryDate: "",
  idsPresented: "",
  fullName: "",
  residence: "",
  contactNumber: "",
  email: "",
  amountInWords: "",
  principalAmount: "",
  storageFee: "",
  parkingFee: "",
  netProceeds: "",
  brandModel: "",
  itemsIncluded: "",
  condition: "",
  serialNo: "",
  memoryStorage: "",
};

export function NewPawnTicketModal({ isOpen, onClose, onSave }: NewPawnTicketModalProps) {
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
    }
  }, [isOpen]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

  const handleSave = () => {
    // Replace this with real save logic when ready.
    onSave?.(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              One-page ticket creation
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">New Pawn Ticket</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Complete the pawn ticket details below in a single scrollable modal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Contract Details</h3>
                <p className="text-sm text-zinc-500">Fill in the contract and schedule data.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Unit Code</span>
                <input
                  name="unitCode"
                  value={form.unitCode}
                  onChange={handleChange}
                  placeholder="e.g. UC-2026"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Purchased Date</span>
                <input
                  name="purchasedDate"
                  type="date"
                  value={form.purchasedDate}
                  onChange={handleChange}
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Maturity Date</span>
                <input
                  name="maturityDate"
                  type="date"
                  value={form.maturityDate}
                  onChange={handleChange}
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Expiry Date of Repurchase Back</span>
                <input
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>ID(s) Presented</span>
                <input
                  name="idsPresented"
                  value={form.idsPresented}
                  onChange={handleChange}
                  placeholder="e.g. PhilHealth ID, Driver’s License, Passport"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Customer Details</h3>
              <p className="text-sm text-zinc-500">Enter customer contact and address information.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Full Name (Mr./Mrs.)</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Full legal name"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Residence / Address</span>
                <input
                  name="residence"
                  value={form.residence}
                  onChange={handleChange}
                  placeholder="Street, Blk, Lot, Subdivision, Barangay, City, Province"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Contact Number</span>
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Email Address</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="@gmail.com"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Financial Details</h3>
              <p className="text-sm text-zinc-500">Provide amounts and fees used to generate the pawn ticket.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Amount in Words</span>
                <input
                  name="amountInWords"
                  value={form.amountInWords}
                  onChange={handleChange}
                  placeholder="e.g. Five Thousand Pesos"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Principal Amount</span>
                <input
                  name="principalAmount"
                  type="number"
                  value={form.principalAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Storage Fee</span>
                <input
                  name="storageFee"
                  type="number"
                  value={form.storageFee}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Parking Fee</span>
                <input
                  name="parkingFee"
                  type="number"
                  value={form.parkingFee}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Net Proceeds</span>
                <input
                  name="netProceeds"
                  type="number"
                  value={form.netProceeds}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Unit Description</h3>
              <p className="text-sm text-zinc-500">Describe the pawned item and its condition.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Brand &amp; Model</span>
                <input
                  name="brandModel"
                  value={form.brandModel}
                  onChange={handleChange}
                  placeholder="e.g. Apple iPhone 17 Pro Max"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Items Included</span>
                <input
                  name="itemsIncluded"
                  value={form.itemsIncluded}
                  onChange={handleChange}
                  placeholder="e.g. Charger, Box, Earphones"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Condition</span>
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700">
                <span>Serial No.</span>
                <input
                  name="serialNo"
                  value={form.serialNo}
                  onChange={handleChange}
                  placeholder="e.g. Device serial / IMEI"
                  className="w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-1.5 text-sm text-zinc-700 sm:col-span-2">
                <span>Memory / Storage</span>
                <input
                  name="memoryStorage"
                  value={form.memoryStorage}
                  onChange={handleChange}
                  placeholder="e.g. 512GB ROM, 12GB RAM"
                  className="w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </section>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Save Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
