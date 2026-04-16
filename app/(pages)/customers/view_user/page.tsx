"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { ViewCustomerModal } from "./_components/view-customer-modal";
import { EditCustomerModal } from "./_components/edit-customer-modal";
import type { CustomerDetail } from "./_components/types";
import { api } from "@/lib/api";

/* ──────────────────────────── Mock Data ──────────────────────────── */

const mockCustomers: Record<string, CustomerDetail> = {
  "1": {
    id: "1",
    firstName: "Juan",
    middleName: "Santos",
    lastName: "Dela Cruz",
    name: "Juan Dela Cruz",
    street: "123 Rizal St., Brgy. Ususan",
    barangay: "Brgy. Ususan",
    city: "Taguig City",
    province: "Metro Manila",
    address: "Brgy. Ususan, Taguig City",
    email: "juandelacruz@gmail.com",
    phone: "0912-345-6789",
    idType: "Driver's License",
    idNumber: "N5012345678",
    profilePhoto: null,
    idFrontPhoto: null,
    idBackPhoto: null,
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
      { label: "₱500 Cashback", points: 100 },
      { label: "10% Discount", points: 200 },
    ],
    deadlines: [
      { date: "April 30, 2026", label: "3 days remaining", variant: "warning" as const },
      { date: "Was due March 20, 2026", label: "Overdue", variant: "danger" as const },
    ],
    activityLog: [
      { title: "Contract renewed", date: "Apr 3 · Maria S.", description: "— iPhone 12 loan renewed for 30 days.", color: "bg-green-500" },
      { title: "Payment reminder sent", date: "Mar 25 · System", description: "— Gold ring overdue notice via SMS.", color: "bg-yellow-400" },
      { title: "Customer visited", date: "Mar 18 · Rico T.", description: "— Inquired about laptop appraisal.", color: "bg-zinc-400" },
    ],
  },
  "2": {
    id: "2",
    firstName: "John",
    middleName: "",
    lastName: "Doe",
    name: "John Doe",
    street: "456 Ayala Ave.",
    barangay: "Brgy. San Antonio",
    city: "Makati",
    province: "Metro Manila",
    address: "Brgy. San Antonio, Makati",
    email: "jhondoe@gmail.com",
    phone: "0912-345-6789",
    idType: "National ID",
    idNumber: "72120002152",
    profilePhoto: null,
    idFrontPhoto: null,
    idBackPhoto: null,
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
    rewards: [{ label: "₱500 Cashback", points: 100 }],
    deadlines: [
      { date: "May 15, 2026", label: "18 days remaining", variant: "warning" as const },
    ],
    activityLog: [
      { title: "Item pawned", date: "Mar 15 · Admin", description: "— Samsung S24 appraised at ₱18,000.", color: "bg-green-500" },
    ],
  },
  "3": {
    id: "3",
    firstName: "Park",
    middleName: "Jimin",
    lastName: "Neutron",
    name: "Park Jimin Neutron",
    street: "789 Commonwealth Ave.",
    barangay: "Brgy. Commonwealth",
    city: "Quezon City",
    province: "Metro Manila",
    address: "Brgy. Commonwealth, Quezon City",
    email: "jiminneutron@gmail.com",
    phone: "0912-345-6789",
    idType: "Passport",
    idNumber: "44443334444",
    profilePhoto: null,
    idFrontPhoto: null,
    idBackPhoto: null,
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
      { title: "Item forfeited", date: "Feb 20 · System", description: "— Laptop ASUS loan expired.", color: "bg-red-500" },
    ],
  },
};

/* ──────────────────────────── Helpers ──────────────────────────── */

function getStatusBadge(status: string) {
  switch (status) {
    case "Active":   return <StatusBadge label="Active"   variant="green"  />;
    case "Redeemed": return <StatusBadge label="Redeemed" variant="blue"   />;
    case "Overdue":  return <StatusBadge label="Overdue"  variant="orange" />;
    case "Forfeited":return <StatusBadge label="Forfeited"variant="black"  />;
    default:         return <StatusBadge label={status}   variant="black"  />;
  }
}

