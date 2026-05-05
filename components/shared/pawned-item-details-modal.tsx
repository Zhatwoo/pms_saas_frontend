"use client";

import { useState, useEffect, useRef, type TouchEvent } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatPeso } from "@/lib/currency";
import { StatusBadge } from "./status-badge";
import { formatPeso } from "@/lib/currency";

interface Renewal {
  date: string;
  amount: number;
}

interface Customer {
  id: string;
  full_name: string;
  address: string;
  barangay?: string;
  city?: string;
  province?: string;
  contact_number?: string;
  email?: string;
  id_presented?: string;
}

export interface DetailedPawnedItem {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  branch: string;
  branch_id: string;
  pawn_date: string;
  status: "Active" | "Redeemed" | "Expired";
  remarks: string;
  qr_code?: string;
  profile_photo?: string;
  item_photo?: string;
  itemPhotos?: string[];
  item_photos?: string[];
  id_photo?: string;
  id_back_photo?: string;
  condition?: string;
  serial_number?: string;
  items_included?: string;
  memory_storage?: string;
  amount: number;
  renewalCount: number;
  renewals: Renewal[];
  customer?: Customer;
  created_at?: string;
}

interface PawnedItemDetailsModalProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRemarks?: (id: string, remarks: string) => Promise<void>;
  userRole?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-6 w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/70">
      {children}
    </h3>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-emerald-700" : "text-text-primary"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

const statusVariant: Record<string, "green" | "blue" | "red" | "orange"> = {
  Active: "green",
  Redeemed: "blue",
  Expired: "red",
};

