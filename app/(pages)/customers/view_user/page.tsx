"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { ViewCustomerModal } from "./_components/view-customer-modal";
import { EditCustomerModal } from "./_components/edit-customer-modal";
import type { CustomerDetail, ActivityEntry, Transaction, Reward, Deadline } from "./_components/types";
import { api } from "@/lib/api";

/* ──────────────────────────── Types ──────────────────────────── */
interface BackendCustomer {
  id: string;
  full_name: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  email: string;
  contact_number: string;
  id_presented: string;
  created_at: string;
}

interface ApiTransaction {
  transaction_no?: string | null;
  transaction_date?: string | null;
  purpose?: string | null;
  cash_in?: number | string | null;
  pawn_amount?: number | string | null;
  branch?: string | null;
  branch_id?: string | null;
  pawned_item?: {
    item_name?: string | null;
    category?: string | null;
    status?: string | null;
    branch?: string | null;
    amount?: number | string | null;
  } | null;
}

interface TransactionsResponse {
  transactions: ApiTransaction[];
}

interface CustomerTransactionRecord {
  transactionNo: string;
  date: string;
  time: string;
  item: string;
  category: string;
  amount: number;
  status: string;
  branch: string;
  unitCode: string;
  itemId: string;
  purpose: string;
  serialNumber: string;
  condition: string;
  itemsIncluded: string;
  memoryStorage: string;
  remarks: string;
  qrCode: string;
  itemPhotos: string[];
}

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
      { date: "April 3",  item: "iPhone 12",      amount: 24000, status: "Active",   branch: "Taguig" },
      { date: "April 4",  item: "MacBook Pro",     amount: 45000, status: "Redeemed", branch: "Makati" },
      { date: "Mar 20",   item: "Gold ring (18k)", amount: 8500,  status: "Overdue",  branch: "Taguig" },
      { date: "Feb 10",   item: "PlayStation 5",   amount: 15000, status: "Forfeited",branch: "Quezon" },
    ],
    rewards: [
      { label: "₱500 Cashback", points: 100 },
      { label: "10% Discount",  points: 200 },
    ],
    deadlines: [
      { date: "April 30, 2026",       label: "3 days remaining", variant: "warning" as const },
      { date: "Was due March 20, 2026", label: "Overdue",        variant: "danger"  as const },
    ],
    activityLog: [
      { title: "Contract renewed",        date: "Apr 3 · Maria S.", description: "— iPhone 12 loan renewed for 30 days.",   color: "bg-green-500"  },
      { title: "Payment reminder sent",   date: "Mar 25 · System",  description: "— Gold ring overdue notice via SMS.",      color: "bg-yellow-400" },
      { title: "Customer visited",        date: "Mar 18 · Rico T.", description: "— Inquired about laptop appraisal.",       color: "bg-zinc-400"   },
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
      { date: "Mar 15", item: "Samsung S24", amount: 18000, status: "Active",   branch: "Makati" },
      { date: "Feb 20", item: "Gold Chain",  amount: 14000, status: "Redeemed", branch: "Makati" },
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
      { date: "Jan 5",  item: "Watch Casio", amount: 5000,  status: "Redeemed",  branch: "Quezon" },
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
    case "Active":    return <StatusBadge label="Active"    variant="green"  />;
    case "Redeemed":  return <StatusBadge label="Redeemed"  variant="blue"   />;
    case "Overdue":   return <StatusBadge label="Overdue"   variant="orange" />;
    case "Forfeited": return <StatusBadge label="Forfeited" variant="black"  />;
    default:          return <StatusBadge label={status}    variant="black"  />;
  }
}

function formatCurrency(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNoteDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateValue?: string | null) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateValue?: string | null) {
  if (!dateValue) return "-";
  const [hours, minutes] = dateValue.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) return dateValue;

  const period = parsedHours >= 12 ? "PM" : "AM";
  const hour12 = ((parsedHours + 11) % 12) + 1;
  return `${hour12}:${minutes.padStart(2, "0")} ${period}`;
}

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

function normalizeTransactionStatus(tx: ApiTransaction) {
  const status = tx.pawned_item?.status;
  if (status) return status;

  switch (tx.purpose) {
    case "Pawn":
    case "Renew":
      return "Active";
    case "Buy Back":
      return "Redeemed";
    case "Sold Item":
      return "Forfeited";
    default:
      return "Active";
  }
}

