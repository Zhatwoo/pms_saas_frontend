"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { api, ApiError } from "@/lib/api";
import { formatPeso } from "@/lib/currency";
import { toast } from "sonner";
import { MoaModal } from "./moa-modal";
import { QRReplacementRequestModal } from "@/components/shared/qr-replacement-request-modal";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import { PhilippineAddressFields } from "@/components/shared/philippine-address-fields";
import { formatDateToYMD } from "@/lib/time";

const NO_ID_VALUE = "No ID / None";
const SINGLE_IMAGE_ID_TYPES = new Set(["NBI Clearance", "Police Clearance"]);

type CustomerMode = "new" | "existing";

interface CustomerLookupRecord {
  id: string;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  barangay: string | null;
  city: string | null;
  region: string | null;
  id_presented: string | null;
}

interface TransactionsResponse {
  transactions: Array<{
    pawned_item?: { customer_id?: string | null } | null;
  }>;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", middleName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "" };
  }

  if (parts.length === 2) {
    return { firstName: parts[0], middleName: "", lastName: parts[1] };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function getVerificationMode(idPresented: string) {
  if (!idPresented) {
    return "pending" as const;
  }

  if (idPresented === NO_ID_VALUE) {
    return "no-id" as const;
  }

  if (SINGLE_IMAGE_ID_TYPES.has(idPresented)) {
    return "single-document" as const;
  }

  return "front-back" as const;
}

function normalizeCustomerName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getTodayDate() {
  return formatDateToYMD();
}

function createEmptyForm() {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    barangay: "",
    city: "",
    region: "",
    contactNo: "",
    email: "",
    idPresented: "",
    unitCode: "",
    unitName: "",
    category: "",
    categorySpecify: "",
    serialNumber: "",
    itemsIncluded: "",
    condition: "",
    memory: "",
    remarks: "",
    amount: "",
    purchasedDate: getTodayDate(),
    storageFee: false,
    storageFeeAmount: "",
    profilePhoto: null as string | null,
      itemPhotos: [] as string[],
    idPhoto: null as string | null,
    idBackPhoto: null as string | null,
  };
}

interface NewPawnModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  branchAdminName?: string;
  loggedInUserName?: string;
  onSuccess?: (transactionNo?: string) => void;
}

interface CreatedPawnTicketResponse {
  transaction?: {
    transaction_no?: string;
    transactionNo?: string;
  };
}

