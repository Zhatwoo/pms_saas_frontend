"use client";
/* eslint-disable @next/next/no-img-element */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { api } from "@/lib/api";
import { ViewCustomerModal, resolveCustomerPrimaryVisual } from "@/components/shared/customer-profile-modal";
import { useAuth } from "@/contexts/auth-context";
import type {
  ActivityEntry,
  CustomerDetail,
} from "@/app/(pages)/customers/view_user/_components/types";

interface ApiCustomer {
  id: string;
  full_name: string;
  address: string | null;
  contact_number: string | null;
  email: string | null;
  id_presented: string | null;
  id_number?: string | null;
  profile_photo_url?: string | null;
  id_front_photo_url?: string | null;
  id_back_photo_url?: string | null;
  branch_name?: string | null;
  matching_customer_count?: number;
  matching_branch_count?: number;
  matching_customer_ids?: string[];
  branch_id: string | null;
  created_at: string;
}

interface ApiTransaction {
  transaction_no?: string | null;
  transaction_date?: string | null;
  transaction_time?: string | null;
  purpose?: string | null;
  cash_in?: number | string | null;
  pawn_amount?: number | string | null;
  branch?: string | null;
  branch_id?: string | null;
  pawned_item?: {
    item_id?: string | null;
    item_name?: string | null;
    category?: string | null;
    status?: string | null;
    condition?: string | null;
    serial_number?: string | null;
    items_included?: string | null;
    memory_storage?: string | null;
    remarks?: string | null;
    qr_code?: string | null;
    item_photo?: string | null;
    item_photos?: string[] | null;
    pawn_date?: string | null;
    amount?: number | string | null;
    branch?: string | null;
  } | null;
}

interface TransactionsResponse {
  transactions: ApiTransaction[];
}

interface ApiCustomerActivityLog {
  id: string;
  action: string;
  createdAt: string;
  actorName?: string;
  details?: {
    title?: string;
    note?: string;
  };
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "",
      middleName: "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts[parts.length - 1],
  };
}

function splitAddress(address: string | null) {
  const parts = (address || "").split(",").map((part) => part.trim()).filter(Boolean);
  return {
    street: parts[0] || "-",
    barangay: parts[1] || "-",
    city: parts[2] || "-",
    province: parts[3] || "Metro Manila",
  };
}

function formatFullDate(dateValue?: string | null) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "long",
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

