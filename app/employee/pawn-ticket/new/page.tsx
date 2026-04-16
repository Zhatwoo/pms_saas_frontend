"use client";

import Link from "next/link";
import { useState } from "react";
import { PrintTicketModal } from "../_components/print-ticket-modal";

export default function EmployeePawnTicketFirstPage() {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleSaveTicket = () => {
    setIsPrintModalOpen(true);
  };

  const handleConfirmPrint = () => {
    setIsPrintModalOpen(false);
    window.setTimeout(() => window.print(), 150);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 leading-tight">New Pawn Ticket</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">
            Complete the pawn ticket details below in a single scrollable page.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">One-page ticket creation</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-900">Pawn Ticket Details</h2>
            </div>
            <Link
              href="/employee/pawn-ticket"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Back to Pawn Tickets
            </Link>
          </div>

          <div className="mt-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
            <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Contract Details</h3>
                  <p className="text-sm text-zinc-500">Fill in the contract and schedule data.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Unit Code</span>
                  <input
                    type="text"
                    placeholder="e.g. UC-2026"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Purchased Date</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Maturity Date</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Expiry Date of Repurchase Back</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>ID(s) Presented</span>
                  <input
                    type="text"
                    placeholder="e.g. PhilHealth ID, Driver’s License, Passport"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Customer Details</h3>
                <p className="text-sm text-zinc-500">Enter customer contact and address information.</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>Full Name (Mr./Mrs.)</span>
                  <input
                    type="text"
                    placeholder="Full legal name"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>Residence / Address</span>
                  <input
                    type="text"
                    placeholder="Street, Blk, Lot, Subdivision, Barangay, City, Province"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Contact Number</span>
                  <input
                    type="tel"
                    placeholder="09XX-XXX-XXXX"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Email Address</span>
                  <input
                    type="email"
                    placeholder="@gmail.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Financial Details</h3>
                <p className="text-sm text-zinc-500">Provide amounts and fees used to generate the pawn ticket.</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>Amount in Words</span>
                  <input
                    type="text"
                    placeholder="e.g. Five Thousand Pesos"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Principal Amount</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Storage Fee</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Parking Fee</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Net Proceeds</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Unit Description</h3>
                <p className="text-sm text-zinc-500">Describe the pawned item and its condition.</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>Brand &amp; Model</span>
                  <input
                    type="text"
                    placeholder="e.g. Apple iPhone 17 Pro Max"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>Items Included</span>
                  <input
                    type="text"
                    placeholder="e.g. Charger, Box, Earphones"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Condition</span>
                  <select className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                    <option value="">Select condition</option>
                    <option>New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Poor</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm text-zinc-700">
                  <span>Serial No.</span>
                  <input
                    type="text"
                    placeholder="e.g. Device serial / IMEI"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="space-y-2 text-sm text-zinc-700 sm:col-span-2">
                  <span>Memory / Storage</span>
                  <input
                    type="text"
                    placeholder="e.g. 512GB ROM, 12GB RAM"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/employee/pawn-ticket"
              className="inline-flex justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSaveTicket}
              className="inline-flex justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Save Ticket
            </button>
          </div>
        </div>
      </div>

      <PrintTicketModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onConfirmPrint={handleConfirmPrint}
      />
    </div>
  );
}
