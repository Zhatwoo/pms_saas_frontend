"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { formatPeso } from "@/lib/currency";
import { findInterestRateGroup, getInterestRateSchedule } from "@/lib/interest";
import { MOA_BODY_PRINT_COLOR_SNIPPET, MOA_PRINT_PAGE_RULE_CSS } from "@/lib/print-templates";

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
    purchasedDate: string;
    idPresented: string;
    branchName: string;
    branchAddress?: string;
    branchPhone?: string;
    processedBy?: string;
  };
  isLoading: boolean;
  autoPrint?: boolean;
}

function normalizeTermsText(rawText?: string) {
  const normalizedLines = (rawText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return normalizedLines.join("\n");
}

export function MoaModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  isLoading,
  autoPrint,
  confirmDisabled = false,
  confirmDisabledReason,
}: MoaModalProps) {
  const [termsText, setTermsText] = useState("");
  const [labels, setLabels] = useState<any>(null);
  const [extensionRows, setExtensionRows] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      async function fetchTemplateAndInterestRates() {
        try {
          const [moaTemplate, interestRates] = await Promise.all([
            api.get<{ terms_text: string; labels: any; extensionRows?: any[] }>(`/settings/moa_template`),
            api.get<any[]>(`/settings/interest_rates`),
          ]);

          if (moaTemplate) {
            setTermsText(normalizeTermsText(moaTemplate.terms_text));
            setLabels(moaTemplate.labels);
            if (moaTemplate.extensionRows) setExtensionRows(moaTemplate.extensionRows);
          }

          if (Array.isArray(interestRates) && typeof window !== "undefined") {
            localStorage.setItem("interest_rates", JSON.stringify(interestRates));
          }
        } catch (error) {
          console.error("Failed to fetch MOA template and/or interest rates:", error);
        }
      }
      fetchTemplateAndInterestRates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && autoPrint && labels) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, labels]);

  const handlePrint = () => {
    if (!printRef.current) return;

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"><title>MOA Slip</title>`);

      // clone stylesheet and style nodes so print styles apply inside iframe
      Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((node) => {
        try {
          iframeDoc.head.appendChild(node.cloneNode(true));
        } catch (e) {
          // ignore cloning errors for some browser-injected styles
        }
      });

      // compute base font styles from the host document so iframe matches layout
      const computedRootStyle = window.getComputedStyle(document.documentElement);
      const baseFontFamily = computedRootStyle.fontFamily || "Inter, Arial, sans-serif";
      const baseFontSize = computedRootStyle.fontSize || "12px";

      // also inject our print-specific snippets and a small layout shim to match modal width/padding
      const layoutShim = `
        html,body{margin:0;padding:0;background:white}
        body{font-family: ${baseFontFamily}; font-size: ${baseFontSize}; color:#000}
        .moa-print-wrapper{width:210mm;max-width:210mm;margin:0 auto;box-sizing:border-box}
        #moa-slip-printable{padding:15mm;box-sizing:border-box;background:white}
      `;

      iframeDoc.head.insertAdjacentHTML(
        "beforeend",
        `<style>${MOA_BODY_PRINT_COLOR_SNIPPET} ${MOA_PRINT_PAGE_RULE_CSS} ${layoutShim}</style>`
      );

      iframeDoc.write(`</head><body>`);
      iframeDoc.write(`<div class="moa-print-wrapper">${printRef.current.outerHTML}</div>`);
      iframeDoc.write(`</body></html>`);
      iframeDoc.close();

      const printWindow = iframe.contentWindow;
      const doPrint = () => {
        try {
          printWindow?.focus();
          printWindow?.print();
        } catch (err) {
          console.error("Printing iframe failed:", err);
        } finally {
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch (_) {}
          }, 500);
        }
      };

      // Give iframe a short time to layout styles
      setTimeout(doPrint, 300);
    } catch (err) {
      console.error("Print failed:", err);
      window.print();
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
      document.body.classList.add("printing-moa-active");
    } else {
      document.body.classList.remove("printing-moa-active");
    }
    return () => {
      document.body.classList.remove("printing-moa-active");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const fullName = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const amount = Number(data.amount) || 0;
  const storageFee = Number(data.storageFee) || 0;
  const parkingFee = Number(data.parkingFee) || 0;
  const totalDue = amount + storageFee + parkingFee;

  const schedule = getInterestRateSchedule(data.category);
  const activeGroup = findInterestRateGroup(data.category);

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

  const lineInputClass = "border-b-2 border-zinc-400 bg-transparent px-2 text-xs font-bold text-zinc-900 outline-none w-full h-6 transition-all focus:border-emerald-600";

  return (
    <div id="moa-modal-root" className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 text-zinc-900">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity no-print" onClick={onClose} />
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
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
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
        <div className="flex-1 overflow-y-auto">
          <div id="moa-slip-printable" ref={printRef} className="max-w-full overflow-x-auto p-6 pb-10 space-y-5 text-[9px] text-zinc-800 leading-tight bg-white sm:text-[10px] moa-paper-effect">
            {/* Title moved to the very top */}
            <div className="text-center mb-4">
              <h1 className="text-[18px] font-black uppercase tracking-[0.18em] text-emerald-900 underline">{labels?.moaTitle || "Memorandum of Agreement Slip"}</h1>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] leading-none text-zinc-500">{data.branchName || "Main Branch"}</p>
              {(data.branchAddress || data.branchPhone) && (
                <div className="mt-1 flex flex-col items-center gap-0.5">
                  {data.branchAddress && (
                    <p className="text-[8px] font-medium uppercase tracking-tight text-zinc-500">{data.branchAddress}</p>
                  )}
                  {data.branchPhone && (
                    <div className="flex items-center gap-1">
                      <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <p className="text-[8px] font-medium uppercase tracking-tight text-zinc-500">{data.branchPhone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 border-b border-zinc-100 pb-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{labels?.originalCopy || "Original copy"}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="font-bold uppercase tracking-wider">{labels?.unitCode || "UNIT CODE:"}</span>
                  <span className="w-32 border-b border-zinc-400 font-bold">{data.unitCode || "---"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-28 font-semibold text-[9px] uppercase tracking-wider">{labels?.purchasedDate || "Purchased Date:"}</span>
                    <span className="flex-1 border-b border-zinc-400">{data.purchasedDate || new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 font-semibold text-[9px] uppercase tracking-wider">{labels?.idsPresented || "ID(s) Presented:"}</span>
                    <span className="flex-1 border-b border-zinc-400">{data.idPresented || "No ID"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-32 font-semibold text-[9px] uppercase tracking-wider">{labels?.maturityDate || "Maturity Date:"}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px]">1st</span>
                      <span className="w-14 border-b border-zinc-400 text-center">{maturityDates[0]}</span>
                      <span className="text-[8px]">2nd</span>
                      <span className="w-14 border-b border-zinc-400 text-center">{maturityDates[1]}</span>
                      <span className="text-[8px]">3rd</span>
                      <span className="w-14 border-b border-zinc-400 text-center">{maturityDates[2]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-32 font-semibold text-[9px] uppercase tracking-wider text-red-600">{labels?.expiryDate || "Expiry Date of Repurchase:"}</span>
                    <span className="flex-1 border-b border-zinc-400 text-red-600 font-bold">{gracePeriodEnd}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest schedule removed to match global MOA template from settings (super admin)
                Template-driven content from `/settings/moa_template` will be used instead. */}

            <div className="space-y-2 px-2">
              <p className="leading-5">
                {labels?.customerIntro || "I, Mr./Mrs."} <span className="inline-block max-w-full px-2 border-b border-zinc-500 font-bold min-w-[120px] sm:min-w-[200px] text-center break-words">{fullName}</span>, {labels?.legalAgeResident || "of legal age and a resident of"} <span className="inline-block max-w-full px-2 border-b border-zinc-500 font-medium min-w-[180px] sm:min-w-[400px] text-center break-words">{data.address.toUpperCase()}</span>, {labels?.agreementText || "agree to transfer and convey by way of sale with a right to repurchase back."}
              </p>
              <p className="leading-5">
                {labels?.repayIntro || "If I have repurchased the above unit, I shall pay the amount of"} <span className="inline-block px-2 border-b border-zinc-500 font-bold min-w-[100px] text-center">{formatPeso(amount)}</span> {labels?.plusText || "plus"} <span className="inline-block px-2 border-b border-zinc-500 font-bold min-w-[100px] text-center">{formatPeso(storageFee)}</span> {labels?.storageFeeText || "every 10 days as storage fee. Penalty amounting to"} <span className="inline-block px-2 border-b border-zinc-500 min-w-[100px] text-center">₱0.00</span> {labels?.overdueText || "applies when overdue."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-y border-zinc-200 py-4 px-3 bg-zinc-50/50">
              <div className="space-y-3">
                <h3 className="font-black text-[9px] uppercase underline tracking-wider text-emerald-900">{labels?.financialDetails || "Financial Details"}</h3>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_96px] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.amount || "Amount:"}</span>
                    <span className="text-right font-bold tabular-nums text-zinc-900">{formatPeso(amount)}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_96px] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.storageFee || "Storage fee:"}</span>
                    <span className="text-right font-medium tabular-nums text-zinc-900">{formatPeso(storageFee)}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_96px] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.parkingFee || "Parking fee:"}</span>
                    <span className="text-right font-medium tabular-nums text-zinc-900">{formatPeso(parkingFee)}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_96px] items-center gap-2 border-t border-zinc-200 pt-2">
                    <span className="font-black uppercase text-emerald-800 text-[9px]">{labels?.totalDue || "Total Due:"}</span>
                    <span className="text-right font-black tabular-nums text-emerald-800 text-lg">{formatPeso(totalDue)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-black text-[9px] uppercase underline tracking-wider text-emerald-900">{labels?.unitDescription || "Unit Description"}</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.brandModel || "Brand and model:"}</span>
                    <span className="font-bold text-zinc-900 border-b border-zinc-300">{data.unitName || "---"}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.itemsIncluded || "Items included:"}</span>
                    <span className="text-zinc-700 border-b border-zinc-300">{data.itemsIncluded || "---"}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.condition || "Condition:"}</span>
                    <span className="text-zinc-700 border-b border-zinc-300 italic">{data.condition || "---"}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.serialNo || "Serial No.:"}</span>
                    <span className="font-medium text-zinc-900 border-b border-zinc-300 tracking-wider uppercase">{data.serialNumber || "---"}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.memory || "Memory:"}</span>
                    <span className="text-zinc-700 border-b border-zinc-300">{data.memory || "---"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <div className="grid grid-cols-6 gap-3 text-[8px] font-black uppercase text-zinc-400 italic text-center">
                <span>{labels?.dateHeader || "Date"}</span>
                <span>{labels?.storageHeader || "Storage"}</span>
                <span>{labels?.periodHeader || "Period"}</span>
                <span>Interest Rate</span>
                <span>{labels?.extendHeader || "Extend"}</span>
                <span>{labels?.signHeader || "Sign"}</span>
              </div>
              {(extensionRows.length > 0 ? extensionRows : [1, 2, 3]).map((row, idx) => {
                const scheduleItem = schedule[idx + 1];
                return (
                  <div key={idx} className="grid grid-cols-6 gap-3">
                    <div className="flex h-5 items-center justify-center border-b border-zinc-300 bg-white/30 font-bold text-zinc-900">
                      {maturityDates[idx] || ""}
                    </div>
                    <div className="h-5 border-b border-zinc-300 bg-white/50">{typeof row === 'object' ? row.storage : ''}</div>
                    <div className="flex h-5 items-center justify-center border-b border-zinc-300 bg-zinc-50 font-bold text-zinc-500">
                      {typeof row === 'object' ? row.period : `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} Period`}
                    </div>
                    <div className="flex h-5 items-center justify-center border-b border-zinc-300 bg-emerald-50 font-black text-emerald-700">
                      {scheduleItem ? `${scheduleItem.percentage}%` : "—"}
                    </div>
                    <div className="h-5 border-b border-zinc-300 bg-white/50">{typeof row === 'object' ? row.extend : ''}</div>
                    <div className="h-5 border-b border-zinc-300 bg-white/50">{typeof row === 'object' ? row.sign : ''}</div>
                  </div>
                );
              })}
              <div className="grid grid-cols-6 gap-3">
                <div className="flex h-5 items-center justify-center border-b border-zinc-300 bg-white/30 font-bold text-zinc-900">
                  {gracePeriodEnd}
                </div>
                <div className="h-5 border-b border-zinc-300 bg-white/50"></div>
                <div className="flex h-5 items-center justify-center border-b border-zinc-300 font-black text-[7px] uppercase text-zinc-400">{labels?.gracePeriodHeader || "GRACE PERIOD"}</div>
                <div className="flex h-5 items-center justify-center border-b border-zinc-300 bg-emerald-50 font-black text-emerald-700">
                  {schedule[4] ? `${schedule[4].percentage}%` : "—"}
                </div>
                <div className="h-5 border-b border-zinc-300"></div>
                <div className="h-5 border-b border-zinc-300"></div>
              </div>
            </div>

            <div className="moa-bottom-block max-w-full overflow-x-hidden space-y-2 pt-4 pb-2">
              {/* Seller advised banner - full width */}
              <div className="w-full border border-emerald-300 bg-emerald-50 p-2 text-center text-[7px] font-black uppercase tracking-widest text-emerald-800 italic leading-[1.25]">
                {labels?.adviseText || "SELLER IS ADVISED TO READ AND UNDERSTAND THE TERMS AND CONDITIONS ON THE REVERSE SIDE HEREOF"}
              </div>

              {/* Terms and Conditions - full width, centered */}
              <div className="w-full space-y-1 pt-1.5">
                <h4 className="text-center font-black uppercase underline tracking-tighter text-[10px] text-zinc-900">{labels?.termsHeading || "Terms and Conditions"}</h4>
                <div className="rounded border border-zinc-200 bg-white/80 p-1 text-[7px] leading-tight text-zinc-700">
                  <ol className="space-y-0 pl-2">
                    {printableTermsLines.map((line) => (
                      <li key={line} className="list-decimal">
                        {line.replace(/^\d+\.\s*/, "")}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Signatures - 2 Columns */}
              <div className="moa-signatures grid grid-cols-2 gap-12 pt-8 pb-4">
                <div className="flex flex-col text-center space-y-2">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-900 invisible select-none" aria-hidden="true">
                    I HEREBY AUTHORIZED
                  </span>
                  <div className="h-8 w-full border-b-2 border-zinc-800"></div>
                  <p className="font-black uppercase text-[8px] tracking-widest">{labels?.sellerSignature || "(Name and Signature of Seller)"}</p>
                </div>
                <div className="flex flex-col text-center space-y-2">
                  <p className="font-black uppercase text-[9px] text-emerald-900 tracking-widest">{labels?.authorizedText || "I HEREBY AUTHORIZED"}</p>
                  <div className="h-8 w-full border-b-2 border-zinc-800 flex items-end justify-center pb-0.5">
                    {data.processedBy && (
                      <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-900">{data.processedBy}</span>
                    )}
                  </div>
                  <p className="font-black uppercase text-[8px] tracking-widest">{labels?.representativeSignature || "(Name and Signature of Representative)"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {!autoPrint && (
          <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-8 py-4 flex justify-between items-center z-10 no-print">
            <div className="min-w-0 pr-4">
              <p className="text-[10px] text-zinc-400 font-medium italic">
                Review carefully. Finalizing will generate the ticket and store record permanently.
              </p>
              {confirmDisabled && confirmDisabledReason ? (
                <p className="mt-2 text-[11px] font-semibold text-amber-800" role="alert">
                  {confirmDisabledReason}
                </p>
              ) : null}
            </div>
            <div className="flex gap-4 shrink-0">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 text-xs font-black text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Back to Form
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 text-xs font-black text-white bg-zinc-800 rounded-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
                Print / PDF
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading || confirmDisabled}
                className="px-8 py-2.5 text-xs font-black text-white bg-emerald-700 rounded-xl shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95 flex items-center gap-2 disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="anim-loading h-4 w-4 border-white/30 border-t-white rounded-full" />
                    Saving Record...
                  </>
                ) : (
                  "Save & Finalize Transaction"
                )}
              </button>
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

        @media print {
          .no-print { display: none !important; }

          html.printing-moa-active,
          body.printing-moa-active {
            visibility: visible !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide all other sections in printable-area when printing this slip to prevent overlaps and extra pages */
          body.printing-moa-active .printable-area > *:not(#moa-modal-root) {
            display: none !important;
          }

          body.printing-moa-active #moa-modal-root {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body.printing-moa-active #moa-modal-root *,
          body.printing-moa-active #moa-slip-printable,
          body.printing-moa-active #moa-slip-printable * {
            visibility: visible !important;
          }

          /* Reset all potential scroll/height constraints in the DOM tree specifically for this print slip modal */
          #moa-modal-root.fixed.inset-0, 
          #moa-modal-root .relative.w-full.max-w-4xl,
          #moa-modal-root .flex-1.overflow-y-auto {
            position: static !important;
            display: block !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            box-shadow: none !important;
            flex: none !important;
          }

          #moa-slip-printable, 
          #moa-slip-printable * {
            visibility: visible !important;
          }

          #moa-slip-printable {
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          /* Improve print readability: force all gray text shades to black */
          #moa-slip-printable .text-zinc-300,
          #moa-slip-printable .text-zinc-400,
          #moa-slip-printable .text-zinc-500,
          #moa-slip-printable .text-zinc-600,
          #moa-slip-printable .text-zinc-700,
          #moa-slip-printable .text-zinc-800 {
            color: #000 !important;
          }

          /* Restore grid/flex for specific components that need them */
          #moa-slip-printable .grid { display: grid !important; }
          #moa-slip-printable .flex { display: flex !important; }
          #moa-slip-printable .moa-bottom-block {
            margin-top: 16px !important;
            overflow: visible !important;
          }

          #moa-slip-printable .moa-signatures {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 3rem !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          ${MOA_PRINT_PAGE_RULE_CSS}
        }
        `}</style>
      </div>
    </div>
  );
}
