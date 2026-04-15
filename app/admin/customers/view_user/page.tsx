"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";

/* ---------------------------- Mock Data ---------------------------- */

const mockCustomers: Record<string, CustomerDetail> = {
  "1": {
    id: "1",
    name: "Juan Dela Cruz",
    address: "Brgy. Ususan, Taguig City",
    email: "juandelacruz@gmail.com",
    phone: "0912-345-6789",
    idNumber: "12345678",
    createdAt: "February 14, 2022",
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
      { date: "Mar 20", item: "Gold ring (18k)", amount: 8500, status: "Overdue", branch: "Taguig" },
      { date: "Feb 10", item: "PlayStation 5", amount: 15000, status: "Forfeited", branch: "Quezon" },
    ],
    rewards: [
      { label: "P500 Cashback", points: 100 },
      { label: "10% Discount", points: 200 },
    ],
    deadlines: [
      { date: "April 30, 2026", label: "3 days remaining", variant: "warning" as const },
      { date: "Was due March 20, 2026", label: "Overdue", variant: "danger" as const },
    ],
    activityLog: [
      { title: "Contract renewed", date: "Apr 3 | Maria S.", description: "iPhone 12 loan renewed for 30 days.", color: "bg-green-500" },
      { title: "Payment reminder sent", date: "Mar 25 | System", description: "Gold ring overdue notice via SMS.", color: "bg-yellow-400" },
      { title: "Customer visited", date: "Mar 18 | Rico T.", description: "Inquired about laptop appraisal.", color: "bg-zinc-400" },
    ],
  },
  "2": {
    id: "2",
    name: "John Doe",
    address: "Brgy. San Antonio, Makati",
    email: "jhondoe@gmail.com",
    phone: "0912-345-6789",
    idNumber: "72120002152",
    createdAt: "February 15, 2022",
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
    rewards: [
      { label: "P500 Cashback", points: 100 },
    ],
    deadlines: [
      { date: "May 15, 2026", label: "18 days remaining", variant: "warning" as const },
    ],
    activityLog: [
      { title: "Item pawned", date: "Mar 15 | Admin", description: "Samsung S24 appraised at P18,000.", color: "bg-green-500" },
    ],
  },
  "3": {
    id: "3",
    name: "Park Jimin Neutron",
    address: "Brgy. Commonwealth, Quezon City",
    email: "jiminneutron@gmail.com",
    phone: "0912-345-6789",
    idNumber: "44443334444",
    createdAt: "February 16, 2022",
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
    activityLog: [
      { title: "Item forfeited", date: "Feb 20 | System", description: "Laptop ASUS loan expired.", color: "bg-red-500" },
    ],
  },
};

/* ------------------------------ Types ------------------------------ */

interface CustomerDetail {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  idNumber: string;
  profileImage?: string;
  createdAt: string;
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
  activityLog: ActivityEntry[];
}

interface Transaction {
  date: string;
  item: string;
  amount: number;
  status: string;
  branch: string;
}

interface Reward {
  label: string;
  points: number;
}

interface Deadline {
  date: string;
  label: string;
  variant: "warning" | "danger";
}

interface ActivityEntry {
  title: string;
  date: string;
  description: string;
  color: string;
}

/* ----------------------------- Helpers ----------------------------- */

function getStatusBadge(status: string) {
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

function formatCurrency(value: number) {
  return `P${value.toLocaleString()}`;
}

const PHONE_LOCAL_REGEX = /^9\d{9}$/;

function toPhoneLocalPart(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("63")) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith("0")) {
    return digits.slice(1, 11);
  }

  return digits.slice(0, 10);
}

/* ------------------------------ Icons ------------------------------ */

const backIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const userIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900">
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

/* ------------------------- Component ------------------------- */

