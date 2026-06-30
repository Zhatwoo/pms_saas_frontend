"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { PasswordChangeRequestCard } from "@/components/shared/password-change-request-card";
import { AvatarPickerModal } from "@/components/shared/avatar-picker-modal";
import { ActionButton } from "@/components/shared/action-button";
import { NotificationSoundSettings } from "@/components/shared/notification-sound-settings";
import { fetchCategories } from "@/lib/categories";
import { MOA_LEGAL_PAGE, MOA_PRINT_CSS, MOA_WATERMARK_CSS } from "@/lib/print-templates";
import { InterestRatesSettings } from "./_components/interest-rates-settings";
import CategoriesSettings from "./_components/categories-settings";

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
        className={`block w-full bg-transparent text-[10px] outline-none disabled:pointer-events-none px-0.5 leading-none m-0 p-0 ${canEdit ? "hover:bg-emerald-50 focus:bg-emerald-50" : ""}`}
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
          <span className="inline-block h-3 w-0.5 rounded-full bg-emerald-400" />
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
};

const DEFAULT_MOA_CATEGORY = "__default__";

const DEFAULT_TERMS_TEXT = `1. This Memorandum of agreement is renewable every TEN (10) days.
2. The Seller shall advise the Buyer of any change of address or mobile number.
3. This is not a PAWN; this is an extended purchase sale known as the buyback agreement.
4. JCLB BUY BACK SHOP OPC has the right to open the sealed item and put on display and dispose this item which way it desires without any further notice after the extension period expires (repurchased back).
5. JCLB BUY BACK SHOP OPC will not be held liable for any loss or damages on this item caused by long time non-usage, ACT of NATURE and any FORTUITOUS EVENTS that may occur without fault or negligence on its part during the storage period as long as the original signed seal and wrapping are untampered.
6. That the seller declares under the penalty of the anti-fencing law that he is the owner of the item(s) subject of the agreement and in no event will JCLB BUY BACK SHOP OPC be liable to any third-party claiming ownership of the item(s)
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
  "moa-print-page moa-paper-effect moa-settings-paper mx-auto min-h-[1344px] w-full max-w-[816px] min-w-0 flex-none space-y-4 overflow-y-auto overflow-x-hidden border border-zinc-300 bg-white text-[9.5px] leading-normal text-zinc-800 shadow-md";

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
  const [isMoaLocked, setIsMoaLocked] = useState(false);
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
      "agree to transfer and convey, by way of sale with a right to repurchase back the ownership over the following unit under JCLB BUY BACK SHOP OPC for THIRTY (30) days from the date of purchase. If I have repurchased the above unit, I shall pay the amount of",
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
    termsPreamble: "You must be pledging to JCLB BUY BACK SHOP OPC, mobile phones, laptop computers, appliances, bike, motor vehicle and other electronic devices or other property or items, otherwise (individually, an \"item\"), or otherwise conducting business with JCLB BUY BACK SHOP OPC. You should have valid proofs of identity and should be voluntarily agreeing to be legally bound by these terms and conditions JCLB BUY BACK SHOP OPC may request documentation of other proof of compliance that you are the real owner of the item(s). You agree to and will identify and hold harmless JCLB BUY BACK SHOP OPC from and against any claims, suits, investigations, judgment, liabilities, obligations and damages relating to or arising out of the title to, ownership of or lien on any item sold or purported or arranged to be sold by you JCLB BUY BACK SHOP OPC. After the verification of your item(s), JCLB BUY BACK SHOP OPC will in its sole discretion, pay in cash that constitutes the payment for item(s) purchased by JCLB BUY BACK SHOP OPC. Upon receipt of cash from JCLB BUY BACK SHOP OPC, you will be legally bound by the sale transaction and you will not have the opportunity or right to rescind the transaction or repurchased your item(s) back from JCLB BUY BACK SHOP OPC without paying the purchased amount and storage fee for THIRTY (30) DAYS which run from the time you received the payment.",
    sellerSignature: "(Name, signature and contact number of Seller)",
    authorizedText: "I HEREBY AUTHORIZED",
    representativeSignature: "(JCLB Representative)",
  });
  const [extensionRows, setExtensionRows] = useState<ExtensionRow[]>([
    { date: "", storage: "", period: "1st Period", periodValue: "", extend: "", sign: "" },
    { date: "", storage: "", period: "2nd Period", periodValue: "", extend: "", sign: "" },
    { date: "", storage: "", period: "3rd Period", periodValue: "", extend: "", sign: "" },
  ]);
  const [isTopHeaderSwapped, setIsTopHeaderSwapped] = useState(false);
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
  const initialTopLabelsRef = useRef(topLabels);
  const initialExtensionRowsRef = useRef(extensionRows);

  const [shopSettings, setShopSettings] = useState({
    shopName: "JCLB BUY BACK SHOP",
    shopAddress: "123 Main Street, Manila, Philippines",
    phoneNumber: "+63 2 1234 5678",
    email: "info@jclbbuyback.com",
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
    shopName: "JCLB BUY BACK SHOP",
    shopAddress: "123 Main Street, Manila, Philippines",
    phoneNumber: "+63 2 1234 5678",
    email: "info@jclbbuyback.com",
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

  const canEditMoa = isSuperAdmin && isMoaEditMode && !isMoaLocked;
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
        height: '14px',
        minWidth: 48,
      }}
    >
      <span className="truncate text-[10px] m-0 p-0">{value}</span>
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

  const getCurrentMoaTemplate = (): MoaTemplateVariant => ({
    terms_text: resolvedTermsText,
    labels: { ...topLabels },
    lineWidths: { ...lineWidths },
    extensionRows: extensionRows.map((row) => ({ ...row })),
    financialFields: [...financialFields],
    unitFields: [...unitFields],
    customFinancialFields: customFinancialFields.map((field) => ({ ...field })),
    customUnitFields: customUnitFields.map((field) => ({ ...field })),
  });

  const applyMoaTemplate = (template: MoaTemplateVariant) => {
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
    applyMoaTemplate(nextTemplate);
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

  const handleApplyMoaToAllCategories = () => {
    if (!canEditMoa || moaCategories.length === 0) return;

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
        },
      ]),
    );

    setCategoryMoaTemplates(templatesForAllCategories);
    setDefaultMoaTemplate(currentTemplate);
    setMoaSavedAt(null);
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

  const handleSaveMoa = async () => {
    try {
      const currentTemplate = getCurrentMoaTemplate();
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
      });
      setDefaultMoaTemplate(nextDefaultTemplate);
      setCategoryMoaTemplates(nextCategoryTemplates);
      setMoaSavedAt(new Date().toLocaleString());
    } catch (error) {
      console.error("Failed to save MOA template:", error);
      alert("Failed to save MOA template. Please try again.");
    }
  };

  const handleSendToAllBranches = async () => {
    setSendStatus("sending");
    try {
      const currentTemplate = getCurrentMoaTemplate();
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

      // `moa_template` is a global setting; saving here applies to all branches.
      await api.post(`/settings/moa_template`, {
        ...nextDefaultTemplate,
        category_templates: nextCategoryTemplates,
      });

      setDefaultMoaTemplate(nextDefaultTemplate);
      setCategoryMoaTemplates(nextCategoryTemplates);
      setMoaSavedAt(new Date().toLocaleString());
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 2500);
    } catch (error) {
      console.error("Failed to send to all branches:", error);
      setSendStatus("idle");
      alert("Failed to send to all branches. Your changes might not have been saved.");
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
  ) => {
    const isInline = className.split(" ").includes("inline");
    const hasExplicitWidth = className.split(" ").some((c) => /^w-/.test(c));
    const sanitizedClassName = className
      .split(" ")
      .filter((part) => part !== "inline")
      .join(" ");

    if (isInline) {
      return (
        <span
          key={`${selectedMoaCategory}-${field}`}
          contentEditable={canEditMoa}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (canEditMoa) updateTopLabel(field, e.currentTarget.textContent || "");
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className={`${sanitizedClassName} inline outline-none ${canEditMoa ? "border-b border-dashed border-emerald-400 bg-emerald-50/30 cursor-text" : ""}`}
        >
          {topLabels[field]}
        </span>
      );
    }

    return (
      <input
        value={topLabels[field]}
        onChange={(e) => updateTopLabel(field, e.target.value)}
        readOnly={!canEditMoa}
        tabIndex={canEditMoa ? 0 : -1}
        spellCheck={false}
        className={`${sanitizedClassName} ${hasExplicitWidth ? "block shrink-0" : "block w-full"} border-none bg-transparent p-0 text-inherit outline-none ${!canEditMoa ? "pointer-events-none" : "hover:bg-emerald-50/30 focus:bg-emerald-50/50"}`}
      />
    );
  };

  return (
    <div className="w-full max-w-none space-y-6 [&_button]:text-sm [&_h2]:text-sm [&_h3]:text-base [&_input]:text-sm [&_label]:text-xs [&_p]:text-sm [&_span]:text-xs">
      <div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-border-main bg-surface p-1 sm:w-fit">
        {["Profile", "Notifications", "Shop", "Manage Categories", "MOA"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-md px-6 py-2 font-bold transition-all ${activeTab === tab
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`grid w-full gap-6 ${activeTab === "Profile" ? "2xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <div className="min-w-0 space-y-6">
          {profileToast && (
            <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
              <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl">
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
                        className="rounded-lg border border-input-border px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
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
                  className="rounded-lg bg-emerald-700 px-6 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
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
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                        ? "border-emerald-500 bg-surface shadow-sm focus:ring-1 focus:ring-emerald-500 text-text-primary"
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
                        ? "border-emerald-500 bg-surface shadow-sm focus:ring-1 focus:ring-emerald-500 text-text-primary"
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
                          ? "border-emerald-500 bg-surface shadow-sm focus:ring-1 focus:ring-emerald-500 text-text-primary"
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
                          ? "border-emerald-500 bg-surface shadow-sm focus:ring-1 focus:ring-emerald-500 text-text-primary"
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
              <InterestRatesSettings />
              <CategoriesSettings />
            </>
          )}

          {activeTab === "MOA" && (
            <section className="overflow-visible rounded-xl border border-border-main bg-surface pb-4 shadow-sm">
              <div className="border-b border-border-main px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Memorandum of Agreement Template</h2>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    Super Admin Only
                  </span>
                </div>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      setIsMoaEditMode((v) => {
                        const next = !v;
                        if (next) {
                          setIsMoaLocked(false);
                        }
                        return next;
                      })
                    }
                    disabled={!isSuperAdmin}
                    className={`rounded-lg px-4 py-2 text-[11px] font-bold transition-colors ${isMoaEditMode
                        ? "border border-emerald-700 bg-emerald-700 text-white"
                        : "border border-border-main bg-surface-secondary text-zinc-700 hover:bg-surface-hover dark:text-zinc-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isMoaEditMode ? "Exit Edit Mode" : "Edit Mode"}
                  </button>

                  <label className={`inline-flex items-center gap-2 rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isMoaLocked}
                      onChange={(e) => setIsMoaLocked(e.target.checked)}
                      disabled={!isSuperAdmin}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
                    />
                    Lock Template (Prevent Editing)
                  </label>

                  <button
                    onClick={() => setIsTopHeaderSwapped((v) => !v)}
                    disabled={!isSuperAdmin}
                    className="rounded-lg border border-border-main bg-surface-secondary px-3 py-2 text-[11px] font-bold text-zinc-700 transition-colors hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed dark:text-zinc-300"
                  >
                    {isTopHeaderSwapped ? "Default Header Layout" : "Interchange Top Fields"}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyMoaToAllCategories}
                    disabled={!canEditMoa || moaCategories.length === 0}
                    className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply to All Categories
                  </button>

                

                </div>

                {isMoaEditMode && (
                  <div className="overflow-x-auto rounded-lg border border-border-main bg-surface-secondary p-1.5">
                    <div className="flex min-w-max items-center gap-1.5">
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
                                ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                                : "border-border-main bg-surface text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:text-zinc-300"
                              }`}
                          >
                            {category.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isMoaEditMode && selectedMoaCategory !== DEFAULT_MOA_CATEGORY && (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-medium text-emerald-800">
                    Editing the MOA used for <strong>{selectedMoaCategory}</strong> transactions.
                  </p>
                )}

                <div className="overflow-hidden rounded-md border border-border-main bg-surface-secondary p-2 shadow-inner sm:p-4 lg:p-6 dark:bg-surface-secondary">
                  <div className="flex min-w-0 flex-col items-stretch gap-6 xl:flex-row xl:items-start xl:justify-center">
                    <div className="flex flex-col gap-6 flex-1 max-w-[816px]">
                      {/* PAGE 1: SLIPS (Original & Customer Copy) */}
                      <div
                        className={MOA_SETTINGS_PAPER_CLASS}
                        style={{ padding: MOA_LEGAL_PAGE.padding, boxSizing: "border-box" }}
                      >

                        {/* ORIGINAL COPY (Top Half) */}
                        <div className="space-y-2 relative moa-watermark pb-1">
                          {/* Row 1: Branch Info (centered) */}
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
                          </div>

                          {/* Row 2: Copy type + Unit Code */}
                          <div className="flex items-center justify-between gap-3 pt-1">
                            {renderEditableLabel("originalCopy", "font-bold italic text-[9.5px]")}
                            <div className="flex items-center gap-1 text-[9.5px]">
                              {renderEditableLabel("unitCode", "font-bold uppercase whitespace-nowrap")}
                              {RL("unitCode", moaFields.unitCode, (v) => updateMoaField("unitCode", v), 100)}
                            </div>
                          </div>

                          {/* Centered Slip Title */}
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

                          {/* Dates grid */}
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

                          {/* Agreement Paragraph */}
                          <div className="space-y-1.5 leading-relaxed text-justify text-[9px] px-1 select-text">
                            <div>
                              {renderEditableLabel("customerIntro", "inline")} {RL("customerName", moaFields.customerName, (v) => updateMoaField("customerName", v), 180)} {renderEditableLabel("legalAgeResident", "inline")} {RL("customerAddress", moaFields.customerAddress, (v) => updateMoaField("customerAddress", v), 220)}. For the amount of {RL("amountInWords", moaFields.principalAmount || "", (v) => updateMoaField("principalAmount", v), 130)} (P {RL("amountInFigures", moaFields.amount || "", (v) => updateMoaField("amount", v), 80)}) {renderEditableLabel("agreementText", "inline")} for THIRTY (30) days from the date of purchase. {renderEditableLabel("repayIntro", "inline")} (P {RL("repurchaseAmount", moaFields.amount || "", (v) => updateMoaField("amount", v), 80)}) {renderEditableLabel("plusText", "inline")} (P {RL("storageFeeValue", moaFields.storageFee || "", (v) => updateMoaField("storageFee", v), 80)}) {renderEditableLabel("storageFeeText", "inline")} {RL("penaltyAmountText", moaFields.penaltyAmount || "", (v) => updateMoaField("penaltyAmount", v), 80)} (P {RL("penaltyAmount", moaFields.penaltyAmount || "", (v) => updateMoaField("penaltyAmount", v), 60)}) and you are given 5 days grace period ({RL("gracePeriod", moaFields.expiryDate || "", (v) => updateMoaField("expiryDate", v), 100)}) my right to repurchase back the unit(s) described below is deemed waived.
                            </div>
                          </div>

                          {/* Unit Description & Financial Fields */}
                          <div className="border-y border-zinc-200 py-2 my-2 space-y-2 bg-zinc-50/30">
                            <p className="font-bold text-center underline text-[9.5px]">{renderEditableLabel("unitDescription", "inline")}</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 px-3">
                              {/* Left column: Financial fields */}
                              <div className="space-y-1">
                                {FINANCIAL_FIELD_OPTIONS.filter((field) =>
                                  financialFields.includes(field.key),
                                ).map((field) => (
                                  <div key={field.key} className="space-y-0.5">
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                                      {renderEditableLabel(field.key, "font-semibold text-zinc-500 uppercase text-[8px]")}
                                      {RL(
                                        field.key,
                                        moaFields[field.valueKey],
                                        (value) => updateMoaField(field.valueKey, value),
                                        100
                                      )}
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
                                    {RL(`custom-financial-${field.id}`, "", () => undefined, 100)}
                                  </div>
                                ))}
                              </div>

                              {/* Right column: Unit description */}
                              <div className="space-y-1">
                                {UNIT_FIELD_OPTIONS.filter((field) =>
                                  unitFields.includes(field.key),
                                ).map((field) => (
                                  <div key={field.key} className="grid grid-cols-[92px_1fr] items-center gap-1">
                                    {renderEditableLabel(field.key, "font-semibold text-zinc-500 uppercase text-[8px]")}
                                    {RL(
                                      field.key,
                                      moaFields[field.valueKey],
                                      (value) => updateMoaField(field.valueKey, value),
                                      100
                                    )}
                                  </div>
                                ))}
                                {customUnitFields.map((field) => (
                                  <div key={field.id} className="grid grid-cols-[92px_1fr] items-center gap-1">
                                    <span className="font-semibold text-zinc-500 uppercase text-[8px]">{field.label}:</span>
                                    {RL(`custom-unit-${field.id}`, "", () => undefined, 100)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Signatures */}
                          <div className="grid grid-cols-2 gap-12 pt-3 text-center">
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

                        {/* Middle Cut Guide */}
                        <div className="relative my-4 flex items-center justify-center border-t border-dashed border-zinc-400 py-1 select-none pointer-events-none">
                          <span className="absolute bg-white px-2 text-[8px] font-bold text-zinc-400 tracking-wider">
                            ✂ - - - - - - - - - - - - - - - - - - - - - - - CUT HERE - - - - - - - - - - - - - - - - - - - - - - - ✂
                          </span>
                        </div>

                        {/* CUSTOMER COPY (Bottom Half) */}
                        <div className="space-y-2 pt-2 relative moa-watermark pb-1">
                          {/* Row 1: Branch Info (centered) */}
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
                          </div>

                          {/* Row 2: Copy type + Unit Code */}
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <span className="font-bold italic text-[9.5px]">Customer copy</span>
                            <div className="flex items-center gap-1 text-[9.5px]">
                              <span className="font-bold uppercase whitespace-nowrap">{topLabels.unitCode}</span>
                              {CL("unitCode", moaFields.unitCode, 100)}
                            </div>
                          </div>

                          {/* Centered Slip Title */}
                          <div className="text-center font-bold uppercase tracking-wider text-[11px] py-0.5 text-zinc-800">
                            {topLabels.moaTitle}
                          </div>

                          {/* Dates grid */}
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

                          {/* Agreement Paragraph */}
                          <div className="space-y-1.5 leading-relaxed text-justify text-[9px] px-1 select-text">
                            <p>
                              {topLabels.customerIntro} {CL("customerName", moaFields.customerName, 180)} {topLabels.legalAgeResident} {CL("customerAddress", moaFields.customerAddress, 220)}. For the amount of {CL("amountInWords", moaFields.principalAmount || "", 130)} (P {CL("amountInFigures", moaFields.amount || "", 80)}) {topLabels.agreementText} for THIRTY (30) days from the date of purchase. {topLabels.repayIntro} (P {CL("repurchaseAmount", moaFields.amount || "", 80)}) {topLabels.plusText} (P {CL("storageFeeValue", moaFields.storageFee || "", 80)}) {topLabels.storageFeeText} {CL("penaltyAmountText", moaFields.penaltyAmount || "", 80)} (P {CL("penaltyAmount", moaFields.penaltyAmount || "", 60)}) and you are given 5 days grace period ({CL("gracePeriod", moaFields.expiryDate || "", 100)}) my right to repurchase back the unit(s) described below is deemed waived.
                            </p>
                          </div>

                          {/* Unit Description & Financial Fields */}
                          <div className="border-y border-zinc-200 py-2 my-2 space-y-2 bg-zinc-50/30">
                            <p className="font-bold text-center underline text-[9.5px]">{topLabels.unitDescription}</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 px-3">
                              {/* Left column: Financial fields */}
                              <div className="space-y-1">
                                {FINANCIAL_FIELD_OPTIONS.filter((field) =>
                                  financialFields.includes(field.key),
                                ).map((field) => (
                                  <div key={field.key} className="space-y-0.5">
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                                      <span className="font-semibold text-zinc-500 uppercase text-[8px]">{topLabels[field.key]}</span>
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

                              {/* Right column: Unit description */}
                              <div className="space-y-1">
                                {UNIT_FIELD_OPTIONS.filter((field) =>
                                  unitFields.includes(field.key),
                                ).map((field) => (
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
                            </div>
                          </div>

                          {/* Signatures */}
                          <div className="grid grid-cols-2 gap-12 pt-3 text-center">
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

                      {/* PAGE 2: TERMS AND CONDITIONS */}
                      <div
                        className={MOA_SETTINGS_PAPER_CLASS}
                        style={{ padding: MOA_LEGAL_PAGE.padding, boxSizing: "border-box" }}
                      >

                        {/* Top Copy (Original terms) */}
                        <div className="space-y-3 relative moa-watermark pb-2">
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
                            className="min-h-[120px] whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-800 text-justify outline-none select-text py-1"
                          />

                          <p className="italic font-bold text-zinc-800 text-[9px]">
                            I hereby declare that the item mentioned in front of this document are my personal property and free from any liens and encumbrances.
                          </p>

                          {/* Signatures block */}
                          <div className="grid grid-cols-[1.2fr_1.5fr] gap-8 pt-4 items-end">
                            <div className="text-center flex flex-col items-center">
                              <div className="w-full border-b border-zinc-400 h-6"></div>
                              <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1">(Name and signature of Seller)</span>
                            </div>

                            <div className="text-center flex flex-col items-center space-y-3">
                              <span className="font-bold uppercase text-[8.5px] text-zinc-950 block tracking-wide">{topLabels.authorizedText}</span>
                              <span className="text-[7.5px] text-zinc-500 block leading-tight">Whose name and signature appears below to repurchase my item(s) covered by this MOA in my behalf.</span>

                              <div className="w-full">
                                <div className="w-full border-b border-zinc-400 h-6"></div>
                                <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1 block">(Name and signature of Representative)</span>
                              </div>

                              <div className="w-full">
                                <div className="w-full border-b border-zinc-400 h-6"></div>
                                <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1 block">(Name and signature of Seller)</span>
                              </div>
                            </div>
                          </div>

                          {/* Received Section */}
                          <div className="pt-4 space-y-3 border-t border-zinc-100">
                            <p className="text-[8.5px] leading-tight text-zinc-800 font-medium">
                              Received the article(s) in the same condition when sold and repurchased back.<br />
                              (Signed in the presence of JCLB BUY BACK SHOP OPC owner/employee)
                            </p>
                            <div className="w-1/2">
                              <div className="w-full border-b border-zinc-400 h-6"></div>
                              <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1 block">(Name and signature of Seller)</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Cut Guide */}
                        <div className="relative my-6 flex items-center justify-center border-t border-dashed border-zinc-400 py-1 select-none pointer-events-none">
                          <span className="absolute bg-white px-2 text-[8px] font-bold text-zinc-400 tracking-wider">
                            ✂ - - - - - - - - - - - - - - - - - - - - - - - CUT HERE - - - - - - - - - - - - - - - - - - - - - - - ✂
                          </span>
                        </div>

                        {/* Bottom Copy (Customer terms) */}
                        <div className="space-y-3 pt-2 relative moa-watermark pb-2">
                          <h2 className="text-center font-bold uppercase text-[11px] text-zinc-800 leading-none">
                            {topLabels.termsHeading}
                          </h2>

                          <div
                            className="whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-700 text-justify"
                          >
                            {topLabels.termsPreamble}
                          </div>

                          <div className="min-h-[120px] whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-800 text-justify py-1">
                            {resolvedTermsText}
                          </div>

                          <p className="italic font-bold text-zinc-800 text-[9px]">
                            I hereby declare that the item mentioned in front of this document are my personal property and free from any liens and encumbrances.
                          </p>

                          {/* Signatures block */}
                          <div className="grid grid-cols-[1.2fr_1.5fr] gap-8 pt-4 items-end">
                            <div className="text-center flex flex-col items-center">
                              <div className="w-full border-b border-zinc-400 h-6"></div>
                              <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1">(Name and signature of Seller)</span>
                            </div>

                            <div className="text-center flex flex-col items-center space-y-3">
                              <span className="font-bold uppercase text-[8.5px] text-zinc-950 block tracking-wide">{topLabels.authorizedText}</span>
                              <span className="text-[7.5px] text-zinc-500 block leading-tight">Whose name and signature appears below to repurchase my item(s) covered by this MOA in my behalf.</span>

                              <div className="w-full">
                                <div className="w-full border-b border-zinc-400 h-6"></div>
                                <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1 block">(Name and signature of Representative)</span>
                              </div>

                              <div className="w-full">
                                <div className="w-full border-b border-zinc-400 h-6"></div>
                                <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1 block">(Name and signature of Seller)</span>
                              </div>
                            </div>
                          </div>

                          {/* Received Section */}
                          <div className="pt-4 space-y-3 border-t border-zinc-100">
                            <p className="text-[8.5px] leading-tight text-zinc-800 font-medium">
                              Received the article(s) in the same condition when sold and repurchased back.<br />
                              (Signed in the presence of JCLB BUY BACK SHOP OPC owner/employee)
                            </p>
                            <div className="w-1/2">
                              <div className="w-full border-b border-zinc-400 h-6"></div>
                              <span className="text-[7.5px] uppercase font-bold text-zinc-500 mt-1 block">(Name and signature of Seller)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isMoaEditMode && (
                      <aside className="w-full xl:w-80 flex-none space-y-4">
                        <div className="space-y-4 rounded-xl border border-border-main bg-surface p-4 shadow-sm">
                          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                            MOA Field Config
                          </h3>
                          <p className="mt-1 text-[9px] leading-4 text-zinc-500">
                            Configure fields for {selectedMoaCategory === DEFAULT_MOA_CATEGORY ? "all categories" : selectedMoaCategory}.
                          </p>
                        </div>

                        <div className="space-y-2 rounded-md border border-zinc-200 p-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-700">Financial Details</p>
                          <div className="space-y-1">
                            {FINANCIAL_FIELD_OPTIONS.map((field) => (
                              <label key={field.key} className="flex items-center gap-2 rounded px-1.5 py-1 text-[10px] font-semibold hover:bg-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={financialFields.includes(field.key)}
                                  onChange={() =>
                                    toggleMoaSectionField(field.key, financialFields, setFinancialFields)
                                  }
                                  disabled={!canEditMoa}
                                  className="h-3.5 w-3.5 accent-emerald-700"
                                />
                                {topLabels[field.key]}
                              </label>
                            ))}
                          </div>
                          {customFinancialFields.map((field) => (
                            <div key={field.id} className="flex items-center gap-1">
                              <input
                                value={field.label}
                                onChange={(event) =>
                                  setCustomFinancialFields((fields) =>
                                    fields.map((currentField) =>
                                      currentField.id === field.id
                                        ? { ...currentField, label: event.target.value }
                                        : currentField,
                                    ),
                                  )
                                }
                                disabled={!canEditMoa}
                                className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-[10px] outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomFinancialFields((fields) =>
                                    fields.filter((currentField) => currentField.id !== field.id),
                                  )
                                }
                                disabled={!canEditMoa}
                                className="rounded px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                aria-label={`Remove ${field.label}`}
                              >
                                X
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-1">
                            <input
                              value={newFinancialField}
                              onChange={(event) => setNewFinancialField(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addCustomMoaField(
                                    newFinancialField,
                                    setNewFinancialField,
                                    setCustomFinancialFields,
                                  );
                                }
                              }}
                              disabled={!canEditMoa}
                              placeholder="New financial field"
                              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                addCustomMoaField(
                                  newFinancialField,
                                  setNewFinancialField,
                                  setCustomFinancialFields,
                                )
                              }
                              disabled={!canEditMoa || !newFinancialField.trim()}
                              className="rounded bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 rounded-md border border-zinc-200 p-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-700">Unit Description</p>
                          <div className="space-y-1">
                            {UNIT_FIELD_OPTIONS.map((field) => (
                              <label key={field.key} className="flex items-center gap-2 rounded px-1.5 py-1 text-[10px] font-semibold hover:bg-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={unitFields.includes(field.key)}
                                  onChange={() =>
                                    toggleMoaSectionField(field.key, unitFields, setUnitFields)
                                  }
                                  disabled={!canEditMoa}
                                  className="h-3.5 w-3.5 accent-emerald-700"
                                />
                                {topLabels[field.key]}
                              </label>
                            ))}
                          </div>
                          {customUnitFields.map((field) => (
                            <div key={field.id} className="flex items-center gap-1">
                              <input
                                value={field.label}
                                onChange={(event) =>
                                  setCustomUnitFields((fields) =>
                                    fields.map((currentField) =>
                                      currentField.id === field.id
                                        ? { ...currentField, label: event.target.value }
                                        : currentField,
                                    ),
                                  )
                                }
                                disabled={!canEditMoa}
                                className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-[10px] outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomUnitFields((fields) =>
                                    fields.filter((currentField) => currentField.id !== field.id),
                                  )
                                }
                                disabled={!canEditMoa}
                                className="rounded px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                aria-label={`Remove ${field.label}`}
                              >
                                X
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-1">
                            <input
                              value={newUnitField}
                              onChange={(event) => setNewUnitField(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addCustomMoaField(
                                    newUnitField,
                                    setNewUnitField,
                                    setCustomUnitFields,
                                  );
                                }
                              }}
                              disabled={!canEditMoa}
                              placeholder="New unit field"
                              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                addCustomMoaField(
                                  newUnitField,
                                  setNewUnitField,
                                  setCustomUnitFields,
                                )
                              }
                              disabled={!canEditMoa || !newUnitField.trim()}
                              className="rounded bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </aside>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    This template matches the printed MOA layout. Enable Edit Mode and unlock template to modify any section.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      onClick={handleSaveMoa}
                      disabled={!canEditMoa || !isSuperAdmin}
                      variant="success"
                      size="sm"
                    >
                      Save MOA Template
                    </ActionButton>
                    <ActionButton
                      onClick={handleSendToAllBranches}
                      disabled={sendStatus === "sending" || !isSuperAdmin}
                      variant="outline"
                      size="sm"
                    >
                      {sendStatus === "sending"
                        ? "Sending to All Branches..."
                        : "Send to All Branches"}
                    </ActionButton>
                  </div>
                </div>

                {(moaSavedAt || sendStatus === "sent") && (
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    {moaSavedAt && <span>Template saved: {moaSavedAt}. </span>}
                    {sendStatus === "sent" && <span>MOA template sent to all branches.</span>}
                  </div>
                )}
              </div>
            </section>
          )}

        </div>

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
                className="mt-3 w-full rounded-lg border border-emerald-100 bg-emerald-50 py-2 text-[9px] font-bold uppercase tracking-wider text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
              >
                Change Avatar
              </button>
              {avatarToast && (
                <p className="mt-2 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">{avatarToast}</p>
              )}
              <PasswordChangeRequestCard />
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left dark:border-emerald-900 dark:bg-emerald-950">
                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
                  Security Restriction
                </p>
                <p className="mt-2 text-xs leading-5 text-emerald-950 dark:text-emerald-100">
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
        .moa-print-page.moa-paper-effect {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          min-height: ${MOA_LEGAL_PAGE.height} !important;
          height: auto !important;
          max-height: none !important;
        }
        @media print {
          .moa-print-page.moa-paper-effect {
            overflow: hidden !important;
            height: ${MOA_LEGAL_PAGE.height} !important;
            max-height: ${MOA_LEGAL_PAGE.height} !important;
          }
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
          font-size: 10px !important;
          line-height: 1.5 !important;
        }
        .moa-paper-effect .moa-title-input {
          font-size: 14px !important;
        }
        .moa-paper-effect .bg-zinc-50\/50 { background-color: #f9fafb !important; }
        .moa-paper-effect .text-zinc-500 { color: #71717a !important; }
        .moa-paper-effect .text-zinc-400 { color: #a1a1aa !important; }
        .moa-paper-effect .text-emerald-900 { color: #064e3b !important; }
        .moa-paper-effect .border-zinc-100 { border-color: #f4f4f5 !important; }
        .moa-paper-effect .border-zinc-200 { border-color: #e4e4e7 !important; }
        .moa-paper-effect .border-zinc-300 { border-color: #d4d4d8 !important; }
        .moa-paper-effect .border-zinc-400 { border-color: #a1a1aa !important; }
        .moa-paper-effect .bg-emerald-50 { background-color: #ecfdf5 !important; }
        .moa-paper-effect .text-emerald-950 { color: #022c22 !important; }
        .moa-paper-effect .text-emerald-800 { color: #065f46 !important; }
        .moa-paper-effect .bg-white\/30 { background-color: rgba(255, 255, 255, 0.3) !important; }
        .moa-paper-effect .bg-white\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
        .moa-paper-effect .bg-white\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
        .moa-paper-effect input { color: #18181b !important; }
        .moa-paper-effect .border-emerald-900\/40 { border-color: rgba(6, 78, 59, 0.4) !important; }
        ${MOA_WATERMARK_CSS}
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
