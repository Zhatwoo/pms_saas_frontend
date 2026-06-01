"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { PasswordChangeRequestCard } from "@/components/shared/password-change-request-card";
import { AvatarPickerModal } from "@/components/shared/avatar-picker-modal";
import { ActionButton } from "@/components/shared/action-button";
import { NotificationSoundSettings } from "@/components/shared/notification-sound-settings";
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
  const spanRef = useRef<HTMLSpanElement>(null);
  const width = storedWidth ?? defaultWidth;

  // Capture actual DOM width when user finishes dragging the resize handle
  const handlePointerUp = () => {
    if (canEdit && spanRef.current) {
      const newWidth = spanRef.current.offsetWidth;
      if (newWidth !== width) onWidthChange(fieldKey, newWidth);
    }
  };

  return (
    <span
      ref={spanRef}
      onPointerUp={handlePointerUp}
      className="inline-block overflow-hidden border-b border-zinc-400 align-bottom"
      style={{
        resize: canEdit ? "horizontal" : "none",
        minWidth: 48,
        maxWidth: 400,
        width,
      }}
      title={canEdit ? "Drag right edge to resize" : undefined}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canEdit}
        className="block w-full h-4 bg-transparent text-[10px] outline-none disabled:pointer-events-none px-0.5 focus:outline-none"
      />
    </span>
  );
}

type ExtensionRow = {
  date: string;
  storage: string;
  period: string;
  extend: string;
  sign: string;
};

const DEFAULT_TERMS_TEXT = `1. This Memorandum of Agreement is renewable every TEN (10) days.
2. The Seller shall advise the Buyer of any change of address or mobile number.
3. This is not a PAWN; this is an extended purchase sale known as the buyback agreement.
4. JCLB BUY BACK SHOP OPC has the right to open the sealed item and put on display and dispose this item after the extension period expires.
5. Unpurchased item and all penalties become binding to this MOA.
6. The seller declares all information and submitted documents are true and authentic.
7. There are no FINANCE or INTEREST charges connected with this MOA.
8. In case of loss of this MOA, bring a valid ID and notarized affidavit before buyback period expires.
9. Representative's signature is required when authorization from owner is used.
10. Seller confirms ownership and freedom from liens and encumbrances.`;