function normalizeStatus(tx: ApiTransaction): string {
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

function collectItemPhotos(tx: ApiTransaction) {
  const photos = (Array.isArray(tx.pawned_item?.item_photos) ? tx.pawned_item?.item_photos : [])
    .filter((value): value is string => typeof value === "string" && isImageUrl(value));

  return Array.from(new Set(photos));
}

function mapTx(tx: ApiTransaction): CustomerTransactionRecord {
  return {
    transactionNo: tx.transaction_no || "-",
    date: formatShortDate(tx.transaction_date),
    time: formatTime(tx.transaction_time),
    item: tx.pawned_item?.item_name || "Item",
    category: tx.pawned_item?.category || "-",
    amount: Number(tx.pawn_amount ?? tx.cash_in ?? tx.pawned_item?.amount ?? 0),
    status: normalizeStatus(tx),
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
                  router.push(`/employee/inventory/pawned-items?itemId=${encodeURIComponent(targetItemId)}`);
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

function formatNoteDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapApiActivityToEntry(log: ApiCustomerActivityLog): ActivityEntry {
  const actor = log.actorName?.trim() || "System";
  const title = log.details?.title?.trim() || "Customer activity";
  const note = log.details?.note?.trim() || "Activity recorded.";

  return {
    title,
    date: `${formatFullDate(log.createdAt)} - ${actor}`,
    description: `- ${note}`,
    color: log.action === "CUSTOMER_NOTE_ADDED" ? "bg-emerald-500" : "bg-blue-500",
  };
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
  const pathname = usePathname();
  const { user } = useAuth();
  const customerId = searchParams.get("id") ?? "";
  const initialAction = searchParams.get("mode");
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [transactionRecords, setTransactionRecords] = useState<CustomerTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<CustomerTransactionRecord | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerData() {
      if (!customerId) {
        setCustomer(null);
        setActivityLog([]);
        setTransactionRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [customerRecord, txResponse, fetchedActivityLogs] = await Promise.all([
          api.get<ApiCustomer | null>(`/customers/${encodeURIComponent(customerId)}`),
          api.get<TransactionsResponse>(`/transactions?customerId=${encodeURIComponent(customerId)}&range=all`),
          api.get<ApiCustomerActivityLog[]>(`/customers/${encodeURIComponent(customerId)}/activity-logs`),
        ]);

        if (!customerRecord) {
          setCustomer(null);
          setActivityLog([]);
          setTransactionRecords([]);
          return;
        }

        const records = (txResponse?.transactions || []).map(mapTx);
        const transactions = records.map((record) => ({
          date: record.date,
          item: record.item,
          amount: record.amount,
          status: record.status,
          branch: record.branch,
        }));
        const activePawned = records.filter((tx) => tx.status === "Active").length;
        const overduePayments = records.filter((tx) => tx.status === "Overdue").length;
        const totalLoanValue = records.reduce((sum, tx) => sum + tx.amount, 0);

        const parsedName = splitName(customerRecord.full_name || "");
        const parsedAddress = splitAddress(customerRecord.address);
        const defaultActivity: ActivityEntry[] = [
          {
            title: "Customer profile loaded",
            date: `${formatFullDate(customerRecord.created_at)} - System`,
            description: "- Showing database transactions for this account.",
            color: "bg-emerald-500",
          },
        ];
        const fetchedActivity = (fetchedActivityLogs || []).map(mapApiActivityToEntry);
        const combinedActivity = [...fetchedActivity, ...defaultActivity];

        const mappedCustomer: CustomerDetail = {
          id: customerRecord.id,
          firstName: parsedName.firstName,
          middleName: parsedName.middleName,
          lastName: parsedName.lastName,
          name: customerRecord.full_name || "Unnamed Customer",
          street: parsedAddress.street,
          barangay: parsedAddress.barangay,
          city: parsedAddress.city,
          province: parsedAddress.province,
          address: customerRecord.address || "-",
          email: customerRecord.email || "-",
          phone: customerRecord.contact_number || "-",
          idType: customerRecord.id_presented || "-",
          idNumber: customerRecord.id_presented || customerRecord.id_number || "-",
          profilePhoto: customerRecord.profile_photo_url || null,
          idFrontPhoto: customerRecord.id_front_photo_url || null,
          idBackPhoto: customerRecord.id_back_photo_url || null,
          matchingCustomerCount: customerRecord.matching_customer_count || 1,
          matchingBranchCount: customerRecord.matching_branch_count || 1,
          matchingCustomerIds: customerRecord.matching_customer_ids || [],
          createdAt: formatFullDate(customerRecord.created_at),
          branch: customerRecord.branch_name || user?.branchName || "Current Branch",
          totalItemsPawned: transactions.length,
          activePawned,
          totalLoanValue,
          overduePayments,
          loyaltyPoints: 0,
          loyaltyMax: 100,
          transactions,
          rewards: [],
          deadlines: [],
          activityLog: combinedActivity,
        };

        setCustomer(mappedCustomer);
        setActivityLog(combinedActivity);
        setTransactionRecords(records);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load customer details.";
        setLoadError(message);
        setCustomer(null);
        setActivityLog([]);
        setTransactionRecords([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCustomerData();
    setIsViewOpen(false);
    setIsNoteOpen(false);
    setViewingTransaction(null);
    setNoteTitle("");
    setNoteBody("");
    setNoteError(null);
  }, [customerId]);

  useEffect(() => {
    if (customer) {
      setActivityLog(customer.activityLog);
    }
  }, [customer]);

  useEffect(() => {
    if (customer && initialAction) {
      setIsViewOpen(true);
    }
  }, [customer, initialAction]);

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBody = noteBody.trim();
    if (!trimmedBody || !customerId) return;

    const trimmedTitle = noteTitle.trim();
    const now = new Date();

    try {
      setIsSavingNote(true);
      setNoteError(null);

      await api.post(`/customers/${encodeURIComponent(customerId)}/activity-logs`, {
        title: trimmedTitle || "Manual Note",
        note: trimmedBody,
      });

      const nextEntry: ActivityEntry = {
        title: trimmedTitle || "Manual Note",
        date: `${formatNoteDate(now)} · Employee`,
        description: `- ${trimmedBody}`,
        color: "bg-emerald-500",
      };

      setActivityLog((current) => [nextEntry, ...current]);
      setNoteTitle("");
      setNoteBody("");
      setIsNoteOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save note.";
      setNoteError(message);
    } finally {
      setIsSavingNote(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-20">
        <div className="flex items-center gap-3 rounded-full border border-border-main bg-surface px-4 py-3 text-sm text-text-secondary shadow-sm">
          <span className="anim-loading h-4 w-4 rounded-full border border-emerald-500/30" />
          Loading customer details...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-semibold text-text-primary">Customer not found</p>
        {loadError && (
          <p className="max-w-md text-center text-xs text-red-500">{loadError}</p>
        )}
        <button
          onClick={() => router.push(pathname.replace("/view_user", ""))}
          className="text-sm text-emerald-700 underline hover:text-emerald-800"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const safeLoyaltyMax = customer.loyaltyMax > 0 ? customer.loyaltyMax : 100;
  const loyaltyPercent = Math.round((customer.loyaltyPoints / safeLoyaltyMax) * 100);
  const pointsToReward = Math.max(0, safeLoyaltyMax - customer.loyaltyPoints);
  const primaryVisual = resolveCustomerPrimaryVisual(customer);
  const matchWarning = (customer.matchingCustomerCount || 1) > 1
    ? `${customer.matchingCustomerCount} customer records match this exact name across ${customer.matchingBranchCount || 1} branch${(customer.matchingBranchCount || 1) === 1 ? "" : "es"}. Verify spelling before creating a new profile or linking rewards.`
    : null;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(pathname.replace("/view_user", ""))}
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
                  {primaryVisual ? (
                    <img
                      src={primaryVisual}
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
                  <p className="text-xs text-text-tertiary">ID Presented: {customer.idType || customer.idNumber}</p>
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

            {matchWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Name verification required</p>
                <p className="mt-1 font-medium">{matchWarning}</p>
              </div>
            )}
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
                        className="border-t border-border-subtle bg-surface-secondary transition-colors hover:bg-emerald-surface/60 cursor-pointer"
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

      {/* View Modal */}
      {isViewOpen && (
        <ViewCustomerModal
          customer={customer}
          onClose={() => setIsViewOpen(false)}
          userRole={user?.role}
          initialAction={initialAction === "request" || initialAction === "edit" ? initialAction : null}
        />
      )}

      {viewingTransaction && (
        <TransactionViewModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
        />
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

              {noteError && (
                <p className="text-xs font-medium text-red-600">{noteError}</p>
              )}

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
                  disabled={isSavingNote}
                  className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
                >
                  {isSavingNote ? "Saving..." : "Save Note"}
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
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-20">
          <div className="flex items-center gap-3 rounded-full border border-border-main bg-surface px-4 py-3 text-sm text-text-secondary shadow-sm">
            <span className="anim-loading h-4 w-4 rounded-full border border-emerald-500/30" />
            Loading customer details…
          </div>
        </div>
      }
    >
      <EmployeeCustomerDetailContent />
    </Suspense>
  );
}
