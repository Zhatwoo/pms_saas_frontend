"use client";

import { useState, useMemo, type ChangeEvent } from "react";

interface BuyBackFormProps {
  onCancel: () => void;
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

export function BuyBackForm({ onCancel }: BuyBackFormProps) {
  const [form, setForm] = useState({
    name: "",
    unitCode: "",
    unit: "",
    serialNumber: "",
    itemsIncluded: "",
    condition: "",
    memory: "",
    barcodeId: "",
    category: "",
    date: "",
    contactNumber: "",
    remarks: "",
    storageFee: "",
    parkingFee: "",
    purchasedDate: "",
    amount: "",
    preparedBy: "",
    status: "",
    timesRenewed: "",
    period: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<PawnedSearchItem | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSelectItem = (item: PawnedSearchItem) => {
    setSelectedItem(item);
    setForm((prev) => ({
      ...prev,
      name: item.name,
      unitCode: item.unitCode,
      unit: item.unit,
      serialNumber: item.serialNumber,
      itemsIncluded: item.itemsIncluded,
      condition: item.condition,
      memory: item.memory,
      barcodeId: item.barcodeId,
      category: item.category,
      purchasedDate: item.purchasedDate,
      amount: item.amount,
      storageFee: item.storageFee,
      contactNumber: item.contactNumber,
      status: item.status,
    }));
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Buyback</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Buy Back Ticket</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Back to Transactions
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900">Search Pawned Item</h3>
            <p className="text-sm text-zinc-500">Search pawned items and select one to populate the buyback details.</p>
          </div>

          <div className="space-y-4 mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, unit code, unit, serial, category..."
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />

            <div className="max-h-60 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-zinc-500">No items found.</p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left rounded-2xl border px-3 py-3 mb-2 transition ${selectedItem?.id === item.id ? "border-emerald-700 bg-emerald-50" : "border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{item.unit}</p>
                        <p className="text-xs text-zinc-500">{item.unitCode}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">{item.name} · {item.category}</p>
                  </button>
                ))
              )}
            </div>

            {selectedItem && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Selected item</p>
                    <h4 className="mt-1 text-base font-semibold text-zinc-900">{selectedItem.unit}</h4>
                    <p className="text-sm text-zinc-600">{selectedItem.unitCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Amount</p>
                    <p className="mt-1 text-lg font-bold text-zinc-900">₱{selectedItem.amount}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Serial</p>
                    <p className="mt-1 text-sm text-zinc-700">{selectedItem.serialNumber}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Customer</p>
                    <p className="mt-1 text-sm text-zinc-700">{selectedItem.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">Customer Information</h3>
              <p className="text-sm text-zinc-500">Search and enter customer details for the buyback.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Customer Name"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Unit Code</span>
                <input
                  type="text"
                  name="unitCode"
                  value={form.unitCode}
                  onChange={handleChange}
                  placeholder="Unit Code"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Date</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Contact Number</span>
                <input
                  type="tel"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Remarks</span>
                <input
                  type="text"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Remarks"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Storage Fee</span>
                <input
                  type="number"
                  name="storageFee"
                  value={form.storageFee}
                  onChange={handleChange}
                  placeholder="Storage Fee"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Parking Fee</span>
                <input
                  type="number"
                  name="parkingFee"
                  value={form.parkingFee}
                  onChange={handleChange}
                  placeholder="Parking Fee"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Purchased Date</span>
                <input
                  type="date"
                  name="purchasedDate"
                  value={form.purchasedDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Amount</span>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Amount"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">Item & Loan Details</h3>
              <p className="text-sm text-zinc-500">Enter the pawned item details for buyback processing.</p>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Unit</span>
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="Unit"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Serial Number</span>
                <input
                  type="text"
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
                  type="text"
                  name="itemsIncluded"
                  value={form.itemsIncluded}
                  onChange={handleChange}
                  placeholder="Items Included"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Condition</span>
                <input
                  type="text"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  placeholder="Condition"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Memory</span>
                <input
                  type="text"
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
                  type="text"
                  name="barcodeId"
                  value={form.barcodeId}
                  onChange={handleChange}
                  placeholder="Barcode ID"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-700">
                <span>Category</span>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Category"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Prepared By</span>
                <input
                  type="text"
                  name="preparedBy"
                  value={form.preparedBy}
                  onChange={handleChange}
                  placeholder="Prepared By"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Status</span>
                <input
                  type="text"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  placeholder="Status"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Times Renewed</span>
                <input
                  type="text"
                  name="timesRenewed"
                  value={form.timesRenewed}
                  onChange={handleChange}
                  placeholder="Times Renewed"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-700">
                <span>Period</span>
                <input
                  type="text"
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                  placeholder="Period"
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end">
          <button
            type="button"
            className="mt-4 inline-flex justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
