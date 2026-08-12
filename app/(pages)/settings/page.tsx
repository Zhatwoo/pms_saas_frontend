"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Eye } from "lucide-react";
import { api } from "@/lib/api";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { useAuth } from "@/contexts/auth-context";
import { PasswordChangeRequestCard } from "@/components/shared/password-change-request-card";
import { AvatarPickerModal } from "@/components/shared/avatar-picker-modal";
import { ActionButton } from "@/components/shared/action-button";
import { NotificationSoundSettings } from "@/components/shared/notification-sound-settings";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";
import { fetchCategories } from "@/lib/categories";
import {
  MOA_LEGAL_PAGE,
  MOA_PRINT_CSS,
  MOA_PRINT_SCREEN_CSS,
  MOA_SIGNATURE_LINE_CLASS,
  printMoaSlipDocument,
} from "@/lib/print-templates";
import { MoaCutGuide } from "@/components/shared/moa-cut-guide";
import { InterestRatesSettings } from "./_components/interest-rates-settings";
import CategoriesSettings from "./_components/categories-settings";
import {
  DEFAULT_SLIP_SECTION_ORDER,
  MoaSortableGroup,
  MoaSortableItem,
  loadSlipSectionOrder,
  saveSlipSectionOrder,
  type SlipSectionId,
} from "./_components/moa-dnd";
import {
  MoaCanvasWatermark,
  MoaDesignCanvasLayer,
  MAX_MOA_PAGES,
  MOA_DOCUMENT_TYPES,
  MOA_FONT_OPTIONS,
  MOA_PAGE_SIZES,
  DEFAULT_MOA_WATERMARK,
  DEFAULT_MOA_LINE_HEIGHT,
  applyToolbarToSelected,
  createMoaDesignElement,
  createMoaConfigFieldElement,
  MOA_PAGE_DOC_FIELD_KEY,
  loadMoaDesignElements,
  loadMoaMargins,
  loadMoaPageCount,
  loadMoaPageSize,
  loadMoaWatermark,
  moaDesignStorageKey,
  saveMoaDesignElements,
  saveMoaMargins,
  saveMoaPageCount,
  saveMoaPageSize,
  saveMoaWatermark,
  type MoaConfigFieldPayload,
  type MoaDesignElement,
  type MoaDocumentType,
  type MoaElementCreateOptions,
  type MoaHeaderFieldKey,
  type MoaPageSizeId,
  type MoaPaletteItemKind,
  type MoaTextAlign,
  type MoaTextStylePatch,
  type MoaWatermarkSettings,
} from "./_components/moa-design-palette";
import { useMoaKeyboard } from "./hooks/useMoaKeyboard";
import { MoaDesignToolsPanel } from "./_components/moa-design/tools-panel";
import { MoaDocsToolbar } from "./_components/moa-design/docs-toolbar";
import { ImageOptionsPanel } from "./_components/moa-design/image-options-panel";
import {
  MoaDocsRuler,
  defaultMarginsForPage,
  marginsToPadding,
  type MoaDocsMargins,
} from "./_components/moa-design/docs-ruler";
import { MoaFieldConfigTab } from "./_components/moa-design/field-config-tab";
import {
  cloneMoaDesignBlob,
  createDefaultMoaDesign,
  createSampleMoaFieldValues,
  hasMoaDesign,
  JEWELRY_FIELD_OPTIONS,
  jewelryFieldInsertLayout,
  MoaDesignPrintPages,
  resolveMoaFieldValue,
  MoaDesignViewModal,
  normalizeMoaDesignBlob,
  placePackOnPage,
  templateToDesignBlob,
  type MoaComponentTemplate,
  type MoaDesignBlob,
} from "@/lib/moa";
import {
  loadCustomMoaComponentTemplates,
  saveCustomMoaComponentTemplates,
} from "@/lib/moa/component-templates";
// Hook implementation resides in ./hooks/useMoaKeyboard.ts
// ─── ResizableLine ───────────────────────────────────────────────────────────
// Must be defined OUTSIDE SettingsPage so React can use hooks inside it.
function ResizableLine({
  value,
  onChange,
  fieldKey,
  storedWidth,
  onWidthChange,
  canEdit,
  defaultWidth = 120,
}: {
  value: string;
  onChange: (v: string) => void;
  fieldKey: string;
  storedWidth?: number;
  onWidthChange: (key: string, width: number) => void;
  canEdit: boolean;
  defaultWidth?: number;
}) {
  const width = storedWidth ?? defaultWidth;
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const currentWidth = dragWidth ?? width;

  return (
    <span
      className={`moa-resizable-line group relative inline-flex items-end border-b border-zinc-400 align-bottom ${canEdit ? "mx-1" : "mx-0.5"}`}
      style={{
        width: currentWidth,
        minWidth: 48,
        maxWidth: "100%",
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canEdit}
        className={`block w-full bg-transparent text-[10px] outline-none disabled:pointer-events-none px-0.5 leading-none m-0 p-0 ${canEdit ? "hover:bg-brand-green/10 focus:bg-brand-green/10" : ""}`}
        style={{ height: '14px' }}
      />
      {canEdit && (
        <span
          className="absolute -right-2 bottom-0 inline-flex h-4 w-4 cursor-ew-resize items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-50 z-10"
          onPointerDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = currentWidth;
            const onPointerMove = (moveEvent: PointerEvent) => {
              setDragWidth(Math.max(48, startWidth + (moveEvent.clientX - startX)));
            };
            const onPointerUp = (upEvent: PointerEvent) => {
              document.removeEventListener("pointermove", onPointerMove);
              document.removeEventListener("pointerup", onPointerUp);
              const finalWidth = Math.max(48, startWidth + (upEvent.clientX - startX));
              setDragWidth(null);
              onWidthChange(fieldKey, finalWidth);
            };
            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
          }}
        >
          <span className="inline-block h-3 w-0.5 rounded-full bg-pawn-gold" />
        </span>
      )}
    </span>
  );
}

type ExtensionRow = {
  date: string;
  storage: string;
  period: string;
  periodValue?: string;
  extend: string;
  sign: string;
};

type FinancialFieldKey = "amount" | "storageFee" | "parkingFee" | "netProceeds";
type UnitFieldKey = "brandModel" | "itemsIncluded" | "condition" | "serialNo" | "memory" | "remarks";
type CustomMoaField = {
  id: string;
  label: string;
};

const FINANCIAL_FIELD_OPTIONS: Array<{ key: FinancialFieldKey; valueKey: FinancialFieldKey }> = [
  { key: "amount", valueKey: "amount" },
  { key: "storageFee", valueKey: "storageFee" },
  { key: "parkingFee", valueKey: "parkingFee" },
  { key: "netProceeds", valueKey: "netProceeds" },
];

const UNIT_FIELD_OPTIONS: Array<{ key: UnitFieldKey; valueKey: UnitFieldKey }> = [
  { key: "brandModel", valueKey: "brandModel" },
  { key: "itemsIncluded", valueKey: "itemsIncluded" },
  { key: "condition", valueKey: "condition" },
  { key: "serialNo", valueKey: "serialNo" },
  { key: "memory", valueKey: "memory" },
  { key: "remarks", valueKey: "remarks" },
];

/** Customer / ticket fields that reflect New Pawn Transaction data onto MOA. */
const CUSTOMER_TICKET_FIELD_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "customerName", label: "Customer name" },
  { key: "customerAddress", label: "Customer address" },
  { key: "contactNo", label: "Contact no." },
  { key: "idPresented", label: "ID presented" },
  { key: "unitCode", label: "Unit code" },
  { key: "purchasedDate", label: "Purchased date" },
  { key: "maturityDate", label: "Maturity date" },
  { key: "expiryDate", label: "Expiry / grace date" },
  { key: "sellerName", label: "Seller name" },
];

const DEFAULT_FINANCIAL_FIELDS = FINANCIAL_FIELD_OPTIONS.map((field) => field.key);
const DEFAULT_UNIT_FIELDS = UNIT_FIELD_OPTIONS.map((field) => field.key);

type MoaTemplateVariant = {
  terms_text: string;
  labels: Record<string, string>;
  lineWidths: Record<string, number>;
  extensionRows: ExtensionRow[];
  financialFields: FinancialFieldKey[];
  unitFields: UnitFieldKey[];
  customFinancialFields: CustomMoaField[];
  customUnitFields: CustomMoaField[];
  /** Canvas layout for the active form (usually MOA). */
  design?: MoaDesignBlob;
  /** Per form-type designs (moa / redeem / buy_back). */
  document_designs?: Partial<Record<MoaDocumentType, MoaDesignBlob>>;
  /** Custom Templates-tab packs synced across branches. */
  component_templates?: MoaComponentTemplate[];
};

const DEFAULT_MOA_CATEGORY = "__default__";

const DEFAULT_TERMS_TEXT = `1. This Memorandum of agreement is renewable every TEN (10) days.
2. The Seller shall advise the Buyer of any change of address or mobile number.
3. This is not a PAWN; this is an extended purchase sale known as the buyback agreement.
4. ${BRAND_CONFIG.companyName} has the right to open the sealed item and put on display and dispose this item which way it desires without any further notice after the extension period expires (repurchased back).
5. ${BRAND_CONFIG.companyName} will not be held liable for any loss or damages on this item caused by long time non-usage, ACT of NATURE and any FORTUITOUS EVENTS that may occur without fault or negligence on its part during the storage period as long as the original signed seal and wrapping are untampered.
6. That the seller declares under the penalty of the anti-fencing law that he is the owner of the item(s) subject of the agreement and in no event will ${BRAND_CONFIG.companyName} be liable to any third-party claiming ownership of the item(s)
7. There are no FINANCE or INTEREST charges connected with this MOA.
8. In case of loss of this MOA, you are required to bring a valid id and notarized affidavit of loss during or before the buyback period expires.
9. Representative is required to bring one (1) valid id (seller) and letter of authorization from the owner (seller), and representative's valid id.`;

function normalizeMoaTerms(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length < 80) {
    return DEFAULT_TERMS_TEXT;
  }
  return trimmed;
}

const MOA_SETTINGS_PAPER_CLASS =
  "moa-print-page moa-paper-effect moa-settings-paper mx-auto w-full max-w-[816px] min-w-0 flex-none overflow-hidden border border-zinc-300 bg-white text-[9.5px] leading-normal text-zinc-800 shadow-md";