function mapTransaction(tx: ApiTransaction): Transaction {
  return {
    date: formatShortDate(tx.transaction_date),
    item: tx.pawned_item?.item_name || "Item",
    amount: Number(tx.pawn_amount ?? tx.cash_in ?? tx.pawned_item?.amount ?? 0),
    status: normalizeTransactionStatus(tx),
    branch: tx.branch || tx.branch_id || tx.pawned_item?.branch || "-",
  };
}

function collectItemPhotos(tx: ApiTransaction) {
  const photos = (Array.isArray((tx as ApiTransaction & { pawned_item?: { item_photos?: string[] | null } }).pawned_item?.item_photos)
    ? (tx as ApiTransaction & { pawned_item?: { item_photos?: string[] | null } }).pawned_item?.item_photos
    : []).filter((value): value is string => typeof value === "string" && isImageUrl(value));

  return Array.from(new Set(photos));
}

function mapTransactionRecord(tx: ApiTransaction): CustomerTransactionRecord {
  return {
    transactionNo: tx.transaction_no || "-",
    date: formatShortDate(tx.transaction_date),
    time: formatTime(tx.transaction_time),
    item: tx.pawned_item?.item_name || "Item",
    category: tx.pawned_item?.category || "-",
    amount: Number(tx.pawn_amount ?? tx.cash_in ?? tx.pawned_item?.amount ?? 0),
    status: normalizeTransactionStatus(tx),
    branch: tx.branch || tx.branch_id || tx.pawned_item?.branch || "-",
    unitCode: tx.pawned_item?.item_id || "-",
    itemId: tx.pawned_item?.item_id || "-",
    purpose: tx.purpose || "-",
    serialNumber: tx.pawned_item?.serial_number || "-",
    condition: tx.pawned_item?.condition || "-",
    itemsIncluded: tx.pawned_item?.items_included || "-",
    memoryStorage: tx.pawned_item?.memory_storage || "-",
    remarks: tx.pawned_item?.remarks || "-",
    qrCode: tx.pawned_item?.qr_code || "-",
    itemPhotos: collectItemPhotos(tx),
  };
}

function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-main bg-surface-secondary p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-emerald-700" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}

