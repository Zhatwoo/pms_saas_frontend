"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";

type Transaction = {
  date: string;
  item: string;
  amount: number;
  status: "Active" | "Redeemed" | "Overdue" | "Forfeited";
  branch: string;
};

type Reward = {
  name: string;
  points: number;
};

type Deadline = {
  date: string;
  label: string;
  variant: "warning" | "danger";
};

type ActivityEntry = {
  type: string;
  date: string;
  description: string;
  color: string;
};

type CustomerDetail = {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  registered: string;
  branch: string;
  totalItemsPawned: number;
  activePawned: number;
  totalLoanValue: number;
  overduePayments: number;
  loyaltyPoints: number;
  loyaltyMax: number;
  transactions: Transaction[];
  rewards: Reward[];
  deadlines: Deadline[];
  activities: ActivityEntry[];
};

const customers: Record<string, CustomerDetail> = {
  "1": {
    id: "1",
    name: "Juan Dela Cruz",
    address: "Brgy. Ususan, Taguig City",
    email: "juandelacruz@gmail.com",
    phone: "0912-345-6789",
    idType: "Driver's License",
    idNumber: "N5012345678",
    registered: "February 14, 2022",
    branch: "Taguig Branch",
    totalItemsPawned: 8,
    activePawned: 2,
    totalLoanValue: 69000,
    overduePayments: 1,
    loyaltyPoints: 90,
    loyaltyMax: 100,
    transactions: [
      { date: "April 3", item: "iPhone 12", amount: 24000, status: "Active", branch: "Taguig" },
      { date: "April 4", item: "MacBook Pro", amount: 45000, status: "Redeemed", branch: "Makati" },
      { date: "Mar 30", item: "Gold ring (18k)", amount: 8500, status: "Overdue", branch: "Taguig" },
      { date: "Feb 10", item: "PlayStation 5", amount: 15000, status: "Forfeited", branch: "Quezon" },
    ],
    rewards: [
      { name: "₱500 Cashback", points: 100 },
      { name: "10% Discount", points: 200 },
    ],
    deadlines: [
      { date: "April 30, 2026", label: "3 days remaining", variant: "warning" },
      { date: "Was due March 20, 2026", label: "Overdue", variant: "danger" },
    ],
    activities: [
      { type: "Contract renewed", date: "Apr 3 · Maria S.", description: "iPhone 12 loan renewed for 30 days.", color: "bg-green-500" },
      { type: "Payment reminder sent", date: "Mar 25 · System", description: "Gold ring overdue notice via SMS.", color: "bg-yellow-400" },
      { type: "Customer visited", date: "Mar 18 · Rico T.", description: "Inquired about laptop appraisal.", color: "bg-zinc-400" },
    ],
  },
  "2": {
    id: "2",
    name: "John Doe",
    address: "Brgy. San Antonio, Makati",
    email: "jhondoe@gmail.com",
    phone: "0912-345-6789",
    idType: "National ID",
    idNumber: "72120002152",
    registered: "February 15, 2022",
    branch: "Makati Branch",
    totalItemsPawned: 3,
    activePawned: 1,
    totalLoanValue: 32000,
    overduePayments: 0,
    loyaltyPoints: 45,
    loyaltyMax: 100,
    transactions: [
      { date: "Mar 15", item: "Samsung S24", amount: 18000, status: "Active", branch: "Makati" },
      { date: "Feb 20", item: "Gold Chain", amount: 14000, status: "Redeemed", branch: "Makati" },
    ],
    rewards: [{ name: "₱500 Cashback", points: 100 }],
    deadlines: [{ date: "May 15, 2026", label: "18 days remaining", variant: "warning" }],
    activities: [
      { type: "Item pawned", date: "Mar 15 · Admin", description: "Samsung S24 appraised at ₱18,000.", color: "bg-green-500" },
    ],
  },
  "3": {
    id: "3",
    name: "Park Jimin Neutron",
    address: "Brgy. Commonwealth, Quezon City",
    email: "jiminneutron@gmail.com",
    phone: "0912-345-6789",
    idType: "Passport",
    idNumber: "44443334444",
    registered: "February 16, 2022",
    branch: "Quezon Branch",
    totalItemsPawned: 5,
    activePawned: 0,
    totalLoanValue: 41000,
    overduePayments: 2,
    loyaltyPoints: 20,
    loyaltyMax: 100,
    transactions: [
      { date: "Jan 20", item: "Laptop ASUS", amount: 22000, status: "Forfeited", branch: "Quezon" },
      { date: "Jan 5", item: "Watch Casio", amount: 5000, status: "Redeemed", branch: "Quezon" },
    ],
    rewards: [],
    deadlines: [],
    activities: [
      { type: "Item forfeited", date: "Feb 20 · System", description: "Laptop ASUS loan expired.", color: "bg-red-500" },
    ],
  },
};

const backIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const userIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const noteIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const editIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString()}`;
}

function getStatusBadge(status: Transaction["status"]) {
  switch (status) {
    case "Active":
      return <StatusBadge label="Active" variant="green" />;
    case "Redeemed":
      return <StatusBadge label="Redeemed" variant="blue" />;
    case "Overdue":
      return <StatusBadge label="Overdue" variant="orange" />;
    case "Forfeited":
      return <StatusBadge label="Forfeited" variant="black" />;
    default:
      return <StatusBadge label={status} variant="black" />;
  }
}

function getIdTypeValue(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("national")) return "national-id";
  if (normalized.includes("passport")) return "passport";
  if (normalized.includes("sss")) return "sss";
  return "driver-license";
}

function EmployeeCustomerProfileContent() {
  const router = useRouter();
  const params = useParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [customer, setCustomer] = useState<CustomerDetail | null>(customerId ? customers[customerId] ?? null : null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    idType: "driver-license",
    idNumber: "",
    address: "",
  });

  useEffect(() => {
    setCustomer(customerId ? customers[customerId] ?? null : null);
  }, [customerId]);

  useEffect(() => {
    if (!customer) return;

    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      idType: getIdTypeValue(customer.idType),
      idNumber: customer.idNumber,
      address: customer.address,
    });
  }, [customer]);

  function handleEditChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  function handleSaveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;

    setCustomer({
      ...customer,
      name: editForm.name.trim() || customer.name,
      email: editForm.email.trim() || customer.email,
      phone: editForm.phone.trim() || customer.phone,
      idType: editForm.idType,
      idNumber: editForm.idNumber.trim() || customer.idNumber,
      address: editForm.address.trim() || customer.address,
    });
    setIsEditOpen(false);
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-semibold text-text-primary">Customer not found</p>
        <button
          onClick={() => router.push("/employee/customers")}
          className="text-sm text-emerald-700 underline hover:text-emerald-800"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const loyaltyPercent = Math.round((customer.loyaltyPoints / customer.loyaltyMax) * 100);
  const pointsToReward = customer.loyaltyMax - customer.loyaltyPoints;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/employee/customers")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          {backIcon}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">{customer.name}</h1>
          <p className="text-sm text-zinc-500">{customer.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                  {userIcon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-emerald-900">Basic Info</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">Email: {customer.email}</p>
                  <p className="text-xs text-zinc-500">Phone: {customer.phone}</p>
                  <p className="text-xs text-zinc-500">ID Type: {customer.idType}</p>
                  <p className="text-xs text-zinc-500">ID: {customer.idNumber}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  {editIcon}
                  Edit Profile
                </button>
                <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-[11px] font-medium text-zinc-600">
                  Created on {customer.registered} at {customer.branch}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Total items pawned</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{customer.totalItemsPawned}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Active Pawned</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{customer.activePawned}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Total loan value</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(customer.totalLoanValue)}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Overdue payments</p>
              <p className={`mt-1 text-2xl font-bold ${customer.overduePayments > 0 ? "text-red-500" : "text-emerald-900"}`}>
                {customer.overduePayments}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="px-5 py-4">
              <h3 className="text-sm font-bold text-emerald-900">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-900 text-amber-400">
                    <th className="whitespace-nowrap px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide">Date</th>
                    <th className="whitespace-nowrap px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide">Item</th>
                    <th className="whitespace-nowrap px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide">Amount</th>
                    <th className="whitespace-nowrap px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wide">Status</th>
                    <th className="whitespace-nowrap px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide">Branch</th>
                    <th className="whitespace-nowrap px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-zinc-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    customer.transactions.map((transaction, index) => (
                      <tr key={index} className="border-t border-zinc-100 transition-colors hover:bg-emerald-50/60">
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-600">{transaction.date}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-zinc-900">{transaction.item}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-600">{formatCurrency(transaction.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center">{getStatusBadge(transaction.status)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-600">{transaction.branch}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center">
                          <button className="rounded border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-900">Notes &amp; Activity Log</h3>
              <ActionButton variant="primary" size="sm">
                <span className="flex items-center gap-1.5">
                  {noteIcon}
                  Add Note
                </span>
              </ActionButton>
            </div>
            <div className="space-y-4">
              {customer.activities.map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <span className={`h-3 w-3 rounded-full ${entry.color}`} />
                    {index < customer.activities.length - 1 && <span className="mt-1 h-8 w-px bg-zinc-200" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-zinc-900">{entry.type}</p>
                    <p className="text-[10px] text-zinc-500">{entry.date}</p>
                    <p className="mt-0.5 text-xs text-zinc-600">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-900">Loyalty System</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{customer.loyaltyPoints} Points</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${loyaltyPercent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Earn {pointsToReward} more points for reward</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-900">Rewards</h3>
            {customer.rewards.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500">No rewards available yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {customer.rewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">{reward.name}</span>
                    <span className="text-xs font-bold text-emerald-700">{reward.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-900">Upcoming Deadlines</h3>
            {customer.deadlines.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500">No upcoming deadlines.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {customer.deadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className={`h-3 w-3 flex-shrink-0 rounded-full ${deadline.variant === "danger" ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="text-xs text-zinc-600">{deadline.date}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          deadline.variant === "danger"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {deadline.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && customer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          onClick={() => setIsEditOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-emerald-900 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                Customer Management
              </p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Customer Profile</h2>
                  <p className="mt-1 text-sm text-emerald-50/80">
                    Update the customer details for <span className="font-bold text-amber-300">{customer.name}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Close edit customer modal"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    ID Type
                  </label>
                  <select
                    name="idType"
                    value={editForm.idType}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                  >
                    <option value="driver-license">Driver&apos;s License</option>
                    <option value="national-id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="sss">SSS</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    ID Number
                  </label>
                  <input
                    name="idNumber"
                    type="text"
                    value={editForm.idNumber}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-sm text-emerald-text">
                Update the profile details and save the changes.
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border-main pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-md border border-border-main px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeCustomerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
          Loading customer details...
        </div>
      }
    >
      <EmployeeCustomerProfileContent />
    </Suspense>
  );
}
