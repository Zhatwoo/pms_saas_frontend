"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

interface TransactionDetail {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  amount: number;
  pawn_date: string;
  serial_number: string | null;
  condition: string | null;
  items_included: string | null;
  memory_storage: string | null;
  remarks: string | null;
  profile_photo: string | null;
  item_photos: string[];
  id_photo: string | null;
  id_back_photo: string | null;
  customer?: {
    full_name: string;
    address: string;
    contact_number: string;
  };
  branch_info?: {
    name: string;
    location: string;
    phone: string;
  };
}

export default function PublicTicketView() {
  const { unitCode } = useParams();
  const [data, setData] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const fetchData = useCallback(async () => {
    if (!unitCode) return;
    setIsLoading(true);
    setError(null);
    try {
      // We use the public endpoint we created in the backend
      const res = await api.get<TransactionDetail>(`/pawn-tickets/public/${unitCode}`);
      if (res) {
        setData(res);
      }
    } catch (err: any) {
      console.error("Failed to fetch ticket:", err);
      setError("Pawn ticket not found or no longer available.");
    } finally {
      setIsLoading(false);
    }
  }, [unitCode]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Verifying Ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-emerald-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-xl font-black text-zinc-900 mb-2">Ticket Not Found</h1>
          <p className="text-zinc-500 text-sm mb-6">{error || "The requested pawn ticket could not be retrieved."}</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all">Retry Access</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-emerald-100 p-4 sm:p-8 md:p-12">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; padding: 0; margin: 0; }
          .print-container { padding: 0 !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
             </div>
             <div>
                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-tighter">Official Transaction Record</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{unitCode}</p>
             </div>
          </div>
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
            Download PDF
          </button>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-200 overflow-hidden print-container">
          {/* Top Banner */}
          <div className="bg-emerald-950 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">JCLB PAWNSHOP OFFICIAL</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{data.item_name}</h1>
              <p className="text-sm font-medium text-emerald-100/60 uppercase tracking-widest">{data.branch_info?.name || "BGC BRANCH"}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Pawn Valuation</p>
              <p className="text-4xl font-black text-emerald-400">₱{data.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {/* Essential Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <InfoBlock label="Unit Code" value={data.item_id} highlight />
              <InfoBlock label="Category" value={data.category} />
              <InfoBlock label="Pawn Date" value={data.pawn_date} />
              <InfoBlock label="Serial Number" value={data.serial_number || "N/A"} />
              <InfoBlock label="Memory/Storage" value={data.memory_storage || "—"} />
              <InfoBlock label="Condition" value={data.condition || "—"} />
              <InfoBlock label="Items Included" value={data.items_included || "—"} />
              <InfoBlock label="Status" value="VERIFIED" highlight color="text-emerald-600" />
            </div>

            {/* Visual Evidence Section */}
            <div className="space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 text-center">Visual Verification Evidence</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Item Photo */}
                  <div className="relative h-[300px] rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-inner group">
                    {data.item_photos.length > 0 ? (
                      <>
                        <Image 
                          src={data.item_photos[photoIndex]} 
                          alt="Pawned Item" 
                          fill 
                          unoptimized 
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {data.item_photos.length > 1 && (
                          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                            {data.item_photos.map((_, i) => (
                              <button 
                                key={i} 
                                onClick={() => setPhotoIndex(i)}
                                className={`h-1.5 rounded-full transition-all ${i === photoIndex ? 'w-6 bg-white shadow-md' : 'w-1.5 bg-white/40'}`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 italic">No image recorded</div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-white uppercase">Item Photo</div>
                  </div>

                  {/* Captured Identity Photo */}
                  <div className="relative h-[300px] rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-inner group">
                    {data.profile_photo ? (
                      <Image 
                        src={data.profile_photo} 
                        alt="Customer Identity" 
                        fill 
                        unoptimized 
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 italic">Identity capture not available</div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-white uppercase">Identity Record</div>
                  </div>
               </div>
            </div>

            {/* Customer & Branch Section */}
            <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-zinc-100">
               <div className="bg-zinc-50 rounded-3xl p-8 space-y-4 border border-zinc-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">Customer Details</p>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Registered Name</p>
                        <p className="text-lg font-black text-zinc-900 uppercase">{data.customer?.full_name}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Primary Address</p>
                        <p className="text-sm font-medium text-zinc-700 leading-relaxed">{data.customer?.address}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-zinc-50 rounded-3xl p-8 space-y-4 border border-zinc-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">Originating Branch</p>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Branch Name</p>
                        <p className="text-lg font-black text-zinc-900 uppercase">{data.branch_info?.name}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Location & Contact</p>
                        <p className="text-sm font-medium text-zinc-700">{data.branch_info?.location}</p>
                        <p className="text-sm font-black text-emerald-700 mt-1">{data.branch_info?.phone}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer / Legal */}
            <div className="pt-12 text-center space-y-4">
               <div className="inline-block px-6 py-2 bg-zinc-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.4em]">
                  Secure Verification System
               </div>
               <p className="text-[9px] text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                  This document serves as an electronic verification of the pawned item transaction. Any unauthorized reproduction or alteration is strictly prohibited and subject to legal action.
               </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center no-print pb-12">
           <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">© 2026 JCLB Pawnshop Management System</p>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, highlight = false, color = "text-zinc-900" }: { label: string, value: string | number, highlight?: boolean, color?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-black uppercase tracking-tight ${highlight ? (color !== "text-zinc-900" ? color : "text-emerald-700") : "text-zinc-800"}`}>
        {value || "—"}
      </p>
    </div>
  );
}
