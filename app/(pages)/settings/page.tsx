"use client";

import { useState } from "react";

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

export default function SettingsPage() {
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

  const canEditMoa = isMoaEditMode && !isMoaLocked;

  const lineInputClass =
    "h-5 w-full border-b border-zinc-500 bg-transparent px-1 text-[10px] outline-none disabled:cursor-not-allowed";
  const labelInputClass =
    "h-5 border-b border-zinc-500 bg-transparent px-1 text-[10px] outline-none disabled:cursor-not-allowed";

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

  const handleSaveMoa = () => {
    setMoaSavedAt(new Date().toLocaleString());
  };

  const handleSendToAllBranches = () => {
    setSendStatus("sending");
    setTimeout(() => {
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 2500);
    }, 700);
  };

  const renderTopLabel = (
    field: keyof typeof topLabels,
    widthClass: string,
  ) => {
    if (!canEditMoa) {
      return <span className={widthClass}>{topLabels[field]}</span>;
    }

    return (
      <input
        value={topLabels[field]}
        onChange={(e) => updateTopLabel(field, e.target.value)}
        className={`${labelInputClass} ${widthClass}`}
      />
    );
  };

  const renderEditableLabel = (
    field: keyof typeof topLabels,
    className: string,
  ) => {
    if (!canEditMoa) {
      return <span className={className}>{topLabels[field]}</span>;
    }

    return (
      <input
        value={topLabels[field]}
        onChange={(e) => updateTopLabel(field, e.target.value)}
        className={`${labelInputClass} ${className}`}
      />
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Configure pawnshop policies and system preferences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-xs font-bold text-zinc-800">Shop Information</h2>
            </div>

            <div className="space-y-5 px-4 py-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  Shop Name
                </label>
                <input
                  defaultValue="JCLB BUY BACK SHOP"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  Shop Address
                </label>
                <input
                  defaultValue="123 Main Street, Manila, Philippines"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                    Phone Number
                  </label>
                  <input
                    defaultValue="+63 2 1234 5678"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                    Email
                  </label>
                  <input
                    defaultValue="info@jclbbuyback.com"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-xs font-bold text-zinc-800">Pawnshop Policies</h2>
            </div>

            <div className="grid gap-3 px-4 py-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  Default Interest Rate (%)
                </label>
                <input
                  defaultValue="3.5"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                />
                <p className="text-[9px] text-zinc-400">per month</p>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  Default Pawn Duration (Days)
                </label>
                <input
                  defaultValue="30"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  Grace Period (Days)
                </label>
                <input
                  defaultValue="3"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition-colors focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold text-zinc-800">Memorandum of Agreement Template</h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
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
                  className={`rounded-lg px-4 py-2 text-[11px] font-bold transition-colors ${
                    isMoaEditMode
                      ? "border border-emerald-700 bg-emerald-700 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {isMoaEditMode ? "Exit Edit Mode" : "Edit Mode"}
                </button>

                <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-[11px] font-bold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={isMoaLocked}
                    onChange={(e) => setIsMoaLocked(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Lock Template (Prevent Editing)
                </label>

                <button
                  onClick={() => setIsTopHeaderSwapped((v) => !v)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[11px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  {isTopHeaderSwapped ? "Default Header Layout" : "Interchange Top Fields"}
                </button>
              </div>

              <div className="overflow-hidden rounded-md border border-zinc-300 bg-white p-6">
                <div className="space-y-5 border border-emerald-800/70 p-5 text-[10px] text-zinc-800">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-3">
                    {renderEditableLabel("originalCopy", "font-semibold")}
                    {renderEditableLabel("moaTitle", "text-center text-xs font-bold uppercase underline")}
                    <div className="min-w-0 flex items-center gap-2 text-[10px]">
                      {renderEditableLabel("unitCode", "font-semibold uppercase")}
                      <input
                        value={moaFields.unitCode}
                        onChange={(e) => updateMoaField("unitCode", e.target.value)}
                        disabled={!canEditMoa}
                        className={lineInputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {isTopHeaderSwapped ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("maturityDate", "w-32")}
                            <span>1st</span>
                            <input
                              value={moaFields.maturityDate1st}
                              onChange={(e) => updateMoaField("maturityDate1st", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                            <span>2nd</span>
                            <input
                              value={moaFields.maturityDate2nd}
                              onChange={(e) => updateMoaField("maturityDate2nd", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                            <span>3rd</span>
                            <input
                              value={moaFields.maturityDate3rd}
                              onChange={(e) => updateMoaField("maturityDate3rd", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("expiryDate", "w-32")}
                            <input
                              value={moaFields.expiryDate}
                              onChange={(e) => updateMoaField("expiryDate", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("purchasedDate", "w-28")}
                            <input
                              value={moaFields.purchasedDate}
                              onChange={(e) => updateMoaField("purchasedDate", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("idsPresented", "w-28")}
                            <input
                              value={moaFields.idsPresented}
                              onChange={(e) => updateMoaField("idsPresented", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("purchasedDate", "w-28")}
                            <input
                              value={moaFields.purchasedDate}
                              onChange={(e) => updateMoaField("purchasedDate", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("idsPresented", "w-28")}
                            <input
                              value={moaFields.idsPresented}
                              onChange={(e) => updateMoaField("idsPresented", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("maturityDate", "w-32")}
                            <span>1st</span>
                            <input
                              value={moaFields.maturityDate1st}
                              onChange={(e) => updateMoaField("maturityDate1st", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                            <span>2nd</span>
                            <input
                              value={moaFields.maturityDate2nd}
                              onChange={(e) => updateMoaField("maturityDate2nd", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                            <span>3rd</span>
                            <input
                              value={moaFields.maturityDate3rd}
                              onChange={(e) => updateMoaField("maturityDate3rd", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {renderEditableLabel("expiryDate", "w-32")}
                            <input
                              value={moaFields.expiryDate}
                              onChange={(e) => updateMoaField("expiryDate", e.target.value)}
                              disabled={!canEditMoa}
                              className={lineInputClass}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 leading-6">
                    <p>
                      {renderEditableLabel("customerIntro", "inline")}
                      <span className="inline-block w-52 align-middle">
                        <input
                          value={moaFields.customerName}
                          onChange={(e) => updateMoaField("customerName", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </span>
                      {renderEditableLabel("legalAgeResident", "inline")}
                      <span className="inline-block w-64 align-middle">
                        <input
                          value={moaFields.customerAddress}
                          onChange={(e) => updateMoaField("customerAddress", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </span>
                      , {renderEditableLabel("agreementText", "inline")}
                    </p>
                    <p>
                      {renderEditableLabel("repayIntro", "inline")}
                      <span className="inline-block w-36 align-middle">
                        <input
                          value={moaFields.principalAmount}
                          onChange={(e) => updateMoaField("principalAmount", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </span>
                      {renderEditableLabel("plusText", "inline")}
                      <span className="inline-block w-32 align-middle">
                        <input
                          value={moaFields.interestAmount}
                          onChange={(e) => updateMoaField("interestAmount", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </span>
                      {renderEditableLabel("storageFeeText", "inline")}
                      <span className="inline-block w-32 align-middle">
                        <input
                          value={moaFields.penaltyAmount}
                          onChange={(e) => updateMoaField("penaltyAmount", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </span>
                      {renderEditableLabel("overdueText", "inline")}
                    </p>
                  </div>

                  <div className="grid gap-5 border-y border-emerald-900/50 py-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="font-bold underline">{renderEditableLabel("financialDetails", "inline")}</p>
                      <div className="grid grid-cols-[74px_1fr] items-center gap-2">
                        {renderEditableLabel("amount", "inline")}
                        <input
                          value={moaFields.amount}
                          onChange={(e) => updateMoaField("amount", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("storageFee", "inline")}
                        <input
                          value={moaFields.storageFee}
                          onChange={(e) => updateMoaField("storageFee", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("parkingFee", "inline")}
                        <input
                          value={moaFields.parkingFee}
                          onChange={(e) => updateMoaField("parkingFee", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("netProceeds", "inline")}
                        <input
                          value={moaFields.netProceeds}
                          onChange={(e) => updateMoaField("netProceeds", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="font-bold underline">{renderEditableLabel("unitDescription", "inline")}</p>
                      <div className="grid grid-cols-[92px_1fr] items-center gap-2">
                        {renderEditableLabel("brandModel", "inline")}
                        <input
                          value={moaFields.brandModel}
                          onChange={(e) => updateMoaField("brandModel", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("itemsIncluded", "inline")}
                        <input
                          value={moaFields.itemsIncluded}
                          onChange={(e) => updateMoaField("itemsIncluded", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("condition", "inline")}
                        <input
                          value={moaFields.condition}
                          onChange={(e) => updateMoaField("condition", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("serialNo", "inline")}
                        <input
                          value={moaFields.serialNo}
                          onChange={(e) => updateMoaField("serialNo", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        {renderEditableLabel("memory", "inline")}
                        <input
                          value={moaFields.memory}
                          onChange={(e) => updateMoaField("memory", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2 font-bold">
                      {renderEditableLabel("dateHeader", "inline")}
                      {renderEditableLabel("storageHeader", "inline")}
                      {renderEditableLabel("periodHeader", "inline")}
                      {renderEditableLabel("extendHeader", "inline")}
                      {renderEditableLabel("signHeader", "inline")}
                    </div>
                    {extensionRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2">
                        <input
                          value={row.date}
                          onChange={(e) => updateExtensionRow(index, "date", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        <input
                          value={row.storage}
                          onChange={(e) =>
                            updateExtensionRow(index, "storage", e.target.value)
                          }
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        <input
                          value={row.period}
                          onChange={(e) =>
                            updateExtensionRow(index, "period", e.target.value)
                          }
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        <input
                          value={row.extend}
                          onChange={(e) =>
                            updateExtensionRow(index, "extend", e.target.value)
                          }
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                        <input
                          value={row.sign}
                          onChange={(e) => updateExtensionRow(index, "sign", e.target.value)}
                          disabled={!canEditMoa}
                          className={lineInputClass}
                        />
                      </div>
                    ))}
                  </div>

                  <p className="border-y border-emerald-900/40 bg-emerald-50 py-1 text-center text-[10px] font-bold uppercase text-emerald-950">
                    {canEditMoa ? (
                      <input
                        value={topLabels.adviseText}
                        onChange={(e) => updateTopLabel("adviseText", e.target.value)}
                        className="w-full border-none bg-transparent text-center text-[10px] font-bold uppercase text-emerald-950 outline-none"
                      />
                    ) : (
                      topLabels.adviseText
                    )}
                  </p>

                  <div className="space-y-2">
                    <p className="text-center text-[10px] font-bold uppercase underline">
                      {canEditMoa ? (
                        <input
                          value={topLabels.termsHeading}
                          onChange={(e) => updateTopLabel("termsHeading", e.target.value)}
                          className="w-full border-none bg-transparent text-center text-[10px] font-bold uppercase outline-none"
                        />
                      ) : (
                        topLabels.termsHeading
                      )}
                    </p>
                    <textarea
                      value={termsText}
                      onChange={(e) => setTermsText(e.target.value)}
                      disabled={!canEditMoa}
                      className="min-h-[175px] w-full resize-y rounded-sm border border-zinc-300 bg-transparent p-3 text-[10px] leading-4 outline-none disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid gap-8 pt-4 md:grid-cols-2">
                    <div className="space-y-2 text-center">
                      <input
                        value={moaFields.sellerName}
                        onChange={(e) => updateMoaField("sellerName", e.target.value)}
                        disabled={!canEditMoa}
                        className={lineInputClass}
                      />
                      <p className="text-[9px]">{renderEditableLabel("sellerSignature", "inline")}</p>
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-bold uppercase text-emerald-900">{renderEditableLabel("authorizedText", "inline")}</p>
                      <input
                        value={moaFields.representativeName}
                        onChange={(e) =>
                          updateMoaField("representativeName", e.target.value)
                        }
                        disabled={!canEditMoa}
                        className={lineInputClass}
                      />
                      <p className="text-[9px]">{renderEditableLabel("representativeSignature", "inline")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-zinc-500">
                  This template matches the printed MOA layout. Enable Edit Mode and unlock template to modify any section.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveMoa}
                    disabled={!canEditMoa}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save MOA Template
                  </button>
                  <button
                    onClick={handleSendToAllBranches}
                    disabled={sendStatus === "sending"}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendStatus === "sending"
                      ? "Sending to All Branches..."
                      : "Send to All Branches"}
                  </button>
                </div>
              </div>

              {(moaSavedAt || sendStatus === "sent") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-800">
                  {moaSavedAt && <span>Template saved: {moaSavedAt}. </span>}
                  {sendStatus === "sent" && <span>MOA template sent to all branches.</span>}
                </div>
              )}
            </div>
          </section>

          <div className="flex gap-3">
            <button className="rounded-lg bg-emerald-700 px-5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-800">
              Save Changes
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-5 py-2 text-[11px] font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
              Discard
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-50 bg-emerald-800 text-2xl font-bold text-white">
              AD
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Admin Panel</h3>
            <p className="mt-1 text-[10px] text-zinc-500">Super Admin Settings</p>
            <button className="mt-3 w-full rounded-lg border border-emerald-100 bg-emerald-50 py-2 text-[9px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-100">
              Change Avatar
            </button>
          </section>

          <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">
              Security Restriction
            </p>
            <p className="mt-2 text-xs leading-5 text-emerald-950">
              System settings are available only to Super Admin users. Updates here affect the shared shop profile and pawnshop policy defaults.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
