"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

interface MoaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
}

const DEFAULT_TERMS_TEXT = `TERMS AND CONDITIONS (GADGETS):
1. INTEREST SCHEDULE:
   - Day 1 to 5: 5% Storage Fee
   - Day 10 (1st Maturity): 10% Storage Fee
   - Day 20 (2nd Maturity): 20% Storage Fee
   - Day 30 (3rd Maturity): 30% Storage Fee
   - Day 31 to 34 (Grace Period): 40% Storage Fee
2. EXPIRED / REMATADO: After Day 34, JCLB shop has the right to dispose the item.
3. This is an extended purchase sale agreement (BUYBACK), not a pawn loan.
4. Seller must advise the shop of any changes in address or contact information.
5. In case of loss of this MOA, present valid ID and notarized affidavit promptly.`;

export function MoaModal({ isOpen, onClose, onConfirm, data, isLoading }: MoaModalProps) {
  const [termsText, setTermsText] = useState(DEFAULT_TERMS_TEXT);
  const [labels, setLabels] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      async function fetchTemplate() {
        try {
          const res = await api.get<{ terms_text: string; labels: any }>(`/settings/moa_template`);
          if (res) {
            setTermsText(res.terms_text);
            setLabels(res.labels);
          }
        } catch (error) {
          console.error("Failed to fetch MOA template:", error);
        }
      }
      fetchTemplate();
    }
  }, [isOpen]);

  const handlePrint = () => {
    if (!printRef.current) return;
    window.print();
  };

  if (!isOpen) return null;

  const fullName = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const amount = Number(data.amount) || 0;
  const storageFee = Number(data.storageFee) || 0;
  const parkingFee = Number(data.parkingFee) || 0;
  const totalDue = amount + storageFee + parkingFee;

  // Maturity dates calc (every 10 days)
  const baseDate = data.purchasedDate ? new Date(data.purchasedDate) : new Date();
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const maturityDates = [
    addDays(baseDate, 10),
    addDays(baseDate, 20),
    addDays(baseDate, 30),
  ];
  const gracePeriodEnd = addDays(baseDate, 34);

  const lineInputClass = "border-b-2 border-zinc-400 bg-transparent px-2 text-xs font-bold text-zinc-900 outline-none w-full h-6 transition-all focus:border-emerald-600";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-zinc-900">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div 
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 animate-in fade-in zoom-in-95 duration-300 flex flex-col relative z-10" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white shrink-0 relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white leading-none">{labels?.moaTitle || "Memorandum of Agreement Slip"}</h2>
            <p className="text-xs text-emerald-100/70">Please review the details before finalizing the transaction.</p>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* MOA Content - Matches Image 2 */}
        <div className="flex-1 overflow-y-auto">
          <div id="moa-slip-printable" ref={printRef} className="p-8 space-y-6 text-[11px] text-zinc-800 leading-tight bg-[#fafafa]">
          {/* Title moved to the very top */}
          <div className="text-center mb-8">
             <h1 className="text-xl font-black underline uppercase tracking-[0.2em] text-emerald-900">{labels?.moaTitle || "Memorandum of Agreement Slip"}</h1>
             <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest leading-none">{data.branchName || "Main Branch"}</p>
             {(data.branchAddress || data.branchPhone) && (
               <div className="mt-1 flex flex-col items-center gap-0.5">
                 {data.branchAddress && (
                   <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-tight">{data.branchAddress}</p>
                 )}
                 {data.branchPhone && (
                   <div className="flex items-center gap-1">
                     <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-300">
                       <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                     </svg>
                     <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-tight">{data.branchPhone}</p>
                   </div>
                 )}
               </div>
             )}
          </div>

          <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
            <div className="space-y-1">
               <p className="font-bold">{labels?.originalCopy || "Original copy"}</p>
               <div className="flex items-center gap-2">
                 <span className="font-semibold whitespace-nowrap text-[9px] uppercase tracking-wider">{labels?.purchasedDate || "Purchased Date:"}</span>
                 <span className="w-32 border-b border-zinc-400">{data.purchasedDate || new Date().toLocaleDateString()}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-semibold whitespace-nowrap text-[9px] uppercase tracking-wider">{labels?.idsPresented || "ID(s) Presented:"}</span>
                 <span className="w-32 border-b border-zinc-400">{data.idPresented || "No ID"}</span>
               </div>
            </div>

            <div className="text-center flex-1">
               {/* Spacer or additional small branding can go here */}
            </div>

            <div className="space-y-1 text-right">
               <div className="flex items-center justify-end gap-2">
                 <span className="font-semibold whitespace-nowrap text-[9px] uppercase tracking-wider">{labels?.unitCode || "UNIT CODE:"}</span>
                 <span className="w-32 border-b border-zinc-400 text-right">{data.unitCode || "---"}</span>
               </div>
               <div className="flex items-center justify-end gap-2">
                 <span className="font-semibold whitespace-nowrap text-[9px] uppercase tracking-wider">{labels?.maturityDate || "Maturity Date:"}</span>
                 <span className="text-[9px]">1st</span>
                 <span className="w-16 border-b border-zinc-400 text-center">{addDays(baseDate, 10)}</span>
                 <span className="text-[9px]">2nd</span>
                 <span className="w-16 border-b border-zinc-400 text-center">{addDays(baseDate, 20)}</span>
                 <span className="text-[9px]">3rd</span>
                 <span className="w-16 border-b border-zinc-400 text-center">{addDays(baseDate, 30)}</span>
               </div>
               <div className="flex items-center justify-end gap-2">
                 <span className="font-semibold whitespace-nowrap text-[9px] uppercase tracking-wider text-red-600">{labels?.expiryDate || "Expiry Date:"}</span>
                 <span className="w-32 border-b border-zinc-400 text-right text-red-600 font-bold">{addDays(baseDate, 31)}</span>
               </div>
            </div>
          </div>

          <div className="space-y-3 px-2">
            <p className="leading-6">
              {labels?.customerIntro || "I, Mr./Mrs."} <span className="inline-block px-2 border-b border-zinc-500 font-bold min-w-[200px] text-center">{fullName}</span>, {labels?.legalAgeResident || "of legal age and a resident of"} <span className="inline-block px-2 border-b border-zinc-500 font-medium min-w-[400px] text-center">{data.address.toUpperCase()}</span>, {labels?.agreementText || "agree to transfer and convey by way of sale with a right to repurchase back."}
            </p>
            <p className="leading-6">
              {labels?.repayIntro || "If I have repurchased the above unit, I shall pay the amount of"} <span className="inline-block px-2 border-b border-zinc-500 font-bold min-w-[100px] text-center">₱{amount.toLocaleString()}</span> {labels?.plusText || "plus"} <span className="inline-block px-2 border-b border-zinc-500 font-bold min-w-[100px] text-center">₱{storageFee.toLocaleString()}</span> {labels?.storageFeeText || "every 10 days as storage fee. Penalty amounting to"} <span className="inline-block px-2 border-b border-zinc-500 min-w-[100px] text-center">₱0.00</span> {labels?.overdueText || "applies when overdue."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 border-y border-zinc-200 py-6 px-4 bg-zinc-50/50">
            <div className="space-y-3">
              <h3 className="font-black text-[9px] uppercase underline tracking-wider text-emerald-900">{labels?.financialDetails || "Financial Details"}</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 items-center">
                  <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.amount || "Amount:"}</span>
                  <span className="font-bold text-zinc-900">₱{amount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 items-center">
                   <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.storageFee || "Storage fee:"}</span>
                   <span className="font-medium text-zinc-900 text-right pr-4">₱{storageFee.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 items-center">
                   <span className="font-semibold uppercase text-zinc-500 text-[8px]">{labels?.parkingFee || "Parking fee:"}</span>
                   <span className="font-medium text-zinc-900 text-right pr-4">₱{parkingFee.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 items-center border-t border-zinc-200 pt-2">
                   <span className="font-black uppercase text-emerald-800 text-[9px]">{labels?.totalDue || "Total Due:"}</span>
                   <span className="font-black text-emerald-800 text-lg">₱{totalDue.toLocaleString()}</span>
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

          <div className="space-y-4 pt-4">
             <div className="grid grid-cols-5 gap-4 text-[8px] font-black uppercase text-zinc-400 italic text-center">
                <span>{labels?.dateHeader || "Date"}</span>
                <span>{labels?.storageHeader || "Storage"}</span>
                <span>{labels?.periodHeader || "Period"}</span>
                <span>{labels?.extendHeader || "Extend"}</span>
                <span>{labels?.signHeader || "Sign"}</span>
             </div>
             {maturityDates.map((_, idx) => (
               <div key={idx} className="grid grid-cols-5 gap-4">
                  <div className="h-6 border-b border-zinc-300 bg-white/30"></div>
                  <div className="h-6 border-b border-zinc-300 bg-white/50"></div>
                  <div className="h-6 border-b border-zinc-300 bg-zinc-50 flex items-center justify-center font-bold text-zinc-500">{idx + 1}{idx === 0?'st':idx === 1?'nd':'rd'} Period</div>
                  <div className="h-6 border-b border-zinc-300 bg-white/50"></div>
                  <div className="h-6 border-b border-zinc-300 bg-white/50"></div>
               </div>
             ))}
             <div className="grid grid-cols-5 gap-4">
                <div className="h-6 border-b border-zinc-300 bg-white/30"></div>
                <div className="h-6 border-b border-zinc-300 bg-white/50"></div>
                <div className="h-6 border-b border-zinc-300 flex items-center justify-center font-black text-zinc-400 text-[7px]">GRACE PERIOD</div>
                <div className="h-6 border-b border-zinc-300"></div>
                <div className="h-6 border-b border-zinc-300"></div>
             </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-2 text-center text-[9px] font-black uppercase tracking-widest text-emerald-800 italic">
            {labels?.adviseText || "SELLER IS ADVISED TO READ AND UNDERSTAND THE TERMS AND CONDITIONS ON THE REVERSE SIDE HEREOF"}
          </div>

          <div className="space-y-2 border-t border-zinc-200 pt-6">
            <h4 className="text-center font-black uppercase underline tracking-tighter">{labels?.termsHeading || "Terms and Conditions"}</h4>
            <div className="rounded border border-zinc-200 p-4 bg-white/80 text-[9px] leading-relaxed text-zinc-600 whitespace-pre-line">
              {termsText}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-20 pt-12 pb-4">
             <div className="text-center space-y-2">
                <div className="h-8 border-b-2 border-zinc-800"></div>
                <p className="font-black uppercase text-[8px] tracking-widest">{labels?.sellerSignature || "(Name and Signature of Seller)"}</p>
             </div>
             <div className="text-center space-y-2">
                <p className="font-black uppercase text-[9px] text-emerald-900 tracking-widest mb-4">{labels?.authorizedText || "I HEREBY AUTHORIZED"}</p>
                <div className="h-8 border-b-2 border-zinc-800 flex items-end justify-center pb-0.5">
                   {data.processedBy && (
                     <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-900">{data.processedBy}</span>
                   )}
                </div>
                <p className="font-black uppercase text-[8px] tracking-widest">{labels?.representativeSignature || "(Name and Signature of Representative)"}</p>
             </div>
          </div>
        </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-8 py-4 flex justify-between items-center z-10 no-print">
           <p className="text-[10px] text-zinc-400 font-medium italic">
             Review carefully. Finalizing will generate the ticket and store record permanently.
           </p>
           <div className="flex gap-4">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                Print / PDF
              </button>
             <button 
               onClick={onConfirm}
               disabled={isLoading}
               className="px-8 py-2.5 text-xs font-black text-white bg-emerald-700 rounded-xl shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95 flex items-center gap-2 disabled:bg-zinc-400"
             >
               {isLoading ? (
                 <>
                   <span className="anim-loading h-4 w-4 border-white/30 border-t-white rounded-full"/>
                   Saving Record...
                 </>
               ) : (
                 "Save & Finalize Transaction"
               )}
             </button>
           </div>
        </div>

        {/* Global Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #moa-slip-printable, #moa-slip-printable * {
              visibility: visible;
            }
            #moa-slip-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              padding: 10mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: portrait;
              margin: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