function TransactionViewModal({
  transaction,
  onClose,
}: {
  transaction: CustomerTransactionRecord | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [transaction?.transactionNo, transaction?.itemPhotos.length]);

  if (!transaction) return null;

  const photos = transaction.itemPhotos;
  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[photoIndex] : null;
  const canMovePhotos = photos.length > 1;
  const targetItemId = transaction.itemId !== "-" ? transaction.itemId : transaction.unitCode;

  function movePhoto(direction: number) {
    if (!canMovePhotos) return;
    setPhotoIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0) return photos.length - 1;
      if (nextIndex >= photos.length) return 0;
      return nextIndex;
    });
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/90">Transaction Details</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{transaction.item}</h2>
              <p className="mt-1 text-sm text-emerald-50/80">
                Transaction No: {transaction.transactionNo} · {transaction.purpose}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
          <div className="space-y-4 self-start">
            <div className="rounded-3xl border border-border-main bg-surface-secondary p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Item Photos</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {hasPhotos ? `${photoIndex + 1} of ${photos.length}` : "No item photos available"}
                  </p>
                </div>
                {canMovePhotos && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => movePhoto(-1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-main bg-surface text-text-secondary transition-colors hover:bg-surface-hover"
                      aria-label="Previous photo"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-main bg-surface text-text-secondary transition-colors hover:bg-surface-hover"
                      aria-label="Next photo"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border-main bg-surface">
                {currentPhoto ? (
                  <div className="relative aspect-[4/3] w-full">
                    <img
                      src={currentPhoto}
                      alt={`${transaction.item} photo ${photoIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {canMovePhotos && (
                      <>
                        <button
                          type="button"
                          onClick={() => movePhoto(-1)}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                          aria-label="Previous photo"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => movePhoto(1)}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                          aria-label="Next photo"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">No item photos available</p>
                      <p className="mt-1 text-xs text-text-tertiary">This transaction only has its QR reference on file.</p>
                    </div>
                  </div>
                )}

                {hasPhotos && (
                  <div className="flex gap-2 overflow-x-auto border-t border-border-main px-3 py-3">
                    {photos.map((photo, index) => (
                      <button
                        key={`${photo}-${index}`}
                        type="button"
                        onClick={() => setPhotoIndex(index)}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border transition-colors ${index === photoIndex ? "border-emerald-600 ring-2 ring-emerald-100" : "border-border-main hover:border-emerald-300"}`}
                        aria-label={`Select item photo ${index + 1}`}
                      >
                        <img src={photo} alt={`Item photo ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border-main bg-surface-secondary p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">QR Code</p>
              <div className="mt-3 flex min-h-[320px] items-center justify-center">
                {transaction.qrCode && transaction.qrCode !== "-" ? (
                  isImageUrl(transaction.qrCode) ? (
                    <img
                      src={transaction.qrCode}
                      alt={`${transaction.item} QR code`}
                      className="h-72 w-72 object-contain"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-text-primary">QR code unavailable for this record.</p>
                  )
                ) : (
                  <p className="text-sm font-semibold text-text-primary">No QR code available.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 min-w-0 self-start xl:sticky xl:top-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Transaction Date" value={transaction.date} />
              <InfoCard label="Time" value={transaction.time} />
              <InfoCard label="Amount" value={formatCurrency(transaction.amount)} highlight />
              <InfoCard label="Status" value={transaction.status} />
              <InfoCard label="Branch" value={transaction.branch} />
              <InfoCard label="Category" value={transaction.category} />
              <InfoCard label="Item ID" value={transaction.itemId} />
              <InfoCard label="Serial Number" value={transaction.serialNumber} />
              <InfoCard label="Condition" value={transaction.condition} />
              <InfoCard label="Items Included" value={transaction.itemsIncluded} />
              <InfoCard label="Memory / Storage" value={transaction.memoryStorage} />
              <div className="rounded-2xl border border-border-main bg-surface-secondary p-4 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Remarks</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{transaction.remarks}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!targetItemId || targetItemId === "-") return;
                  router.push(`/inventory/pawned-items?itemId=${encodeURIComponent(targetItemId)}`);
                }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                View Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Icons ──────────────────────────── */

const backIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const customersListHref = "/customers";

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

/* ──────────────────────────── Page Content ──────────────────────────── */

function EmployeeCustomerDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get("id") ?? "";
  const initialCustomer = mockCustomers[customerId] ?? null;
  const [customer, setCustomer] = useState<CustomerDetail | null>(initialCustomer);
  const [isLoading, setIsLoading] = useState(Boolean(customerId && !initialCustomer));
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [transactionRecords, setTransactionRecords] = useState<CustomerTransactionRecord[]>([]);
  const [viewingTransaction, setViewingTransaction] = useState<CustomerTransactionRecord | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      if (!customerId) {
        setCustomer(null);
        setActivityLog([]);
        setTransactionRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [customerData, transactionData] = await Promise.all([
          api.get<BackendCustomer | null>(`/customers/${customerId}`),
          api.get<TransactionsResponse>(`/transactions?customerId=${encodeURIComponent(customerId)}&range=all`),
        ]);

        if (customerData) {
          const transactions = (transactionData?.transactions || []).map(mapTransaction);
          const detailedTransactions = (transactionData?.transactions || []).map(mapTransactionRecord);
          setCustomer({
            id: customerData.id,
            firstName: customerData.full_name?.split(" ")[0] || "",
            middleName: "",
            lastName: customerData.full_name?.split(" ").slice(1).join(" ") || "",
            name: customerData.full_name || "",
            street: customerData.address,
            barangay: customerData.barangay,
            city: customerData.city,
            province: customerData.province,
            address: [customerData.address, customerData.barangay, customerData.city, customerData.province].filter(Boolean).join(", "),
            email: customerData.email || "N/A",
            phone: customerData.contact_number || "N/A",
            idType: customerData.id_presented || "N/A",
            idNumber: customerData.id_presented || "N/A",
            profilePhoto: null,
            idFrontPhoto: null,
            idBackPhoto: null,
            createdAt: new Date(customerData.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            }),
            branch: "Current Branch", 
            totalItemsPawned: transactions.length,
            activePawned: transactions.filter((transaction) => transaction.status === "Active").length,
            totalLoanValue: transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
            overduePayments: transactions.filter((transaction) => transaction.status === "Overdue").length,
            loyaltyPoints: 0,
            loyaltyMax: 100,
            transactions,
            rewards: [],
            deadlines: [],
            activityLog: [
              { 
                title: "Client Registered", 
                date: new Date(customerData.created_at).toLocaleDateString(), 
                description: "Basic profile created in the system.", 
                color: "bg-emerald-500" 
              }
            ],
          });
          setTransactionRecords(detailedTransactions);
        } else {
          setCustomer(null);
          setTransactionRecords([]);
        }
      } catch (err) {
        console.error("Failed to fetch customer:", err);
        setCustomer(null);
        setTransactionRecords([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    if (customer) {
      setActivityLog(customer.activityLog);
    }
  }, [customer]);

  useEffect(() => {
    setIsViewOpen(false);
    setIsNoteOpen(false);
    setViewingTransaction(null);
    setNoteTitle("");
    setNoteBody("");
  }, [customerId]);

  function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer || !noteBody.trim()) return;

    const newNote = {
      title: noteTitle.trim() || "Manual Note",
      date: formatNoteDate(new Date()),
      description: noteBody.trim(),
      color: "bg-amber-400",
    };

    setActivityLog((prev) => [newNote, ...prev]);
    setNoteTitle("");
    setNoteBody("");
    setIsNoteOpen(false);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-20">
        <div className="flex items-center gap-3 rounded-full border border-border-main bg-surface px-4 py-3 text-sm text-text-secondary shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading customer details...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-semibold text-text-primary">Customer not found</p>
        <button
          type="button"
          onClick={() => router.push(customersListHref)}
          className="group inline-flex items-center gap-2 rounded-full border border-border-main bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200">
            {backIcon}
          </span>
          Back to Customers
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
          type="button"
          onClick={() => router.push(customersListHref)}
          className="group inline-flex h-11 items-center gap-3 rounded-full border border-border-main bg-surface px-4 pl-2 pr-5 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
          aria-label="Back to customers list"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200">
            {backIcon}
          </span>
          <span className="leading-none">Back to customers</span>
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

          {/* Basic Info Card — View only (no edit button) */}
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

              {/* Created-at badge only — no edit button for employee */}
              <div className="flex-shrink-0">
                <div className="rounded-full border border-border-main bg-surface-secondary px-4 py-1.5 text-[11px] font-medium text-text-secondary">
                  Created on {customer.createdAt} at {customer.branch}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Items Pawned", value: customer.totalItemsPawned,             className: "text-text-primary" },
              { label: "Active Pawned",       value: customer.activePawned,                className: "text-emerald-700"  },
              { label: "Total Loan Value",    value: formatCurrency(customer.totalLoanValue), className: "text-text-primary" },
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
                  {transactionRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-text-tertiary">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactionRecords.map((tx, i) => (
                      <tr
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => setViewingTransaction(tx)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setViewingTransaction(tx);
                          }
                        }}
                        className="cursor-pointer border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-secondary">{tx.date}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-text-primary">{tx.item}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-secondary">{formatCurrency(tx.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center">{getStatusBadge(tx.status)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-secondary">{tx.branch}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingTransaction(tx);
                            }}
                            className="rounded border border-border-main bg-surface px-3 py-1 text-[10px] font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
                          >
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
              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => setIsNoteOpen(true)}
              >
                <span className="flex items-center gap-1.5">
                  {noteIcon}
                  Add Note
                </span>
              </ActionButton>
            </div>
            <div className="space-y-4">
              {activityLog.length === 0 ? (
                <p className="text-xs text-text-tertiary">No notes or activity yet.</p>
              ) : (
                activityLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <span className={`h-3 w-3 rounded-full ${entry.color}`} />
                    {i < activityLog.length - 1 && (
                      <span className="mt-1 h-8 w-px bg-border-main" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-primary">{entry.title}</p>
                    <p className="text-[10px] text-text-tertiary">{entry.date}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{entry.description}</p>
                  </div>
                </div>
                ))
              )}
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

      {/* View Modal only — employees cannot edit */}
      {isViewOpen && (
        <ViewCustomerModal customer={customer} onClose={() => setIsViewOpen(false)} />
      )}

      {viewingTransaction && (
        <TransactionViewModal transaction={viewingTransaction} onClose={() => setViewingTransaction(null)} />
      )}

      {isNoteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          onClick={() => setIsNoteOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-emerald-900 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                Customer Notes
              </p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Add Note</h2>
                  <p className="mt-1 text-sm text-emerald-50/80">
                    Save a quick note to the customer activity log.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNoteOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Close add note modal"
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

            <form onSubmit={handleAddNote} className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Note Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  placeholder="Optional title"
                  className="h-11 w-full rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-tertiary">
                  Note
                </label>
                <textarea
                  value={noteBody}
                  onChange={(event) => setNoteBody(event.target.value)}
                  placeholder="Write something useful for the next person who opens this customer..."
                  rows={5}
                  className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-emerald-700"
                />
              </div>

              <div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-sm text-emerald-text">
                This note will appear at the top of the activity log.
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border-main pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsNoteOpen(false)}
                  className="rounded-md border border-border-main px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Page Export ──────────────────────────── */

export default function EmployeeCustomerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
          Loading customer details…
        </div>
      }
    >
      <EmployeeCustomerDetailContent />
    </Suspense>
  );
}