export function NewPawnModal({ 
  isOpen, 
  onClose, 
  branchId, 
  branchName, 
  branchAddress,
  branchPhone,
  branchAdminName, 
  loggedInUserName,
  onSuccess
}: NewPawnModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [form, setForm] = useState(() => createEmptyForm());
  const isProcessingRef = useRef(false);

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isMoaOpen, setIsMoaOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [isQRReplacementOpen, setIsQRReplacementOpen] = useState(false);
  const [qrReplacementPawnItemId, setQrReplacementPawnItemId] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [branchCustomers, setBranchCustomers] = useState<CustomerLookupRecord[]>([]);
  const [customerBranchTransactions, setCustomerBranchTransactions] = useState<Set<string>>(new Set());
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerLookupError, setCustomerLookupError] = useState<string | null>(null);
  const [branchCashAvailable, setBranchCashAvailable] = useState<number | null>(null);
  const [branchCashLoading, setBranchCashLoading] = useState(false);

  const loadBranchCashForMoa = useCallback(async () => {
    if (!branchId || branchId === "__all__") {
      setBranchCashAvailable(null);
      return;
    }
    setBranchCashLoading(true);
    try {
      const rows = await api.get<
        Array<{ branchId: string; currentBalance: number }>
      >("/branch-finance/summary");
      if (!Array.isArray(rows) || rows.length === 0) {
        setBranchCashAvailable(null);
        return;
      }
      const row = rows.find((r) => r.branchId === branchId) ?? rows[0];
      setBranchCashAvailable(Number(row.currentBalance ?? 0));
    } catch {
      setBranchCashAvailable(null);
    } finally {
      setBranchCashLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (isMoaOpen && branchId && branchId !== "__all__") {
      void loadBranchCashForMoa();
    }
  }, [isMoaOpen, branchId, loadBranchCashForMoa]);

  // Auto-generate Unit Code when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchNextCode = async () => {
        try {
          const { unitCode } = await api.get<{ unitCode: string }>("/pawn-tickets/next-unit-code");
          if (unitCode) {
            setForm(prev => ({ ...prev, unitCode }));
          }
        } catch (error) {
          console.error("Failed to fetch next unit code:", error);
          // Fallback to a placeholder if API fails
          setForm(prev => ({ ...prev, unitCode: "PENDING-jclb-xxxxx" }));
        }
      };
      fetchNextCode();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !branchId || branchId === "__all__") {
      return;
    }

    let isActive = true;

    const fetchNextSerialNumber = async () => {
      try {
        const { serialNumber } = await api.get<{ serialNumber: string }>("/pawn-tickets/next-serial-number");
        if (isActive && serialNumber) {
          setForm((prev) => ({ ...prev, serialNumber }));
        }
      } catch (error) {
        console.error("Failed to fetch next serial number:", error);
        if (isActive) {
          setForm((prev) => ({ ...prev, serialNumber: "PENDING-SN-xxxxx" }));
        }
      }
    };

    void fetchNextSerialNumber();

    return () => {
      isActive = false;
    };
  }, [branchId, isOpen]);

  useEffect(() => {
    if (!isOpen || !branchId || branchId === "__all__") {
      setBranchCustomers([]);
      setCustomerBranchTransactions(new Set());
      setCustomerLookupError(null);
      setIsLoadingCustomers(false);
      return;
    }

    let isActive = true;

    const loadBranchCustomers = async () => {
      setIsLoadingCustomers(true);
      setCustomerLookupError(null);

      try {
        const [customers, transactions] = await Promise.all([
          api.get<CustomerLookupRecord[] | { data?: CustomerLookupRecord[] }>(
            `/customers?branchId=${encodeURIComponent(branchId)}`,
          ),
          api.get<TransactionsResponse>(
            `/transactions?branch=${encodeURIComponent(branchId)}&range=all`,
          ),
        ]);

        if (!isActive) {
          return;
        }

        const branchCustomerIds = new Set<string>();
        for (const transaction of transactions.transactions ?? []) {
          const customerId = transaction?.pawned_item?.customer_id;
          if (customerId) {
            branchCustomerIds.add(customerId);
          }
        }

        setBranchCustomers(Array.isArray(customers) ? customers : customers.data ?? []);
        setCustomerBranchTransactions(branchCustomerIds);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setCustomerLookupError(
          error instanceof Error ? error.message : "Unable to load branch customers.",
        );
        setBranchCustomers([]);
        setCustomerBranchTransactions(new Set());
      } finally {
        if (isActive) {
          setIsLoadingCustomers(false);
        }
      }
    };

    void loadBranchCustomers();

    return () => {
      isActive = false;
    };
  }, [branchId, isOpen]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, type, value } = target;
    const checked = "checked" in target ? target.checked : false;

    if (name === "idPresented") {
      setForm((prev) => ({
        ...prev,
        idPresented: value,
        profilePhoto: null,
        idPhoto: null,
        idBackPhoto: null,
      }));
      setQrUrl(null);
      return;
    }

    if (name === "category") {
      setForm((prev) => ({
        ...prev,
        category: value,
        categorySpecify: value === "Others" ? prev.categorySpecify : "",
      }));
      setQrUrl(null);
      return;
    }

    if (type === "number" || name === "contactNo") {
      // Prevent non-numeric characters
      // For contactNo, we strip everything except digits.
      // For type="number", we allow decimal point if needed (amount).
      const numericValue = name === "contactNo" 
        ? value.replace(/[^0-9]/g, "") 
        : value.replace(/[^0-9.]/g, "");
        
      setForm((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Reset QR if key fields change
    if (["unitCode", "unitName", "serialNumber", "categorySpecify"].includes(name)) {
      setQrUrl(null);
    }
  };

  const handleAddItemPhoto = useCallback((dataUrl: string | null) => {
    if (!dataUrl) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      itemPhotos: [...prev.itemPhotos, dataUrl],
    }));
  }, []);

  const handleRemoveItemPhoto = useCallback((indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      itemPhotos: prev.itemPhotos.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleClearForm = useCallback(() => {
    setForm((prev) => ({
      ...createEmptyForm(),
      unitCode: prev.unitCode,
      serialNumber: prev.serialNumber,
      purchasedDate: getTodayDate(),
    }));
    setQrUrl(null);
    setPassword("");
    setErrorMessage(null);
    setCustomerMode("new");
    setSelectedCustomerId(null);
    setCustomerSearch("");
  }, []);

  const handleReset = useCallback(() => {
    handleClearForm();
    setBranchCustomers([]);
    setCustomerBranchTransactions(new Set());
    setCustomerLookupError(null);
    onClose();
  }, [handleClearForm, onClose]);

  const handleSelectExistingCustomer = useCallback((customer: CustomerLookupRecord) => {
    const nameParts = splitFullName(customer.full_name);

    setSelectedCustomerId(customer.id);
    setForm((prev) => ({
      ...prev,
      firstName: nameParts.firstName,
      middleName: nameParts.middleName,
      lastName: nameParts.lastName,
      address: customer.address ?? "",
      barangay: customer.barangay ?? "",
      city: customer.city ?? "",
      region: customer.region ?? "",
      contactNo: customer.contact_number ?? "",
      email: customer.email ?? "",
      idPresented: customer.id_presented ?? "",
      profilePhoto: null,
        itemPhotos: prev.itemPhotos,
      idPhoto: null,
      idBackPhoto: null,
    }));
    setCustomerMode("new");
    setErrorMessage(null);
    setQrUrl(null);
  }, []);

  const handleUseAsNewCustomer = useCallback(() => {
    setSelectedCustomerId(null);
    setCustomerMode("new");
    setErrorMessage(null);
  }, []);

  const handleSwitchToExistingCustomers = useCallback(() => {
    setCustomerMode("existing");
  }, []);

  const filteredBranchCustomers = branchCustomers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return customer.full_name.toLowerCase().includes(query);
  }).sort((left, right) => {
    const query = normalizeCustomerName(customerSearch);
    if (!query) {
      return left.full_name.localeCompare(right.full_name);
    }

    const leftExact = normalizeCustomerName(left.full_name) === query;
    const rightExact = normalizeCustomerName(right.full_name) === query;

    if (leftExact !== rightExact) {
      return leftExact ? -1 : 1;
    }

    return left.full_name.localeCompare(right.full_name);
  });

  const selectedCustomer = selectedCustomerId
    ? branchCustomers.find((customer) => customer.id === selectedCustomerId) ?? null
    : null;

  const getResolvedCategory = () => {
    if (form.category === "Others") {
      const specify = form.categorySpecify.trim();
      return specify ? `Others - ${specify}` : "";
    }

    return form.category.trim();
  };

  const handleGenerateQR = () => {
    // Required fields for QR generation
    const resolvedCategory = getResolvedCategory();
    const unitCodeReady = form.unitCode && !form.unitCode.startsWith("PENDING");
    const serialNumberReady = form.serialNumber && !form.serialNumber.startsWith("PENDING");
    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      address: "Street Address",
      barangay: "Barangay",
      city: "City",
      contactNo: "Contact Number",
      idPresented: "ID Type",
      unitName: "Unit Name",
      amount: "Loan Amount",
      purchasedDate: "Purchased Date"
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (!form[key as keyof typeof form]) {
        setErrorMessage(`${label} is required before generating QR.`);
        return;
      }
    }

    if (!resolvedCategory) {
      setErrorMessage(
        form.category === "Others"
          ? "Specify the category before generating QR."
          : "Category is required before generating QR.",
      );
      return;
    }

    // 1.5. Check Required Photos before QR
    const verificationMode = getVerificationMode(form.idPresented);
    if (verificationMode === "no-id" && !form.profilePhoto) {
      setErrorMessage("Customer photo is required when No ID / None is selected.");
      return;
    }
    if (verificationMode === "single-document" && !form.idPhoto) {
      setErrorMessage("Document image is required for clearance verification.");
      return;
    }
    if (verificationMode === "front-back" && (!form.idPhoto || !form.idBackPhoto)) {
      setErrorMessage("Front and back ID photos are required for this ID type.");
      return;
    }

    if (form.itemPhotos.length === 0) {
      setErrorMessage("At least one Item Photo is required before generating QR.");
      return;
    }

    if (!unitCodeReady) {
      setErrorMessage("Unit code is still generating. Please wait and try again.");
      return;
    }

    if (!serialNumberReady) {
      setErrorMessage("Serial number is still generating. Please wait and try again.");
      return;
    }

    setErrorMessage(null);
    const fullName = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicViewUrl = `${baseUrl}/view-ticket/${encodeURIComponent(form.unitCode)}`;

    setIsGeneratingQR(true);
    const encoded = encodeURIComponent(publicViewUrl);
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=250x250&color=065f46&bgcolor=f0fdf4&margin=2`;
    setQrUrl(url);
    setIsGeneratingQR(false);
  };

  const handleGenerateTicket = async () => {
    setErrorMessage(null);

    if (!branchId || branchId === "__all__") {
      setErrorMessage("Select a valid branch before generating a ticket.");
      return;
    }

    const resolvedCategory = getResolvedCategory();
    const unitCodeReady = form.unitCode && !form.unitCode.startsWith("PENDING");
    const serialNumberReady = form.serialNumber && !form.serialNumber.startsWith("PENDING");

    // 1. Check all required fields - Customer
    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      barangay: "Barangay",
      city: "City",
      contactNo: "Contact Number",
      idPresented: "ID Type",
      unitName: "Unit Name",
      amount: "Loan Amount",
      purchasedDate: "Purchased Date"
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (!form[key as keyof typeof form]) {
        setErrorMessage(`${label} is required.`);
        return;
      }
    }

    if (!selectedCustomerId && !form.address.trim()) {
      toast.error("Street / Address is required.");
      return;
    }

    if (!resolvedCategory) {
      setErrorMessage(
        form.category === "Others"
          ? "Specify the category before generating the ticket."
          : "Category is required.",
      );
      return;
    }

    if (!unitCodeReady) {
      setErrorMessage("Unit code is still generating. Please wait and try again.");
      return;
    }

    if (!serialNumberReady) {
      setErrorMessage("Serial number is still generating. Please wait and try again.");
      return;
    }

    const verificationMode = getVerificationMode(form.idPresented);
    if (verificationMode === "no-id" && !form.profilePhoto) {
      setErrorMessage("Customer photo is required when No ID / None is selected.");
      return;
    }
    if (verificationMode === "single-document" && !form.idPhoto) {
      setErrorMessage("Document image is required for clearance verification.");
      return;
    }
    if (verificationMode === "front-back" && (!form.idPhoto || !form.idBackPhoto)) {
      setErrorMessage("Front and back ID photos are required for this ID type.");
      return;
    }

    if (form.itemPhotos.length === 0) {
      setErrorMessage("At least one Item Photo is required for pawned items.");
      return;
    }

    // 2. Check QR Code
    if (!qrUrl) {
      setErrorMessage("Please generate a QR Code first before generating the ticket.");
      return;
    }

    // 3. Verify Password
    if (!password) {
      setErrorMessage("Please enter your password to authorize this transaction.");
      return;
    }

    setIsSaving(true);
    try {
      // Verify password with API
      const response = await api.post("/auth/verify-password", { password });
      if (!response) {
        throw new Error("Invalid password. Please try again.");
      }

      // If password is correct, open MOA
      setIsMoaOpen(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Security verification failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmMoa = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsSaving(true);
    setErrorMessage(null);

    const amountValue = Number(form.amount || 0);
    const storageAmount = form.storageFee ? Number(form.storageFeeAmount || 0) : 0;
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ").trim();
    const verificationMode = getVerificationMode(form.idPresented);
    const resolvedCategory = getResolvedCategory();

    if (verificationMode === "no-id" && !form.profilePhoto) {
      setIsSaving(false);
      isProcessingRef.current = false;
      setErrorMessage("Customer photo is required when No ID / None is selected.");
      return;
    }

    if (verificationMode === "single-document" && !form.idPhoto) {
      setIsSaving(false);
      isProcessingRef.current = false;
      setErrorMessage("Document image is required for clearance verification.");
      return;
    }

    if (verificationMode === "front-back" && (!form.idPhoto || !form.idBackPhoto)) {
      setIsSaving(false);
      isProcessingRef.current = false;
      setErrorMessage("Front and back ID photos are required for this ID type.");
      return;
    }

      if (form.itemPhotos.length === 0) {
      setIsSaving(false);
      isProcessingRef.current = false;
      setErrorMessage("Item photo is required for pawned items.");
      return;
    }

    if (!resolvedCategory) {
      setIsSaving(false);
      isProcessingRef.current = false;
      setErrorMessage(
        form.category === "Others"
          ? "Specify the category before finalizing the ticket."
          : "Category is required before finalizing the ticket.",
      );
      return;
    }

    const loanForCashCheck = Number(form.amount || 0);
    if (
      branchCashAvailable !== null &&
      !branchCashLoading &&
      loanForCashCheck > 0 &&
      loanForCashCheck > branchCashAvailable
    ) {
      const msg = `Insufficient branch cash for this loan. Available ${formatPeso(branchCashAvailable)}; required ${formatPeso(loanForCashCheck)}.`;
      setIsSaving(false);
      isProcessingRef.current = false;
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      const response = await api.post<CreatedPawnTicketResponse>('/pawn-tickets', {
        branchId,
        branchName,
        customerId: selectedCustomerId ?? undefined,
        customer: {
          fullName,
          address: form.address.trim(),
          barangay: form.barangay.trim(),
          city: form.city.trim(),
          region: form.region.trim(),
          contactNumber: form.contactNo.trim(),
          email: form.email.trim(),
          idPresented: form.idPresented,
        },
        item: {
          unitCode: form.unitCode.trim(),
          unitName: form.unitName.trim(),
          category: resolvedCategory,
          serialNumber: form.serialNumber.trim(),
          itemsIncluded: form.itemsIncluded.trim(),
          condition: form.condition,
          memoryStorage: form.memory.trim(),
          remarks: form.remarks.trim(),
          amount: amountValue,
          purchasedDate: form.purchasedDate,
          qrCode: qrUrl || undefined,
          profilePhoto: form.profilePhoto || undefined,
          itemPhotos: form.itemPhotos.length > 0 ? form.itemPhotos : undefined,
          idPhoto: form.idPhoto || undefined,
          idBackPhoto: form.idBackPhoto || undefined,
        },
        transaction: {
          pawnAmount: amountValue,
          storageFee: storageAmount,
          returnAmount: 0,
          transactionDate: formatDateToYMD(),
          transactionTime: new Date().toTimeString().slice(0, 8),
          details: [form.itemsIncluded.trim(), form.idPresented, `Processed by: ${loggedInUserName || 'Employee'}`].filter(Boolean).join(' | '),
        },
      });

      const createdTransactionNo =
        response?.transaction?.transaction_no ??
        response?.transaction?.transactionNo ??
        "";

      if (createdTransactionNo) {
        const targetPath = `${pathname || "/employee/pawn-transaction"}?transactionNo=${encodeURIComponent(createdTransactionNo)}&highlightTransaction=true`;

        toast.custom((toastId) => (
          <div className="flex w-[360px] items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl shadow-emerald-900/10">
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-900">New pawn transaction created</p>
              <p className="mt-0.5 truncate text-xs text-emerald-700">{createdTransactionNo}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastId);
                router.push(targetPath);
              }}
              className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-800"
            >
              View
            </button>
          </div>
        ));
      } else {
        toast.success("New pawn ticket generated successfully!");
      }

      if (onSuccess) onSuccess(createdTransactionNo);
      setIsMoaOpen(false);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.insufficientFunds) {
        const ab = error.availableBalance;
        const rq = error.requiredAmount;
        const detail =
          ab != null && rq != null
            ? ` Available: ${formatPeso(ab)} · Required: ${formatPeso(rq)}`
            : "";
        const msg = `${error.message}${detail}`;
        console.warn("[Pawn MOA] Insufficient funds from API", {
          branchId,
          available_balance: ab,
          required_amount: rq,
          loanAmount: amountValue,
          ts: new Date().toISOString(),
        });
        setErrorMessage(msg);
        toast.error(msg);
        void loadBranchCashForMoa();
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
      isProcessingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity no-print" onClick={onClose} />
      <div 
        className="relative w-full max-w-7xl h-[90vh] flex flex-col bg-white dark:bg-background rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-emerald-300 shadow-inner border border-emerald-700/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90 dark:text-emerald-400">
                  {branchName}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white leading-none">
                  New Pawn Ticket
                </h1>
              </div>
            </div>
            
            <button 
              onClick={handleReset} 
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/95 text-emerald-950 transition-colors hover:bg-white dark:bg-surface/10 dark:text-white dark:hover:bg-surface/20"
              aria-label="Close New Pawn Ticket"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-emerald-50/30 dark:bg-surface-secondary">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <h3 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[2px]">Customer Details</h3>
                  </div>

                  <div className="relative flex w-full max-w-[19rem] rounded-2xl border border-emerald-100 dark:border-border-subtle bg-emerald-50/50 dark:bg-surface/50 p-1 shadow-sm">
                    <span
                      className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white dark:bg-emerald-900/40 shadow-sm transition-transform duration-300 ease-out ${customerMode === "new" ? "translate-x-0" : "translate-x-full"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setCustomerMode("new")}
                      className={`relative z-10 flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${customerMode === "new" ? "text-emerald-900 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
                    >
                      New Customer
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToExistingCustomers}
                      className={`relative z-10 flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${customerMode === "existing" ? "text-emerald-900 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
                    >
                      Existing Customer
                    </button>
                  </div>
                </div>

                {selectedCustomer && customerMode === "new" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Loaded branch customer</p>
                        <p className="mt-1 text-sm font-black text-emerald-950 dark:text-white">{selectedCustomer.full_name}</p>
                        <p className="mt-0.5 text-xs font-medium text-emerald-800/70">This contract will reuse the selected branch record.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSwitchToExistingCustomers}
                          className="rounded-xl border border-emerald-200 bg-white dark:bg-surface px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 transition-colors hover:bg-emerald-50"
                        >
                          Change Customer
                        </button>
                        <button
                          type="button"
                          onClick={handleUseAsNewCustomer}
                          className="rounded-xl border border-emerald-200 bg-emerald-700 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-800"
                        >
                          Use As New
                        </button>
                        <button
                          type="button"
                          onClick={handleClearForm}
                          className="rounded-xl border border-zinc-200 dark:border-border bg-white dark:bg-surface px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:bg-zinc-50 dark:bg-surface-secondary"
                        >
                          Clear Form
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {customerMode === "existing" ? (
                  <div className="space-y-4 rounded-3xl border border-zinc-200 dark:border-border bg-white dark:bg-surface p-4 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Search by name only</p>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Find a branch customer, review the contact details, and load the record into the pawn form.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Exact name match required</p>
                      <p className="mt-1 font-medium">
                        Double-check the spelling before selecting a customer. Rewards and future cross-branch matching use the exact full name.
                      </p>
                    </div>

                    <Input
                      label="Customer Name"
                      name="customerSearch"
                      value={customerSearch}
                        onChange={(event) => setCustomerSearch(event.target.value)}
                        placeholder="Search existing customer by exact full name"
                    />

                    {isLoadingCustomers ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-border bg-zinc-50 dark:bg-surface-secondary px-4 py-6 text-center text-sm font-medium text-zinc-400">
                        Loading branch customers...
                      </div>
                    ) : customerLookupError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {customerLookupError}
                      </div>
                    ) : filteredBranchCustomers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-border bg-zinc-50 dark:bg-surface-secondary px-4 py-6 text-center text-sm font-medium text-zinc-400">
                        No matching branch customer found.
                      </div>
                    ) : (
                      <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
                        {filteredBranchCustomers.map((customer) => {
                          const statusLabel = customerBranchTransactions.has(customer.id)
                            ? "Existing customer"
                            : "First time transaction";

                          return (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectExistingCustomer(customer)}
                              className={`w-full rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${selectedCustomerId === customer.id ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-zinc-200 dark:border-border bg-white dark:bg-surface hover:border-emerald-200"}`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1">
                                  <p className="truncate text-sm font-black text-zinc-900 dark:text-white">{customer.full_name}</p>
                                  <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {customer.contact_number || "No contact number"}
                                  </p>
                                  <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {customer.email || "No email address"}
                                  </p>
                                </div>

                                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${customerBranchTransactions.has(customer.id) ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} readOnly={Boolean(selectedCustomerId)} />
                      <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} readOnly={Boolean(selectedCustomerId)} />
                      <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} readOnly={Boolean(selectedCustomerId)} />
                    </div>

                    <PhilippineAddressFields
                      key={selectedCustomerId || "new-customer"}
                      value={{
                        address: form.address,
                        barangay: form.barangay,
                        city: form.city,
                        region: form.region,
                      }}
                      disabled={Boolean(selectedCustomerId)}
                      onFieldChange={(field, nextValue) => {
                        setForm((prev) => ({ ...prev, [field]: nextValue }));
                      }}
                    />

                    <Input label="Contact No." name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="09XX-XXX-XXXX" readOnly={Boolean(selectedCustomerId)} />

                    <Input label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" placeholder="example@email.com" readOnly={Boolean(selectedCustomerId)} />

                    <div className="space-y-1.5 w-full">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">ID Presented</label>
                      <select
                        name="idPresented"
                        value={form.idPresented}
                        onChange={handleChange}
                        disabled={Boolean(selectedCustomerId)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-border bg-white dark:bg-surface px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-100 dark:bg-surface-hover [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                      >
                        <option value="">— Select ID Type —</option>
                        <optgroup label="Government IDs">
                          <option value="PhilSys / National ID">PhilSys / National ID</option>
                          <option value="Passport">Passport</option>
                          <option value="Driver's License">Driver&apos;s License</option>
                          <option value="SSS ID">SSS ID</option>
                          <option value="GSIS ID">GSIS ID</option>
                          <option value="PRC ID">PRC ID</option>
                          <option value="Voter's ID">Voter&apos;s ID</option>
                          <option value="PhilHealth ID">PhilHealth ID</option>
                          <option value="Pag-IBIG ID">Pag-IBIG ID</option>
                          <option value="Senior Citizen ID">Senior Citizen ID</option>
                          <option value="PWD ID">PWD ID</option>
                          <option value="Postal ID">Postal ID</option>
                          <option value="NBI Clearance">NBI Clearance</option>
                          <option value="Police Clearance">Police Clearance</option>
                          <option value="Barangay ID">Barangay ID</option>
                          <option value="OFW ID">OFW ID</option>
                          <option value="UMID">UMID</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="No ID / None">No ID / None — Take Customer Photo</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Camera capture section */}
                    <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-surface-secondary border border-zinc-100">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                         {getVerificationMode(form.idPresented) === "no-id"
                           ? "Customer Photo"
                           : getVerificationMode(form.idPresented) === "single-document"
                             ? "Document Upload"
                             : getVerificationMode(form.idPresented) === "front-back"
                               ? "ID Front / Back"
                               : "ID & Verification"}
                      </span>

                      {getVerificationMode(form.idPresented) === "pending" ? (
                        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-border bg-white dark:bg-surface px-4 py-6 text-center text-xs font-medium text-zinc-400">
                          Select an ID type to show the required verification photo fields.
                        </div>
                      ) : getVerificationMode(form.idPresented) === "no-id" ? (
                        <div className="grid grid-cols-1 gap-3">
                          <PhotoUpload 
                            label="Take Customer Facing Photo" 
                            onCapture={(data) => setForm(prev => ({ ...prev, profilePhoto: data }))}
                            onPreview={(src) => setPreviewImage({ src, title: "Customer Photo" })}
                            currentPhoto={form.profilePhoto}
                          />
                        </div>
                      ) : getVerificationMode(form.idPresented) === "single-document" ? (
                        <div className="grid grid-cols-1 gap-3">
                          <PhotoUpload 
                            label="Upload Image" 
                            onCapture={(data) => setForm(prev => ({ ...prev, idPhoto: data }))}
                            onPreview={(src) => setPreviewImage({ src, title: "ID Document" })}
                            currentPhoto={form.idPhoto}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <PhotoUpload 
                            label="Front of ID" 
                            onCapture={(data) => setForm(prev => ({ ...prev, idPhoto: data }))}
                            onPreview={(src) => setPreviewImage({ src, title: "ID Front" })}
                            currentPhoto={form.idPhoto}
                          />
                          <PhotoUpload 
                            label="Back of ID" 
                            onCapture={(data) => setForm(prev => ({ ...prev, idBackPhoto: data }))}
                            onPreview={(src) => setPreviewImage({ src, title: "ID Back" })}
                            currentPhoto={form.idBackPhoto}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Unit Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </div>
                  <h3 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[2px]">Unit Information</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Unit Code" name="unitCode" value={form.unitCode} onChange={handleChange} bg="bg-zinc-200" readOnly={true} />
                    <Input label="Unit Name" name="unitName" value={form.unitName} onChange={handleChange} bg="bg-zinc-100 dark:bg-surface-hover" placeholder="e.g. iPhone 15 Pro" />
                  </div>

                  {/* Item Photos Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Item Photos</label>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{form.itemPhotos.length} / 4 Captured</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {form.itemPhotos.map((photo, index) => (
                        <div key={`${photo.slice(0, 24)}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 dark:border-border bg-zinc-100 dark:bg-surface-hover shadow-sm">
                          <Image
                            src={photo}
                            alt={`Item photo ${index + 1}`}
                            width={320}
                            height={240}
                            unoptimized
                            className="h-full w-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                            onClick={() => setPreviewImage({ src: photo, title: `Item Photo ${index + 1}` })}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItemPhoto(index)}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                            title="Remove photo"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setPreviewImage({ src: photo, title: `Item Photo ${index + 1}` })}
                            className="absolute left-2 top-2 rounded-full bg-emerald-600/90 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-emerald-500"
                            title="Preview photo"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                          </button>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white pointer-events-none">
                            Photo {index + 1}
                          </div>
                        </div>
                      ))}

                      {form.itemPhotos.length < 4 && (
                        <PhotoUpload 
                          label="Add Item Photo" 
                          onCapture={handleAddItemPhoto}
                          allowMultipleCapture={true}
                          frameClassName="aspect-square"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-zinc-200 dark:border-border bg-zinc-100 dark:bg-surface-hover px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                    >
                      <option value="">— Select Category —</option>
                      <option value="Smartphone">Smartphone</option>
                      <option value="Laptop & PC">Laptop & PC</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Gaming Console">Gaming Console</option>
                      <option value="Camera">Camera</option>
                      <option value="Smartwatch">Smartwatch</option>
                      <option value="Audio and Earphone">Audio and Earphone</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  {form.category === "Others" && (
                    <Input
                      label="Specify Category"
                      name="categorySpecify"
                      value={form.categorySpecify}
                      onChange={handleChange}
                      bg="bg-zinc-100 dark:bg-surface-hover"
                      placeholder="Enter specific category"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Serial Number" name="serialNumber" value={form.serialNumber} onChange={handleChange} bg="bg-zinc-200" readOnly={true} />
                    <Input label="Items Included" name="itemsIncluded" value={form.itemsIncluded} onChange={handleChange} bg="bg-zinc-100 dark:bg-surface-hover" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Condition</label>
                      <select
                        name="condition"
                        value={form.condition}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-zinc-200 dark:border-border bg-zinc-100 dark:bg-surface-hover px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                      >
                        <option value="">Select Condition</option>
                        <optgroup label="Working">
                          <option value="Brand New">Brand New (Sealed)</option>
                          <option value="Like New">Like New (No scratches)</option>
                          <option value="Good">Good (Minor wear)</option>
                          <option value="Fair">Fair (Visible scratches)</option>
                          <option value="Poor">Poor (Heavy wear/dents)</option>
                        </optgroup>
                        <optgroup label="Issues">
                          <option value="For Repair">For Repair</option>
                          <option value="Incomplete">Incomplete (Missing parts)</option>
                          <option value="Defective">Defective / Not working</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Memory / Storage (GB)</label>
                      <div className={`relative flex items-center overflow-hidden rounded-xl border border-zinc-200 dark:border-border bg-zinc-100 dark:bg-surface-hover focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all`}>
                        <input
                          name="memory"
                          value={form.memory}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            setForm(prev => ({ ...prev, memory: raw }));
                          }}
                          placeholder="e.g. 128"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full bg-transparent px-4 py-3 text-xs font-black text-emerald-950 dark:text-white outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 placeholder:font-medium [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                        />
                        <span className="pr-4 text-zinc-400 font-bold text-xs">GB</span>
                      </div>
                    </div>
                  </div>

                  <Input label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} bg="bg-zinc-100 dark:bg-surface-hover" />

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Amount" name="amount" value={form.amount} onChange={handleChange} type="number" bg="bg-zinc-100 dark:bg-surface-hover" prefix="₱" />
                    <Input label="Purchased Date" name="purchasedDate" value={form.purchasedDate} onChange={handleChange} type="date" bg="bg-zinc-100 dark:bg-surface-hover" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 dark:border-border-subtle mt-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center cursor-pointer">
                        <input
                          id="storageFeeModal"
                          name="storageFee"
                          type="checkbox"
                          checked={form.storageFee}
                          onChange={handleChange}
                          className="w-6 h-6 rounded-lg accent-emerald-600 cursor-pointer"
                        />
                      </div>
                      <label htmlFor="storageFeeModal" className="text-sm font-black text-emerald-900 uppercase tracking-tight cursor-pointer">
                        Apply Storage Fee
                      </label>
                    </div>
                    {form.storageFee && (
                      <div className="w-32">
                        <Input label="" name="storageFeeAmount" value={form.storageFeeAmount} onChange={handleChange} type="number" placeholder="0.00" prefix="₱" size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-emerald-50 bg-white dark:bg-surface flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <div className="h-10 w-px bg-zinc-100 dark:bg-surface-hover hidden sm:block" />
            <div className="flex flex-col sm:flex-row gap-4 flex-1 sm:flex-none">
              {/* Password — entered by the logged-in employee */}
              <div className="min-w-[200px] space-y-1.5">
                <label className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-widest ml-1">
                  Security Password Verification
                  {loggedInUserName && (
                    <span className="ml-1 text-emerald-600 normal-case font-bold">({loggedInUserName})</span>
                  )}
                </label>
                <div className="relative flex items-center rounded-xl border border-zinc-200 dark:border-border bg-zinc-50 dark:bg-surface-secondary focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent px-4 py-2 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-emerald-900/40 dark:text-emerald-400 uppercase tracking-[0.2em]">Total Loan Amount</p>
                <p className="text-xl font-black text-emerald-900 dark:text-white tracking-tighter">₱ {Number(form.amount || 0).toLocaleString()}</p>
             </div>
             
             {qrUrl ? (
               <div className="flex items-center gap-4">
                 {(user?.role === "admin" || user?.role === "super_admin") ? (
                   <div className="relative group shrink-0">
                     <Image 
                       src={qrUrl} 
                       alt="QR Preview" 
                       width={44} 
                       height={44} 
                       unoptimized
                       className="rounded-lg shadow-sm border border-emerald-200 bg-white dark:bg-surface p-0.5" 
                     />
                     <button 
                       onClick={() => setQrUrl(null)} 
                       className="absolute -top-1.5 -right-1.5 bg-zinc-900 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-colors"
                     >
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                     </button>
                   </div>
                 ) : (
                   <div className="relative group shrink-0 flex items-center justify-center w-11 h-11 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/></svg>
                   </div>
                 )}
                 <button
                   type="button"
                   onClick={handleGenerateTicket}
                   disabled={isSaving}
                   className="bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 text-white text-sm font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.98] flex items-center gap-2"
                 >
                   {isSaving ? (
                    <div className="flex items-center gap-2">
                      <span className="anim-loading h-5 w-5 border-white/30 border-t-white rounded-full" />
                      <span>Generating Ticket...</span>
                    </div>
                  ) : "Print Pawn Ticket"}
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                 </button>
               </div>
             ) : (
               <button
                 type="button"
                 onClick={handleGenerateQR}
                 disabled={isGeneratingQR}
                 className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 text-sm font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-all active:scale-[0.98] flex items-center gap-2 relative shadow-sm"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3m0 4h4v-4m-4 0v-3h4" /></svg>
                 {isGeneratingQR ? 'Generating QR...' : 'Generate QR Code'}
                 {errorMessage && errorMessage.includes("before generating QR") && (
                   <span className="absolute -top-2 -right-2 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                   </span>
                 )}
               </button>
             )}
          </div>
          {errorMessage && (
            <div className="absolute top-4 right-6 left-6 z-50 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <p>{errorMessage}</p>
              <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 p-1">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Preview Modal Portal */}
        {previewImage && (
          <PreviewModal 
            src={previewImage.src} 
            title={previewImage.title} 
            onClose={() => setPreviewImage(null)} 
          />
        )}
      </div>

      <MoaModal 
        isOpen={isMoaOpen}
        onClose={() => setIsMoaOpen(false)}
        onConfirm={handleConfirmMoa}
        confirmDisabled={(() => {
          const loan = Number(form.amount || 0);
          return (
            branchCashAvailable !== null &&
            !branchCashLoading &&
            loan > 0 &&
            loan > branchCashAvailable
          );
        })()}
        confirmDisabledReason={(() => {
          const loan = Number(form.amount || 0);
          if (
            branchCashAvailable === null ||
            branchCashLoading ||
            loan <= 0 ||
            loan <= branchCashAvailable
          ) {
            return undefined;
          }
          return `Recorded branch cash is ${formatPeso(branchCashAvailable)}. This loan needs ${formatPeso(loan)} in vault cash — reduce the loan or add cash before confirming.`;
        })()}
        data={{
          ...form,
          // Build full address: street + barangay + city + region
          address: [
            form.address,
            form.barangay,
            form.city,
            form.region,
          ].filter(Boolean).join(", "),
          storageFee: form.storageFeeAmount,
          idPresented: form.idPresented || "",
          branchName: branchName || "Pasig branch",
          branchAddress: branchAddress || "",
          branchPhone: branchPhone || "",
          processedBy: loggedInUserName || branchAdminName || "AUTHORIZED PERSONNEL"
        }}
        isLoading={isSaving}
      />

      <QRReplacementRequestModal
        isOpen={isQRReplacementOpen}
        pawnedItemId={qrReplacementPawnItemId || ""}
        itemCode={form.unitCode}
        onClose={() => {
          setIsQRReplacementOpen(false);
          setQrReplacementPawnItemId(null);
        }}
        onSuccess={() => {
          toast.success("Replacement request submitted. Awaiting Super Admin approval.");
        }}
      />
    </div>
  );
}

function Input({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  bg = "bg-white dark:bg-surface",
  prefix,
  size = "md",
  readOnly = false
}: { 
  label: string; 
  name: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  type?: string;
  bg?: string;
  prefix?: string;
  size?: "sm" | "md";
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400 uppercase tracking-tighter ml-1">{label}</label>}
      <div className={`relative flex items-center overflow-hidden rounded-xl border border-zinc-200 dark:border-border ${bg} focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all ${readOnly ? 'opacity-70 bg-zinc-100 dark:bg-surface-hover' : ''}`}>
        {prefix && <span className="pl-4 text-zinc-400 font-bold">{prefix}</span>}
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          readOnly={readOnly}
          className={`w-full bg-transparent ${prefix ? 'pl-2' : 'px-4'} ${size === 'sm' ? 'py-2' : 'py-3'} text-xs font-black text-emerald-950 dark:text-white outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 placeholder:font-medium ${readOnly ? 'cursor-not-allowed select-none' : ''} [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]`}
        />
      </div>
    </div>
  );
}

function PreviewModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <div className="anim-modal-enter relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-zinc-900">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-400">Media Preview</p>
            <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close image preview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className="flex h-[calc(90vh-76px)] items-center justify-center bg-black p-4">
          <Image src={src} alt={title} width={1200} height={900} unoptimized className="max-h-full w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

function PhotoUpload({
  label,
  onCapture,
  onPreview,
  currentPhoto,
  frameClassName = "aspect-[4/3]",
  allowMultipleCapture = false,
}: {
  label: string;
  onCapture?: (dataUrl: string | null) => void;
  onPreview?: (dataUrl: string) => void;
  currentPhoto?: string | null;
  frameClassName?: string;
  allowMultipleCapture?: boolean;
}) {
  const [photo, setPhoto] = useState<string | null>(currentPhoto || null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync with prop
  useEffect(() => {
    if (currentPhoto !== undefined) {
      setPhoto(currentPhoto);
    }
  }, [currentPhoto]);

  const openCamera = useCallback(async () => {
    setCameraError("");
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch {
      setCameraError("Camera access denied or not available. Please allow camera permissions.");
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsStreaming(false);
    setCameraOpen(false);
    setCameraError("");
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPhoto(dataUrl);
    if (onCapture) onCapture(dataUrl);
    if (!allowMultipleCapture) {
      stopCamera();
      return;
    }

    requestAnimationFrame(() => {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => undefined);
      }
      setIsStreaming(true);
    });
  }, [allowMultipleCapture, stopCamera, onCapture]);

  const retake = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!allowMultipleCapture) {
      setPhoto(null);
      if (onCapture) onCapture(null);
    }
    openCamera();
  };

  const handleThumbnailClick = () => {
    if (photo && onPreview) {
      onPreview(photo);
    } else {
      openCamera();
    }
  };

  return (
    <>
      {/* Thumbnail / Placeholder */}
      <div
        onClick={handleThumbnailClick}
        className={`${frameClassName} rounded-2xl border-2 border-dashed bg-white dark:bg-surface flex flex-col items-center justify-center text-center p-4 transition-all group relative overflow-hidden
          ${ photo ? "border-emerald-400 cursor-pointer" : "border-zinc-200 dark:border-border hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer" }`}
      >
        {photo && !allowMultipleCapture ? (
          <>
            <Image
              src={photo}
              alt={label}
              fill
              unoptimized
              className="rounded-2xl object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPreview) onPreview(photo);
                }}
                className="bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow hover:bg-emerald-500 transition"
              >
                View Full
              </button>
              <button
                type="button"
                onClick={retake}
                className="bg-white dark:bg-surface text-emerald-700 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow hover:bg-emerald-50 transition"
              >
                Retake
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-surface-secondary flex items-center justify-center mb-2 group-hover:bg-emerald-100 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400 group-hover:text-emerald-600 transition-colors">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">{label}</p>
            {allowMultipleCapture && photo && (
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-600/70">Ready for next shot</p>
            )}
          </>
        )}
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={stopCamera}>
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-800">
              <p className="text-xs font-black text-white uppercase tracking-widest">{label} — Camera</p>
              <button onClick={stopCamera} className="text-zinc-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Stream / Error */}
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm font-bold text-red-300">{cameraError}</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}

              {/* Viewfinder corners */}
              {isStreaming && !cameraError && (
                <>
                  <span className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <span className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <span className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <span className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 py-4 bg-zinc-800">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2 rounded-xl bg-zinc-700 text-xs font-black text-zinc-300 dark:text-zinc-600 hover:bg-zinc-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="w-14 h-14 rounded-full bg-white dark:bg-surface border-4 border-emerald-500 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                title="Capture photo"
              >
                <span className="w-10 h-10 rounded-full bg-emerald-600 block" />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-500 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
