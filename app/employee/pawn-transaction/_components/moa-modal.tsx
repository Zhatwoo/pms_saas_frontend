"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { api } from "@/lib/api";
import { formatPeso } from "@/lib/currency";
import {
  calculatePeriodicStorageFee,
  getInterestRateSchedule,
  setInterestRatesCache,
  type InterestRateGroup,
} from "@/lib/interest";
import {
  MOA_LEGAL_PAGE,
  MOA_PRINT_CSS,
  MOA_PRINT_SCREEN_CSS,
  MOA_SIGNATURE_LINE_CLASS,
  printMoaSlipDocument,
} from "@/lib/print-templates";
import { MoaCutGuide } from "@/components/shared/moa-cut-guide";

interface MoaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** When true, blocks finalizing (e.g. branch cash below loan amount). */
  confirmDisabled?: boolean;
  /** Short explanation shown when confirm is disabled. */
  confirmDisabledReason?: string;
  data: {
    firstName: string;
    middleName: string;
    lastName: string;
    address: string;
    contactNo: string;
    unitCode: string;
    unitName: string;
    category: string;
    serialNumber: string;
    itemsIncluded: string;
    condition: string;
    remarks: string;
    memory: string;
    amount: string;
    storageFee: string;
    parkingFee?: string;
    customMoaValues?: Record<string, string>;
    purchasedDate: string;
    idPresented: string;
    branchName: string;
    branchAddress?: string;
    branchPhone?: string;
    processedBy?: string;
  };
  isLoading: boolean;
  autoPrint?: boolean;
  /** finalize = new pawn (no header X; Save & Finalize). view = reprint/view only (header X; no Save). */
  mode?: "finalize" | "view";
}

type MoaLabels = Record<string, string>;
type FinancialFieldKey = "amount" | "storageFee" | "parkingFee" | "netProceeds";
type UnitFieldKey = "brandModel" | "itemsIncluded" | "condition" | "serialNo" | "memory" | "remarks";
type CustomMoaField = {
  id: string;
  label: string;
};

const DEFAULT_FINANCIAL_FIELDS: FinancialFieldKey[] = [
  "amount",
  "storageFee",
  "parkingFee",
  "netProceeds",
];
const DEFAULT_UNIT_FIELDS: UnitFieldKey[] = [
  "brandModel",
  "itemsIncluded",
  "condition",
  "serialNo",
  "memory",
  "remarks",
];

type MoaExtensionRow = {
  date?: string;
  storage?: string;
  period?: string;
  periodValue?: string;
  extend?: string;
  sign?: string;
};

type MoaTemplate = {
  terms_text: string;
  labels: MoaLabels;
  extensionRows?: MoaExtensionRow[];
  financialFields?: FinancialFieldKey[];
  unitFields?: UnitFieldKey[];
  customFinancialFields?: CustomMoaField[];
  customUnitFields?: CustomMoaField[];
  category_templates?: Record<string, {
    terms_text?: string;
    labels?: MoaLabels;
    extensionRows?: MoaExtensionRow[];
    financialFields?: FinancialFieldKey[];
    unitFields?: UnitFieldKey[];
    customFinancialFields?: CustomMoaField[];
    customUnitFields?: CustomMoaField[];
  }>;
};

const MOA_PAGE_CLASS =
  "moa-print-page mx-auto w-full min-w-0 flex-none overflow-hidden border border-zinc-300 bg-white text-[9.5px] leading-normal text-zinc-800 shadow-md moa-paper-effect";
const MOA_PAGE_STYLE = {
  width: MOA_LEGAL_PAGE.screenWidthPx,
  height: MOA_LEGAL_PAGE.screenHeightPx,
  maxWidth: MOA_LEGAL_PAGE.screenWidthPx,
  maxHeight: MOA_LEGAL_PAGE.screenHeightPx,
  padding: MOA_LEGAL_PAGE.padding,
  boxSizing: "border-box" as const,
};