export default function CustomerDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get("id") ?? "";

  const [customer, setCustomer] = useState<CustomerDetail | null>(mockCustomers[customerId] ?? null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    profileImage: "",
  });

  useEffect(() => {
    setCustomer(mockCustomers[customerId] ?? null);
  }, [customerId]);

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name,
        email: customer.email,
        phone: toPhoneLocalPart(customer.phone),
        idNumber: customer.idNumber,
        address: customer.address,
        profileImage: customer.profileImage ?? "",
      });
    }
  }, [customer]);

  function handleEditChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    if (name === "phone") {
      const phoneDigits = toPhoneLocalPart(value);
      setEditForm((current) => ({ ...current, phone: phoneDigits }));
      setPhoneError("");
      return;
    }

    setEditForm((current) => ({ ...current, [name]: value }));
  }

  function handleProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditForm((current) => ({ ...current, profileImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(selectedFile);
  }

  function handleSaveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;

    const localPhone = editForm.phone.trim();
    if (!PHONE_LOCAL_REGEX.test(localPhone)) {
      setPhoneError("Phone must be 10 digits and start with 9.");
      return;
    }

    const normalizedPhone = `+63${localPhone}`;

    setPhoneError("");

    setCustomer({
      ...customer,
      name: editForm.name.trim() || customer.name,
      email: editForm.email.trim() || customer.email,
      phone: normalizedPhone || customer.phone,
      idNumber: editForm.idNumber.trim() || customer.idNumber,
      address: editForm.address.trim() || customer.address,
      profileImage: editForm.profileImage || customer.profileImage,
    });
    setIsEditOpen(false);
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-semibold text-text-primary">Customer not found</p>
        <button
          onClick={() => router.push("/admin/customers")}
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/customers")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-surface text-text-secondary transition-colors hover:bg-surface-hover"
        >
          {backIcon}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{customer.name}</h1>
          <p className="text-sm text-text-tertiary">{customer.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-border-main bg-surface p-5 shadow-sm transition-colors duration-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pawn-gold shadow-sm">
                  {customer.profileImage ? (
                    <img
                      src={customer.profileImage}
                      alt={`${customer.name} profile`}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    userIcon
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Basic Info</h2>
                  <p className="mt-0.5 text-xs text-text-tertiary">Email: {customer.email}</p>
                  <p className="text-xs text-text-tertiary">Phone: {customer.phone}</p>
                  <p className="text-xs text-text-tertiary">ID: {customer.idNumber}</p>
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
                <div className="rounded-full border border-border-main bg-surface-secondary px-4 py-1.5 text-[11px] font-medium text-text-secondary">
                  Created on {customer.createdAt} at {customer.branch}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Total items pawned</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{customer.totalItemsPawned}</p>
            </div>
            <div className="rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Active Pawned</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{customer.activePawned}</p>
            </div>
            <div className="rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Total loan value</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(customer.totalLoanValue)}</p>
            </div>
            <div className="rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Overdue payments</p>
              <p className={`mt-1 text-2xl font-bold ${customer.overduePayments > 0 ? "text-red-500" : "text-text-primary"}`}>
                {customer.overduePayments}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
            <div className="px-5 py-4">
              <h3 className="text-sm font-bold text-text-primary">Transaction History</h3>
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
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-text-tertiary">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    customer.transactions.map((tx, i) => (
                      <tr key={i} className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60">
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-secondary">{tx.date}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-text-primary">{tx.item}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-secondary">{formatCurrency(tx.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center">{getStatusBadge(tx.status)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-secondary">{tx.branch}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center">
                          <button className="rounded border border-border-main bg-surface px-3 py-1 text-[10px] font-semibold text-text-secondary transition-colors hover:bg-surface-hover">
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

          <div className="rounded-lg border border-border-main bg-surface p-5 shadow-sm transition-colors duration-300">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Notes &amp; Activity Log</h3>
              <ActionButton variant="primary" size="sm">
                <span className="flex items-center gap-1.5">
                  {noteIcon}
                  Add Note
                </span>
              </ActionButton>
            </div>
            <div className="space-y-4">
              {customer.activityLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <span className={`h-3 w-3 rounded-full ${entry.color}`} />
                    {i < customer.activityLog.length - 1 && (
                      <span className="mt-1 h-8 w-px bg-border-main" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-primary">{entry.title}</p>
                    <p className="text-[10px] text-text-tertiary">{entry.date}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border-main bg-surface p-5 shadow-sm transition-colors duration-300">
            <h3 className="text-sm font-bold text-text-primary">Loyalty System</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{customer.loyaltyPoints} Points</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${loyaltyPercent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-text-tertiary">
              Earn {pointsToReward} more points for reward
            </p>
          </div>

          <div className="rounded-lg border border-border-main bg-surface p-5 shadow-sm transition-colors duration-300">
            <h3 className="text-sm font-bold text-text-primary">Rewards</h3>
            {customer.rewards.length === 0 ? (
              <p className="mt-3 text-xs text-text-tertiary">No rewards available yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {customer.rewards.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{r.label}</span>
                    <span className="text-xs font-bold text-emerald-700">{r.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border-main bg-surface p-5 shadow-sm transition-colors duration-300">
            <h3 className="text-sm font-bold text-text-primary">Upcoming Deadlines</h3>
            {customer.deadlines.length === 0 ? (
              <p className="mt-3 text-xs text-text-tertiary">No upcoming deadlines.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {customer.deadlines.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`h-3 w-3 flex-shrink-0 rounded-full ${d.variant === "danger" ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="text-xs text-text-secondary">{d.date}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          d.variant === "danger"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {d.label}
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
                    Profile Picture
                  </label>
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-border-main bg-surface-secondary p-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border-main bg-surface">
                      {editForm.profileImage ? (
                        <img
                          src={editForm.profileImage}
                          alt="Customer profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xl font-bold leading-none text-text-tertiary">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <input
                        id="edit-customer-profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="edit-customer-profile-image"
                        className="inline-flex cursor-pointer items-center rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
                      >
                        Upload Photo
                      </label>
                      {editForm.profileImage && (
                        <button
                          type="button"
                          onClick={() => setEditForm((current) => ({ ...current, profileImage: "" }))}
                          className="rounded-md border border-border-main px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
                        >
                          Remove
                        </button>
                      )}
                      <p className="text-center text-[11px] text-text-tertiary">
                        Upload JPG or PNG profile image.
                      </p>
                    </div>
                  </div>
                </div>

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
                  <div className="flex h-11 w-full overflow-hidden rounded-md border border-input-border bg-input-bg focus-within:border-emerald-700">
                    <span className="inline-flex items-center border-r border-input-border px-3 text-sm font-semibold text-text-secondary">
                      +63
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9XXXXXXXXX"
                      pattern="^9\\d{9}$"
                      title="Use 10-digit mobile number starting with 9"
                      className="h-full w-full bg-transparent px-3 text-sm text-text-primary outline-none"
                    />
                  </div>
                  {phoneError && (
                    <p className="mt-1 text-xs font-medium text-red-500">{phoneError}</p>
                  )}
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
