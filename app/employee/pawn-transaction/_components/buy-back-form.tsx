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
  const [pendingItem, setPendingItem] = useState<PawnedSearchItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<PawnedSearchItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setPendingItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmItem = () => {
    if (!pendingItem) return;
    setSelectedItem(pendingItem);
    setForm((prev) => ({
      ...prev,
      name: pendingItem.name,
      unitCode: pendingItem.unitCode,
      unit: pendingItem.unit,
      serialNumber: pendingItem.serialNumber,
      itemsIncluded: pendingItem.itemsIncluded,
      condition: pendingItem.condition,
      memory: pendingItem.memory,
      barcodeId: pendingItem.barcodeId,
      category: pendingItem.category,
      purchasedDate: pendingItem.purchasedDate,
      amount: pendingItem.amount,
      storageFee: pendingItem.storageFee,
      contactNumber: pendingItem.contactNumber,
      status: pendingItem.status,
    }));
    setPendingItem(null);
    setIsModalOpen(false);
  };

  const handleCancelModal = () => {
    setPendingItem(null);
    setIsModalOpen(false);
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

            {isModalOpen && pendingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Selected pawned item</p>
                      <h3 className="mt-2 text-xl font-semibold text-zinc-900">{pendingItem.unit}</h3>
                      <p className="text-sm text-zinc-500">{pendingItem.unitCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelModal}
                      className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-700">Item & Loan Details</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Purchased Date</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.purchasedDate}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Storage Fee</p>
                        <p className="text-sm font-semibold text-zinc-900">₱{pendingItem.storageFee}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Amount</p>
                        <p className="text-sm font-semibold text-zinc-900">₱{pendingItem.amount}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Barcode ID</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.barcodeId || "—"}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Memory</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.memory}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.status}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Condition</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.condition}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Items Included</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.itemsIncluded}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Serial Number</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.serialNumber}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Category</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.category}</p>
                      </div>
                      <div className="space-y-1 rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Unit Code</p>
                        <p className="text-sm font-semibold text-zinc-900">{pendingItem.unitCode}</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4">
                      <div className="mb-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-700">Customer Information</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Name</p>
                          <p className="text-sm font-semibold text-zinc-900">{pendingItem.name}</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Unit Code</p>
                          <p className="text-sm font-semibold text-zinc-900">{pendingItem.unitCode}</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Date</p>
                          <p className="text-sm font-semibold text-zinc-900">{pendingItem.purchasedDate}</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Contact Number</p>
                          <p className="text-sm font-semibold text-zinc-900">{pendingItem.contactNumber}</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Remarks</p>
                          <p className="text-sm font-semibold text-zinc-900">—</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Storage Fee</p>
                          <p className="text-sm font-semibold text-zinc-900">₱{pendingItem.storageFee}</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Parking Fee</p>
                          <p className="text-sm font-semibold text-zinc-900">—</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Purchased Date</p>
                          <p className="text-sm font-semibold text-zinc-900">{pendingItem.purchasedDate}</p>
                        </div>
                        <div className="space-y-1 rounded-2xl bg-zinc-50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Amount</p>
                          <p className="text-sm font-semibold text-zinc-900">₱{pendingItem.amount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancelModal}
                      className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmItem}
                      className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Confirm selection
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 inline-flex justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="mt-4 inline-flex justify-center rounded-lg border border-emerald-700 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            View Breakdown
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="mt-4 inline-flex justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