/** Scales the fixed legal-size MOA paper to fit mobile/tablet preview width. */
function MoaPaperScale({
  children,
  paperWidth = MOA_LEGAL_PAGE.screenWidthPx,
  paperHeight = MOA_LEGAL_PAGE.screenHeightPx,
  userZoom = 1,
}: {
  children: ReactNode;
  paperWidth?: number;
  paperHeight?: number;
  /** Extra zoom from Docs toolbar (1 = 100%). */
  userZoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth;
      if (available <= 0) return;
      setFitScale(Math.min(1, available / paperWidth));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paperWidth]);

  const scale = fitScale * userZoom;

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <div
        className="relative mx-auto"
        style={{
          width: paperWidth * scale,
          height: paperHeight * scale,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: paperWidth,
            height: paperHeight,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [activeTab, setActiveTab] = useState("Profile");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarToast, setAvatarToast] = useState<string | null>(null);
  const [profileToast, setProfileToast] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const [isMoaEditMode, setIsMoaEditMode] = useState(false);
  const [moaFields, setMoaFields] = useState({
    unitCode: "",
    purchasedDate: "",
    maturityDate1st: "",
    maturityDate2nd: "",
    maturityDate3rd: "",
    expiryDate: "",
    idsPresented: "",
    customerName: "",
    customerAddress: "",
    principalAmount: "",
    interestAmount: "",
    penaltyAmount: "",
    amount: "",
    storageFee: "",
    parkingFee: "",
    netProceeds: "",
    brandModel: "",
    itemsIncluded: "",
    condition: "",
    serialNo: "",
    memory: "",
    remarks: "",
    sellerName: "",
    representativeName: "",
  });
  const [topLabels, setTopLabels] = useState({
    originalCopy: "Original copy",
    moaTitle: "Memorandum of Agreement Slip",
    unitCode: "Unit Code:",
    purchasedDate: "Purchased Date:",
    idsPresented: "ID(s) Presented:",
    maturityDate: "Maturity Date:",
    expiryDate: "Expiry Date of Repurchase back:",
    customerIntro: "I Mr. /Mrs.",
    legalAgeResident: "of legal age and a resident of",
    agreementText:
      `agree to transfer and convey, by way of sale with a right to repurchase back the ownership over the following unit under ${BRAND_CONFIG.companyName} for THIRTY (30) days from the date of purchase. If I have repurchased the above unit, I shall pay the amount of`,
    repayIntro: "If I have repurchased the above unit, I shall pay the amount of",
    plusText: "plus",
    storageFeeText: "every 10 days as a storage fee. FAILURE to repurchase back or renew the storage fee within THIRTY (30) days, there will be a corresponding penalty amounting to",
    overdueText: "applies when overdue.",
    financialDetails: "Financial Details",
    unitDescription: "Unit Description",
    amount: "Amount:",
    storageFee: "Storage fee:",
    parkingFee: "Parking fee:",
    netProceeds: "Net Proceeds:",
    brandModel: "Brand and model:",
    itemsIncluded: "Items included:",
    condition: "Condition:",
    serialNo: "Serial No.:",
    memory: "Memory:",
    remarks: "Remarks:",
    dateHeader: "Date",
    storageHeader: "Storage",
    periodHeader: "Period",
    extendHeader: "Extend",
    signHeader: "Sign",
    adviseText:
      "SELLER IS ADVISED TO READ AND UNDERSTAND THE TERMS AND CONDITIONS ON THE REVERSE SIDE HEREOF",
    termsHeading: "TERMS AND CONDITIONS",
    termsPreamble: `You must be pledging to ${BRAND_CONFIG.companyName}, mobile phones, laptop computers, appliances, bike, motor vehicle and other electronic devices or other property or items, otherwise (individually, an "item"), or otherwise conducting business with ${BRAND_CONFIG.companyName}. You should have valid proofs of identity and should be voluntarily agreeing to be legally bound by these terms and conditions ${BRAND_CONFIG.companyName} may request documentation of other proof of compliance that you are the real owner of the item(s). You agree to and will identify and hold harmless ${BRAND_CONFIG.companyName} from and against any claims, suits, investigations, judgment, liabilities, obligations and damages relating to or arising out of the title to, ownership of or lien on any item sold or purported or arranged to be sold by you ${BRAND_CONFIG.companyName}. After the verification of your item(s), ${BRAND_CONFIG.companyName} will in its sole discretion, pay in cash that constitutes the payment for item(s) purchased by ${BRAND_CONFIG.companyName}. Upon receipt of cash from ${BRAND_CONFIG.companyName}, you will be legally bound by the sale transaction and you will not have the opportunity or right to rescind the transaction or repurchased your item(s) back from ${BRAND_CONFIG.companyName} without paying the purchased amount and storage fee for THIRTY (30) DAYS which run from the time you received the payment.`,
    sellerSignature: "(Name, signature and contact number of Seller)",
    authorizedText: "I HEREBY AUTHORIZED",
    representativeSignature: `(${BRAND_CONFIG.shortCompanyName} Representative)`,
    termsDeclaration:
      "I hereby declare that the item mentioned in front of this document are my personal property and free from any liens and encumbrances.",
    authorizedSubtext:
      "Whose name and signature appears below to repurchase my item(s) covered by this MOA in my behalf.",
    termsReceivedText:
      "Received the article(s) in the same condition when sold and repurchased back.",
    termsReceivedPresence:
      `(Signed in the presence of ${BRAND_CONFIG.companyName} owner/employee)`,
  });
  const [extensionRows, setExtensionRows] = useState<ExtensionRow[]>([
    { date: "", storage: "", period: "1st Period", periodValue: "", extend: "", sign: "" },
    { date: "", storage: "", period: "2nd Period", periodValue: "", extend: "", sign: "" },
    { date: "", storage: "", period: "3rd Period", periodValue: "", extend: "", sign: "" },
  ]);
  const [slipSectionOrder, setSlipSectionOrder] = useState<SlipSectionId[]>([...DEFAULT_SLIP_SECTION_ORDER]);
  const [moaDesignElements, setMoaDesignElements] = useState<MoaDesignElement[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [moaHistory, setMoaHistory] = useState<MoaDesignElement[][]>([]);
  const [moaFuture, setMoaFuture] = useState<MoaDesignElement[][]>([]);
  const moaClipboardRef = useRef<MoaDesignElement[]>([]);
  const [imageCropModeId, setImageCropModeId] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageReplaceTargetId, setImageReplaceTargetId] = useState<string | null>(null);
  const imageReplaceInputRef = useRef<HTMLInputElement>(null);
  /** Focus target after Ctrl+A so Delete / shortcuts work without textarea lag. */
  const moaCanvasFocusRef = useRef<HTMLDivElement>(null);
  const moaDesignElementsRef = useRef(moaDesignElements);
  moaDesignElementsRef.current = moaDesignElements;
  const selectedDesignIdsRef = useRef(selectedDesignIds);
  selectedDesignIdsRef.current = selectedDesignIds;
  const [moaDesignFontFamily, setMoaDesignFontFamily] = useState<string>(MOA_FONT_OPTIONS[0].value);
  const [moaDesignFontSize, setMoaDesignFontSize] = useState(11);
  const [moaDesignTextAlign, setMoaDesignTextAlign] = useState<MoaTextAlign>("left");
  const [moaDesignFontWeight, setMoaDesignFontWeight] = useState<"normal" | "bold">("normal");
  const [moaDesignFontStyle, setMoaDesignFontStyle] = useState<"normal" | "italic">("normal");
  const [moaDesignTextDecoration, setMoaDesignTextDecoration] = useState<"none" | "underline" | "line-through">("none");
  const [moaDesignColor, setMoaDesignColor] = useState("#18181b");
  const [moaDesignFill, setMoaDesignFill] = useState("transparent");
  const [moaDesignLineSpacing, setMoaDesignLineSpacing] = useState(DEFAULT_MOA_LINE_HEIGHT);
  const [moaSpellCheck, setMoaSpellCheck] = useState(true);
  const [moaZoom, setMoaZoom] = useState(100);
  const [moaMargins, setMoaMargins] = useState<MoaDocsMargins>(() =>
    defaultMarginsForPage("long"),
  );
  const moaImageInputRef = useRef<HTMLInputElement>(null);
  const [moaPageSizeId, setMoaPageSizeId] = useState<MoaPageSizeId>("long");
  const [moaPageCount, setMoaPageCount] = useState(1);
  const [moaDocumentType, setMoaDocumentType] = useState<MoaDocumentType>("moa");
  const [moaWatermark, setMoaWatermark] = useState<MoaWatermarkSettings>(() => ({
    enabled: DEFAULT_MOA_WATERMARK.enabled,
    items: DEFAULT_MOA_WATERMARK.items.map((item) => ({ ...item })),
  }));
  const [isPaletteDragging, setIsPaletteDragging] = useState(false);
  const [termsText, setTermsText] = useState(DEFAULT_TERMS_TEXT);
  const [financialFields, setFinancialFields] = useState<FinancialFieldKey[]>(DEFAULT_FINANCIAL_FIELDS);
  const [unitFields, setUnitFields] = useState<UnitFieldKey[]>(DEFAULT_UNIT_FIELDS);
  const [customFinancialFields, setCustomFinancialFields] = useState<CustomMoaField[]>([]);
  const [customUnitFields, setCustomUnitFields] = useState<CustomMoaField[]>([]);
  const [newFinancialField, setNewFinancialField] = useState("");
  const [newUnitField, setNewUnitField] = useState("");
  const [moaCategories, setMoaCategories] = useState<string[]>([]);
  const [selectedMoaCategory, setSelectedMoaCategory] = useState(DEFAULT_MOA_CATEGORY);
  const [defaultMoaTemplate, setDefaultMoaTemplate] = useState<MoaTemplateVariant | null>(null);
  const [categoryMoaTemplates, setCategoryMoaTemplates] = useState<Record<string, MoaTemplateVariant>>({});
  const [moaSavedAt, setMoaSavedAt] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [moaConfirm, setMoaConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    resolve: (ok: boolean) => void;
  } | null>(null);
  const requestMoaConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel: string;
  }) =>
    new Promise<boolean>((resolve) => {
      setMoaConfirm({ ...opts, resolve });
    });
  const [moaDirty, setMoaDirty] = useState(false);
  const [isSavingMoa, setIsSavingMoa] = useState(false);
  const initialTopLabelsRef = useRef(topLabels);
  const initialExtensionRowsRef = useRef(extensionRows);

  const [shopSettings, setShopSettings] = useState({
    shopName: BRAND_CONFIG.companyName,
    shopAddress: BRAND_CONFIG.address,
    phoneNumber: BRAND_CONFIG.phone ?? "",
    email: BRAND_CONFIG.email,
  });

  const [policies, setPolicies] = useState({
    interestRate: "3.5",
    pawnDuration: "30",
    gracePeriod: "3",
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  // Shop settings edit mode states
  const [isShopEditMode, setIsShopEditMode] = useState(false);
  const [tempShopSettings, setTempShopSettings] = useState({
    shopName: BRAND_CONFIG.companyName,
    shopAddress: BRAND_CONFIG.address,
    phoneNumber: BRAND_CONFIG.phone ?? "",
    email: BRAND_CONFIG.email,
  });

  const adminInitials = (profileFullName || user?.fullName || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (user) {
      setProfileFullName(user.fullName || "");
      setProfileEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    async function fetchMoaTemplate() {
      try {
        const data = await api.get<{
          terms_text: string;
          labels: Partial<typeof topLabels> | null;
          lineWidths?: Record<string, number>;
          extensionRows?: ExtensionRow[];
          financialFields?: FinancialFieldKey[];
          unitFields?: UnitFieldKey[];
          customFinancialFields?: CustomMoaField[];
          customUnitFields?: CustomMoaField[];
          category_templates?: Record<string, Partial<MoaTemplateVariant>>;
        }>(`/settings/moa_template`);
        if (data) {
          const loadedDefault: MoaTemplateVariant = {
            terms_text: normalizeMoaTerms(data.terms_text),
            labels: { ...initialTopLabelsRef.current, ...(data.labels ?? {}) },
            lineWidths: data.lineWidths ?? {},
            extensionRows: Array.isArray(data.extensionRows)
              ? data.extensionRows
              : initialExtensionRowsRef.current,
            financialFields: Array.isArray(data.financialFields)
              ? data.financialFields
              : DEFAULT_FINANCIAL_FIELDS,
            unitFields: Array.isArray(data.unitFields)
              ? data.unitFields
              : DEFAULT_UNIT_FIELDS,
            customFinancialFields: Array.isArray(data.customFinancialFields)
              ? data.customFinancialFields
              : [],
            customUnitFields: Array.isArray(data.customUnitFields)
              ? data.customUnitFields
              : [],
            design: normalizeMoaDesignBlob((data as { design?: unknown }).design) ?? undefined,
            document_designs: (() => {
              const raw = (data as { document_designs?: Record<string, unknown> }).document_designs;
              if (!raw || typeof raw !== "object") return undefined;
              const next: Partial<Record<MoaDocumentType, MoaDesignBlob>> = {};
              (["moa", "redeem", "buy_back", "renewal"] as MoaDocumentType[]).forEach((key) => {
                const normalized = normalizeMoaDesignBlob(raw[key]);
                if (normalized) next[key] = normalized;
              });
              return Object.keys(next).length > 0 ? next : undefined;
            })(),
            component_templates: Array.isArray(
              (data as { component_templates?: unknown }).component_templates,
            )
              ? ((data as { component_templates?: MoaComponentTemplate[] })
                  .component_templates as MoaComponentTemplate[])
              : undefined,
          };
          const loadedCategoryTemplates = Object.fromEntries(
            Object.entries(data.category_templates ?? {}).map(([category, template]) => [
              category,
              {
                terms_text: normalizeMoaTerms(template.terms_text ?? loadedDefault.terms_text),
                labels: { ...loadedDefault.labels, ...(template.labels ?? {}) },
                lineWidths: template.lineWidths ?? loadedDefault.lineWidths,
                extensionRows: Array.isArray(template.extensionRows)
                  ? template.extensionRows
                  : loadedDefault.extensionRows,
                financialFields: Array.isArray(template.financialFields)
                  ? template.financialFields
                  : loadedDefault.financialFields,
                unitFields: Array.isArray(template.unitFields)
                  ? template.unitFields
                  : loadedDefault.unitFields,
                customFinancialFields: Array.isArray(template.customFinancialFields)
                  ? template.customFinancialFields
                  : loadedDefault.customFinancialFields,
                customUnitFields: Array.isArray(template.customUnitFields)
                  ? template.customUnitFields
                  : loadedDefault.customUnitFields,
                design:
                  normalizeMoaDesignBlob((template as { design?: unknown }).design) ??
                  loadedDefault.design,
                document_designs:
                  (template as MoaTemplateVariant).document_designs ??
                  loadedDefault.document_designs,
              },
            ]),
          );

          setTermsText(loadedDefault.terms_text);
          setTopLabels((prev) => ({ ...prev, ...loadedDefault.labels }));
          setLineWidths(loadedDefault.lineWidths);
          setExtensionRows(loadedDefault.extensionRows);
          setFinancialFields(loadedDefault.financialFields);
          setUnitFields(loadedDefault.unitFields);
          setCustomFinancialFields(loadedDefault.customFinancialFields);
          setCustomUnitFields(loadedDefault.customUnitFields);
          setDefaultMoaTemplate(loadedDefault);
          setCategoryMoaTemplates(loadedCategoryTemplates);
          if (Array.isArray(loadedDefault.component_templates)) {
            saveCustomMoaComponentTemplates(
              loadedDefault.component_templates.filter((t) => t && !t.builtin),
            );
          }
          setMoaDirty(false);
        }
      } catch (error) {
        console.error("Failed to fetch MOA template:", error);
      }
    }
    async function loadMoaCategories() {
      const categories = await fetchCategories();
      setMoaCategories(categories.map((category) => category.name));
    }
    async function fetchSettings() {
      try {
        const data = await api.get<{ shopInfo: typeof shopSettings; policies: typeof policies }>('/settings/general');
        if (data) {
          if (data.shopInfo) {
            setShopSettings(data.shopInfo);
            setTempShopSettings(data.shopInfo);
          }
          if (data.policies) setPolicies(data.policies);
        }
      } catch {
        console.warn("Failed to fetch settings, using defaults.");
      }
    }
    fetchMoaTemplate();
    loadMoaCategories();
    fetchSettings();

    const handleCategoriesUpdated = () => {
      void loadMoaCategories();
    };
    window.addEventListener("categories-updated", handleCategoriesUpdated);
    return () => window.removeEventListener("categories-updated", handleCategoriesUpdated);
  }, []);

  const canEditMoa = isSuperAdmin && isMoaEditMode;
  const moaStorageKey = moaDesignStorageKey(moaDocumentType, selectedMoaCategory);
  const activeDocumentLabel =
    MOA_DOCUMENT_TYPES.find((item) => item.id === moaDocumentType)?.label ?? "MOA";

  useEffect(() => {
    setSlipSectionOrder(loadSlipSectionOrder(selectedMoaCategory));
    const template =
      selectedMoaCategory === DEFAULT_MOA_CATEGORY
        ? defaultMoaTemplate
        : categoryMoaTemplates[selectedMoaCategory] ?? defaultMoaTemplate;

    // Only apply API design into MOA form keys. Redeem / Buy back stay on
    // localStorage (or document_designs[type]) so API MOA design cannot wipe them.
    const fromDocDesigns =
      moaDocumentType !== "moa" && template?.document_designs?.[moaDocumentType]
        ? normalizeMoaDesignBlob(template.document_designs[moaDocumentType])
        : null;
    const fromApiMoa =
      moaDocumentType === "moa" && template?.design
        ? normalizeMoaDesignBlob(template.design)
        : null;
    const fromApi = fromDocDesigns ?? fromApiMoa;

    const fromLs = loadMoaDesignElements(moaStorageKey);
    if (fromApi && hasMoaDesign(fromApi)) {
      applyMoaDesign(fromApi, moaStorageKey);
      return;
    }
    if (fromLs.length > 0) {
      setMoaDesignElements(fromLs);
      setMoaPageSizeId(loadMoaPageSize(moaStorageKey));
      setMoaPageCount(loadMoaPageCount(moaStorageKey, fromLs));
      setMoaWatermark(loadMoaWatermark(moaStorageKey));
      setMoaMargins(loadMoaMargins(moaStorageKey, defaultMarginsForPage(loadMoaPageSize(moaStorageKey))));
      setSelectedDesignId(null);
      setSelectedDesignIds([]);
      setSelectedFieldIds([]);
      setMoaHistory([]);
      setMoaFuture([]);
      return;
    }
    applyMoaDesign(createDefaultMoaDesign(), moaStorageKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate when storage key / templates change
  }, [moaStorageKey, selectedMoaCategory, defaultMoaTemplate, categoryMoaTemplates, moaDocumentType]);

  const moaPageSize = MOA_PAGE_SIZES[moaPageSizeId];

  /** One scaled canvas + label — inner doc panel scrolls when page 2+ exists. */
  const moaCanvasScrollHeightPx = useMemo(() => {
    const scaledPage = Math.ceil(moaPageSize.screenHeightPx * (moaZoom / 100));
    const pageLabel = moaPageCount > 1 ? 28 : 0;
    return scaledPage + pageLabel + 32;
  }, [moaPageSize.screenHeightPx, moaZoom, moaPageCount]);

  const moaSampleFieldValues = useMemo(
    () => createSampleMoaFieldValues(shopSettings),
    [shopSettings],
  );

  const resolveMoaCanvasFieldValue = useCallback(
    (fieldKey: string) => resolveMoaFieldValue(fieldKey, moaSampleFieldValues),
    [moaSampleFieldValues],
  );

  const scrollMoaElementIntoView = useCallback((elementId: string) => {
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-moa-element-id="${elementId}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, []);

  const updateSlipSectionOrder = (next: SlipSectionId[]) => {
    setSlipSectionOrder(next);
    saveSlipSectionOrder(selectedMoaCategory, next);
  };

  const updateMoaDesignElements = (next: MoaDesignElement[], pushToHistory = true) => {
    if (pushToHistory) {
      setMoaHistory((prev) => [...prev, moaDesignElements]);
      setMoaFuture([]);
    }
    setMoaDesignElements(next);
    saveMoaDesignElements(moaStorageKey, next);
    setMoaDirty(true);
  };

  const handleUndo = () => {
    if (moaHistory.length === 0) return;
    const previous = moaHistory[moaHistory.length - 1];
    setMoaHistory((prev) => prev.slice(0, -1));
    setMoaFuture((prev) => [moaDesignElements, ...prev]);
    updateMoaDesignElements(previous, false);
  };

  const handleRedo = () => {
    if (moaFuture.length === 0) return;
    const nextState = moaFuture[0];
    setMoaFuture((prev) => prev.slice(1));
    setMoaHistory((prev) => [...prev, moaDesignElements]);
    updateMoaDesignElements(nextState, false);
  };

  const syncToolbarFromElement = (el: MoaDesignElement) => {
    setMoaDesignFontFamily(el.fontFamily);
    setMoaDesignFontSize(el.fontSize);
    setMoaDesignTextAlign(el.textAlign);
    setMoaDesignFontWeight(el.fontWeight);
    setMoaDesignFontStyle(el.fontStyle);
    setMoaDesignTextDecoration(el.textDecoration);
    setMoaDesignColor(el.color);
    setMoaDesignFill(el.fill || "transparent");
    setMoaDesignLineSpacing(el.lineHeight ?? DEFAULT_MOA_LINE_HEIGHT);
  };

  const handleDeleteSelected = () => {
    const ids = new Set(
      selectedDesignIdsRef.current.length > 0
        ? selectedDesignIdsRef.current
        : selectedDesignId
          ? [selectedDesignId]
          : [],
    );
    const fieldSet = new Set(selectedFieldIds);
    if (ids.size === 0 && fieldSet.size === 0) return;

    const elements = moaDesignElementsRef.current;
    updateMoaDesignElements(
      elements
        .map((el) => {
          if (ids.has(el.id) && el.fieldKey === MOA_PAGE_DOC_FIELD_KEY) {
            return { ...el, text: "" };
          }
          if (el.kind === "header" && fieldSet.size > 0 && ids.has(el.id)) {
            const remaining = el.headerFields.filter((field) => !fieldSet.has(field.id));
            if (fieldSet.size < el.headerFields.length) {
              return { ...el, headerFields: remaining };
            }
          }
          if (el.kind === "header" && fieldSet.size > 0 && !ids.has(el.id)) {
            return {
              ...el,
              headerFields: el.headerFields.filter((field) => !fieldSet.has(field.id)),
            };
          }
          return el;
        })
        .filter((el) => {
          if (!ids.has(el.id)) return true;
          if (el.fieldKey === MOA_PAGE_DOC_FIELD_KEY) return true;
          return false;
        }),
    );
    setSelectedDesignId(null);
    setSelectedDesignIds([]);
    setSelectedFieldIds([]);
  };

  const handleCopySelected = () => {
    const ids =
      selectedDesignIdsRef.current.length > 0
        ? selectedDesignIdsRef.current
        : selectedDesignId
          ? [selectedDesignId]
          : [];
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    moaClipboardRef.current = moaDesignElementsRef.current
      .filter((el) => idSet.has(el.id) && el.fieldKey !== MOA_PAGE_DOC_FIELD_KEY)
      .map((el) => ({
        ...el,
        headerFields: el.headerFields.map((hf) => ({ ...hf })),
      }));
  };

  const handleCutSelected = () => {
    handleCopySelected();
    handleDeleteSelected();
  };

  const handlePasteSelected = () => {
    const clips = moaClipboardRef.current;
    if (!clips.length) return;
    const stamp = Date.now();
    const pasted = clips.map((clip, index) => {
      const newId = `el-${stamp}-${index}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        ...clip,
        id: newId,
        x: clip.x + 16,
        y: clip.y + 16,
        headerFields: clip.headerFields.map((hf) => ({
          ...hf,
          id: `hf-${stamp}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      } satisfies MoaDesignElement;
    });
    updateMoaDesignElements([...moaDesignElementsRef.current, ...pasted]);
    setSelectedDesignIds(pasted.map((el) => el.id));
    setSelectedDesignId(pasted[0]?.id ?? null);
  };

  const handleDuplicateSelected = () => {
    const ids =
      selectedDesignIdsRef.current.length > 0
        ? selectedDesignIdsRef.current
        : selectedDesignId
          ? [selectedDesignId]
          : [];
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const stamp = Date.now();
    const dupes = moaDesignElementsRef.current
      .filter((el) => idSet.has(el.id) && el.fieldKey !== MOA_PAGE_DOC_FIELD_KEY)
      .map((el, index) => ({
        ...el,
        id: `el-${stamp}-d${index}-${Math.random().toString(36).slice(2, 7)}`,
        x: el.x + 16,
        y: el.y + 16,
        headerFields: el.headerFields.map((hf) => ({
          ...hf,
          id: `hf-${stamp}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      }));
    if (dupes.length === 0) return;
    updateMoaDesignElements([...moaDesignElementsRef.current, ...dupes]);
    setSelectedDesignIds(dupes.map((el) => el.id));
    setSelectedDesignId(dupes[0]?.id ?? null);
  };

  const handleSelectAllText = () => {
    if (!canEditMoa) return;
    const elements = moaDesignElementsRef.current;
    // Text surfaces only — skip shapes/images/tables (faster + matches "all text")
    const textElements = elements.filter(
      (el) =>
        el.fieldKey === MOA_PAGE_DOC_FIELD_KEY ||
        el.kind === "text" ||
        el.kind === "section" ||
        el.kind === "moaField" ||
        el.kind === "header" ||
        (el.kind === "body" && el.fieldKey !== MOA_PAGE_DOC_FIELD_KEY),
    );
    const ids = textElements.map((el) => el.id);
    // Do NOT select every header-field id (that caused ring lag). Header box
    // selection still styles/deletes all fields via applyToolbarToSelected / delete.
    setSelectedDesignIds(ids);
    setSelectedDesignId(ids[0] ?? null);
    setSelectedFieldIds([]);

    const first =
      textElements.find((el) => el.fieldKey === MOA_PAGE_DOC_FIELD_KEY) ??
      textElements[0];
    if (first) syncToolbarFromElement(first);

    // Blur only the active page-doc, then focus sentinel so Delete works instantly
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement && active.dataset.moaPageDoc === "true") {
      active.blur();
    }
    requestAnimationFrame(() => {
      moaCanvasFocusRef.current?.focus({ preventScroll: true });
    });
  };

  useMoaKeyboard({
    enabled: canEditMoa,
    canvasSelectionActive:
      selectedDesignIds.length > 0 ||
      Boolean(selectedDesignId) ||
      selectedFieldIds.length > 0,
    onDelete: handleDeleteSelected,
    onCopy: handleCopySelected,
    onCut: handleCutSelected,
    onPaste: handlePasteSelected,
    onDuplicate: handleDuplicateSelected,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectAll: handleSelectAllText,
    onClearSelection: () => {
      setSelectedDesignId(null);
      setSelectedDesignIds([]);
      setSelectedFieldIds([]);
    },
    onToggleBold: () => {
      applyDesignStylePatch({
        fontWeight: moaDesignFontWeight === "bold" ? "normal" : "bold",
      });
    },
    onToggleItalic: () => {
      applyDesignStylePatch({
        fontStyle: moaDesignFontStyle === "italic" ? "normal" : "italic",
      });
    },
    onToggleUnderline: () => {
      applyDesignStylePatch({
        textDecoration: moaDesignTextDecoration === "underline" ? "none" : "underline",
      });
    },
  });

  const handleMoaPageSizeChange = (id: MoaPageSizeId) => {
    setMoaPageSizeId(id);
    const nextMargins = defaultMarginsForPage(id);
    setMoaMargins(nextMargins);
    saveMoaMargins(moaStorageKey, nextMargins);
    saveMoaPageSize(moaStorageKey, id);
    setMoaDirty(true);
  };

  const handleMoaDocumentTypeChange = (nextType: MoaDocumentType) => {
    if (nextType === moaDocumentType) return;
    // Checkpoint current design into in-memory template before switching form.
    const checkpoint = getCurrentMoaTemplate();
    if (selectedMoaCategory === DEFAULT_MOA_CATEGORY) {
      setDefaultMoaTemplate(checkpoint);
    } else {
      setCategoryMoaTemplates((prev) => ({
        ...prev,
        [selectedMoaCategory]: checkpoint,
      }));
    }
    setMoaDocumentType(nextType);
    setSelectedDesignId(null);
    setMoaDirty(true);
  };

  const handleMoaWatermarkChange = (next: MoaWatermarkSettings) => {
    setMoaWatermark(next);
    saveMoaWatermark(moaStorageKey, next);
    setMoaDirty(true);
  };

  const handleAddMoaPage = () => {
    if (moaPageCount >= MAX_MOA_PAGES) return;
    const next = moaPageCount + 1;
    setMoaPageCount(next);
    saveMoaPageCount(moaStorageKey, next);
    // Scroll to the new page after paint
    requestAnimationFrame(() => {
      document
        .getElementById(`moa-canvas-page-${next - 1}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  /** When page document text overflows, keep fit on this page and continue on the next page. */
  const handlePaginatePageDoc = (fromPage: number, fitText: string, overflowText: string) => {
    if (!overflowText) return;
    const nextPage = fromPage + 1;
    if (nextPage >= MAX_MOA_PAGES) {
      // Cap: keep only what fits on the last allowed page.
      setMoaDesignElements((prev) => {
        const next = prev.map((el) =>
          (el.pageIndex ?? 0) === fromPage &&
          el.kind === "body" &&
          el.fieldKey === MOA_PAGE_DOC_FIELD_KEY
            ? { ...el, text: fitText }
            : el,
        );
        saveMoaDesignElements(moaStorageKey, next);
        return next;
      });
      return;
    }

    if (moaPageCount <= nextPage) {
      setMoaPageCount(nextPage + 1);
      saveMoaPageCount(moaStorageKey, nextPage + 1);
    }

    setMoaHistory((history) => [...history, moaDesignElements]);
    setMoaFuture([]);
    setMoaDesignElements((prev) => {
      let next = prev.map((el) =>
        (el.pageIndex ?? 0) === fromPage &&
        el.kind === "body" &&
        el.fieldKey === MOA_PAGE_DOC_FIELD_KEY
          ? { ...el, text: fitText }
          : el,
      );

      const nextDoc = next.find(
        (el) =>
          (el.pageIndex ?? 0) === nextPage &&
          el.kind === "body" &&
          el.fieldKey === MOA_PAGE_DOC_FIELD_KEY,
      );

      if (nextDoc) {
        next = next.map((el) =>
          el.id === nextDoc.id
            ? { ...el, text: `${overflowText}${el.text ? el.text : ""}` }
            : el,
        );
      } else {
        const created = {
          ...createMoaDesignElement("body", 8, 8, {
            fontFamily: moaDesignFontFamily,
            fontSize: moaDesignFontSize,
            pageIndex: nextPage,
          }),
          fieldKey: MOA_PAGE_DOC_FIELD_KEY,
          text: overflowText,
          fill: "transparent",
          stroke: "transparent",
          pageIndex: nextPage,
        };
        next = [...next, created];
      }

      saveMoaDesignElements(moaStorageKey, next);
      return next;
    });

    requestAnimationFrame(() => {
      const pageEl = document.getElementById(`moa-canvas-page-${nextPage}`);
      pageEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const ta = pageEl?.querySelector(
        "textarea[data-moa-page-doc]",
      ) as HTMLTextAreaElement | null;
      ta?.focus();
      const len = ta?.value.length ?? 0;
      ta?.setSelectionRange(len, len);
    });
  };

  const handleRemoveMoaPage = () => {
    if (moaPageCount <= 1) return;
    const lastIndex = moaPageCount - 1;
    const nextCount = moaPageCount - 1;
    const remaining = moaDesignElements.filter((el) => (el.pageIndex ?? 0) !== lastIndex);
    updateMoaDesignElements(remaining);
    setMoaPageCount(nextCount);
    saveMoaPageCount(moaStorageKey, nextCount);
    const selected = moaDesignElements.find((el) => el.id === selectedDesignId);
    if (selected && (selected.pageIndex ?? 0) === lastIndex) {
      setSelectedDesignId(null);
    }
  };

  const updatePageDesignElements = (pageIndex: number, nextPageElements: MoaDesignElement[]) => {
    const stamped = nextPageElements.map((el) => ({ ...el, pageIndex }));
    setMoaHistory((history) => [...history, moaDesignElements]);
    setMoaFuture([]);
    setMoaDesignElements((prev) => {
      const others = prev.filter((el) => (el.pageIndex ?? 0) !== pageIndex);
      const next = [...others, ...stamped];
      saveMoaDesignElements(moaStorageKey, next);
      return next;
    });
  };

  const applyDesignStylePatch = (patch: MoaTextStylePatch) => {
    if (patch.fontFamily !== undefined) setMoaDesignFontFamily(patch.fontFamily);
    if (patch.fontSize !== undefined) setMoaDesignFontSize(Number(patch.fontSize));
    if (patch.textAlign !== undefined) setMoaDesignTextAlign(patch.textAlign);
    if (patch.fontWeight !== undefined) setMoaDesignFontWeight(patch.fontWeight);
    if (patch.fontStyle !== undefined) setMoaDesignFontStyle(patch.fontStyle);
    if (patch.textDecoration !== undefined) setMoaDesignTextDecoration(patch.textDecoration);
    if (patch.color !== undefined) setMoaDesignColor(patch.color);
    if (patch.fill !== undefined) setMoaDesignFill(patch.fill);
    if (patch.lineHeight !== undefined) setMoaDesignLineSpacing(Number(patch.lineHeight));

    const ids =
      selectedDesignIds.length > 0
        ? selectedDesignIds
        : selectedDesignId
          ? [selectedDesignId]
          : [];
    const fieldIds = selectedFieldIds;
    if (fieldIds.length === 0 && ids.length === 0) return;

    const normalizedPatch: MoaTextStylePatch = {
      ...patch,
      ...(patch.fontSize !== undefined ? { fontSize: Number(patch.fontSize) } : {}),
      ...(patch.lineHeight !== undefined ? { lineHeight: Number(patch.lineHeight) } : {}),
      ...(patch.indent !== undefined
        ? { indent: Math.max(0, Math.min(8, Math.round(Number(patch.indent)))) }
        : {}),
    };

    setMoaHistory((history) => [...history, moaDesignElements]);
    setMoaFuture([]);
    setMoaDesignElements((prev) => {
      const next = applyToolbarToSelected(prev, selectedDesignId, normalizedPatch, {
        selectedIds: ids,
        selectedFieldIds: fieldIds,
      });
      saveMoaDesignElements(moaStorageKey, next);
      return next;
    });
  };

  const formatSelectedTextAsList = (kind: "bullet" | "number" | "check") => {
    const ids = new Set(
      selectedDesignIds.length > 0
        ? selectedDesignIds
        : selectedDesignId
          ? [selectedDesignId]
          : [],
    );
    if (ids.size === 0) return;

    const stripPrefix = (line: string) =>
      line.replace(/^\s*(?:[•\-☐☑]|\d+\.)\s+/, "");

    const applyList = (text: string) => {
      const lines = (text || "").split("\n");
      const stripped = lines.map(stripPrefix);
      const marker =
        kind === "bullet"
          ? (i: number) => `• ${stripped[i]}`
          : kind === "check"
            ? (i: number) => `☐ ${stripped[i]}`
            : (i: number) => `${i + 1}. ${stripped[i]}`;
      const already =
        kind === "bullet"
          ? lines.every((l) => !l.trim() || /^\s*[•\-]\s+/.test(l))
          : kind === "check"
            ? lines.every((l) => !l.trim() || /^\s*[☐☑]\s+/.test(l))
            : lines.every((l) => !l.trim() || /^\s*\d+\.\s+/.test(l));
      if (already) return stripped.join("\n");
      return stripped.map((line, i) => (line.trim() ? marker(i) : line)).join("\n");
    };

    updateMoaDesignElements(
      moaDesignElements.map((el) => {
        if (!ids.has(el.id)) return el;
        if (
          el.fieldKey === MOA_PAGE_DOC_FIELD_KEY ||
          el.kind === "text" ||
          el.kind === "section" ||
          el.kind === "body" ||
          el.kind === "moaField"
        ) {
          return { ...el, text: applyList(el.text) };
        }
        return el;
      }),
    );
  };

  const handleInsertLink = () => {
    if (!canEditMoa) return;
    const url = window.prompt("Enter link URL", "https://");
    if (!url?.trim()) return;
    const pageIndex =
      moaDesignElements.find((el) => el.id === selectedDesignId)?.pageIndex ?? 0;
    const next = createMoaDesignElement("text", 48, 120, {
      pageIndex,
      fontFamily: moaDesignFontFamily,
      fontSize: moaDesignFontSize,
    });
    next.text = url.trim();
    next.color = "#1a73e8";
    next.textDecoration = "underline";
    next.width = Math.min(420, Math.max(160, url.trim().length * 7));
    updateMoaDesignElements([...moaDesignElements, next]);
    setSelectedDesignId(next.id);
    setSelectedDesignIds([next.id]);
  };

  const handleInsertQr = () => {
    if (!canEditMoa) return;
    const data = window.prompt("QR code content (URL or text)", "https://");
    if (!data?.trim()) return;
    const pageIndex =
      moaDesignElements.find((el) => el.id === selectedDesignId)?.pageIndex ?? 0;
    const next = createMoaDesignElement("photo", 48, 120, {
      pageIndex,
      photoAspect: "square",
    });
    next.width = 140;
    next.height = 140;
    next.text = "QR";
    next.imageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(data.trim())}`;
    updateMoaDesignElements([...moaDesignElements, next]);
    setSelectedDesignId(next.id);
    setSelectedDesignIds([next.id]);
  };

  const handleDesignFontFamilyChange = (value: string) => {
    applyDesignStylePatch({ fontFamily: value });
  };

  const handleDesignFontSizeChange = (value: number) => {
    applyDesignStylePatch({ fontSize: value });
  };

  const syncToolbarFromSelection = (
    elementId: string | null,
    fieldIds: string[],
  ) => {
    if (!elementId) return;
    const selected = moaDesignElements.find((el) => el.id === elementId);
    if (!selected) return;
    if (fieldIds.length > 0 && selected.kind === "header") {
      const field = selected.headerFields.find((item) => item.id === fieldIds[0]);
      if (field) {
        setMoaDesignFontFamily(field.fontFamily ?? selected.fontFamily);
        setMoaDesignFontSize(field.fontSize ?? selected.fontSize);
        setMoaDesignTextAlign(field.textAlign ?? selected.textAlign);
        setMoaDesignFontWeight(field.fontWeight ?? selected.fontWeight);
        setMoaDesignFontStyle(field.fontStyle ?? selected.fontStyle);
        setMoaDesignTextDecoration(field.textDecoration ?? selected.textDecoration);
        setMoaDesignColor(field.color ?? selected.color);
        setMoaDesignFill(selected.fill || "transparent");
        return;
      }
    }
    setMoaDesignFontFamily(selected.fontFamily);
    setMoaDesignFontSize(selected.fontSize);
    setMoaDesignTextAlign(selected.textAlign);
    setMoaDesignFontWeight(selected.fontWeight);
    setMoaDesignFontStyle(selected.fontStyle);
    setMoaDesignTextDecoration(selected.textDecoration);
    setMoaDesignColor(selected.color);
    setMoaDesignFill(selected.fill || "transparent");
    setMoaDesignLineSpacing(selected.lineHeight ?? DEFAULT_MOA_LINE_HEIGHT);
  };

  const handleSelectDesignElement = (id: string | null) => {
    setSelectedDesignId(id);
    if (!id) {
      setSelectedDesignIds([]);
      setSelectedFieldIds([]);
      return;
    }
    // Preserve multi-select (marquee / Ctrl+A) when onSelect(firstId) follows
    // onSelectedIdsChange(allIds). Plain click on a new id collapses to one.
    setSelectedDesignIds((prev) =>
      prev.length > 1 && prev.includes(id) ? prev : [id],
    );
  };

  const handleSelectedIdsChange = (ids: string[]) => {
    setSelectedDesignIds(ids);
    setSelectedDesignId(ids[0] ?? null);
    // Element-level selection clears header-field picks (field handlers re-set after).
    setSelectedFieldIds([]);
    if (ids[0]) syncToolbarFromSelection(ids[0], []);
  };

  const handleSelectedFieldIdsChange = (ids: string[]) => {
    setSelectedFieldIds(ids);
    const headerId =
      selectedDesignId ??
      moaDesignElements.find(
        (el) =>
          el.kind === "header" && el.headerFields.some((field) => ids.includes(field.id)),
      )?.id ??
      null;
    if (headerId) {
      setSelectedDesignId(headerId);
      setSelectedDesignIds([headerId]);
      syncToolbarFromSelection(headerId, ids);
    }
  };

  const handleInsertSelectedImage = () => {
    if (!selectedDesignId || !canEditMoa) return;
    moaImageInputRef.current?.click();
  };

  const handleClearSelectedImage = () => {
    if (!selectedDesignId || !canEditMoa) return;
    updateMoaDesignElements(
      moaDesignElements.map((el) =>
        el.id === selectedDesignId ? { ...el, imageSrc: undefined } : el,
      ),
    );
  };

  const selectedDesignElement = selectedDesignId
    ? moaDesignElements.find((el) => el.id === selectedDesignId) ?? null
    : null;

  const handleAddHeaderField = (key: MoaHeaderFieldKey) => {
    if (!selectedDesignId) return;
    const selected = moaDesignElements.find((el) => el.id === selectedDesignId);
    if (!selected || selected.kind !== "header") return;
    if (selected.headerFields.some((field) => field.key === key)) return;
    const size =
      key === "shopAddress"
        ? { width: 380, height: 36 }
        : key === "shopName"
          ? { width: 320, height: 24 }
          : { width: 180, height: 22 };
    updateMoaDesignElements(
      moaDesignElements.map((el) =>
        el.id === selectedDesignId
          ? {
            ...el,
            headerFields: [
              ...el.headerFields,
              {
                id: `hf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                key,
                x: 8,
                y:
                  el.headerFields.length === 0
                    ? 8
                    : Math.max(
                        ...el.headerFields.map((field) => field.y + (field.height || 22)),
                      ) + 6,
                width: size.width,
                height: size.height,
              },
            ],
          }
          : el,
      ),
    );
  };

  const handleAddPaletteElement = (
    kind: MoaPaletteItemKind,
    options?: MoaElementCreateOptions,
  ) => {
    if (!canEditMoa) return;
    const selected = selectedDesignId
      ? moaDesignElements.find((el) => el.id === selectedDesignId)
      : null;
    const pageIndex = selected?.pageIndex ?? 0;
    const offset = moaDesignElements.filter((el) => (el.pageIndex ?? 0) === pageIndex).length;
    const next = createMoaDesignElement(kind, 32 + (offset % 5) * 16, 100 + (offset % 6) * 18, {
      fontFamily: moaDesignFontFamily,
      fontSize: moaDesignFontSize,
      pageIndex,
      ...options,
    });
    updateMoaDesignElements([...moaDesignElements, next]);
    setSelectedDesignId(next.id);
    setSelectedDesignIds([next.id]);
    setSelectedFieldIds([]);
  };

  const handleInsertConfigField = (payload: MoaConfigFieldPayload) => {
    if (!canEditMoa) return;
    const selected = selectedDesignId
      ? moaDesignElements.find((el) => el.id === selectedDesignId)
      : null;
    const pageIndex = selected?.pageIndex ?? 0;
    const existingOnPage = moaDesignElements.filter(
      (el) => (el.pageIndex ?? 0) === pageIndex,
    ).length;
    const next = {
      ...createMoaConfigFieldElement(
        payload,
        40 + (existingOnPage % 5) * 16,
        320 + (existingOnPage % 6) * 28,
        {
          fontFamily: moaDesignFontFamily,
          fontSize: moaDesignFontSize,
        },
      ),
      pageIndex,
    };
    updateMoaDesignElements([...moaDesignElements, next]);
    setSelectedDesignId(next.id);
    setSelectedDesignIds([next.id]);
    setSelectedFieldIds([]);
    scrollMoaElementIntoView(next.id);
  };

  const handleInsertAllJewelryFields = () => {
    if (!canEditMoa) return;
    const selected = selectedDesignId
      ? moaDesignElements.find((el) => el.id === selectedDesignId)
      : null;
    const pageIndex = selected?.pageIndex ?? 0;
    const layout = jewelryFieldInsertLayout();
    const newElements = layout.map((field) => ({
      ...createMoaConfigFieldElement(
        { key: field.key, label: field.label },
        field.x,
        field.y,
        {
          fontFamily: moaDesignFontFamily,
          fontSize: moaDesignFontSize,
        },
      ),
      pageIndex,
    }));
    updateMoaDesignElements([...moaDesignElements, ...newElements]);
    const last = newElements[newElements.length - 1];
    setSelectedDesignId(last.id);
    setSelectedDesignIds([last.id]);
    setSelectedFieldIds([]);
    scrollMoaElementIntoView(newElements[0].id);
  };

  const reorderFinancialFields = (nextIds: string[]) => {
    setFinancialFields(nextIds as FinancialFieldKey[]);
  };

  const reorderUnitFields = (nextIds: string[]) => {
    setUnitFields(nextIds as UnitFieldKey[]);
  };

  const reorderCustomFinancialFields = (nextIds: string[]) => {
    setCustomFinancialFields((fields) => {
      const byId = new Map(fields.map((field) => [field.id, field]));
      return nextIds.map((id) => byId.get(id)).filter(Boolean) as CustomMoaField[];
    });
  };

  const reorderCustomUnitFields = (nextIds: string[]) => {
    setCustomUnitFields((fields) => {
      const byId = new Map(fields.map((field) => [field.id, field]));
      return nextIds.map((id) => byId.get(id)).filter(Boolean) as CustomMoaField[];
    });
  };
  const resolvedTermsText = normalizeMoaTerms(termsText);

  // Uncontrolled refs for terms editors — avoids cursor-jump on every keystroke
  const termsRef = useRef<HTMLDivElement>(null);
  const termsPreambleRef = useRef<HTMLDivElement>(null);
  const termsEditingRef = useRef(false);
  const termsPreambleEditingRef = useRef(false);

  const syncTermsEditorFromState = () => {
    if (termsRef.current && !termsEditingRef.current) {
      termsRef.current.innerText = normalizeMoaTerms(termsText);
    }
    if (termsPreambleRef.current && !termsPreambleEditingRef.current) {
      termsPreambleRef.current.innerText = topLabels.termsPreamble;
    }
  };

  useEffect(() => {
    syncTermsEditorFromState();
  }, [activeTab, selectedMoaCategory, termsText, topLabels.termsPreamble]);

  // Line widths state — keyed by fieldKey, persisted with MOA template save
  const [lineWidths, setLineWidths] = useState<Record<string, number>>({});
  const handleWidthChange = (key: string, width: number) => {
    setLineWidths((prev) => ({ ...prev, [key]: width }));
  };

  const RL = (fieldKey: string, value: string, onChange: (v: string) => void, defaultWidth = 120) => (
    <ResizableLine
      fieldKey={fieldKey}
      value={value}
      onChange={onChange}
      storedWidth={lineWidths[fieldKey]}
      onWidthChange={handleWidthChange}
      canEdit={canEditMoa}
      defaultWidth={defaultWidth}
    />
  );

  const CL = (fieldKey: string, value: string, defaultWidth = 120) => (
    <span
      className="inline-flex items-end justify-center border-b border-zinc-400 align-bottom mx-0.5 px-0.5 leading-none overflow-hidden"
      style={{
        width: lineWidths[fieldKey] ?? defaultWidth,
        height: '12px',
        minWidth: 48,
      }}
    >
      <span className="truncate text-[9px] m-0 p-0">{value}</span>
    </span>
  );

  const updateMoaField = (field: keyof typeof moaFields, value: string) => {
    setMoaFields((prev) => ({ ...prev, [field]: value }));
  };

  const updateTopLabel = (field: keyof typeof topLabels, value: string) => {
    setTopLabels((prev) => ({ ...prev, [field]: value }));
  };

  const updateExtensionRow = (
    index: number,
    field: keyof ExtensionRow,
    value: string,
  ) => {
    setExtensionRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const getCurrentMoaDesign = (): MoaDesignBlob => ({
    elements: moaDesignElements.map((el) => ({
      ...el,
      headerFields: el.headerFields.map((field) => ({ ...field })),
    })),
    pageSizeId: moaPageSizeId,
    pageCount: moaPageCount,
    watermark: {
      enabled: moaWatermark.enabled,
      items: moaWatermark.items.map((item) => ({ ...item })),
    },
    margins: { ...moaMargins },
  });

  const applyMoaDesign = (
    raw: MoaDesignBlob | null | undefined,
    storageKey = moaStorageKey,
  ) => {
    const design =
      raw && hasMoaDesign(raw)
        ? cloneMoaDesignBlob(raw)
        : createDefaultMoaDesign();
    setMoaDesignElements(design.elements);
    setMoaPageSizeId(design.pageSizeId);
    setMoaPageCount(design.pageCount);
    setMoaWatermark(design.watermark);
    setMoaMargins(design.margins);
    saveMoaDesignElements(storageKey, design.elements);
    saveMoaPageSize(storageKey, design.pageSizeId);
    saveMoaPageCount(storageKey, design.pageCount);
    saveMoaWatermark(storageKey, design.watermark);
    saveMoaMargins(storageKey, design.margins);
    setSelectedDesignId(null);
    setSelectedDesignIds([]);
    setSelectedFieldIds([]);
    setMoaHistory([]);
    setMoaFuture([]);
  };

  const handlePrintMoaDesign = async () => {
    const design = getCurrentMoaDesign();
    if (!hasMoaDesign(design)) {
      alert("Add layout elements on the canvas before printing, or use the eye preview.");
      return;
    }

    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;left:-12000px;top:0;width:auto;height:auto;opacity:0;pointer-events:none;";
    document.body.appendChild(host);

    const root = createRoot(host);
    const values = createSampleMoaFieldValues(shopSettings);

    try {
      await new Promise<void>((resolve) => {
        root.render(
          <div id="moa-slip-printable" className="moa-paper-effect bg-white text-zinc-800">
            <MoaDesignPrintPages design={design} values={values} />
          </div>,
        );
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      const printable = host.querySelector("#moa-slip-printable");
      if (!printable) {
        throw new Error("Printable MOA was not rendered");
      }
      await printMoaSlipDocument(printable.outerHTML, {
        pageSizeId: design.pageSizeId,
      });
    } catch (error) {
      console.error("MOA design print failed:", error);
      alert("Failed to print MOA design. Try Preview, then print from there.");
    } finally {
      root.unmount();
      host.remove();
    }
  };

  const handleApplyTemplatePack = (template: MoaComponentTemplate) => {
    if (!canEditMoa) return;
    const pageIndex =
      moaDesignElements.find((el) => el.id === selectedDesignId)?.pageIndex ?? 0;
    const placed = placePackOnPage(
      template.elements,
      moaDesignElements,
      pageIndex,
    );
    updateMoaDesignElements([...moaDesignElements, ...placed]);
    if (placed[0]) {
      setSelectedDesignId(placed[0].id);
      setSelectedDesignIds(placed.map((el) => el.id));
    }
  };

  const handleApplyTemplateFull = (template: MoaComponentTemplate) => {
    if (!canEditMoa) return;
    applyMoaDesign(templateToDesignBlob(template));
  };

  const getCurrentMoaTemplate = (): MoaTemplateVariant => {
    const currentDesign = getCurrentMoaDesign();
    const baseTemplate =
      selectedMoaCategory === DEFAULT_MOA_CATEGORY
        ? defaultMoaTemplate
        : categoryMoaTemplates[selectedMoaCategory] ?? defaultMoaTemplate;
    const prevDocs = baseTemplate?.document_designs ?? {};
    const document_designs: Partial<Record<MoaDocumentType, MoaDesignBlob>> = {
      ...prevDocs,
      [moaDocumentType]: cloneMoaDesignBlob(currentDesign),
    };
    if (!document_designs.moa && moaDocumentType !== "moa" && baseTemplate?.design) {
      document_designs.moa = cloneMoaDesignBlob(baseTemplate.design);
    }

    return {
      terms_text: resolvedTermsText,
      labels: { ...topLabels },
      lineWidths: { ...lineWidths },
      extensionRows: extensionRows.map((row) => ({ ...row })),
      financialFields: [...financialFields],
      unitFields: [...unitFields],
      customFinancialFields: customFinancialFields.map((field) => ({ ...field })),
      customUnitFields: customUnitFields.map((field) => ({ ...field })),
      design:
        moaDocumentType === "moa"
          ? currentDesign
          : document_designs.moa
            ? cloneMoaDesignBlob(document_designs.moa)
            : currentDesign,
      document_designs,
      component_templates: loadCustomMoaComponentTemplates(),
    };
  };

  const applyMoaTemplate = (
    template: MoaTemplateVariant,
    storageKey = moaStorageKey,
  ) => {
    setTermsText(normalizeMoaTerms(template.terms_text));
    setTopLabels((prev) => ({ ...prev, ...template.labels }));
    setLineWidths({ ...template.lineWidths });
    setExtensionRows(template.extensionRows.map((row) => ({ ...row })));
    setFinancialFields([...template.financialFields]);
    setUnitFields([...template.unitFields]);
    setCustomFinancialFields(template.customFinancialFields.map((field) => ({ ...field })));
    setCustomUnitFields(template.customUnitFields.map((field) => ({ ...field })));
    setNewFinancialField("");
    setNewUnitField("");
    const designForForm =
      moaDocumentType === "moa"
        ? template.design
        : template.document_designs?.[moaDocumentType] ?? null;
    applyMoaDesign(designForForm, storageKey);
  };

  const toggleMoaSectionField = <T extends string>(
    field: T,
    fields: T[],
    setFields: (next: T[]) => void,
  ) => {
    setFields(
      fields.includes(field)
        ? fields.filter((currentField) => currentField !== field)
        : [...fields, field],
    );
  };

  const addCustomMoaField = (
    label: string,
    setLabel: (value: string) => void,
    setFields: React.Dispatch<React.SetStateAction<CustomMoaField[]>>,
  ) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    setFields((fields) => [
      ...fields,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: trimmedLabel,
      },
    ]);
    setLabel("");
  };

  const handleMoaCategoryChange = (nextCategory: string) => {
    const currentTemplate = getCurrentMoaTemplate();
    const nextCategoryTemplates = { ...categoryMoaTemplates };
    let nextDefaultTemplate = defaultMoaTemplate ?? currentTemplate;

    if (selectedMoaCategory === DEFAULT_MOA_CATEGORY) {
      nextDefaultTemplate = currentTemplate;
      setDefaultMoaTemplate(currentTemplate);
    } else {
      nextCategoryTemplates[selectedMoaCategory] = currentTemplate;
      setCategoryMoaTemplates(nextCategoryTemplates);
    }

    const nextTemplate =
      nextCategory === DEFAULT_MOA_CATEGORY
        ? nextDefaultTemplate
        : nextCategoryTemplates[nextCategory] ?? nextDefaultTemplate;

    setSelectedMoaCategory(nextCategory);
    applyMoaTemplate(
      nextTemplate,
      moaDesignStorageKey(moaDocumentType, nextCategory),
    );
  };

  useEffect(() => {
    if (
      selectedMoaCategory !== DEFAULT_MOA_CATEGORY
      || moaCategories.length === 0
      || !defaultMoaTemplate
    ) {
      return;
    }

    const firstCategory = moaCategories[0];
    setSelectedMoaCategory(firstCategory);
    applyMoaTemplate(categoryMoaTemplates[firstCategory] ?? defaultMoaTemplate);
  }, [
    categoryMoaTemplates,
    defaultMoaTemplate,
    moaCategories,
    selectedMoaCategory,
  ]);

  const handleApplyMoaToAllCategories = async () => {
    if (!canEditMoa || moaCategories.length === 0) return;
    const okApplyAll = await requestMoaConfirm({
      title: "Apply to all categories",
      message:
        "Apply the current template (including canvas design) to ALL categories, then save?",
      confirmLabel: "Apply & save",
    });
    if (!okApplyAll) return;

    const currentTemplate = getCurrentMoaTemplate();
    const templatesForAllCategories = Object.fromEntries(
      moaCategories.map((category) => [
        category,
        {
          ...currentTemplate,
          labels: { ...currentTemplate.labels },
          lineWidths: { ...currentTemplate.lineWidths },
          extensionRows: currentTemplate.extensionRows.map((row) => ({ ...row })),
          financialFields: [...currentTemplate.financialFields],
          unitFields: [...currentTemplate.unitFields],
          customFinancialFields: currentTemplate.customFinancialFields.map((field) => ({ ...field })),
          customUnitFields: currentTemplate.customUnitFields.map((field) => ({ ...field })),
          design: currentTemplate.design
            ? cloneMoaDesignBlob(currentTemplate.design)
            : createDefaultMoaDesign(),
          document_designs: currentTemplate.document_designs
            ? Object.fromEntries(
                Object.entries(currentTemplate.document_designs).map(([key, value]) => [
                  key,
                  value ? cloneMoaDesignBlob(value) : value,
                ]),
              )
            : undefined,
        },
      ]),
    );

    setCategoryMoaTemplates(templatesForAllCategories);
    setDefaultMoaTemplate(currentTemplate);
    setMoaDirty(true);
    await handleSaveMoa(currentTemplate, templatesForAllCategories);
  };

  const handleTempShopSettingChange = (field: keyof typeof shopSettings, value: string) => {
    setTempShopSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelShopEdit = () => {
    setIsShopEditMode(false);
    setTempShopSettings(shopSettings);
  };

  const handleSaveShopEdit = async () => {
    if (!isSuperAdmin) {
      alert("Only Super Admins can save these settings.");
      return;
    }
    setIsSavingSettings(true);
    try {
      await api.post('/settings/general', { shopInfo: tempShopSettings, policies });
      setShopSettings(tempShopSettings);
      setIsShopEditMode(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileToast(null);
    try {
      await api.patch("/auth/profile", { fullName: profileFullName });
      await refreshProfile();
      setProfileToast("Profile updated successfully.");
      setTimeout(() => setProfileToast(null), 3000);
    } catch (error) {
      setProfileToast(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDiscardProfile = () => {
    setProfileFullName(user?.fullName || "");
    setProfileEmail(user?.email || "");
    setProfileToast(null);
  };

  const handleSaveMoa = async (
    overrideCurrent?: MoaTemplateVariant,
    overrideCategoryTemplates?: Record<string, MoaTemplateVariant>,
  ) => {
    try {
      const currentTemplate = overrideCurrent ?? getCurrentMoaTemplate();
      if (!hasMoaDesign(currentTemplate.design) && moaDocumentType === "moa") {
        const ok = await requestMoaConfirm({
          title: "Empty canvas design",
          message:
            "Canvas design is empty. Save anyway? New Pawn will fall back to the classic slip.",
          confirmLabel: "Save anyway",
        });
        if (!ok) return;
      }

      setIsSavingMoa(true);
      const nextDefaultTemplate =
        selectedMoaCategory === DEFAULT_MOA_CATEGORY
          ? currentTemplate
          : defaultMoaTemplate ?? currentTemplate;
      const nextCategoryTemplates = overrideCategoryTemplates ?? {
        ...categoryMoaTemplates,
        ...(selectedMoaCategory === DEFAULT_MOA_CATEGORY
          ? {}
          : { [selectedMoaCategory]: currentTemplate }),
      };

      await api.post(`/settings/moa_template`, {
        ...nextDefaultTemplate,
        category_templates: nextCategoryTemplates,
        component_templates: loadCustomMoaComponentTemplates(),
      });
      setDefaultMoaTemplate(nextDefaultTemplate);
      setCategoryMoaTemplates(nextCategoryTemplates);
      setMoaSavedAt(new Date().toLocaleString());
      setMoaDirty(false);
      window.dispatchEvent(new CustomEvent("moa-template-updated"));
    } catch (error) {
      console.error("Failed to save MOA template:", error);
      alert("Failed to save MOA template. Please try again.");
    } finally {
      setIsSavingMoa(false);
    }
  };

  const handleSendToAllBranches = async () => {
    if (!isSuperAdmin) return;
    if (moaDirty) {
      const ok = await requestMoaConfirm({
        title: "Unsaved changes",
        message: "You have unsaved MOA changes. Save and send to all branches now?",
        confirmLabel: "Save & send",
      });
      if (!ok) return;
    }
    setSendStatus("sending");
    try {
      const currentTemplate = getCurrentMoaTemplate();
      if (!hasMoaDesign(currentTemplate.design) && moaDocumentType === "moa") {
        const ok = await requestMoaConfirm({
          title: "Empty canvas design",
          message:
            "Canvas design is empty. Send anyway? Branches will fall back to the classic slip.",
          confirmLabel: "Send anyway",
        });
        if (!ok) {
          setSendStatus("idle");
          return;
        }
      }
      const nextDefaultTemplate =
        selectedMoaCategory === DEFAULT_MOA_CATEGORY
          ? currentTemplate
          : defaultMoaTemplate ?? currentTemplate;
      const nextCategoryTemplates = {
        ...categoryMoaTemplates,
        ...(selectedMoaCategory === DEFAULT_MOA_CATEGORY
          ? {}
          : { [selectedMoaCategory]: currentTemplate }),
      };

      await api.post(`/settings/moa_template`, {
        ...nextDefaultTemplate,
        category_templates: nextCategoryTemplates,
        component_templates: loadCustomMoaComponentTemplates(),
        broadcastToAllEnvironments: true,
      });

      setDefaultMoaTemplate(nextDefaultTemplate);
      setCategoryMoaTemplates(nextCategoryTemplates);
      setMoaSavedAt(new Date().toLocaleString());
      setMoaDirty(false);
      setSendStatus("sent");
      window.dispatchEvent(new CustomEvent("moa-template-updated"));
      setTimeout(() => setSendStatus("idle"), 2500);
    } catch (error) {
      console.error("Failed to send to all branches:", error);
      setSendStatus("idle");
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to send to all branches. Your changes might not have been saved.";
      alert(message);
    }
  };

  const handleSaveAvatar = async (avatarDataUrl: string) => {
    setIsSavingAvatar(true);

    try {
      await api.patch("/auth/profile", { avatarUrl: avatarDataUrl });
      await refreshProfile();
      setIsAvatarModalOpen(false);
      setAvatarToast("Avatar updated successfully.");
      setTimeout(() => setAvatarToast(null), 2500);
    } catch (error) {
      console.error("Failed to update avatar:", error);
      setAvatarToast("Failed to update avatar.");
      setTimeout(() => setAvatarToast(null), 3000);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const renderEditableLabel = (
    field: keyof typeof topLabels,
    className: string,
    keySuffix = "",
  ) => {
    const isInline = className.split(" ").includes("inline");
    const hasExplicitWidth = className.split(" ").some((c) => /^w-/.test(c));
    const sanitizedClassName = className
      .split(" ")
      .filter((part) => part !== "inline")
      .join(" ");
    const fieldKey = `${selectedMoaCategory}-${String(field)}${keySuffix}`;

    if (isInline) {
      return (
        <span
          key={fieldKey}
          contentEditable={canEditMoa}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (canEditMoa) updateTopLabel(field, e.currentTarget.textContent || "");
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className={`${sanitizedClassName} inline outline-none ${canEditMoa ? "border-b border-dashed border-brand-green/60 bg-brand-green/5 cursor-text" : ""}`}
        >
          {topLabels[field]}
        </span>
      );
    }

    return (
      <input
        key={fieldKey}
        value={topLabels[field]}
        onChange={(e) => updateTopLabel(field, e.target.value)}
        readOnly={!canEditMoa}
        tabIndex={canEditMoa ? 0 : -1}
        spellCheck={false}
        className={`${sanitizedClassName} ${hasExplicitWidth ? "block shrink-0" : "block w-full"} border-none bg-transparent p-0 text-inherit outline-none ${!canEditMoa ? "pointer-events-none" : "hover:bg-brand-green/5 focus:bg-brand-green/10"}`}
      />
    );
  };

  const renderShopHeader = (editable: boolean) => (
    <div className="text-center space-y-0.5 pb-1 border-b border-zinc-300">
      <p className="text-[12px] font-extrabold uppercase text-zinc-950 tracking-wider">
        {shopSettings.shopName}
      </p>
      {shopSettings.shopAddress && (
        <p className="text-[7.5px] text-zinc-500 font-bold leading-tight">{shopSettings.shopAddress}</p>
      )}
      {shopSettings.phoneNumber && (
        <p className="text-[7.5px] text-zinc-500 font-bold leading-tight">{shopSettings.phoneNumber}</p>
      )}
      {editable && canEditMoa && (
        <p className="pt-0.5 text-[7px] font-semibold uppercase tracking-wide text-sky-600">
          Drag header to move
        </p>
      )}
    </div>
  );

  const renderFinancialColumn = (editable: boolean) => {
    const ordered = financialFields
      .map((key) => FINANCIAL_FIELD_OPTIONS.find((field) => field.key === key))
      .filter(Boolean) as typeof FINANCIAL_FIELD_OPTIONS;

    if (!editable || !canEditMoa) {
      return (
        <div className="space-y-1">
          {ordered.map((field) => (
            <div key={field.key} className="space-y-0.5">
              <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                <span className="font-semibold text-zinc-500 uppercase text-[8px]">
                  {topLabels[field.key]}
                </span>
                {CL(field.key, moaFields[field.valueKey], 100)}
              </div>
              {field.key === "parkingFee" && (
                <div className="text-[7.5px] text-zinc-500 font-bold italic leading-none pl-[80px]">
                  (Cars, motorcycle and bike)
                </div>
              )}
            </div>
          ))}
          {customFinancialFields.map((field) => (
            <div key={field.id} className="grid grid-cols-[80px_1fr] items-center gap-1">
              <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
              {CL(`custom-financial-${field.id}`, "", 100)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <MoaSortableGroup
          group={`financial-${selectedMoaCategory}`}
          enabled={canEditMoa}
          itemIds={financialFields}
          onReorderIds={reorderFinancialFields}
        >
          <div className="space-y-1">
            {ordered.map((field) => (
              <MoaSortableItem key={field.key} id={field.key} variant="field" handleLabel={`Move ${topLabels[field.key]}`}>
                <div className="space-y-0.5">
                  <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                    {renderEditableLabel(field.key, "font-semibold text-zinc-500 uppercase text-[8px]")}
                    {RL(
                      field.key,
                      moaFields[field.valueKey],
                      (value) => updateMoaField(field.valueKey, value),
                      100,
                    )}
                  </div>
                  {field.key === "parkingFee" && (
                    <div className="text-[7.5px] text-zinc-500 font-bold italic leading-none pl-[80px]">
                      (Cars, motorcycle and bike)
                    </div>
                  )}
                </div>
              </MoaSortableItem>
            ))}
          </div>
        </MoaSortableGroup>
        <MoaSortableGroup
          group={`custom-financial-${selectedMoaCategory}`}
          enabled={canEditMoa && customFinancialFields.length > 1}
          itemIds={customFinancialFields.map((field) => field.id)}
          onReorderIds={reorderCustomFinancialFields}
        >
          <div className="space-y-1">
            {customFinancialFields.map((field) => (
              <MoaSortableItem key={field.id} id={field.id} variant="field" handleLabel={`Move ${field.label}`}>
                <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                  <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                  {RL(`custom-financial-${field.id}`, "", () => undefined, 100)}
                </div>
              </MoaSortableItem>
            ))}
          </div>
        </MoaSortableGroup>
      </div>
    );
  };

  const renderUnitColumn = (editable: boolean) => {
    const ordered = unitFields
      .map((key) => UNIT_FIELD_OPTIONS.find((field) => field.key === key))
      .filter(Boolean) as typeof UNIT_FIELD_OPTIONS;

    if (!editable || !canEditMoa) {
      return (
        <div className="space-y-1">
          {ordered.map((field) => (
            <div key={field.key} className="grid grid-cols-[92px_1fr] items-center gap-1">
              <span className="font-semibold text-zinc-500 uppercase text-[8px]">{topLabels[field.key]}</span>
              {CL(field.key, moaFields[field.valueKey], 100)}
            </div>
          ))}
          {customUnitFields.map((field) => (
            <div key={field.id} className="grid grid-cols-[92px_1fr] items-center gap-1">
              <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
              {CL(`custom-unit-${field.id}`, "", 100)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <MoaSortableGroup
          group={`unit-${selectedMoaCategory}`}
          enabled={canEditMoa}
          itemIds={unitFields}
          onReorderIds={reorderUnitFields}
        >
          <div className="space-y-1">
            {ordered.map((field) => (
              <MoaSortableItem key={field.key} id={field.key} variant="field" handleLabel={`Move ${topLabels[field.key]}`}>
                <div className="grid grid-cols-[92px_1fr] items-center gap-1">
                  {renderEditableLabel(field.key, "font-semibold text-zinc-500 uppercase text-[8px]")}
                  {RL(
                    field.key,
                    moaFields[field.valueKey],
                    (value) => updateMoaField(field.valueKey, value),
                    100,
                  )}
                </div>
              </MoaSortableItem>
            ))}
          </div>
        </MoaSortableGroup>
        <MoaSortableGroup
          group={`custom-unit-${selectedMoaCategory}`}
          enabled={canEditMoa && customUnitFields.length > 1}
          itemIds={customUnitFields.map((field) => field.id)}
          onReorderIds={reorderCustomUnitFields}
        >
          <div className="space-y-1">
            {customUnitFields.map((field) => (
              <MoaSortableItem key={field.id} id={field.id} variant="field" handleLabel={`Move ${field.label}`}>
                <div className="grid grid-cols-[92px_1fr] items-center gap-1">
                  <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                  {RL(`custom-unit-${field.id}`, "", () => undefined, 100)}
                </div>
              </MoaSortableItem>
            ))}
          </div>
        </MoaSortableGroup>
      </div>
    );
  };

  const renderSlipSectionContent = (sectionId: SlipSectionId, editable: boolean) => {
    switch (sectionId) {
      case "shopHeader":
        return renderShopHeader(editable);
      case "copyMeta":
        return editable ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            {renderEditableLabel("originalCopy", "font-bold italic text-[9.5px]")}
            <div className="flex items-center gap-1 text-[9.5px]">
              {renderEditableLabel("unitCode", "font-bold uppercase whitespace-nowrap")}
              {RL("unitCode", moaFields.unitCode, (v) => updateMoaField("unitCode", v), 100)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="font-bold italic text-[9.5px]">Customer copy</span>
            <div className="flex items-center gap-1 text-[9.5px]">
              <span className="font-bold uppercase whitespace-nowrap">{topLabels.unitCode}</span>
              {CL("unitCode", moaFields.unitCode, 100)}
            </div>
          </div>
        );
      case "title":
        return editable ? (
          <div className="text-center font-bold uppercase tracking-wider text-[11px] py-0.5">
            <input
              value={topLabels.moaTitle}
              onChange={(e) => updateTopLabel("moaTitle", e.target.value)}
              readOnly={!canEditMoa}
              tabIndex={canEditMoa ? 0 : -1}
              spellCheck={false}
              className={`moa-title-input block w-full text-center text-[11px] font-bold uppercase border-none bg-transparent p-0 outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
            />
          </div>
        ) : (
          <div className="text-center font-bold uppercase tracking-wider text-[11px] py-0.5 text-zinc-800">
            {topLabels.moaTitle}
          </div>
        );
      case "dates":
        return editable ? (
          <div className="grid grid-cols-2 gap-4 border-b border-zinc-300 pb-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {renderEditableLabel("purchasedDate", "w-24 font-bold uppercase tracking-wider text-[8.5px]")}
                {RL("purchasedDate", moaFields.purchasedDate, (v) => updateMoaField("purchasedDate", v), 140)}
              </div>
              <div className="flex items-center gap-2">
                {renderEditableLabel("idsPresented", "w-24 font-bold uppercase tracking-wider text-[8.5px]")}
                {RL("idsPresented", moaFields.idsPresented, (v) => updateMoaField("idsPresented", v), 140)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-[90px_1fr] items-start gap-x-1">
                {renderEditableLabel("maturityDate", "font-bold uppercase tracking-wider text-[8.5px] mt-0.5")}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 w-6 whitespace-nowrap">1st</span>
                    {RL("maturityDate1st", moaFields.maturityDate1st, (v) => updateMoaField("maturityDate1st", v), 120)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 w-6 whitespace-nowrap">2nd</span>
                    {RL("maturityDate2nd", moaFields.maturityDate2nd, (v) => updateMoaField("maturityDate2nd", v), 120)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 w-6 whitespace-nowrap">3rd</span>
                    {RL("maturityDate3rd", moaFields.maturityDate3rd, (v) => updateMoaField("maturityDate3rd", v), 120)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center gap-x-1 text-zinc-800 font-bold">
                {renderEditableLabel("expiryDate", "font-bold uppercase tracking-wider text-[8.5px]")}
                {RL("expiryDate", moaFields.expiryDate, (v) => updateMoaField("expiryDate", v), 80)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 border-b border-zinc-300 pb-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-24 font-bold uppercase tracking-wider text-[8.5px]">{topLabels.purchasedDate}</span>
                {CL("purchasedDate", moaFields.purchasedDate, 140)}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-bold uppercase tracking-wider text-[8.5px]">{topLabels.idsPresented}</span>
                {CL("idsPresented", moaFields.idsPresented, 140)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-[90px_1fr] items-start gap-x-1">
                <span className="font-bold uppercase tracking-wider text-[8.5px] mt-0.5">{topLabels.maturityDate}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 w-6 whitespace-nowrap">1st</span>
                    {CL("maturityDate1st", moaFields.maturityDate1st, 120)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 w-6 whitespace-nowrap">2nd</span>
                    {CL("maturityDate2nd", moaFields.maturityDate2nd, 120)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 w-6 whitespace-nowrap">3rd</span>
                    {CL("maturityDate3rd", moaFields.maturityDate3rd, 120)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center gap-x-1 text-red-600 font-bold">
                <span className="font-bold uppercase tracking-wider text-[8.5px]">{topLabels.expiryDate}</span>
                {CL("expiryDate", moaFields.expiryDate, 80)}
              </div>
            </div>
          </div>
        );
      case "agreement":
        return editable ? (
          <div className="moa-agreement-text space-y-1.5 leading-relaxed text-justify text-[9px] px-1 select-text">
            <div>
              {renderEditableLabel("customerIntro", "inline")} {RL("customerName", moaFields.customerName, (v) => updateMoaField("customerName", v), 180)} {renderEditableLabel("legalAgeResident", "inline")} {RL("customerAddress", moaFields.customerAddress, (v) => updateMoaField("customerAddress", v), 220)}. For the amount of {RL("amountInWords", moaFields.principalAmount || "", (v) => updateMoaField("principalAmount", v), 130)} (P {RL("amountInFigures", moaFields.amount || "", (v) => updateMoaField("amount", v), 80)}) {renderEditableLabel("agreementText", "inline")} for THIRTY (30) days from the date of purchase. {renderEditableLabel("repayIntro", "inline")} (P {RL("repurchaseAmount", moaFields.amount || "", (v) => updateMoaField("amount", v), 80)}) {renderEditableLabel("plusText", "inline")} (P {RL("storageFeeValue", moaFields.storageFee || "", (v) => updateMoaField("storageFee", v), 80)}) {renderEditableLabel("storageFeeText", "inline")} {RL("penaltyAmountText", moaFields.penaltyAmount || "", (v) => updateMoaField("penaltyAmount", v), 80)} (P {RL("penaltyAmount", moaFields.penaltyAmount || "", (v) => updateMoaField("penaltyAmount", v), 60)}) and you are given 5 days grace period ({RL("gracePeriod", moaFields.expiryDate || "", (v) => updateMoaField("expiryDate", v), 100)}) my right to repurchase back the unit(s) described below is deemed waived.
            </div>
          </div>
        ) : (
          <div className="moa-agreement-text space-y-1.5 leading-relaxed text-justify text-[9px] px-1 select-text">
            <p>
              {topLabels.customerIntro} {CL("customerName", moaFields.customerName, 180)} {topLabels.legalAgeResident} {CL("customerAddress", moaFields.customerAddress, 220)}. For the amount of {CL("amountInWords", moaFields.principalAmount || "", 130)} (P {CL("amountInFigures", moaFields.amount || "", 80)}) {topLabels.agreementText} for THIRTY (30) days from the date of purchase. {topLabels.repayIntro} (P {CL("repurchaseAmount", moaFields.amount || "", 80)}) {topLabels.plusText} (P {CL("storageFeeValue", moaFields.storageFee || "", 80)}) {topLabels.storageFeeText} {CL("penaltyAmountText", moaFields.penaltyAmount || "", 80)} (P {CL("penaltyAmount", moaFields.penaltyAmount || "", 60)}) and you are given 5 days grace period ({CL("gracePeriod", moaFields.expiryDate || "", 100)}) my right to repurchase back the unit(s) described below is deemed waived.
            </p>
          </div>
        );
      case "unitFields":
        return (
          <div className="border-y border-zinc-200 py-2 my-2 space-y-2 bg-zinc-50/30">
            <p className="font-bold text-center underline text-[9.5px]">
              {editable ? renderEditableLabel("unitDescription", "inline") : topLabels.unitDescription}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 px-3">
              {renderFinancialColumn(editable)}
              {renderUnitColumn(editable)}
            </div>
          </div>
        );
      case "signatures":
        return null;
      default:
        return null;
    }
  };

  const renderSlipBodySections = (editable: boolean) => {
    const bodySections = slipSectionOrder.filter((id) => id !== "signatures");

    if (!editable || !canEditMoa) {
      return bodySections.map((sectionId) => (
        <div key={sectionId}>{renderSlipSectionContent(sectionId, editable)}</div>
      ));
    }

    return (
      <MoaSortableGroup
        group={`slip-sections-${selectedMoaCategory}`}
        enabled={canEditMoa}
        itemIds={bodySections}
        onReorderIds={(nextIds) => {
          const next = [...nextIds, ...slipSectionOrder.filter((id) => !nextIds.includes(id as SlipSectionId))] as SlipSectionId[];
          updateSlipSectionOrder(next);
        }}
      >
        <div className="space-y-0.5">
          {bodySections.map((sectionId) => (
            <MoaSortableItem
              key={sectionId}
              id={sectionId}
              variant="block"
              handleLabel={`Move ${sectionId === "shopHeader" ? "header" : "section"}`}
            >
              {renderSlipSectionContent(sectionId, editable)}
            </MoaSortableItem>
          ))}
        </div>
      </MoaSortableGroup>
    );
  };

  return (
    <div className="w-full max-w-none space-y-6 [&_button]:text-sm [&_h2]:text-sm [&_h3]:text-base [&_input]:text-sm [&_label]:text-xs [&_p]:text-sm [&_span]:text-xs">
      <div className="flex w-full flex-nowrap gap-1 overflow-x-auto rounded-lg border border-border-main bg-surface p-1 sm:w-fit">
        {[
          "Profile",
          "Notifications",
          "Shop",
          "Manage Categories",
          "MOA",
        ].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-bold transition-all sm:px-6 sm:py-2 sm:text-sm ${activeTab === tab
              ? "bg-brand-green text-white shadow-sm"
              : "text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              }`}
          >
            {tab === "MOA" ? "Slip Edit" : tab}
          </button>
        ))}
      </div>

      <div className={`grid w-full gap-6 ${activeTab === "Profile" ? "2xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <div className="min-w-0 space-y-6">
          {profileToast && (
            <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
              <div className="rounded-xl border border-brand-green/40 bg-brand-green/10 px-5 py-3 text-sm font-semibold text-brand-green shadow-xl">
                {profileToast}
              </div>
            </div>
          )}

          {activeTab === "Profile" && (
            <>
              <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
                <h3 className="mb-4 border-b border-border-main pb-2 text-base font-bold text-text-primary">
                  My Account Profile
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                        Full Name
                      </label>
                      <input
                        className="rounded-lg border border-input-border px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-green"
                        value={profileFullName}
                        onChange={(event) => setProfileFullName(event.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                        Account Role
                      </label>
                      <div className="rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm capitalize text-text-tertiary">
                        {user?.role?.replace("_", " ") || "Super Admin"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                      Email Address
                    </label>
                    <input
                      className="cursor-not-allowed rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm text-zinc-400 outline-none"
                      value={profileEmail}
                      readOnly
                      title="Email cannot be changed from this page"
                    />
                    <p className="text-[10px] italic text-zinc-400">
                      Email updates require administrative verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || profileFullName === user?.fullName}
                  className="rounded-lg bg-brand-green px-6 py-2 text-xs font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleDiscardProfile}
                  className="rounded-lg border border-input-border px-6 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-surface-hover"
                >
                  Discard
                </button>
              </div>
            </>
          )}

          {activeTab === "Notifications" && <NotificationSoundSettings />}

          {activeTab === "Shop" && (
            <section className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
              <div className="border-b border-border-main px-4 py-3 flex items-center justify-between">
                <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-brand-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Shop Information
                </h2>
                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    {!isShopEditMode ? (
                      <button
                        onClick={() => setIsShopEditMode(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-main bg-surface-secondary px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-surface-hover dark:text-zinc-300 transition-all duration-200"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Info
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleCancelShopEdit}
                          className="rounded-lg border border-border-main bg-surface-secondary px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-surface-hover dark:text-zinc-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveShopEdit}
                          disabled={isSavingSettings}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-green px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        >
                          {isSavingSettings ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-5 px-4 py-4 transition-all duration-300">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Shop Name
                  </label>
                  <input
                    value={isShopEditMode ? tempShopSettings.shopName : shopSettings.shopName}
                    onChange={(e) => handleTempShopSettingChange("shopName", e.target.value)}
                    disabled={!isShopEditMode}
                    className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${isShopEditMode
                      ? "border-brand-green bg-surface shadow-sm focus:ring-1 focus:ring-brand-green text-text-primary"
                      : "border-border-main bg-surface-secondary text-text-secondary opacity-80 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Shop Address
                  </label>
                  <input
                    value={isShopEditMode ? tempShopSettings.shopAddress : shopSettings.shopAddress}
                    onChange={(e) => handleTempShopSettingChange("shopAddress", e.target.value)}
                    disabled={!isShopEditMode}
                    className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${isShopEditMode
                      ? "border-brand-green bg-surface shadow-sm focus:ring-1 focus:ring-brand-green text-text-primary"
                      : "border-border-main bg-surface-secondary text-text-secondary opacity-80 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Phone Number
                    </label>
                    <input
                      value={isShopEditMode ? tempShopSettings.phoneNumber : shopSettings.phoneNumber}
                      onChange={(e) => handleTempShopSettingChange("phoneNumber", e.target.value)}
                      disabled={!isShopEditMode}
                      className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${isShopEditMode
                        ? "border-brand-green bg-surface shadow-sm focus:ring-1 focus:ring-brand-green text-text-primary"
                        : "border-border-main bg-surface-secondary text-text-secondary opacity-80 cursor-not-allowed"
                        }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Email
                    </label>
                    <input
                      type="email"
                      value={isShopEditMode ? tempShopSettings.email : shopSettings.email}
                      onChange={(e) => handleTempShopSettingChange("email", e.target.value)}
                      disabled={!isShopEditMode}
                      className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${isShopEditMode
                        ? "border-brand-green bg-surface shadow-sm focus:ring-1 focus:ring-brand-green text-text-primary"
                        : "border-border-main bg-surface-secondary text-text-secondary opacity-80 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Manage Categories" && (
            <>
              <CategoriesSettings />
              <InterestRatesSettings />
            </>
          )}

          {activeTab === "MOA" && (
            <section className="overflow-visible rounded-xl border border-border-main bg-surface pb-4 shadow-sm">
              <div className="border-b border-border-main px-3 py-3 sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                    Slip Edit & Templates
                  </h2>
                  <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-brand-green">
                    Super Admin Only
                  </span>
                </div>
              </div>

              <div className="space-y-3 px-3 py-4 sm:px-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    onClick={() => setIsMoaEditMode((v) => !v)}
                    disabled={!isSuperAdmin}
                    className={`w-full rounded-lg px-4 py-2 text-[11px] font-bold transition-colors sm:w-auto ${isMoaEditMode
                      ? "border border-brand-green bg-brand-green text-white"
                      : "border border-border-main bg-surface-secondary text-zinc-700 hover:bg-surface-hover dark:text-zinc-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isMoaEditMode ? "Exit Slip Edit" : "Slip Edit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintPreview(true)}
                    disabled={!hasMoaDesign(getCurrentMoaDesign()) && !isMoaEditMode}
                    title="Preview slip (view only)"
                    aria-label="Preview slip (view only)"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-700 bg-sky-50 text-sky-800 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Eye className="h-4 w-4" strokeWidth={2.25} />
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyMoaToAllCategories}
                    disabled={!canEditMoa || moaCategories.length === 0}
                    className="w-full rounded-lg border border-brand-green bg-brand-green/10 px-3 py-2 text-[11px] font-bold text-brand-green transition-colors hover:bg-brand-green/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Apply to All Categories
                  </button>
                </div>

                {isMoaEditMode && (
                  <div className="space-y-2">
                    <div className="overflow-x-auto rounded-lg border border-border-main bg-surface-secondary p-1.5">
                      <div className="flex min-w-max items-center gap-1.5">
                        <span className="px-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                          Form
                        </span>
                        {MOA_DOCUMENT_TYPES.map((doc) => {
                          const isActive = moaDocumentType === doc.id;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              title={doc.hint}
                              onClick={() => handleMoaDocumentTypeChange(doc.id)}
                              disabled={!canEditMoa}
                              className={`whitespace-nowrap rounded-md border px-3 py-2 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive
                                  ? "border-sky-700 bg-sky-700 text-white shadow-sm"
                                  : "border-border-main bg-surface text-zinc-700 hover:border-sky-500/40 hover:bg-sky-50 hover:text-sky-800 dark:text-zinc-300"
                              }`}
                            >
                              {doc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border-main bg-surface-secondary p-1.5">
                      <div className="flex min-w-max items-center gap-1.5">
                        <span className="px-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                          Category
                        </span>
                        {moaCategories.map((categoryName) => {
                          const category = { value: categoryName, label: categoryName };
                          const isActive = selectedMoaCategory === category.value;
                          return (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => handleMoaCategoryChange(category.value)}
                              disabled={!canEditMoa}
                              className={`whitespace-nowrap rounded-md border px-3 py-2 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isActive
                                ? "border-brand-green bg-brand-green text-white shadow-sm"
                                : "border-border-main bg-surface text-zinc-700 hover:border-brand-green/40 hover:bg-brand-green/10 hover:text-brand-green dark:text-zinc-300"
                                }`}
                            >
                              {category.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Context hints removed — info now in sidebar & toolbar */}

                {isMoaEditMode ? (
                  <div className="overflow-hidden rounded-xl border border-border-main bg-white shadow-sm">
                    <div className="flex h-[min(78vh,920px)] max-h-[min(78vh,920px)] min-h-0 items-stretch overflow-hidden">
                      <aside className="relative z-10 flex shrink-0 items-stretch border-r border-zinc-200 bg-zinc-50">
                        <input
                          ref={moaImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file || !selectedDesignId) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result !== "string") return;
                              updateMoaDesignElements(
                                moaDesignElements.map((el) =>
                                  el.id === selectedDesignId
                                    ? { ...el, imageSrc: reader.result as string }
                                    : el,
                                ),
                              );
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <MoaDesignToolsPanel
                          enabled={canEditMoa}
                          pageSize={moaPageSizeId}
                          onPageSizeChange={handleMoaPageSizeChange}
                          pageCount={moaPageCount}
                          onAddPage={handleAddMoaPage}
                          onRemovePage={handleRemoveMoaPage}
                          watermark={moaWatermark}
                          onWatermarkChange={handleMoaWatermarkChange}
                          onPaletteDragStateChange={setIsPaletteDragging}
                          onAddHeaderField={handleAddHeaderField}
                          onAddElement={handleAddPaletteElement}
                          currentDesign={getCurrentMoaDesign()}
                          selectedElements={moaDesignElements.filter((el) =>
                            selectedDesignIds.length > 0
                              ? selectedDesignIds.includes(el.id)
                              : selectedDesignId
                                ? el.id === selectedDesignId
                                : false,
                          )}
                          onApplyTemplatePack={handleApplyTemplatePack}
                          onApplyTemplateFull={handleApplyTemplateFull}
                          termsText={termsText}
                          onTermsChange={(value) => {
                            setTermsText(value);
                            setMoaDirty(true);
                          }}
                          termsHeading={topLabels.termsHeading || "TERMS AND CONDITIONS"}
                          onTermsHeadingChange={(value) => {
                            setTopLabels((prev) => ({ ...prev, termsHeading: value }));
                            setMoaDirty(true);
                          }}
                          termsPreamble={topLabels.termsPreamble || ""}
                          onTermsPreambleChange={(value) => {
                            setTopLabels((prev) => ({ ...prev, termsPreamble: value }));
                            setMoaDirty(true);
                          }}
                          onUseUploadedImage={(dataUrl) => {
                            if (!selectedDesignId) {
                              const next = createMoaDesignElement("photo", 32, 100, {
                                fontFamily: moaDesignFontFamily,
                                fontSize: moaDesignFontSize,
                                pageIndex: moaDesignElements.find((el) => el.id === selectedDesignId)?.pageIndex ?? 0,
                              });
                              updateMoaDesignElements([
                                ...moaDesignElements,
                                { ...next, imageSrc: dataUrl },
                              ]);
                              setSelectedDesignId(next.id);
                              setSelectedDesignIds([next.id]);
                            } else {
                              updateMoaDesignElements(
                                moaDesignElements.map((el) =>
                                  el.id === selectedDesignId
                                    ? { ...el, imageSrc: dataUrl }
                                    : el,
                                ),
                              );
                            }
                          }}
                          fieldConfig={
                            <MoaFieldConfigTab
                              enabled={canEditMoa}
                              categoryLabel={
                                selectedMoaCategory === DEFAULT_MOA_CATEGORY
                                  ? "all categories"
                                  : selectedMoaCategory
                              }
                              groupSuffix={selectedMoaCategory}
                              financialOptions={FINANCIAL_FIELD_OPTIONS.map((field) => ({
                                key: field.key,
                                label: topLabels[field.key],
                              }))}
                              unitOptions={UNIT_FIELD_OPTIONS.map((field) => ({
                                key: field.key,
                                label: topLabels[field.key],
                              }))}
                              customerOptions={CUSTOMER_TICKET_FIELD_OPTIONS}
                              jewelryOptions={JEWELRY_FIELD_OPTIONS.map((field) => ({
                                key: field.key,
                                label: field.label,
                              }))}
                              financialFields={financialFields}
                              unitFields={unitFields}
                              customFinancialFields={customFinancialFields}
                              customUnitFields={customUnitFields}
                              newFinancialField={newFinancialField}
                              newUnitField={newUnitField}
                              onReorderFinancial={reorderFinancialFields}
                              onReorderUnit={reorderUnitFields}
                              onReorderCustomFinancial={reorderCustomFinancialFields}
                              onReorderCustomUnit={reorderCustomUnitFields}
                              onToggleFinancial={(key) =>
                                toggleMoaSectionField(
                                  key as FinancialFieldKey,
                                  financialFields,
                                  setFinancialFields,
                                )
                              }
                              onToggleUnit={(key) =>
                                toggleMoaSectionField(
                                  key as UnitFieldKey,
                                  unitFields,
                                  setUnitFields,
                                )
                              }
                              onCustomFinancialLabelChange={(id, label) =>
                                setCustomFinancialFields((fields) =>
                                  fields.map((field) =>
                                    field.id === id ? { ...field, label } : field,
                                  ),
                                )
                              }
                              onCustomUnitLabelChange={(id, label) =>
                                setCustomUnitFields((fields) =>
                                  fields.map((field) =>
                                    field.id === id ? { ...field, label } : field,
                                  ),
                                )
                              }
                              onRemoveCustomFinancial={(id) =>
                                setCustomFinancialFields((fields) =>
                                  fields.filter((field) => field.id !== id),
                                )
                              }
                              onRemoveCustomUnit={(id) =>
                                setCustomUnitFields((fields) =>
                                  fields.filter((field) => field.id !== id),
                                )
                              }
                              onNewFinancialChange={setNewFinancialField}
                              onNewUnitChange={setNewUnitField}
                              onAddCustomFinancial={() =>
                                addCustomMoaField(
                                  newFinancialField,
                                  setNewFinancialField,
                                  setCustomFinancialFields,
                                )
                              }
                              onAddCustomUnit={() =>
                                addCustomMoaField(
                                  newUnitField,
                                  setNewUnitField,
                                  setCustomUnitFields,
                                )
                              }
                              onInsertOntoCanvas={handleInsertConfigField}
                              onInsertAllJewelryOntoCanvas={handleInsertAllJewelryFields}
                              onPaletteDragStateChange={setIsPaletteDragging}
                            />
                          }
                        />
                      </aside>
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-100">
                        {/* Hidden file input for replace image */}
                        <input
                          ref={imageReplaceInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file || !imageReplaceTargetId) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              updateMoaDesignElements(
                                moaDesignElements.map((el) =>
                                  el.id === imageReplaceTargetId
                                    ? { ...el, imageSrc: ev.target?.result as string }
                                    : el,
                                ),
                              );
                              setImageReplaceTargetId(null);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                        <MoaDocsToolbar
                          enabled={canEditMoa}
                          hasSelection={
                            selectedDesignIds.length > 0 ||
                            Boolean(selectedDesignId) ||
                            selectedFieldIds.length > 0
                          }
                          canUndo={moaHistory.length > 0}
                          canRedo={moaFuture.length > 0}
                          zoom={moaZoom}
                          fontFamily={moaDesignFontFamily}
                          fontSize={moaDesignFontSize}
                          textAlign={moaDesignTextAlign}
                          fontWeight={moaDesignFontWeight}
                          fontStyle={moaDesignFontStyle}
                          textDecoration={moaDesignTextDecoration}
                          color={moaDesignColor}
                          highlight={moaDesignFill}
                          lineSpacing={moaDesignLineSpacing}
                          spellCheck={moaSpellCheck}
                          onUndo={handleUndo}
                          onRedo={handleRedo}
                          onZoomChange={setMoaZoom}
                          onFontFamilyChange={handleDesignFontFamilyChange}
                          onFontSizeChange={handleDesignFontSizeChange}
                          onTextStyleChange={applyDesignStylePatch}
                          onLineSpacingChange={(value) =>
                            applyDesignStylePatch({ lineHeight: value })
                          }
                          onIndent={(direction) => {
                            const ids =
                              selectedDesignIds.length > 0
                                ? selectedDesignIds
                                : selectedDesignId
                                  ? [selectedDesignId]
                                  : [];
                            if (ids.length === 0) return;
                            const idSet = new Set(ids);
                            updateMoaDesignElements(
                              moaDesignElements.map((el) => {
                                if (!idSet.has(el.id)) return el;
                                // Text surfaces: indent level. Boxes: nudge X.
                                if (
                                  el.fieldKey === MOA_PAGE_DOC_FIELD_KEY ||
                                  el.kind === "text" ||
                                  el.kind === "section" ||
                                  el.kind === "body" ||
                                  el.kind === "moaField"
                                ) {
                                  const nextIndent = Math.max(
                                    0,
                                    Math.min(8, (el.indent ?? 0) + direction),
                                  );
                                  return { ...el, indent: nextIndent };
                                }
                                return { ...el, x: Math.max(0, el.x + direction * 24) };
                              }),
                            );
                          }}
                          onInsertElement={(kind, options) =>
                            handleAddPaletteElement(kind, options as MoaElementCreateOptions | undefined)
                          }
                          onInsertLink={handleInsertLink}
                          onInsertQr={handleInsertQr}
                          onListFormat={formatSelectedTextAsList}
                          onToggleSpellCheck={() => setMoaSpellCheck((prev) => !prev)}
                          onPrint={() => {
                            void handlePrintMoaDesign();
                          }}
                          onDeleteSelected={handleDeleteSelected}
                          onClearFormatting={() =>
                            applyDesignStylePatch({
                              fontFamily: MOA_FONT_OPTIONS[0].value,
                              fontSize: 11,
                              fontWeight: "normal",
                              fontStyle: "normal",
                              textDecoration: "none",
                              color: "#18181b",
                              fill: "transparent",
                              textAlign: "left",
                              lineHeight: DEFAULT_MOA_LINE_HEIGHT,
                              indent: 0,
                            })
                          }
                          selectedElement={
                            selectedDesignId
                              ? moaDesignElements.find((el) => el.id === selectedDesignId) ?? null
                              : null
                          }
                          onImageStyleChange={(patch) => {
                            if (!selectedDesignId) return;
                            updateMoaDesignElements(
                              moaDesignElements.map((el) =>
                                el.id === selectedDesignId ? { ...el, ...patch } : el,
                              ),
                            );
                          }}
                          isCropMode={imageCropModeId === selectedDesignId && !!selectedDesignId}
                          onToggleCropMode={() => {
                            setImageCropModeId((prev) =>
                              prev === selectedDesignId ? null : selectedDesignId,
                            );
                          }}
                          onOpenImageOptions={() => setShowImageOptions(true)}
                          onReplaceImage={() => {
                            if (!selectedDesignId) return;
                            setImageReplaceTargetId(selectedDesignId);
                            imageReplaceInputRef.current?.click();
                          }}
                        />
                        <MoaDocsRuler
                          paperWidthPx={moaPageSize.screenWidthPx}
                          margins={moaMargins}
                          enabled={canEditMoa}
                          onMarginsChange={(next) => {
                            setMoaMargins(next);
                            saveMoaMargins(moaStorageKey, next);
                          }}
                        />
                        <div
                          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-5"
                          style={{ maxHeight: moaCanvasScrollHeightPx }}
                        >
                          {/* Sentinel: receives focus after Ctrl+A so Delete/toolbar shortcuts stay snappy */}
                          <div
                            ref={moaCanvasFocusRef}
                            tabIndex={-1}
                            aria-hidden
                            className="sr-only"
                          />
                          <div
                            className="mx-auto flex w-full min-w-0 flex-col gap-6"
                            style={{ maxWidth: moaPageSize.screenWidthPx * (moaZoom / 100) }}
                          >
                            {/* MOA blank canvas pages */}
                            {Array.from({ length: moaPageCount }, (_, pageIndex) => {
                          const pageElements = moaDesignElements.filter(
                            (el) => (el.pageIndex ?? 0) === pageIndex,
                          );
                          return (
                            <div key={`moa-page-${pageIndex}`} id={`moa-canvas-page-${pageIndex}`} className="space-y-2">
                              {moaPageCount > 1 ? (
                                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                  Page {pageIndex + 1} of {moaPageCount}
                                </p>
                              ) : null}
                              <MoaPaperScale
                                paperWidth={moaPageSize.screenWidthPx}
                                paperHeight={moaPageSize.screenHeightPx}
                                userZoom={moaZoom / 100}
                              >
                                <div
                                  className={`${MOA_SETTINGS_PAPER_CLASS} relative bg-white`}
                                  style={{
                                    padding: marginsToPadding(moaMargins),
                                    boxSizing: "border-box",
                                    width: moaPageSize.screenWidthPx,
                                    height: moaPageSize.screenHeightPx,
                                    maxHeight: moaPageSize.screenHeightPx,
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* Plain document paper — no grid lines */}
                                  <MoaCanvasWatermark
                                    settings={moaWatermark}
                                    editable={canEditMoa}
                                    onChange={handleMoaWatermarkChange}
                                  />
                                  <MoaDesignCanvasLayer
                                    enabled={canEditMoa}
                                    paletteDragging={isPaletteDragging}
                                    elements={pageElements}
                                    selectedId={selectedDesignId}
                                    selectedIds={selectedDesignIds}
                                    onSelect={handleSelectDesignElement}
                                    onSelectedIdsChange={handleSelectedIdsChange}
                                    selectedFieldIds={selectedFieldIds}
                                    onSelectedFieldIdsChange={handleSelectedFieldIdsChange}
                                    onChangeElements={(next) =>
                                      updatePageDesignElements(pageIndex, next)
                                    }
                                    defaultFontFamily={moaDesignFontFamily}
                                    defaultFontSize={moaDesignFontSize}
                                    branchPreview={shopSettings}
                                    pageIndex={pageIndex}
                                    onPaginatePageDoc={(fitText, overflowText) =>
                                      handlePaginatePageDoc(pageIndex, fitText, overflowText)
                                    }
                                    spellCheck={moaSpellCheck}
                                    cropModeId={imageCropModeId}
                                    onCropModeChange={setImageCropModeId}
                                    onDeleteSelected={handleDeleteSelected}
                                    resolveFieldValue={resolveMoaCanvasFieldValue}
                                  />
                                </div>
                              </MoaPaperScale>
                            </div>
                          );
                        })}
                          </div>
                        </div>
                      </div>

                      {/* Image Options sidebar */}
                      {showImageOptions && selectedDesignId && (() => {
                        const imgEl = moaDesignElements.find((el) => el.id === selectedDesignId);
                        if (!imgEl?.imageSrc) return null;
                        return (
                          <aside className="w-[260px] shrink-0 overflow-y-auto">
                            <ImageOptionsPanel
                              element={imgEl}
                              onUpdate={(patch) => {
                                updateMoaDesignElements(
                                  moaDesignElements.map((el) =>
                                    el.id === selectedDesignId ? { ...el, ...patch } : el,
                                  ),
                                );
                              }}
                              onClose={() => setShowImageOptions(false)}
                              onReplaceImage={() => {
                                setImageReplaceTargetId(selectedDesignId);
                                imageReplaceInputRef.current?.click();
                              }}
                            />
                          </aside>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0 overflow-x-auto rounded-md border border-border-main bg-surface-secondary p-2 shadow-inner sm:p-4 lg:p-6 dark:bg-surface-secondary">
                    {hasMoaDesign(getCurrentMoaDesign()) ? (
                      <div
                        className="overflow-y-auto overscroll-contain"
                        style={{ maxHeight: moaCanvasScrollHeightPx + 48 }}
                      >
                        <div
                          className="mx-auto flex w-full min-w-0 flex-col gap-4"
                          style={{ maxWidth: moaPageSize.screenWidthPx }}
                        >
                          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            Latest saved slip design (sample data). Open Slip Edit to change templates.
                          </p>
                          <MoaDesignPrintPages
                            design={getCurrentMoaDesign()}
                            values={createSampleMoaFieldValues(shopSettings)}
                          />
                        </div>
                      </div>
                    ) : (
                    <div
                      className="mx-auto flex w-full min-w-0 flex-col gap-6"
                      style={{ maxWidth: moaPageSize.screenWidthPx }}
                    >
                      <>
                          {/* PAGE 1: SLIPS (Original & Customer Copy) */}
                          <MoaPaperScale
                            paperWidth={moaPageSize.screenWidthPx}
                            paperHeight={moaPageSize.screenHeightPx}
                          >
                            <div
                              className={`${MOA_SETTINGS_PAPER_CLASS} moa-slip-sheet relative`}
                              style={{
                                padding: moaPageSize.padding,
                                boxSizing: "border-box",
                                width: moaPageSize.screenWidthPx,
                                height: moaPageSize.screenHeightPx,
                                maxHeight: moaPageSize.screenHeightPx,
                                overflow: "hidden",
                              }}
                            >
                              <div className="moa-slip-halves">

                                {/* ORIGINAL COPY (Top Half) */}
                                <div className="moa-slip-half">
                                  <div className="moa-slip-copy relative moa-watermark">
                                    <div className="moa-slip-body space-y-0.5">
                                      {renderSlipBodySections(true)}
                                    </div>
                                    <div className="moa-slip-footer space-y-0.5">
                                      {/* Signatures */}
                                      <div className="grid grid-cols-2 gap-12 pt-1 text-center">
                                        <div className="flex flex-col items-center">
                                          {RL("sellerName", moaFields.sellerName, (v) => updateMoaField("sellerName", v), 180)}
                                          <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{renderEditableLabel("sellerSignature", "inline")}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                          {RL("representativeName", moaFields.representativeName, (v) => updateMoaField("representativeName", v), 180)}
                                          <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{renderEditableLabel("representativeSignature", "inline")}</p>
                                        </div>
                                      </div>

                                      {/* Renewal table */}
                                      <div className="py-2 space-y-1 border-t border-zinc-100">
                                        {extensionRows.map((row, index) => (
                                          <div key={index} className="flex items-center justify-between gap-2 text-[8.5px] font-semibold text-zinc-600">
                                            <div className="flex items-center gap-1">
                                              <span>Date:</span>
                                              {RL(`extRow_${index}_date`, row.date, (v) => updateExtensionRow(index, "date", v), 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Storage:</span>
                                              {RL(`extRow_${index}_storage`, row.storage, (v) => updateExtensionRow(index, "storage", v), 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Period:</span>
                                              <span className="font-bold text-zinc-800">{row.period === "1st Period" ? "1st" : row.period === "2nd Period" ? "2nd" : row.period === "3rd Period" ? "3rd" : row.period}</span>
                                              {RL(`extRow_${index}_periodValue`, row.periodValue || "", (v) => updateExtensionRow(index, "periodValue", v), 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Extend:</span>
                                              {RL(`extRow_${index}_extend`, row.extend, (v) => updateExtensionRow(index, "extend", v), 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Sign:</span>
                                              {RL(`extRow_${index}_sign`, row.sign, (v) => updateExtensionRow(index, "sign", v), 60)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Advise Banner */}
                                      <div className="text-center font-bold text-[8.5px] uppercase pt-1 border-t border-zinc-100 select-text">
                                        <input
                                          value={topLabels.adviseText}
                                          onChange={(e) => updateTopLabel("adviseText", e.target.value)}
                                          readOnly={!canEditMoa}
                                          tabIndex={canEditMoa ? 0 : -1}
                                          spellCheck={false}
                                          className={`block w-full border-none bg-transparent text-center text-[8.5px] font-bold uppercase text-zinc-700 outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
                                        />
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
                                      {renderSlipBodySections(false)}
                                    </div>
                                    <div className="moa-slip-footer space-y-0.5">
                                      {/* Signatures */}
                                      <div className="grid grid-cols-2 gap-12 pt-1 text-center">
                                        <div className="flex flex-col items-center">
                                          {CL("sellerName", moaFields.sellerName, 180)}
                                          <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{topLabels.sellerSignature}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                          {CL("representativeName", moaFields.representativeName, 180)}
                                          <p className="mt-0.5 text-[8.5px] font-bold text-zinc-500">{topLabels.representativeSignature}</p>
                                        </div>
                                      </div>

                                      {/* Renewal table */}
                                      <div className="py-2 space-y-1 border-t border-zinc-100">
                                        {extensionRows.map((row, index) => (
                                          <div key={index} className="flex items-center justify-between gap-2 text-[8.5px] font-semibold text-zinc-600">
                                            <div className="flex items-center gap-1">
                                              <span>Date:</span>
                                              {CL(`extRow_${index}_date`, row.date, 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Storage:</span>
                                              {CL(`extRow_${index}_storage`, row.storage, 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Period:</span>
                                              <span className="font-bold text-zinc-800">{row.period === "1st Period" ? "1st" : row.period === "2nd Period" ? "2nd" : row.period === "3rd Period" ? "3rd" : row.period}</span>
                                              {CL(`extRow_${index}_periodValue`, row.periodValue || "", 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Extend:</span>
                                              {CL(`extRow_${index}_extend`, row.extend, 60)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>Sign:</span>
                                              {CL(`extRow_${index}_sign`, row.sign, 60)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Advise Banner */}
                                      <div className="text-center font-bold text-[8.5px] uppercase pt-1 border-t border-zinc-100 select-text">
                                        <div className="block w-full text-center text-[8.5px] font-bold uppercase text-zinc-700 outline-none">
                                          {topLabels.adviseText}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </MoaPaperScale>

                          {/* PAGE 2: TERMS AND CONDITIONS */}
                          <MoaPaperScale
                            paperWidth={moaPageSize.screenWidthPx}
                            paperHeight={moaPageSize.screenHeightPx}
                          >
                            <div
                              className={`${MOA_SETTINGS_PAPER_CLASS} moa-slip-sheet`}
                              style={{
                                padding: moaPageSize.padding,
                                boxSizing: "border-box",
                                width: moaPageSize.screenWidthPx,
                                height: moaPageSize.screenHeightPx,
                                maxHeight: moaPageSize.screenHeightPx,
                                overflow: "hidden",
                              }}
                            >
                              <div className="moa-slip-halves">

                                {/* Top Copy (Original terms) */}
                                <div className="moa-slip-half">
                                  <div className="moa-terms-copy relative moa-watermark">
                                    <div className="moa-terms-body space-y-1.5">
                                      <h2 className="text-center font-bold uppercase text-[11px] select-text">
                                        <input
                                          value={topLabels.termsHeading}
                                          onChange={(e) => updateTopLabel("termsHeading", e.target.value)}
                                          readOnly={!canEditMoa}
                                          tabIndex={canEditMoa ? 0 : -1}
                                          spellCheck={false}
                                          className={`block w-full border-none bg-transparent text-center text-[11px] font-bold uppercase outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
                                        />
                                      </h2>

                                      <div
                                        ref={termsPreambleRef}
                                        contentEditable={canEditMoa}
                                        suppressContentEditableWarning
                                        onFocus={() => {
                                          termsPreambleEditingRef.current = true;
                                        }}
                                        onInput={(e) => {
                                          termsPreambleEditingRef.current = true;
                                          updateTopLabel("termsPreamble", e.currentTarget.innerText ?? "");
                                        }}
                                        onBlur={(e) => {
                                          termsPreambleEditingRef.current = false;
                                          updateTopLabel("termsPreamble", e.currentTarget.innerText ?? "");
                                        }}
                                        className="whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-700 text-justify outline-none select-text"
                                      />

                                      <div
                                        ref={termsRef}
                                        contentEditable={canEditMoa}
                                        suppressContentEditableWarning
                                        onFocus={() => {
                                          termsEditingRef.current = true;
                                        }}
                                        onInput={(e) => {
                                          termsEditingRef.current = true;
                                          setTermsText(e.currentTarget.innerText ?? "");
                                        }}
                                        onBlur={(e) => {
                                          termsEditingRef.current = false;
                                          setTermsText(e.currentTarget.innerText ?? "");
                                        }}
                                        className="whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-800 text-justify outline-none select-text py-1"
                                      />

                                      <p className="italic font-bold text-zinc-800 text-[9px] text-center">
                                        {renderEditableLabel("termsDeclaration", "italic font-bold text-zinc-800 text-[9px] text-center block w-full")}
                                      </p>

                                    </div>
                                    <div className="moa-terms-footer">
                                      {/* Signatures block */}
                                      <div className="moa-terms-signatures grid grid-cols-[1.2fr_1.5fr] gap-8 pt-2 items-start">
                                        <div className="moa-signature-block text-center">
                                          <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                          {renderEditableLabel("sellerSignature", "moa-signature-label uppercase font-bold text-zinc-500 text-center block w-full text-[6.5px]", "-terms-left")}
                                        </div>

                                        <div className="text-center flex flex-col items-center space-y-1.5">
                                          {renderEditableLabel("authorizedText", "font-bold uppercase text-[8.5px] text-zinc-950 block tracking-wide text-center w-full")}
                                          {renderEditableLabel("authorizedSubtext", "text-[7.5px] text-zinc-500 block leading-tight text-center w-full")}

                                          <div className="moa-signature-block w-full">
                                            <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                            {renderEditableLabel("representativeSignature", "moa-signature-label uppercase font-bold text-zinc-500 text-center block w-full text-[6.5px]")}
                                          </div>

                                          <div className="moa-signature-block w-full">
                                            <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                            {renderEditableLabel("sellerSignature", "moa-signature-label uppercase font-bold text-zinc-500 text-center block w-full text-[6.5px]", "-terms-right")}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Received Section */}
                                      <div className="moa-terms-received pt-2 space-y-2 border-t border-zinc-100">
                                        <div className="text-[8.5px] leading-tight text-zinc-800 font-medium text-left">
                                          {renderEditableLabel("termsReceivedText", "text-[8.5px] leading-tight text-zinc-800 font-medium text-left block w-full")}
                                          <br />
                                          {renderEditableLabel("termsReceivedPresence", "text-[8.5px] leading-tight text-zinc-800 font-medium text-left block w-full")}
                                        </div>
                                        <div className="w-1/2">
                                          <div className="moa-signature-block w-full">
                                            <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                            {renderEditableLabel("sellerSignature", "moa-signature-label uppercase font-bold text-zinc-500 text-center block w-full text-[6.5px]", "-terms-received")}
                                          </div>
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
                                      <h2 className="text-center font-bold uppercase text-[11px] text-zinc-800 leading-none">
                                        {topLabels.termsHeading}
                                      </h2>

                                      <div
                                        className="whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-700 text-justify"
                                      >
                                        {topLabels.termsPreamble}
                                      </div>

                                      <div className="whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-800 text-justify py-1">
                                        {resolvedTermsText}
                                      </div>

                                      <p className="italic font-bold text-zinc-800 text-[9px] text-center">
                                        {topLabels.termsDeclaration}
                                      </p>

                                    </div>
                                    <div className="moa-terms-footer">
                                      {/* Signatures block */}
                                      <div className="moa-terms-signatures grid grid-cols-[1.2fr_1.5fr] gap-8 pt-2 items-start">
                                        <div className="moa-signature-block text-center">
                                          <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                          <span className="moa-signature-label uppercase font-bold text-zinc-500">{topLabels.sellerSignature}</span>
                                        </div>

                                        <div className="text-center flex flex-col items-center space-y-1.5">
                                          <span className="font-bold uppercase text-[8.5px] text-zinc-950 block tracking-wide">{topLabels.authorizedText}</span>
                                          <span className="text-[7.5px] text-zinc-500 block leading-tight">{topLabels.authorizedSubtext}</span>

                                          <div className="moa-signature-block w-full">
                                            <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                            <span className="moa-signature-label uppercase font-bold text-zinc-500">{topLabels.representativeSignature}</span>
                                          </div>

                                          <div className="moa-signature-block w-full">
                                            <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                            <span className="moa-signature-label uppercase font-bold text-zinc-500">{topLabels.sellerSignature}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Received Section */}
                                      <div className="moa-terms-received pt-2 space-y-2 border-t border-zinc-100">
                                        <p className="text-[8.5px] leading-tight text-zinc-800 font-medium text-left">
                                          {topLabels.termsReceivedText}<br />
                                          {topLabels.termsReceivedPresence}
                                        </p>
                                        <div className="w-1/2">
                                          <div className="moa-signature-block w-full">
                                            <div className={MOA_SIGNATURE_LINE_CLASS} aria-hidden="true" />
                                            <span className="moa-signature-label uppercase font-bold text-zinc-500 text-center block w-full text-[6.5px]">{topLabels.sellerSignature}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </MoaPaperScale>
                        </>
                    </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 rounded-xl border border-border-main bg-white px-3 py-3 shadow-sm dark:bg-zinc-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
                  <p className="min-w-0 flex-1 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {moaDirty ? (
                      <span className="font-bold text-amber-700">Unsaved changes.</span>
                    ) : (
                      <span>All changes saved locally to template.</span>
                    )}{" "}
                    Eye icon = preview · Save / Send applies to branches.
                    {moaDocumentType !== "moa" ? (
                      <span className="ml-1 text-sky-700">
                        ({activeDocumentLabel} design is stored separately from MOA.)
                      </span>
                    ) : null}
                  </p>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                    <ActionButton
                      onClick={() => void handleSaveMoa()}
                      disabled={!isSuperAdmin || isSavingMoa}
                      variant="success"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isSavingMoa ? "Saving…" : moaDirty ? "Save Slip Template *" : "Save Slip Template"}
                    </ActionButton>
                    <ActionButton
                      onClick={handleSendToAllBranches}
                      disabled={sendStatus === "sending" || !isSuperAdmin}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {sendStatus === "sending"
                        ? "Sending to All Branches..."
                        : "Send to All Branches"}
                    </ActionButton>
                  </div>
                </div>

                {(moaSavedAt || sendStatus === "sent") && (
                  <div className="rounded-md border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-[10px] text-brand-green">
                    {moaSavedAt && <span>Template saved: {moaSavedAt}. </span>}
                    {sendStatus === "sent" && <span>Slip template sent to all branches.</span>}
                  </div>
                )}
              </div>
            </section>
          )}

        </div>

        <TransactionConfirmModal
          isOpen={moaConfirm !== null}
          title={moaConfirm?.title ?? ""}
          message={moaConfirm?.message ?? ""}
          confirmLabel={moaConfirm?.confirmLabel ?? "Confirm"}
          onClose={() => {
            moaConfirm?.resolve(false);
            setMoaConfirm(null);
          }}
          onConfirm={() => {
            moaConfirm?.resolve(true);
            setMoaConfirm(null);
          }}
        />

        <MoaDesignViewModal
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          design={getCurrentMoaDesign()}
          values={createSampleMoaFieldValues(shopSettings)}
          title={topLabels.moaTitle || "Slip Template Preview"}
          subtitle="View only — sample data · same layout as New Pawn Transaction"
        />

        {activeTab === "Profile" && (
          <aside className="min-w-0 space-y-4">
            <section className="rounded-xl border border-border-main bg-surface p-4 text-center shadow-sm">
              <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-border-main bg-surface-secondary">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt="Profile avatar"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                    {adminInitials}
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">{profileFullName || "Admin Panel"}</h3>
              <p className="mt-1 text-[10px] text-zinc-700 dark:text-zinc-400">Super Admin Settings</p>
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="mt-3 w-full rounded-lg border border-brand-green/20 bg-brand-green/10 py-2 text-[9px] font-bold uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/20 dark:border-brand-green/30 dark:bg-brand-green/15"
              >
                Change Avatar
              </button>
              {avatarToast && (
                <p className="mt-2 text-[10px] font-medium text-brand-green">{avatarToast}</p>
              )}
              <PasswordChangeRequestCard />
              <div className="mt-4 rounded-xl border border-brand-green/20 bg-brand-green/10 p-4 text-left dark:border-brand-green/30 dark:bg-brand-green/15">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-green">
                  Security Restriction
                </p>
                <p className="mt-2 text-xs leading-5 text-brand-green">
                  System settings are available only to Super Admin users. Updates here affect the shared shop profile and pawnshop policy defaults.
                </p>
              </div>
            </section>
          </aside>
        )}
      </div>

      <style jsx global>{`
        @media print {
          ${MOA_PRINT_CSS}

          /* Hide everything on the page except the MOA papers */
          body > *,
          body > * > *,
          #__next > * {
            visibility: hidden !important;
          }

          /* Show only the moa paper containers */
          .moa-print-page,
          .moa-print-page * {
            visibility: visible !important;
          }
        }
        .moa-paper-effect {
          background-color: white !important;
          color: #18181b !important;
          color-scheme: light !important;
        }
        .moa-print-page.moa-slip-sheet.moa-paper-effect {
          overflow: hidden !important;
          width: ${MOA_LEGAL_PAGE.width} !important;
          height: ${MOA_LEGAL_PAGE.height} !important;
          max-height: ${MOA_LEGAL_PAGE.height} !important;
          min-height: ${MOA_LEGAL_PAGE.height} !important;
        }
        .moa-settings-paper.moa-slip-sheet {
          overflow: hidden !important;
          height: ${MOA_LEGAL_PAGE.screenHeightPx}px !important;
          max-height: ${MOA_LEGAL_PAGE.screenHeightPx}px !important;
          min-height: ${MOA_LEGAL_PAGE.screenHeightPx}px !important;
        }
        .moa-settings-paper,
        .moa-settings-paper * {
          box-sizing: border-box;
        }
        .moa-settings-paper {
          overflow-wrap: anywhere;
        }
        .moa-settings-paper input,
        .moa-settings-paper [contenteditable="true"],
        .moa-settings-paper .moa-resizable-line {
          max-width: 100%;
        }
        .moa-paper-effect input {
          min-width: 0;
          font-size: 9px !important;
          line-height: 1.2 !important;
        }
        /* Force identical sizing for both Original & Customer agreement paragraphs
           (text + fill-in blanks). 3-class selector beats compact/input overrides. */
        .moa-settings-paper .moa-slip-copy .moa-agreement-text,
        .moa-settings-paper .moa-slip-copy .moa-agreement-text * {
          font-size: 8px !important;
          line-height: 1.3 !important;
        }
        .moa-settings-paper .moa-slip-copy .moa-agreement-text input {
          height: auto !important;
        }
        .moa-paper-effect .moa-title-input {
          font-size: 14px !important;
        }
        .moa-paper-effect .bg-zinc-50\/50 { background-color: #f9fafb !important; }
        .moa-paper-effect .text-zinc-500 { color: #71717a !important; }
        .moa-paper-effect .text-zinc-400 { color: #a1a1aa !important; }
        .moa-paper-effect .text-emerald-900 { color: var(--brand-green) !important; }
        .moa-paper-effect .border-zinc-100 { border-color: #f4f4f5 !important; }
        .moa-paper-effect .border-zinc-200 { border-color: #e4e4e7 !important; }
        .moa-paper-effect .border-zinc-300 { border-color: #d4d4d8 !important; }
        .moa-paper-effect .border-zinc-400 { border-color: #a1a1aa !important; }
        .moa-paper-effect .bg-emerald-50 { background-color: color-mix(in oklab, var(--brand-green) 8%, white) !important; }
        .moa-paper-effect .text-emerald-950 { color: var(--brand-green) !important; }
        .moa-paper-effect .text-emerald-800 { color: var(--brand-green) !important; }
        .moa-paper-effect .bg-white\/30 { background-color: rgba(255, 255, 255, 0.3) !important; }
        .moa-paper-effect .bg-white\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
        .moa-paper-effect .bg-white\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
        .moa-paper-effect input { color: #18181b !important; }
        .moa-paper-effect .border-emerald-900\/40 { border-color: color-mix(in oklab, var(--brand-green) 40%, transparent) !important; }
        .moa-paper-effect .moa-signature-line {
          display: block !important;
          min-height: 22px !important;
          height: 22px !important;
          border-bottom: 1.5px solid #27272a !important;
          flex-shrink: 0 !important;
        }
        ${MOA_PRINT_SCREEN_CSS}
      `}</style>



      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        isSaving={isSavingAvatar}
        currentAvatarUrl={user?.avatarUrl}
        onClose={() => {
          if (!isSavingAvatar) {
            setIsAvatarModalOpen(false);
          }
        }}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