export function PawnedItemDetailsModal({ itemId, isOpen, onClose, onSaveRemarks, userRole }: PawnedItemDetailsModalProps) {
  const [item, setItem] = useState<DetailedPawnedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [itemPhotoIndex, setItemPhotoIndex] = useState(0);
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const canEdit = userRole === "super_admin" || userRole === "admin" || userRole === "employee";
  const canViewQr = userRole === "super_admin";

  useEffect(() => {
    if (isOpen && itemId) {
      fetchDetails();
    } else {
      setItem(null);
      setRemarks("");
      setError(null);
    }
  }, [isOpen, itemId]);

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<DetailedPawnedItem>(`/inventory/pawned/${itemId}`);
      setItem(data);
      setRemarks(data.remarks || "");
    } catch (err: any) {
      setError(err.message || "Failed to fetch item details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!item || !onSaveRemarks) return;
    setIsSaving(true);
    try {
      await onSaveRemarks(item.id, remarks);
      toast.success("Remarks updated.");
      await fetchDetails();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save remarks.");
    } finally {
      setIsSaving(false);
    }
  };

  const itemPhotos = item
    ? Array.from(new Set([
        ...(item.itemPhotos ?? item.item_photos ?? []),
      ].filter((photo): photo is string => Boolean(photo))))
    : [];

  const customerIdPresented = item?.customer?.id_presented?.trim().toLowerCase() || "";
  const hasCustomerId = Boolean(
    customerIdPresented &&
      customerIdPresented !== "-" &&
      customerIdPresented !== "n/a" &&
      customerIdPresented !== "no id / none",
  );
  const identityMedia = hasCustomerId
    ? [
        { src: item?.id_photo || "", label: "Front ID" },
        { src: item?.id_back_photo || "", label: "Back ID" },
      ].filter((entry) => Boolean(entry.src))
    : [{ src: item?.profile_photo || item?.id_photo || item?.item_photo || "", label: "Captured image" }].filter((entry) => Boolean(entry.src));

  useEffect(() => {
    setItemPhotoIndex(0);
  }, [item?.id, itemPhotos.length]);

  useEffect(() => {
    if (itemPhotos.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setItemPhotoIndex((currentIndex) => (currentIndex + 1) % itemPhotos.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [itemPhotos.length]);

  const handleItemTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleItemTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;

    if (startX === null || itemPhotos.length <= 1) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;

    if (Math.abs(delta) < 40) {
      return;
    }

    setItemPhotoIndex((currentIndex) => {
      if (delta < 0) {
        return (currentIndex + 1) % itemPhotos.length;
      }

      return (currentIndex - 1 + itemPhotos.length) % itemPhotos.length;
    });
  };

  const qrVisual = item?.qr_code
    ? item.qr_code.startsWith('data:')
      ? item.qr_code
      : `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${item.qr_code}`
    : null;

  if (!isOpen) return null;

  return (
    <>
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8 overflow-y-auto print:bg-white print:p-0 print:block"
      onClick={onClose}
    >
      {canViewQr && (
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            html,
            body {
              width: 2cm;
              height: 2cm;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            #print-label, #print-label * {
              visibility: visible;
            }
            #print-label {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 2cm;
              height: 2cm;
              display: flex !important;
              align-items: center;
              justify-content: center;
            }
            @page {
              size: 2cm 2cm;
              margin: 0mm;
            }
          }
        `}</style>
      )}

      {/* Neat Print Label Section (Only visible during print) */}
      {canViewQr && (
        <div id="print-label" className="hidden print:flex flex-col items-center justify-center bg-white w-full h-full p-0">
          <p className="text-[5px] font-black leading-none text-emerald-800 uppercase mb-[1px]">JCLB</p>
          {item?.qr_code && (
            <img 
              src={item.qr_code.startsWith('data:') ? item.qr_code : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.qr_code}`} 
              alt="QR" 
              className="w-[1.45cm] h-[1.45cm] object-contain"
            />
          )}
        </div>
      )}

      <div 
        className="relative w-[95vw] max-w-5xl bg-surface rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row transition-all duration-500 scale-in-center print:hidden md:w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Section: Visuals */}
        <div className="w-full md:w-[320px] bg-emerald-950 p-5 flex flex-col text-white shrink-0 md:max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="flex flex-col gap-4 min-h-max">
            <div className="flex flex-col items-center text-center">
              <SectionTitle><span className="text-emerald-400">Identity Media</span></SectionTitle>
              {hasCustomerId ? (
                <div className="grid w-full gap-3 md:grid-cols-2">
                  {identityMedia.map((media) => (
                    <button
                      key={media.label}
                      type="button"
                      onClick={() => setPreview(media.src ? { src: media.src, title: media.label } : null)}
                      className="group relative h-[180px] w-full overflow-hidden rounded-2xl border border-emerald-800 bg-emerald-900/60 shadow-xl"
                    >
                      <Image
                        src={media.src}
                        alt={media.label}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                        Expand
                      </div>
                      <div className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                        {media.label}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (identityMedia[0]?.src) {
                      setPreview({ src: identityMedia[0].src, title: identityMedia[0].label });
                    }
                  }}
                  className="group relative h-[200px] w-full overflow-hidden rounded-2xl border border-emerald-800 bg-emerald-900/60 shadow-xl"
                >
                  {identityMedia[0]?.src ? (
                    <>
                      <Image
                        src={identityMedia[0].src}
                        alt={identityMedia[0].label}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                        Expand
                      </div>
                      <div className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                        {identityMedia[0].label}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center">
                      <div className="space-y-2 opacity-60">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-emerald-300">
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70">
                          No capture available
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-col items-center text-center">
              <SectionTitle><span className="text-emerald-400">Item Visuals</span></SectionTitle>
              <div
                className="relative h-[200px] w-full overflow-hidden rounded-2xl border border-emerald-800 bg-emerald-900/60 shadow-xl"
                onTouchStart={handleItemTouchStart}
                onTouchEnd={handleItemTouchEnd}
              >
                {itemPhotos.length > 0 ? (
                  <div
                    className="flex h-full w-full transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${itemPhotoIndex * 100}%)` }}
                  >
                    {itemPhotos.map((photo, index) => (
                      <div key={`${photo.slice(0, 24)}-${index}`} className="relative h-full w-full shrink-0">
                        <Image
                          src={photo}
                          alt={`${item?.item_name || "Item photo"} ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-6 text-center">
                    <div className="space-y-2 opacity-60">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-emerald-300">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/70">
                        No item photo saved
                      </p>
                    </div>
                  </div>
                )}
                {itemPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setItemPhotoIndex((currentIndex) => (currentIndex - 1 + itemPhotos.length) % itemPhotos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-lg font-black text-white backdrop-blur transition hover:bg-black/60"
                      aria-label="Previous item photo"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemPhotoIndex((currentIndex) => (currentIndex + 1) % itemPhotos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-lg font-black text-white backdrop-blur transition hover:bg-black/60"
                      aria-label="Next item photo"
                    >
                      ›
                    </button>
                    <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
                      {itemPhotos.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setItemPhotoIndex(index)}
                          className={`h-2 rounded-full transition-all ${index === itemPhotoIndex ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                          aria-label={`Show item photo ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-4 right-4">
                  <StatusBadge label={item?.status || "..."} variant={statusVariant[item?.status || ""] || "black"} />
                </div>
                {itemPhotos.length > 0 && (
                  <div className="absolute bottom-4 left-4 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur">
                    {itemPhotoIndex + 1} / {itemPhotos.length}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <SectionTitle><span className="text-emerald-400">Security Identity</span></SectionTitle>
              <div className="flex w-full items-center justify-center">
                {canViewQr && qrVisual ? (
                  <Image
                    src={qrVisual}
                    alt="Security QR"
                    width={180}
                    height={180}
                    unoptimized
                    className="object-contain bg-white p-3 rounded-2xl shadow-xl"
                  />
                ) : !canViewQr ? (
                  <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300/60 bg-emerald-100/20 px-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">QR Visible to Super Admin only</p>
                  </div>
                ) : (
                  <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-100/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">No QR generated</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Detailed Information */}
        <div className="flex-1 p-8 md:p-12 max-h-[90vh] overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
               <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
               <p className="text-xs font-black uppercase tracking-widest">Retrieving Secure Data...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
               <div className="mb-6 text-rose-500">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               </div>
               <h4 className="text-lg font-black text-text-primary mb-2">Access Error</h4>
               <p className="text-sm text-text-tertiary mb-6">{error}</p>
               <button onClick={fetchDetails} className="px-6 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800">Retry Fetch</button>
            </div>
          ) : !item ? null : (
            <div className="space-y-10">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-main">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Pawned Inventory Record</span>
                  <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase">{item.item_name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-tighter">{item.category}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300" />
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-tighter">{item.branch}</span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Pawn Value</p>
                   <p className="text-3xl font-black text-emerald-700">{formatPeso(item.amount.toLocaleString())}</p>
                </div>
              </div>

              {/* Grid 1: Item specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <DetailItem label="Unit Code" value={item.item_id} highlight />
                <DetailItem label="Pawn Date" value={item.pawn_date} />
                <DetailItem label="Serial #" value={item.serial_number || "—"} />
                <DetailItem label="Renewals" value={`${item.renewalCount} Cycles`} />
                <DetailItem label="Memory/Storage" value={item.memory_storage || "—"} />
                <DetailItem label="Condition" value={item.condition || "—"} />
                <DetailItem label="Includes" value={item.items_included || "—"} />
                <DetailItem label="Records Date" value={item.created_at?.split('T')[0] || item.pawn_date} />
              </div>

              {/* Grid 2: Customer info */}
              <div className="rounded-[2rem] bg-surface-secondary border border-border-main p-8 space-y-6">
                <SectionTitle>Customer Profile</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <DetailItem label="Full Name" value={item.customer?.full_name || "WALK-IN CUSTOMER"} />
                   <DetailItem label="Contact Number" value={item.customer?.contact_number || "—"} />
                   <DetailItem label="ID Presented" value={item.customer?.id_presented || "—"} />
                   <div className="md:col-span-2 lg:col-span-3">
                      <DetailItem label="Primary Residence / Address" value={
                        [item.customer?.address, item.customer?.barangay, item.customer?.city, item.customer?.province]
                          .filter(Boolean)
                          .join(", ") || "No address recorded"
                      } />
                   </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <SectionTitle>Inventory Remarks & Investigations</SectionTitle>
                {canEdit ? (
                  <div className="space-y-3">
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add internal notes about the item condition or specific investigations..."
                      className="w-full min-h-[120px] rounded-3xl border border-border-main bg-surface-secondary p-6 text-sm font-medium text-text-primary outline-none focus:border-emerald-500"
                    />
                    {onSaveRemarks && (
                      <div className="flex justify-end">
                        <button 
                          onClick={handleSaveRemarks}
                          disabled={isSaving || remarks === item.remarks}
                          className="rounded-2xl bg-emerald-700 px-8 py-3 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-30 transition-all flex items-center gap-2"
                        >
                          {isSaving && <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                          {isSaving ? "SAVING..." : "UPDATE REMARKS"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-surface-secondary p-6 border border-border-main">
                    <p className="text-sm font-medium italic text-text-secondary leading-relaxed">
                      "{item.remarks || "No additional notes or description provided for this item."}"
                    </p>
                  </div>
                )}
              </div>

              {/* Renewal History */}
              <div className="space-y-6">
                 <SectionTitle>Financial Renewal Lifecycle</SectionTitle>
                 <div className="space-y-3">
                    {item.renewals.length > 0 ? (
                      item.renewals.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-surface-secondary rounded-2xl border border-border-main group hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700">R{i+1}</div>
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight">Renewal Payment Cycle {i+1}</p>
                                <p className="text-[10px] font-bold text-text-tertiary">PROCESSED ON {r.date}</p>
                             </div>
                          </div>
                          <p className="text-sm font-black text-emerald-700">{formatPeso(r.amount.toLocaleString())}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center opacity-30 border-2 border-dashed border-border-main rounded-[2rem]">
                         <p className="text-[10px] font-black uppercase tracking-widest">Original Pawn Cycle (No Renewals)</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-8 border-t border-border-subtle flex items-center justify-between">
                 <p className="text-[10px] font-bold text-text-tertiary italic">Last updated: {item.created_at?.split('T')[0] || "—"}</p>
                 <div className="flex gap-4">
                    <button 
                      onClick={onClose}
                      className="px-8 py-4 rounded-2xl border border-border-main text-xs font-black text-text-secondary hover:bg-surface-secondary active:scale-95 transition-all"
                    >
                      CLOSE RECORD
                    </button>
                    {canViewQr && (
                      <button 
                        onClick={() => window.print()}
                        className="px-8 py-4 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-black active:scale-95 transition-all shadow-xl"
                      >
                        PRINT LABEL
                      </button>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button Top-Right (Desktop) */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-50 md:hidden lg:flex"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>

    {preview && (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md" onClick={() => setPreview(null)}>
        <div className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Identity Preview</p>
              <h3 className="mt-1 text-lg font-black text-text-primary">{preview.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-hover"
              aria-label="Close image preview"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="flex max-h-[calc(90vh-72px)] items-center justify-center bg-zinc-950 p-4">
            <Image src={preview.src} alt={preview.title} width={1600} height={1200} unoptimized className="max-h-[calc(90vh-120px)] w-full object-contain" />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