/** Scales legal-size MOA pages to fit mobile/tablet modal width (screen only). */
function MoaPreviewScale({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      if (available <= 0) return;
      setScale(Math.min(1, available / MOA_LEGAL_PAGE.screenWidthPx));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageCount = 2;
  const scaledHeight = MOA_LEGAL_PAGE.screenHeightPx * scale * pageCount;

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-x-hidden p-2 sm:p-4">
      <div
        className="relative mx-auto"
        style={{
          width: MOA_LEGAL_PAGE.screenWidthPx * scale,
          height: scaledHeight,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left space-y-0"
          style={{
            width: MOA_LEGAL_PAGE.screenWidthPx,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function MoaBranchHeader({
  primary,
  branchLine,
  address,
  phone,
}: {
  primary: string;
  branchLine?: string;
  address?: string;
  phone?: string;
}) {
  return (
    <div className="text-center space-y-0.5 pb-1 border-b border-zinc-300">
      <p className="text-[12px] font-extrabold uppercase text-zinc-950 tracking-wider">{primary}</p>
      {branchLine ? (
        <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-600 leading-tight">{branchLine}</p>
      ) : null}
      {address ? (
        <p className="text-[7.5px] text-zinc-500 font-bold leading-tight">{address}</p>
      ) : null}
      {phone ? (
        <p className="text-[7.5px] text-zinc-500 font-bold leading-tight">{phone}</p>
      ) : null}
    </div>
  );
}

function MoaNamedSignatureLine({
  name,
  label,
  className = "",
}: {
  name: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`moa-signature-block text-center shrink-0 ${className}`}>
      <div className={MOA_SIGNATURE_LINE_CLASS}>
        {name ? (
          <span className="text-[8px] font-bold text-zinc-800 uppercase truncate max-w-full px-1 leading-none">{name}</span>
        ) : (
          <span className="inline-block w-full" aria-hidden="true" />
        )}
      </div>
      <span className="moa-signature-label uppercase font-bold text-zinc-500">{label}</span>
    </div>
  );
}

const DEFAULT_TERMS_PREAMBLE =
  'You must be pledging to JCLB BUY BACK SHOP OPC, mobile phones, laptop computers, appliances, bike, motor vehicle and other electronic devices or other property or items, otherwise (individually, an "item"), or otherwise conducting business with JCLB BUY BACK SHOP OPC. You should have valid proofs of identity and should be voluntarily agreeing to be legally bound by these terms and conditions JCLB BUY BACK SHOP OPC may request documentation of other proof of compliance that you are the real owner of the item(s). You agree to and will identify and hold harmless JCLB BUY BACK SHOP OPC from and against any claims, suits, investigations, judgment, liabilities, obligations and damages relating to or arising out of the title to, ownership of or lien on any item sold or purported or arranged to be sold by you JCLB BUY BACK SHOP OPC. After the verification of your item(s), JCLB BUY BACK SHOP OPC will in its sole discretion, pay in cash that constitutes the payment for item(s) purchased by JCLB BUY BACK SHOP OPC. Upon receipt of cash from JCLB BUY BACK SHOP OPC, you will be legally bound by the sale transaction and you will not have the opportunity or right to rescind the transaction or repurchased your item(s) back from JCLB BUY BACK SHOP OPC without paying the purchased amount and storage fee for THIRTY (30) DAYS which run from the time you received the payment.';

const DEFAULT_TERMS_DECLARATION =
  "I hereby declare that the item mentioned in front of this document are my personal property and free from any liens and encumbrances.";

const DEFAULT_AUTHORIZED_SUBTEXT =
  "Whose name and signature appears below to repurchase my item(s) covered by this MOA in my behalf.";

const DEFAULT_TERMS_RECEIVED_TEXT =
  "Received the article(s) in the same condition when sold and repurchased back.";

const DEFAULT_TERMS_RECEIVED_PRESENCE =
  "(Signed in the presence of JCLB BUY BACK SHOP OPC owner/employee)";

function normalizeTermsText(rawText?: string) {
  const normalizedLines = (rawText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return normalizedLines.join("\n");
}

function parsePersistedMoaValues(remarks?: string) {
  const metadataLine = (remarks ?? "")
    .split(/\r?\n/)
    .find((line) => line.startsWith("[MOA Fields] "));
  if (!metadataLine) return {};

  return Object.fromEntries(
    metadataLine
      .slice("[MOA Fields] ".length)
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf(":");
        if (separatorIndex < 0) return [entry, ""];
        return [
          entry.slice(0, separatorIndex).trim(),
          entry.slice(separatorIndex + 1).trim(),
        ];
      }),
  );
}

function numberToWords(num: number): string {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  
  if (num === 0) return "zero";
  
  const convertLessThanOneThousand = (n: number): string => {
    if (n < 20) return ones[n];
    const unit = n % 10;
    const ten = Math.floor(n / 10) % 10;
    const hundred = Math.floor(n / 100);
    
    let res = "";
    if (hundred > 0) {
      res += ones[hundred] + " hundred";
      if (n % 100 > 0) res += " and ";
    }
    
    if (ten >= 2) {
      res += tens[ten];
      if (unit > 0) res += "-" + ones[unit];
    } else if (n % 100 > 0) {
      res += ones[n % 100];
    }
    
    return res;
  };
  
  const thousands = Math.floor(num % 1000000 / 1000);
  const millions = Math.floor(num % 1000000000 / 1000000);
  const remaining = Math.floor(num % 1000);
  
  let result = "";
  
  if (millions > 0) {
    result += convertLessThanOneThousand(millions) + " million ";
  }
  if (thousands > 0) {
    result += convertLessThanOneThousand(thousands) + " thousand ";
  }
  if (remaining > 0) {
    result += convertLessThanOneThousand(remaining);
  }
  
  return result.trim().toUpperCase() + " PESOS ONLY";
}

export function MoaModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  isLoading,
  autoPrint,
  mode = "finalize",
  confirmDisabled = false,
  confirmDisabledReason,
}: MoaModalProps) {
  const isFinalizeMode = mode === "finalize";
  const isViewMode = mode === "view";
  const [termsText, setTermsText] = useState("");
  const [labels, setLabels] = useState<MoaLabels | null>(null);
  const [extensionRows, setExtensionRows] = useState<MoaExtensionRow[]>([]);
  const [financialFields, setFinancialFields] = useState<FinancialFieldKey[]>(DEFAULT_FINANCIAL_FIELDS);
  const [unitFields, setUnitFields] = useState<UnitFieldKey[]>(DEFAULT_UNIT_FIELDS);
  const [customFinancialFields, setCustomFinancialFields] = useState<CustomMoaField[]>([]);
  const [customUnitFields, setCustomUnitFields] = useState<CustomMoaField[]>([]);
  const [shopInfo, setShopInfo] = useState<{
    shopName?: string;
    shopAddress?: string;
    phoneNumber?: string;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const templateFetchRef = useRef(0);
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsFinalizeConfirmOpen(false);
    }
  }, [isOpen]);

  const applyMoaTemplate = (moaTemplate: MoaTemplate, category: string) => {
    const categoryKey = Object.keys(moaTemplate.category_templates ?? {}).find(
      (item) => item.trim().toLowerCase() === category.trim().toLowerCase(),
    );
    const categoryTemplate = categoryKey
      ? moaTemplate.category_templates?.[categoryKey]
      : undefined;

    setTermsText(normalizeTermsText(categoryTemplate?.terms_text ?? moaTemplate.terms_text));
    setLabels({ ...moaTemplate.labels, ...(categoryTemplate?.labels ?? {}) });
    setExtensionRows(categoryTemplate?.extensionRows ?? moaTemplate.extensionRows ?? []);
    setFinancialFields(
      categoryTemplate?.financialFields
      ?? moaTemplate.financialFields
      ?? DEFAULT_FINANCIAL_FIELDS,
    );
    setUnitFields(
      categoryTemplate?.unitFields
      ?? moaTemplate.unitFields
      ?? DEFAULT_UNIT_FIELDS,
    );
    setCustomFinancialFields(
      categoryTemplate?.customFinancialFields
      ?? moaTemplate.customFinancialFields
      ?? [],
    );
    setCustomUnitFields(
      categoryTemplate?.customUnitFields
      ?? moaTemplate.customUnitFields
      ?? [],
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const fetchId = ++templateFetchRef.current;

    async function fetchTemplateAndInterestRates() {
      try {
        const [moaTemplate, interestRates, generalSettings] = await Promise.all([
          api.get<MoaTemplate>(`/settings/moa_template?t=${Date.now()}`, {
            cache: "no-store",
          }),
          api.get<unknown[]>(`/settings/interest_rates`),
          api.get<{ shopInfo?: { shopName?: string; shopAddress?: string; phoneNumber?: string } }>(`/settings/general`),
        ]);

        if (cancelled || fetchId !== templateFetchRef.current) return;

        if (moaTemplate) {
          applyMoaTemplate(moaTemplate, data.category);
        }

        if (Array.isArray(interestRates)) {
          setInterestRatesCache(interestRates as InterestRateGroup[]);
        }
        if (generalSettings?.shopInfo) {
          setShopInfo(generalSettings.shopInfo);
        }
      } catch (error) {
        console.error("Failed to fetch MOA template and/or interest rates:", error);
      }
    }

    fetchTemplateAndInterestRates();

    const handleTemplateUpdated = () => {
      void fetchTemplateAndInterestRates();
    };
    window.addEventListener("moa-template-updated", handleTemplateUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("moa-template-updated", handleTemplateUpdated);
    };
  }, [data.category, isOpen]);

  useEffect(() => {
    if (!isOpen || !autoPrint || !labels) return;

    let cancelled = false;
    const tryPrint = (attempt = 0) => {
      if (cancelled) return;
      const pageCount = printRef.current?.querySelectorAll(".moa-print-page").length ?? 0;
      if (pageCount >= 2 || attempt >= 8) {
        void handlePrint();
        return;
      }
      setTimeout(() => tryPrint(attempt + 1), 200);
    };

    const timer = setTimeout(() => tryPrint(), 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, autoPrint, labels, termsText]);

  const handlePrint = async () => {
    if (!printRef.current) return;

    // Clone only the legal pages — never include modal chrome (Close / Print buttons).
    const pages = printRef.current.querySelectorAll(".moa-print-page");
    if (pages.length === 0) return;

    const wrapper = document.createElement("div");
    wrapper.id = "moa-slip-printable";
    wrapper.className = "moa-paper-effect";
    pages.forEach((page) => {
      wrapper.appendChild(page.cloneNode(true));
    });

    try {
      await printMoaSlipDocument(wrapper.outerHTML);
    } catch (err) {
      console.error("Print failed:", err);
    }
  };

  useEffect(() => {
    if (autoPrint && isOpen) {
      const handleAfterPrint = () => {
        onClose();
      };
      window.addEventListener('afterprint', handleAfterPrint);
      return () => window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, [autoPrint, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add("printing-moa-active");
      document.body.classList.add("printing-moa-active");
    } else {
      document.documentElement.classList.remove("printing-moa-active");
      document.body.classList.remove("printing-moa-active");
    }
    return () => {
      document.documentElement.classList.remove("printing-moa-active");
      document.body.classList.remove("printing-moa-active");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const fullName = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const amount = Number(data.amount) || 0;
  const persistedMoaValues = parsePersistedMoaValues(data.remarks);
  const parkingFee =
    Number(data.parkingFee)
    || Number(persistedMoaValues["Parking fee"])
    || 0;
  const visibleRemarks = data.remarks
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("[MOA Fields] "))
    .join("\n")
    .trim();
  const savedStorageFee = Number(data.storageFee) || 0;
  const storageFee =
    savedStorageFee > 0
      ? savedStorageFee
      : amount > 0
        ? calculatePeriodicStorageFee(amount, data.category)
        : 0;
  const netProceeds = Math.max(0, amount - parkingFee);
  const financialValues: Record<FinancialFieldKey, string> = {
    amount: formatPeso(amount),
    storageFee: formatPeso(storageFee),
    parkingFee: formatPeso(parkingFee),
    netProceeds: formatPeso(netProceeds),
  };
  const unitValues: Record<UnitFieldKey, string> = {
    brandModel: data.unitName || "---",
    itemsIncluded: data.itemsIncluded || "---",
    condition: data.condition || "---",
    serialNo: data.serialNumber || "---",
    memory: data.memory || "---",
    remarks: visibleRemarks || "---",
  };
  const financialLabelFallbacks: Record<FinancialFieldKey, string> = {
    amount: "Amount:",
    storageFee: "Storage fee:",
    parkingFee: "Parking fee:",
    netProceeds: "Net Proceeds:",
  };
  const unitLabelFallbacks: Record<UnitFieldKey, string> = {
    brandModel: "Brand and model:",
    itemsIncluded: "Items included:",
    condition: "Condition:",
    serialNo: "Serial No.:",
    memory: "Memory:",
    remarks: "Remarks:",
  };

  const schedule = getInterestRateSchedule(data.category);

  const baseDate = data.purchasedDate ? new Date(data.purchasedDate) : new Date();
  const formatCompactDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return formatCompactDate(res);
  };

  const maturityDates = [
    addDays(baseDate, schedule[1]?.endDay ?? 10),
    addDays(baseDate, schedule[2]?.endDay ?? 20),
    addDays(baseDate, schedule[3]?.endDay ?? 30),
  ];
  const gracePeriodEnd = addDays(baseDate, schedule[4]?.endDay ?? 34);
  const printableTermsLines = termsText.split(/\r?\n/).filter(Boolean);

  const brandName = shopInfo?.shopName || "JCLB BUY BACK SHOP";
  const transactionBranch = data.branchName?.trim() || "";
  const transactionAddress = data.branchAddress?.trim() || "";
  const transactionPhone = data.branchPhone?.trim() || "";
  const hasTransactionBranch = Boolean(
    transactionBranch || transactionAddress || transactionPhone,
  );
  const headerPrimary = brandName;
  const headerBranchLine = hasTransactionBranch ? transactionBranch : "";
  const headerSecondary =
    transactionAddress || (!hasTransactionBranch ? shopInfo?.shopAddress : "") || "";
  const headerPhone =
    transactionPhone || (!hasTransactionBranch ? shopInfo?.phoneNumber : "") || "";
  const sellerSignatureLabel =
    labels?.sellerSignature || "(Name and Signature of Seller)";
  const representativeSignatureLabel =
    labels?.representativeSignature || "(Name and Signature of Representative)";
  const termsPreamble = labels?.termsPreamble || DEFAULT_TERMS_PREAMBLE;
  const termsDeclaration = labels?.termsDeclaration || DEFAULT_TERMS_DECLARATION;
  const authorizedSubtext = labels?.authorizedSubtext || DEFAULT_AUTHORIZED_SUBTEXT;
  const termsReceivedText = labels?.termsReceivedText || DEFAULT_TERMS_RECEIVED_TEXT;
  const termsReceivedPresence = labels?.termsReceivedPresence || DEFAULT_TERMS_RECEIVED_PRESENCE;
  const customerFullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ").trim() || "Customer";

  const handleFinalizeRequest = () => {
    if (isLoading || confirmDisabled) return;
    setIsFinalizeConfirmOpen(true);
  };

  const handleFinalizeConfirm = () => {
    if (isLoading || confirmDisabled) return;
    void onConfirm();
  };

  return (
    <div id="moa-modal-root" className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 text-zinc-900">
      <div
        className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity no-print"
        onClick={isViewMode ? onClose : undefined}
      />
      <div
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 animate-in fade-in zoom-in-95 duration-300 flex flex-col relative z-10 light moa-paper-effect"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {!autoPrint && (
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white shrink-0 relative z-10 flex items-center justify-between no-print">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white leading-none">{labels?.moaTitle || "Memorandum of Agreement Slip"}</h2>
            </div>
            {isViewMode ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            ) : null}
          </div>
        )}

        {autoPrint && (
          <div className="bg-emerald-50 px-6 py-4 flex items-center justify-between border-b border-emerald-100 no-print">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
              <p className="text-sm font-bold text-emerald-900">Preparing print dialog...</p>
            </div>
            <button onClick={onClose} className="text-xs font-bold text-emerald-700 hover:underline">Cancel</button>
          </div>
        )}

        {/* MOA Content - Matches Image 2 */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MoaPreviewScale>
          <div id="moa-slip-printable" ref={printRef} className="max-w-full bg-white text-zinc-800 moa-paper-effect">
            
            {/* PAGE 1: SLIPS (Original & Customer Copy) */}
            <div className={`${MOA_PAGE_CLASS} moa-slip-sheet`} style={MOA_PAGE_STYLE}>
              <div className="moa-slip-halves">

              {/* ORIGINAL COPY (Top Half) */}
              <div className="moa-slip-half">
              <div className="moa-slip-copy relative moa-watermark">
              <div className="moa-slip-body space-y-0.5">
                {/* Centered shop header */}
                <MoaBranchHeader
                  primary={headerPrimary}
                  branchLine={headerBranchLine}
                  address={headerSecondary}
                  phone={headerPhone}
                />

                {/* Row of copy label and unit code */}
                <div className="flex items-center justify-between gap-3 pt-1 text-[9.5px]">
                  <p className="font-bold italic">{labels?.originalCopy || "Original copy"}</p>
                  <div className="flex items-center gap-1">
                    <span className="font-bold uppercase tracking-wider">{labels?.unitCode || "UNIT CODE:"}</span>
                    <span className="w-20 border-b border-zinc-400 font-bold text-center">{data.unitCode || "---"}</span>
                  </div>
                </div>

                {/* Centered Slip Title */}
                <div className="text-center font-bold uppercase tracking-wider text-[11px] py-0.5">
                  {labels?.moaTitle || "Memorandum of Agreement Slip"}
                </div>

                {/* Dates & Maturity row */}
                <div className="grid grid-cols-2 gap-8 border-b border-zinc-100 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-24 font-semibold text-[8.5px] uppercase tracking-wider">{labels?.purchasedDate || "Purchased Date:"}</span>
                      <span className="flex-1 border-b border-zinc-400 text-center">{data.purchasedDate || new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 font-semibold text-[8.5px] uppercase tracking-wider">{labels?.idsPresented || "ID(s) Presented:"}</span>
                      <span className="flex-1 border-b border-zinc-400 text-center">{data.idPresented || "No ID"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-[76px_1fr] items-center gap-x-1">
                      <span className="whitespace-nowrap font-semibold text-[8.5px] uppercase tracking-wider">{labels?.maturityDate || "Maturity Date:"}</span>
                      <div className="grid grid-cols-[auto_48px_auto_48px_auto_48px] items-center gap-x-1">
                        <span className="contents whitespace-nowrap">
                          <span className="text-[7.5px] text-zinc-500">1st</span>
                          <span className="w-12 border-b border-zinc-400 text-center">{maturityDates[0]}</span>
                        </span>
                        <span className="contents whitespace-nowrap">
                          <span className="text-[7.5px] text-zinc-500">2nd</span>
                          <span className="w-12 border-b border-zinc-400 text-center">{maturityDates[1]}</span>
                        </span>
                        <span className="contents whitespace-nowrap">
                          <span className="text-[7.5px] text-zinc-500">3rd</span>
                          <span className="w-12 border-b border-zinc-400 text-center">{maturityDates[2]}</span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-[76px_1fr] items-center gap-x-1 text-red-600 font-bold">
                      <span className="whitespace-nowrap font-semibold text-[8.5px] uppercase tracking-wider">{labels?.expiryDate || "Expiry Date:"}</span>
                      <span className="flex-1 border-b border-zinc-400 text-center">{gracePeriodEnd}</span>
                    </div>
                  </div>
                </div>

                {/* Agreement text */}
                <div className="moa-agreement-text space-y-1 leading-relaxed text-justify text-[9px] px-1 select-text">
                  <div>
                    {labels?.customerIntro || "I, Mr./Mrs."} <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[120px]">{fullName}</span>, {labels?.legalAgeResident || "of legal age and a resident of"} <span className="inline-block border-b border-zinc-500 font-medium px-1 text-center min-w-[180px]">{data.address.toUpperCase()}</span>. For the amount of <span className="inline-block border-b border-zinc-500 px-1 text-center min-w-[120px]">{amount > 0 ? numberToWords(amount) : "________________"}</span> (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">{formatPeso(amount)}</span>) {labels?.agreementText || "agree to transfer and convey by way of sale with a right to repurchase back."} {labels?.repayIntro || "If I have repurchased the above unit, I shall pay the amount of"} (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">{formatPeso(amount)}</span>) {labels?.plusText || "plus"} (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">{formatPeso(storageFee)}</span>) {labels?.storageFeeText || "every 10 days as storage fee. Penalty amounting to"} <span className="inline-block border-b border-zinc-500 px-1 text-center min-w-[80px]">₱0.00</span> (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">₱0.00</span>) {labels?.overdueText || "applies when overdue."} and you are given 5 days grace period (<span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[70px]">{gracePeriodEnd}</span>) my right to repurchase back the unit(s) described below is deemed waived.
                  </div>
                </div>

                {/* Unit description grid */}
                <div className="border-y border-zinc-200 py-2 my-2 space-y-2 bg-zinc-50/30">
                  <h3 className="font-bold text-center underline text-[9.5px]">{labels?.unitDescription || "Unit Description"}</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 px-3">
                    {/* Left column: Financial */}
                    <div className="space-y-1">
                      {financialFields.map((field, index) => {
                        const isTotal = field === "netProceeds";
                        return (
                          <div key={field} className="grid grid-cols-[80px_1fr] items-center gap-1">
                            <span className="font-semibold text-zinc-500 uppercase text-[8px]">
                              {labels?.[field] || financialLabelFallbacks[field]}
                            </span>
                            <span className={`border-b border-zinc-300 w-[100px] inline-block text-center ${isTotal ? "font-bold text-emerald-800" : "text-zinc-900"}`}>
                              {financialValues[field]}
                            </span>
                          </div>
                        );
                      })}
                      {customFinancialFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-[80px_1fr] items-center gap-1">
                          <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                          <span className="border-b border-zinc-300 w-[100px] inline-block text-center text-zinc-900">
                            {data.customMoaValues?.[field.id] || persistedMoaValues[field.label] || ""}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Right column: Unit details */}
                    <div className="space-y-1">
                      {unitFields.map((field) => (
                        <div key={field} className="grid grid-cols-[92px_1fr] items-center gap-1">
                          <span className="font-semibold text-zinc-500 uppercase text-[8px]">
                            {labels?.[field] || unitLabelFallbacks[field]}
                          </span>
                          <span className="border-b border-zinc-300 w-[120px] inline-block text-center text-zinc-900">
                            {unitValues[field]}
                          </span>
                        </div>
                      ))}
                      {customUnitFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-[92px_1fr] items-center gap-1">
                          <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                          <span className="border-b border-zinc-300 w-[120px] inline-block text-center text-zinc-900">
                            {data.customMoaValues?.[field.id] || persistedMoaValues[field.label] || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                </div>
                <div className="moa-slip-footer space-y-0.5">
                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-1 text-center">
                  <div className="flex flex-col items-center">
                    <span className="inline-block border-b border-zinc-400 w-[180px] h-4 text-center">{fullName}</span>
                    <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{labels?.sellerSignature || "(Name and Signature of Seller)"}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="inline-block border-b border-zinc-400 w-[180px] h-4 text-center">{data.processedBy || ""}</span>
                    <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{labels?.representativeSignature || "(Name and Signature of Representative)"}</p>
                  </div>
                </div>

                {/* Renewal Rows */}
                <div className="py-2 space-y-1 border-t border-zinc-100">
                  {(extensionRows.length > 0
                    ? extensionRows
                    : [
                        { period: "1st Period" },
                        { period: "2nd Period" },
                        { period: "3rd Period" },
                      ]
                  ).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-[8.5px] font-semibold text-zinc-600">
                      <div className="flex items-center gap-1">
                        <span>Date:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{maturityDates[idx] || ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Storage:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.storage || formatPeso(storageFee)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Period:</span>
                        <span className="font-bold text-zinc-800">{row.period === "1st Period" ? "1st" : row.period === "2nd Period" ? "2nd" : row.period === "3rd Period" ? "3rd" : row.period}</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.periodValue || ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Extend:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.extend || ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Sign:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.sign || ""}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advise Banner */}
                <div className="text-center font-bold text-[8.5px] uppercase pt-1 border-t border-zinc-100 select-text">
                  <div className="block w-full text-center text-[8.5px] font-bold uppercase text-zinc-700 outline-none">
                    {labels?.adviseText || "SELLER IS ADVISED TO READ AND UNDERSTAND THE TERMS AND CONDITIONS ON THE REVERSE SIDE HEREOF"}
                  </div>
                </div>
              </div>
              </div>
              </div>

              {/* Middle Cut Guide */}
              <MoaCutGuide />

              {/* CUSTOMER COPY (Bottom Half) */}
              <div className="moa-slip-half">
              <div className="moa-slip-copy relative moa-watermark">
              <div className="moa-slip-body space-y-0.5">
                {/* Centered shop header */}
                <MoaBranchHeader
                  primary={headerPrimary}
                  branchLine={headerBranchLine}
                  address={headerSecondary}
                  phone={headerPhone}
                />

                {/* Row of copy label and unit code */}
                <div className="flex items-center justify-between gap-3 pt-1 text-[9.5px]">
                  <p className="font-bold italic">Customer copy</p>
                  <div className="flex items-center gap-1">
                    <span className="font-bold uppercase tracking-wider">{labels?.unitCode || "UNIT CODE:"}</span>
                    <span className="w-20 border-b border-zinc-400 font-bold text-center">{data.unitCode || "---"}</span>
                  </div>
                </div>

                {/* Centered Slip Title */}
                <div className="text-center font-bold uppercase tracking-wider text-[11px] py-0.5">
                  {labels?.moaTitle || "Memorandum of Agreement Slip"}
                </div>

                {/* Dates & Maturity row */}
                <div className="grid grid-cols-2 gap-8 border-b border-zinc-100 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-24 font-semibold text-[8.5px] uppercase tracking-wider">{labels?.purchasedDate || "Purchased Date:"}</span>
                      <span className="flex-1 border-b border-zinc-400 text-center">{data.purchasedDate || new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 font-semibold text-[8.5px] uppercase tracking-wider">{labels?.idsPresented || "ID(s) Presented:"}</span>
                      <span className="flex-1 border-b border-zinc-400 text-center">{data.idPresented || "No ID"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-[76px_1fr] items-center gap-x-1">
                      <span className="whitespace-nowrap font-semibold text-[8.5px] uppercase tracking-wider">{labels?.maturityDate || "Maturity Date:"}</span>
                      <div className="grid grid-cols-[auto_48px_auto_48px_auto_48px] items-center gap-x-1">
                        <span className="contents whitespace-nowrap">
                          <span className="text-[7.5px] text-zinc-500">1st</span>
                          <span className="w-12 border-b border-zinc-400 text-center">{maturityDates[0]}</span>
                        </span>
                        <span className="contents whitespace-nowrap">
                          <span className="text-[7.5px] text-zinc-500">2nd</span>
                          <span className="w-12 border-b border-zinc-400 text-center">{maturityDates[1]}</span>
                        </span>
                        <span className="contents whitespace-nowrap">
                          <span className="text-[7.5px] text-zinc-500">3rd</span>
                          <span className="w-12 border-b border-zinc-400 text-center">{maturityDates[2]}</span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-[76px_1fr] items-center gap-x-1 text-red-600 font-bold">
                      <span className="whitespace-nowrap font-semibold text-[8.5px] uppercase tracking-wider">{labels?.expiryDate || "Expiry Date:"}</span>
                      <span className="flex-1 border-b border-zinc-400 text-center">{gracePeriodEnd}</span>
                    </div>
                  </div>
                </div>

                {/* Agreement text */}
                <div className="moa-agreement-text space-y-1 leading-relaxed text-justify text-[9px] px-1 select-text">
                  <div>
                    {labels?.customerIntro || "I, Mr./Mrs."} <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[120px]">{fullName}</span>, {labels?.legalAgeResident || "of legal age and a resident of"} <span className="inline-block border-b border-zinc-500 font-medium px-1 text-center min-w-[180px]">{data.address.toUpperCase()}</span>. For the amount of <span className="inline-block border-b border-zinc-500 px-1 text-center min-w-[120px]">{amount > 0 ? numberToWords(amount) : "________________"}</span> (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">{formatPeso(amount)}</span>) {labels?.agreementText || "agree to transfer and convey by way of sale with a right to repurchase back."} {labels?.repayIntro || "If I have repurchased the above unit, I shall pay the amount of"} (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">{formatPeso(amount)}</span>) {labels?.plusText || "plus"} (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">{formatPeso(storageFee)}</span>) {labels?.storageFeeText || "every 10 days as storage fee. Penalty amounting to"} <span className="inline-block border-b border-zinc-500 px-1 text-center min-w-[80px]">₱0.00</span> (P <span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[60px]">₱0.00</span>) {labels?.overdueText || "applies when overdue."} and you are given 5 days grace period (<span className="inline-block border-b border-zinc-500 font-bold px-1 text-center min-w-[70px]">{gracePeriodEnd}</span>) my right to repurchase back the unit(s) described below is deemed waived.
                  </div>
                </div>

                {/* Unit description grid */}
                <div className="border-y border-zinc-200 py-2 my-2 space-y-2 bg-zinc-50/30">
                  <h3 className="font-bold text-center underline text-[9.5px]">{labels?.unitDescription || "Unit Description"}</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 px-3">
                    {/* Left column: Financial */}
                    <div className="space-y-1">
                      {financialFields.map((field, index) => {
                        const isTotal = field === "netProceeds";
                        return (
                          <div key={field} className="grid grid-cols-[80px_1fr] items-center gap-1">
                            <span className="font-semibold text-zinc-500 uppercase text-[8px]">
                              {labels?.[field] || financialLabelFallbacks[field]}
                            </span>
                            <span className={`border-b border-zinc-300 w-[100px] inline-block text-center ${isTotal ? "font-bold text-emerald-800" : "text-zinc-900"}`}>
                              {financialValues[field]}
                            </span>
                          </div>
                        );
                      })}
                      {customFinancialFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-[80px_1fr] items-center gap-1">
                          <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                          <span className="border-b border-zinc-300 w-[100px] inline-block text-center text-zinc-900">
                            {data.customMoaValues?.[field.id] || persistedMoaValues[field.label] || ""}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Right column: Unit details */}
                    <div className="space-y-1">
                      {unitFields.map((field) => (
                        <div key={field} className="grid grid-cols-[92px_1fr] items-center gap-1">
                          <span className="font-semibold text-zinc-500 uppercase text-[8px]">
                            {labels?.[field] || unitLabelFallbacks[field]}
                          </span>
                          <span className="border-b border-zinc-300 w-[120px] inline-block text-center text-zinc-900">
                            {unitValues[field]}
                          </span>
                        </div>
                      ))}
                      {customUnitFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-[92px_1fr] items-center gap-1">
                          <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                          <span className="border-b border-zinc-300 w-[120px] inline-block text-center text-zinc-900">
                            {data.customMoaValues?.[field.id] || persistedMoaValues[field.label] || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                </div>
                <div className="moa-slip-footer space-y-0.5">
                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-1 text-center">
                  <div className="flex flex-col items-center">
                    <span className="inline-block border-b border-zinc-400 w-[180px] h-4 text-center">{fullName}</span>
                    <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{labels?.sellerSignature || "(Name and Signature of Seller)"}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="inline-block border-b border-zinc-400 w-[180px] h-4 text-center">{data.processedBy || ""}</span>
                    <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{labels?.representativeSignature || "(Name and Signature of Representative)"}</p>
                  </div>
                </div>

                {/* Renewal Rows */}
                <div className="py-2 space-y-1 border-t border-zinc-100">
                  {(extensionRows.length > 0
                    ? extensionRows
                    : [
                        { period: "1st Period" },
                        { period: "2nd Period" },
                        { period: "3rd Period" },
                      ]
                  ).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-[8.5px] font-semibold text-zinc-600">
                      <div className="flex items-center gap-1">
                        <span>Date:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{maturityDates[idx] || ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Storage:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.storage || formatPeso(storageFee)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Period:</span>
                        <span className="font-bold text-zinc-800">{row.period === "1st Period" ? "1st" : row.period === "2nd Period" ? "2nd" : row.period === "3rd Period" ? "3rd" : row.period}</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.periodValue || ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Extend:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.extend || ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Sign:</span>
                        <span className="inline-block border-b border-zinc-400 w-[60px] h-4 text-center">{row.sign || ""}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advise Banner */}
                <div className="text-center font-bold text-[8.5px] uppercase pt-1 border-t border-zinc-100 select-text">
                  <div className="block w-full text-center text-[8.5px] font-bold uppercase text-zinc-700 outline-none">
                    {labels?.adviseText || "SELLER IS ADVISED TO READ AND UNDERSTAND THE TERMS AND CONDITIONS ON THE REVERSE SIDE HEREOF"}
                  </div>
                </div>
              </div>
              </div>
              </div>
            </div>
            </div>

            {/* PAGE 2: TERMS AND CONDITIONS */}
            <div className={`${MOA_PAGE_CLASS} moa-slip-sheet`} style={MOA_PAGE_STYLE}>
              <div className="moa-slip-halves">
              
              {/* Top Copy (Original terms) */}
              <div className="moa-slip-half">
              <div className="moa-terms-copy relative moa-watermark">
              <div className="moa-terms-body space-y-1.5">
                <h2 className="text-center font-bold uppercase text-[11px] select-text">
                  {labels?.termsHeading || "Terms and Conditions"}
                </h2>
                
                <p className="text-justify leading-relaxed text-[8.5px] text-zinc-700">
                  {termsPreamble}
                </p>

                <div className="whitespace-pre-wrap text-[8.5px] leading-relaxed text-zinc-800">
                  {printableTermsLines.map((line, lIdx) => (
                    <div key={lIdx} className="mb-0.5 flex items-start gap-1">
                      <span className="font-bold shrink-0">{lIdx + 1}.</span>
                      <span>{line.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  ))}
                </div>

                <p className="italic font-bold text-zinc-800 text-[8.5px] text-center">
                  {termsDeclaration}
                </p>

                </div>
                <div className="moa-terms-footer">
                {/* Signatures block */}
                <div className="moa-terms-signatures grid grid-cols-[1.2fr_1.5fr] gap-8 pt-2 items-start">
                  <MoaNamedSignatureLine name={fullName} label={sellerSignatureLabel} />

                  <div className="text-center flex flex-col items-center space-y-1.5">
                    <span className="font-bold uppercase text-[8.5px] text-emerald-900 block tracking-wide">{labels?.authorizedText || "I HEREBY AUTHORIZED"}</span>
                    <span className="text-[7.5px] text-zinc-500 block leading-tight">{authorizedSubtext}</span>

                    <MoaNamedSignatureLine
                      name={data.processedBy || ""}
                      label={representativeSignatureLabel}
                      className="w-full"
                    />

                    <MoaNamedSignatureLine
                      name={fullName}
                      label={sellerSignatureLabel}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Received Section */}
                <div className="moa-terms-received pt-2 space-y-2 border-t border-zinc-100">
                  <p className="text-[8px] leading-tight text-zinc-800 font-medium text-left">
                    {termsReceivedText}<br />
                    {termsReceivedPresence}
                  </p>
                  <div className="w-1/2">
                    <MoaNamedSignatureLine name={fullName} label={sellerSignatureLabel} className="w-full" />
                  </div>
                </div>
                </div>
              </div>
              </div>

              {/* Middle Cut Guide */}
              <MoaCutGuide />

              {/* Bottom Copy (Customer terms) */}
              <div className="moa-slip-half">
              <div className="moa-terms-copy relative moa-watermark">
              <div className="moa-terms-body space-y-1.5">
                <h2 className="text-center font-bold uppercase text-[11px] select-text">
                  {labels?.termsHeading || "Terms and Conditions"}
                </h2>
                
                <p className="text-justify leading-relaxed text-[8.5px] text-zinc-700">
                  {termsPreamble}
                </p>

                <div className="whitespace-pre-wrap text-[8.5px] leading-relaxed text-zinc-800">
                  {printableTermsLines.map((line, lIdx) => (
                    <div key={lIdx} className="mb-0.5 flex items-start gap-1">
                      <span className="font-bold shrink-0">{lIdx + 1}.</span>
                      <span>{line.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  ))}
                </div>

                <p className="italic font-bold text-zinc-800 text-[8.5px] text-center">
                  {termsDeclaration}
                </p>

                </div>
                <div className="moa-terms-footer">
                {/* Signatures block */}
                <div className="moa-terms-signatures grid grid-cols-[1.2fr_1.5fr] gap-8 pt-2 items-start">
                  <MoaNamedSignatureLine name={fullName} label={sellerSignatureLabel} />

                  <div className="text-center flex flex-col items-center space-y-1.5">
                    <span className="font-bold uppercase text-[8.5px] text-emerald-900 block tracking-wide">{labels?.authorizedText || "I HEREBY AUTHORIZED"}</span>
                    <span className="text-[7.5px] text-zinc-500 block leading-tight">{authorizedSubtext}</span>

                    <MoaNamedSignatureLine
                      name={data.processedBy || ""}
                      label={representativeSignatureLabel}
                      className="w-full"
                    />

                    <MoaNamedSignatureLine
                      name={fullName}
                      label={sellerSignatureLabel}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Received Section */}
                <div className="moa-terms-received pt-2 space-y-2 border-t border-zinc-100">
                  <p className="text-[8px] leading-tight text-zinc-800 font-medium text-left">
                    {termsReceivedText}<br />
                    {termsReceivedPresence}
                  </p>
                  <div className="w-1/2">
                    <MoaNamedSignatureLine name={fullName} label={sellerSignatureLabel} className="w-full" />
                  </div>
                </div>
                </div>
              </div>
              </div>
              </div>
            </div>
          </div>
          </MoaPreviewScale>
        </div>

        {/* Footer Actions */}
        {!autoPrint && (
          <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-zinc-200 bg-white p-4 no-print sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
            <div className="min-w-0 sm:pr-4">
              {isFinalizeMode ? (
                <>
                  <p className="text-[10px] text-zinc-400 font-medium italic">
                    Review carefully. Finalizing will generate the ticket and store record permanently.
                  </p>
                  {confirmDisabled && confirmDisabledReason ? (
                    <p className="mt-2 text-[11px] font-semibold text-amber-800" role="alert">
                      {confirmDisabledReason}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-[10px] text-zinc-400 font-medium italic">
                  View or print the memorandum of agreement slip. Use Legal (8.5×13 in) paper size when printing.
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0 sm:gap-4">
              {isFinalizeMode ? (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full px-6 py-2.5 text-xs font-black text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50 sm:w-auto"
                >
                  Back to Form
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-6 py-2.5 text-xs font-black text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-95 sm:w-auto"
                >
                  Close
                </button>
              )}
              <button
                type="button"
                onClick={() => void handlePrint()}
                className="w-full px-6 py-2.5 text-xs font-black text-white bg-zinc-800 rounded-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 sm:w-auto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
                Print / PDF
              </button>
              {isFinalizeMode ? (
                <button
                  type="button"
                  onClick={handleFinalizeRequest}
                  disabled={isLoading || confirmDisabled}
                  className="w-full px-8 py-2.5 text-xs font-black text-white bg-emerald-700 rounded-xl shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-zinc-400 disabled:cursor-not-allowed sm:w-auto"
                >
                  Save & Finalize Transaction
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Global Print Styles */}
        <style jsx global>{`
        /* Force light mode aesthetics on screen even in dark mode */
        .moa-paper-effect {
          background-color: white !important;
          color: #18181b !important;
          color-scheme: light !important;
        }
        .moa-paper-effect .bg-zinc-50\/50 { background-color: #f9fafb !important; }
        .moa-paper-effect .text-zinc-700 { color: #3f3f46 !important; }
        .moa-paper-effect .text-zinc-500 { color: #71717a !important; }
        .moa-paper-effect .text-zinc-400 { color: #a1a1aa !important; }
        .moa-paper-effect .text-emerald-900 { color: #064e3b !important; }
        .moa-paper-effect .border-zinc-100 { border-color: #f4f4f5 !important; }
        .moa-paper-effect .border-zinc-200 { border-color: #e4e4e7 !important; }
        .moa-paper-effect .border-zinc-300 { border-color: #d4d4d8 !important; }
        .moa-paper-effect .border-zinc-400 { border-color: #a1a1aa !important; }
        .moa-paper-effect .bg-emerald-50 { background-color: #ecfdf5 !important; }
        .moa-paper-effect .text-emerald-800 { color: #065f46 !important; }
        .moa-paper-effect .bg-white\/30 { background-color: rgba(255, 255, 255, 0.3) !important; }
        .moa-paper-effect .bg-white\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
        .moa-paper-effect .bg-white\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }

        ${MOA_PRINT_SCREEN_CSS}

        @media print {
          ${MOA_PRINT_CSS}
          .no-print { display: none !important; }
          .no-print * { display: none !important; }

          html.printing-moa-active,
          body.printing-moa-active {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }

          body.printing-moa-active * {
            visibility: hidden !important;
          }

          body.printing-moa-active #moa-modal-root,
          body.printing-moa-active #moa-modal-root * {
            visibility: visible !important;
          }

          body.printing-moa-active #moa-modal-root {
            position: fixed !important;
            inset: 0 !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            z-index: 99999 !important;
          }

          body.printing-moa-active #moa-modal-root > div:first-child {
            display: none !important;
          }

          #moa-modal-root,
          #moa-modal-root * {
            animation: none !important;
            transition: none !important;
          }

          #moa-modal-root.fixed.inset-0,
          #moa-modal-root .relative.w-full.max-w-4xl,
          #moa-modal-root .flex-1.overflow-y-auto {
            position: static !important;
            display: block !important;
            width: auto !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            transform: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            flex: none !important;
          }

          #moa-slip-printable {
            font-size: 9.5px !important;
            line-height: 1.15 !important;
          }

          #moa-slip-printable .grid { display: grid !important; }
          #moa-slip-printable .flex { display: flex !important; }
          #moa-slip-printable .text-center { text-align: center !important; }
          #moa-slip-printable .justify-between { justify-content: space-between !important; }
          #moa-slip-printable .items-center { align-items: center !important; }

          #moa-slip-printable .text-zinc-300,
          #moa-slip-printable .text-zinc-400,
          #moa-slip-printable .text-zinc-500,
          #moa-slip-printable .text-zinc-600,
          #moa-slip-printable .text-zinc-700,
          #moa-slip-printable .text-zinc-800 {
            color: #000 !important;
          }

          #moa-slip-printable .rounded-3xl,
          #moa-slip-printable .rounded-xl {
            border-radius: 0 !important;
          }
        }
        `}</style>
      </div>

      {isFinalizeMode && isFinalizeConfirmOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 no-print">
          <div
            className="absolute inset-0 bg-emerald-950/50 backdrop-blur-sm"
            onClick={() => {
              if (!isLoading) setIsFinalizeConfirmOpen(false);
            }}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200 bg-white shadow-2xl shadow-emerald-900/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center px-6 pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-700"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-black text-zinc-900">
                Finalize this pawn transaction?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                This will permanently save the pawn record, generate the ticket, and update branch inventory.
                Please confirm the details below before continuing.
              </p>
              <div className="mt-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs text-zinc-700">
                <p><span className="font-bold text-zinc-500">Customer:</span> {customerFullName}</p>
                <p className="mt-1"><span className="font-bold text-zinc-500">Unit:</span> {data.unitName || "—"}</p>
                <p className="mt-1"><span className="font-bold text-zinc-500">Unit Code:</span> {data.unitCode || "—"}</p>
                <p className="mt-1"><span className="font-bold text-zinc-500">Pawn Amount:</span> {formatPeso(Number(data.amount || 0))}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-5">
              <button
                type="button"
                onClick={() => setIsFinalizeConfirmOpen(false)}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-black text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeConfirm}
                disabled={isLoading || confirmDisabled}
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-700/20 transition-colors hover:bg-emerald-800 disabled:bg-zinc-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="anim-loading h-4 w-4 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </>
                ) : (
                  "Yes, Finalize"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