function formatCurrency(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ──────────────────────────── Icons ──────────────────────────── */

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

const editIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const noteIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

/* ──────────────────────────── Page Content ──────────────────────────── */

function CustomerDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get("id") ?? "";
  const [customer, setCustomer] = useState<CustomerDetail | null>(
    mockCustomers[customerId] ?? null,
  );
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      if (!customerId) return;
      setIsLoading(true);
      try {
        const data = await api.get<BackendCustomer>(`/customers/${customerId}`);
        if (data) {
          setCustomer({
            id: data.id,
            name: data.full_name,
            address: [data.address, data.barangay, data.city, data.province].filter(Boolean).join(", "),
            email: data.email || "N/A",
            phone: data.contact_number || "N/A",
            idNumber: data.id_presented || "N/A",
            createdAt: new Date(data.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            }),
            branch: "Current Branch", // This could be fetched too
            totalItemsPawned: 0,
            activePawned: 0,
            totalLoanValue: 0,
            overduePayments: 0,
            loyaltyPoints: 0,
            loyaltyMax: 100,
            transactions: [],
            rewards: [],
            deadlines: [],
            activityLog: [
              { 
                title: "Client Registered", 
                date: new Date(data.created_at).toLocaleDateString(), 
                description: "Basic profile created in the system.", 
                color: "bg-emerald-500" 
              }
            ],
          });
        } else {
          setCustomer(null);
        }
      } catch (err) {
        console.error("Failed to fetch customer:", err);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        idNumber: customer.idNumber,
        address: customer.address,
      });
    }
  }, [customer]);

  function handleEditChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      idNumber: editForm.idNumber.trim() || customer.idNumber,
      address: editForm.address.trim() || customer.address,
    });
    setIsEditOpen(false);
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">Customer Profile Not Found</p>
          <p className="text-sm text-text-tertiary mt-1">The requested ID does not exist in our database or belongs to another branch.</p>
        </div>
        <button
          onClick={() => router.push("/customers")}
          className="mt-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const loyaltyPercent = Math.round((customer.loyaltyPoints / customer.loyaltyMax) * 100);
  const pointsToReward = customer.loyaltyMax - customer.loyaltyPoints;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/customers")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-surface text-text-secondary transition-colors hover:bg-surface-hover"
        >
          {backIcon}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{customer.name}</h1>
          <p className="text-sm text-text-tertiary">{customer.address}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        {/* ── Left Column ── */}
        <div className="space-y-5">

          {/* Basic Info Card */}
          <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Clickable info area → opens View modal */}
              <button
                type="button"
                onClick={() => setIsViewOpen(true)}
                className="flex items-center gap-4 text-left transition-opacity hover:opacity-80"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-pawn-gold shadow-sm">
                  {customer.profilePhoto ? (
                    <img
                      src={customer.profilePhoto}
                      alt={`${customer.name} profile`}
                      className="h-full w-full object-cover"
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
                  <p className="mt-1 text-[10px] text-emerald-600 underline decoration-dotted">
                    Click to view full details
                  </p>
                </div>
              </button>

              {/* Pen icon + created-at badge */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-700 bg-emerald-50 text-emerald-800 transition-colors hover:bg-emerald-100"
                  title="Edit Profile"
                >
                  {editIcon}
                </button>
                <div className="rounded-full border border-border-main bg-surface-secondary px-4 py-1.5 text-[11px] font-medium text-text-secondary">
                  Created on {customer.createdAt} at {customer.branch}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Items Pawned", value: customer.totalItemsPawned, className: "text-text-primary" },
              { label: "Active Pawned",      value: customer.activePawned,      className: "text-emerald-700" },
              { label: "Total Loan Value",   value: formatCurrency(customer.totalLoanValue), className: "text-text-primary" },
              {
                label: "Overdue Payments",
                value: customer.overduePayments,
                className: customer.overduePayments > 0 ? "text-red-500" : "text-text-primary",
              },
            ].map(({ label, value, className }) => (
              <div key={label} className="rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Transaction History */}
          <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
            <div className="px-5 py-4">
              <h3 className="text-sm font-bold text-text-primary">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-900 text-amber-400">
                    {["Date", "Item", "Amount", "Status", "Branch", "Action"].map((h, i) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap px-4 py-2 text-[10px] font-bold uppercase tracking-wide ${i === 3 || i === 5 ? "text-center" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
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

          {/* Notes & Activity Log */}
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

        {/* ── Right Sidebar ── */}
        <div className="space-y-5">

          {/* Loyalty System */}
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

          {/* Rewards */}
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

          {/* Upcoming Deadlines */}
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
                          d.variant === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
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

      {/* Modals */}
      {isViewOpen && (
        <ViewCustomerModal customer={customer} onClose={() => setIsViewOpen(false)} />
      )}
      {isEditOpen && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setIsEditOpen(false)}
          onSave={(updated) => {
            setCustomer(updated);
            setIsEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────── Page Export ──────────────────────────── */

export default function CustomerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
          Loading customer details…
        </div>
      }
    >
      <CustomerDetailContent />
    </Suspense>
  );
}