function normalizeMoaTerms(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length < 80) {
    return DEFAULT_TERMS_TEXT;
  }
  return trimmed;
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
    customerIntro: "I, Mr./Mrs.",
    legalAgeResident: "of legal age and a resident of",
    agreementText:
      "agree to transfer and convey by way of sale with a right to repurchase back.",
    repayIntro: "If I have repurchased the above unit, I shall pay the amount of",
    plusText: "plus",
    storageFeeText: "every 10 days as storage fee. Penalty amounting to",
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
    dateHeader: "Date",
    storageHeader: "Storage",
    periodHeader: "Period",
    extendHeader: "Extend",
    signHeader: "Sign",
    adviseText:
      "SELLER IS ADVISED TO READ AND UNDERSTAND THE TERMS AND CONDITIONS ON THE REVERSE SIDE HEREOF",
    termsHeading: "TERMS AND CONDITIONS",
    sellerSignature: "(Name and signature of Seller)",
    authorizedText: "I HEREBY AUTHORIZED",
    representativeSignature: "(Name and signature of Representative)",
  });
  const [extensionRows, setExtensionRows] = useState<ExtensionRow[]>([
    { date: "", storage: "", period: "1st Period", extend: "", sign: "" },
    { date: "", storage: "", period: "2nd Period", extend: "", sign: "" },
    { date: "", storage: "", period: "3rd Period", extend: "", sign: "" },
  ]);
  const [isTopHeaderSwapped, setIsTopHeaderSwapped] = useState(false);
  const [termsText, setTermsText] = useState(DEFAULT_TERMS_TEXT);
  const [moaSavedAt, setMoaSavedAt] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">("idle");

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
        }>(`/settings/moa_template`);
        if (data) {
          setTermsText(normalizeMoaTerms(data.terms_text));
          if (data.labels && typeof data.labels === "object") {
            setTopLabels((prev) => ({ ...prev, ...data.labels }));
          }
          if (data.lineWidths && typeof data.lineWidths === "object") {
            setLineWidths(data.lineWidths);
          }
          if (data.extensionRows && Array.isArray(data.extensionRows)) {
            setExtensionRows(data.extensionRows);
          }
        }
      } catch (error) {
        console.error("Failed to fetch MOA template:", error);
      }
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
    fetchSettings();
  }, []);

  const canEditMoa = isSuperAdmin && isMoaEditMode && !isMoaLocked;
  const resolvedTermsText = normalizeMoaTerms(termsText);

  // Uncontrolled ref for the Terms editor — avoids cursor-jump on every keystroke
  const termsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (termsRef.current) {
      if (termsRef.current.innerText !== resolvedTermsText) {
        termsRef.current.innerText = resolvedTermsText;
      }
    }
  }, [activeTab, resolvedTermsText]);

  // Line widths state — keyed by fieldKey, persisted with MOA template save
  const [lineWidths, setLineWidths] = useState<Record<string, number>>({});
  const handleWidthChange = (key: string, width: number) => {
    setLineWidths((prev) => ({ ...prev, [key]: width }));
  };

  // Helper to render a ResizableLine with tracked width
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
      await api.post(`/settings/moa_template`, {
        terms_text: resolvedTermsText,
        labels: topLabels,
        lineWidths,
        extensionRows,
      });
      setMoaSavedAt(new Date().toLocaleString());
    } catch (error) {
      console.error("Failed to save MOA template:", error);
      alert("Failed to save MOA template. Please try again.");
    }
  };

  const handleSendToAllBranches = async () => {
    setSendStatus("sending");
    try {
      // `moa_template` is a global setting; saving here applies to all branches.
      await api.post(`/settings/moa_template`, {
        terms_text: resolvedTermsText,
        labels: topLabels,
        lineWidths,
        extensionRows,
      });

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

    return (
      <input
        value={topLabels[field]}
        onChange={(e) => updateTopLabel(field, e.target.value)}
        readOnly={!canEditMoa}
        tabIndex={canEditMoa ? 0 : -1}
        spellCheck={false}
        className={`${sanitizedClassName} ${isInline ? "inline-block" : hasExplicitWidth ? "block shrink-0" : "block w-full"} border-none bg-transparent p-0 text-inherit outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
        style={isInline ? { width: `${Math.max(topLabels[field].length + 1, 6)}ch` } : undefined}
      />
    );
  };

  return (
    <div className="w-full max-w-none space-y-6 [&_button]:text-sm [&_h2]:text-sm [&_h3]:text-base [&_input]:text-sm [&_label]:text-xs [&_p]:text-sm [&_span]:text-xs">
      <div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-border-main bg-surface p-1 sm:w-fit">
        {["Profile", "Notifications", "Shop", "Interest Rate", "MOA"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-md px-6 py-2 font-bold transition-all ${
              activeTab === tab
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
                  className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${
                    isShopEditMode
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
                  className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${
                    isShopEditMode
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
                    className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${
                      isShopEditMode
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
                    className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-all duration-200 ${
                      isShopEditMode
                        ? "border-emerald-500 bg-surface shadow-sm focus:ring-1 focus:ring-emerald-500 text-text-primary"
                        : "border-border-main bg-surface-secondary text-text-secondary opacity-80 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>
            </div>
          </section>
          )}

          {activeTab === "Interest Rate" && (
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
                  className={`rounded-lg px-4 py-2 text-[11px] font-bold transition-colors ${
                    isMoaEditMode
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
              </div>

              <div className="overflow-x-auto overflow-y-visible rounded-md border border-border-main bg-surface-secondary p-3 shadow-inner sm:p-6 dark:bg-surface-secondary">
                <div className="moa-paper-effect mx-auto min-h-[1120px] w-[794px] max-w-none space-y-3 border border-emerald-800/70 bg-white p-6 text-[10px] leading-normal text-zinc-800">
                  {/* Row 1: Title + Branch Info (centered) */}
                  <div className="text-center space-y-0.5 pb-3 border-b border-zinc-100">
                    <input
                      value={topLabels.moaTitle}
                      onChange={(e) => updateTopLabel("moaTitle", e.target.value)}
                      readOnly={!canEditMoa}
                      tabIndex={canEditMoa ? 0 : -1}
                      spellCheck={false}
                      className={`block w-full text-center text-sm font-black uppercase underline tracking-widest border-none bg-transparent p-0 outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
                    />
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      {shopSettings.shopName}
                    </p>
                    {shopSettings.shopAddress && (
                      <p className="text-[8px] text-zinc-400">{shopSettings.shopAddress}</p>
                    )}
                    {shopSettings.phoneNumber && (
                      <p className="text-[8px] text-zinc-400">{shopSettings.phoneNumber}</p>
                    )}
                  </div>

                  {/* Row 2: Original Copy | Unit Code */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {renderEditableLabel("originalCopy", "font-semibold")}
                    <div className="min-w-0 flex items-center gap-2 text-[10px]">
                      {renderEditableLabel("unitCode", "font-semibold uppercase whitespace-nowrap")}
                      {RL("unitCode", moaFields.unitCode, (v) => updateMoaField("unitCode", v))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {isTopHeaderSwapped ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("maturityDate", "w-32")}
                            <span>1st</span>
                            {RL("maturityDate1st", moaFields.maturityDate1st, (v) => updateMoaField("maturityDate1st", v), 80)}
                            <span>2nd</span>
                            {RL("maturityDate2nd", moaFields.maturityDate2nd, (v) => updateMoaField("maturityDate2nd", v), 80)}
                            <span>3rd</span>
                            {RL("maturityDate3rd", moaFields.maturityDate3rd, (v) => updateMoaField("maturityDate3rd", v), 80)}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("expiryDate", "w-32")}
                            {RL("expiryDate", moaFields.expiryDate, (v) => updateMoaField("expiryDate", v))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("purchasedDate", "w-28")}
                            {RL("purchasedDate", moaFields.purchasedDate, (v) => updateMoaField("purchasedDate", v))}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("idsPresented", "w-28")}
                            {RL("idsPresented", moaFields.idsPresented, (v) => updateMoaField("idsPresented", v))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("purchasedDate", "w-28")}
                            {RL("purchasedDate", moaFields.purchasedDate, (v) => updateMoaField("purchasedDate", v))}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("idsPresented", "w-28")}
                            {RL("idsPresented", moaFields.idsPresented, (v) => updateMoaField("idsPresented", v))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("maturityDate", "w-32")}
                            <span>1st</span>
                            {RL("maturityDate1st", moaFields.maturityDate1st, (v) => updateMoaField("maturityDate1st", v), 80)}
                            <span>2nd</span>
                            {RL("maturityDate2nd", moaFields.maturityDate2nd, (v) => updateMoaField("maturityDate2nd", v), 80)}
                            <span>3rd</span>
                            {RL("maturityDate3rd", moaFields.maturityDate3rd, (v) => updateMoaField("maturityDate3rd", v), 80)}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderEditableLabel("expiryDate", "w-32")}
                            {RL("expiryDate", moaFields.expiryDate, (v) => updateMoaField("expiryDate", v))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 leading-6">
                    <p className="flex items-baseline gap-1 flex-wrap">
                      {renderEditableLabel("customerIntro", "inline")}
                      {RL("customerName", moaFields.customerName, (v) => updateMoaField("customerName", v), 200)}
                      {renderEditableLabel("legalAgeResident", "inline")}
                      {RL("customerAddress", moaFields.customerAddress, (v) => updateMoaField("customerAddress", v), 280)}
                      {renderEditableLabel("agreementText", "inline")}
                    </p>
                    <p className="flex items-baseline gap-1 flex-wrap">
                      {renderEditableLabel("repayIntro", "inline")}
                      {RL("principalAmount", moaFields.principalAmount, (v) => updateMoaField("principalAmount", v), 100)}
                      {renderEditableLabel("plusText", "inline")}
                      {RL("interestAmount", moaFields.interestAmount, (v) => updateMoaField("interestAmount", v), 100)}
                      {renderEditableLabel("storageFeeText", "inline")}
                      {RL("penaltyAmount", moaFields.penaltyAmount, (v) => updateMoaField("penaltyAmount", v), 100)}
                      {renderEditableLabel("overdueText", "inline")}
                    </p>
                  </div>

                  <div className="grid gap-5 border-y border-emerald-900/50 py-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="font-bold underline">{renderEditableLabel("financialDetails", "inline")}</p>
                      <div className="grid grid-cols-[74px_1fr] items-center gap-2">
                        {renderEditableLabel("amount", "inline")}
                        {RL("amount", moaFields.amount, (v) => updateMoaField("amount", v))}
                        {renderEditableLabel("storageFee", "inline")}
                        {RL("storageFee", moaFields.storageFee, (v) => updateMoaField("storageFee", v))}
                        {renderEditableLabel("parkingFee", "inline")}
                        {RL("parkingFee", moaFields.parkingFee, (v) => updateMoaField("parkingFee", v))}
                        {renderEditableLabel("netProceeds", "inline")}
                        {RL("netProceeds", moaFields.netProceeds, (v) => updateMoaField("netProceeds", v))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold underline">{renderEditableLabel("unitDescription", "inline")}</p>
                      <div className="grid grid-cols-[92px_1fr] items-center gap-2">
                        {renderEditableLabel("brandModel", "inline")}
                        {RL("brandModel", moaFields.brandModel, (v) => updateMoaField("brandModel", v))}
                        {renderEditableLabel("itemsIncluded", "inline")}
                        {RL("itemsIncluded", moaFields.itemsIncluded, (v) => updateMoaField("itemsIncluded", v))}
                        {renderEditableLabel("condition", "inline")}
                        {RL("condition", moaFields.condition, (v) => updateMoaField("condition", v))}
                        {renderEditableLabel("serialNo", "inline")}
                        {RL("serialNo", moaFields.serialNo, (v) => updateMoaField("serialNo", v))}
                        {renderEditableLabel("memory", "inline")}
                        {RL("memory", moaFields.memory, (v) => updateMoaField("memory", v))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-2 font-bold">
                      {renderEditableLabel("dateHeader", "inline")}
                      {renderEditableLabel("storageHeader", "inline")}
                      {renderEditableLabel("periodHeader", "inline")}
                      {renderEditableLabel("extendHeader", "inline")}
                      {renderEditableLabel("signHeader", "inline")}
                    </div>
                    {extensionRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-5 gap-1">
                        {RL(`extRow_${index}_date`, row.date, (v) => updateExtensionRow(index, "date", v))}
                        {RL(`extRow_${index}_storage`, row.storage, (v) => updateExtensionRow(index, "storage", v))}
                        {RL(`extRow_${index}_period`, row.period, (v) => updateExtensionRow(index, "period", v))}
                        {RL(`extRow_${index}_extend`, row.extend, (v) => updateExtensionRow(index, "extend", v))}
                        {RL(`extRow_${index}_sign`, row.sign, (v) => updateExtensionRow(index, "sign", v))}
                      </div>
                    ))}
                  </div>

                  <p className="border-y border-emerald-900/40 bg-emerald-50 py-1 text-center text-[10px] font-bold uppercase text-emerald-950">
                    <input
                      value={topLabels.adviseText}
                      onChange={(e) => updateTopLabel("adviseText", e.target.value)}
                      readOnly={!canEditMoa}
                      tabIndex={canEditMoa ? 0 : -1}
                      spellCheck={false}
                      className={`block w-full border-none bg-transparent text-center text-[10px] font-bold uppercase text-emerald-950 outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
                    />
                  </p>

                  <div className="space-y-2">
                    <p className="text-center text-[10px] font-bold uppercase underline">
                      <input
                        value={topLabels.termsHeading}
                        onChange={(e) => updateTopLabel("termsHeading", e.target.value)}
                        readOnly={!canEditMoa}
                        tabIndex={canEditMoa ? 0 : -1}
                        spellCheck={false}
                        className={`block w-full border-none bg-transparent text-center text-[10px] font-bold uppercase outline-none ${!canEditMoa ? "pointer-events-none" : ""}`}
                      />
                    </p>
                    <div
                      ref={termsRef}
                      contentEditable={canEditMoa}
                      suppressContentEditableWarning
                      onInput={(e) => setTermsText(e.currentTarget.innerText ?? "")}
                      className="min-h-[200px] whitespace-pre-wrap rounded-sm border border-zinc-300 bg-transparent p-3 text-[10px] leading-relaxed text-zinc-800 outline-none dark:border-zinc-600"
                    >
                      {resolvedTermsText}
                    </div>
                  </div>

                  <div className="grid gap-8 pt-4 md:grid-cols-2 items-end">
                    <div className="flex flex-col text-center">
                      {/* Invisible spacer — same height as "I HEREBY AUTHORIZED" on the other column */}
                      <span className="block text-[11px] font-bold uppercase text-emerald-900 invisible select-none" aria-hidden="true">
                        I HEREBY AUTHORIZED
                      </span>
                      {RL("sellerName", moaFields.sellerName, (v) => updateMoaField("sellerName", v))}
                      <p className="mt-1 text-[9px]">{renderEditableLabel("sellerSignature", "inline")}</p>
                    </div>
                    <div className="flex flex-col text-center">
                      <p className="text-[11px] font-bold uppercase text-emerald-900">{renderEditableLabel("authorizedText", "inline")}</p>
                      {RL("representativeName", moaFields.representativeName, (v) => updateMoaField("representativeName", v))}
                      <p className="mt-1 text-[9px]">{renderEditableLabel("representativeSignature", "inline")}</p>
                    </div>
                  </div>
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
        .moa-paper-effect {
          background-color: white !important;
          color: #18181b !important;
          color-scheme: light !important;
          overflow-y: visible !important;
          max-height: none !important;
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
