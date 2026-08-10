"use client";

/**
 * Employee Buy Back Slip modal — loads Settings `document_designs.buy_back`
 * and fills fields from the buy-back transaction (no sample hardcoding).
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MOA_PAGE_SIZES } from "@/app/(pages)/settings/_components/moa-design-palette";
import { api } from "@/lib/api";
import { printMoaSlipDocument } from "@/lib/print-templates";
import type { MoaDesignBlob } from "@/lib/moa/design-blob";
import { hasMoaDesign } from "@/lib/moa/design-blob";
import {
  applyBuyBackPaymentTableAmounts,
  buildBuyBackSlipFieldValues,
  type BuyBackSlipSource,
} from "@/lib/moa/build-buy-back-slip-values";
import { resolveEmployeeDocumentDesign } from "@/lib/moa/load-local-document-design";
import { MoaDesignPrintPages } from "@/lib/moa/moa-design-print";

type ShopInfo = {
  shopName?: string;
  shopAddress?: string;
  phoneNumber?: string;
  email?: string;
};

type MoaTemplateResponse = {
  design?: MoaDesignBlob | null;
  document_designs?: Record<string, MoaDesignBlob | null> | null;
  category_templates?: Record<
    string,
    {
      design?: MoaDesignBlob | null;
      document_designs?: Record<string, MoaDesignBlob | null> | null;
    }
  > | null;
};

export type BuyBackSlipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Finalize buy-back transaction after slip review. */
  onConfirm: () => void;
  source: BuyBackSlipSource | null;
  isConfirming?: boolean;
};

export function BuyBackSlipModal({
  isOpen,
  onClose,
  onConfirm,
  source,
  isConfirming = false,
}: BuyBackSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef(0);
  const [design, setDesign] = useState<MoaDesignBlob | null>(null);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const category = source?.category?.trim() || "";

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, isConfirming]);

  useEffect(() => {
    if (!isOpen || !source) return;

    let cancelled = false;
    const fetchId = ++fetchRef.current;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [moaTemplate, generalSettings] = await Promise.all([
          api.get<MoaTemplateResponse>(`/settings/moa_template?t=${Date.now()}`, {
            cache: "no-store",
          }),
          api.get<{ shopInfo?: ShopInfo }>(`/settings/general`),
        ]);

        if (cancelled || fetchId !== fetchRef.current) return;

        if (generalSettings?.shopInfo) {
          setShopInfo(generalSettings.shopInfo);
        }

        setDesign(resolveEmployeeDocumentDesign(moaTemplate, "buy_back", category));
      } catch (err) {
        console.error("Failed to load Buy Back Slip template:", err);
        if (!cancelled && fetchId === fetchRef.current) {
          setLoadError("Could not load buy back slip template.");
          setDesign(resolveEmployeeDocumentDesign(null, "buy_back", category));
        }
      } finally {
        if (!cancelled && fetchId === fetchRef.current) {
          setIsLoading(false);
        }
      }
    }

    void load();

    const onUpdated = () => {
      void load();
    };
    window.addEventListener("moa-template-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("moa-template-updated", onUpdated);
    };
  }, [isOpen, source, category]);

  const fieldValues = useMemo(() => {
    if (!source) return null;
    return buildBuyBackSlipFieldValues({
      ...source,
      shop: {
        shopName: source.shop?.shopName || shopInfo?.shopName,
        shopAddress: source.shop?.shopAddress || shopInfo?.shopAddress,
        phoneNumber: source.shop?.phoneNumber || shopInfo?.phoneNumber,
        email: source.shop?.email || shopInfo?.email,
      },
    });
  }, [source, shopInfo]);

  const printableDesign = useMemo(() => {
    if (!design || !fieldValues) return null;
    return applyBuyBackPaymentTableAmounts(design, fieldValues);
  }, [design, fieldValues]);

  const ready = Boolean(printableDesign && fieldValues && hasMoaDesign(printableDesign));
  const page =
    ready && printableDesign
      ? MOA_PAGE_SIZES[printableDesign.pageSizeId] ?? MOA_PAGE_SIZES.long
      : MOA_PAGE_SIZES.long;
  const pageCount =
    ready && printableDesign ? Math.max(1, printableDesign.pageCount || 1) : 1;

  const handlePrint = async () => {
    if (!printRef.current || !printableDesign) return;
    const pages = printRef.current.querySelectorAll(".moa-print-page");
    if (pages.length === 0) return;

    const wrapper = document.createElement("div");
    wrapper.id = "moa-slip-printable";
    wrapper.className = "moa-paper-effect";
    pages.forEach((pageEl) => {
      wrapper.appendChild(pageEl.cloneNode(true));
    });

    setIsPrinting(true);
    try {
      await printMoaSlipDocument(wrapper.outerHTML, {
        pageSizeId: printableDesign.pageSizeId,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen || !source) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 text-zinc-900">
      <div
        className="fixed inset-0 bg-brand-green/40 backdrop-blur-md"
        onClick={() => {
          if (!isConfirming && !isPrinting) onClose();
        }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buy Back Slip"
        className="relative z-10 flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-green/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-brand-green via-brand-green to-brand-green px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-tight leading-none sm:text-xl">
              Buy Back Slip
            </h2>
            <p className="mt-1.5 text-[10px] font-medium text-white/80 sm:text-[11px]">
              Review slip details from this repurchase, then finalize the transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming || isPrinting}
            aria-label="Close buy back slip"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-100/80" ref={printRef}>
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-3 py-16">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
              <p className="text-sm font-bold text-brand-green">Loading slip template…</p>
            </div>
          ) : ready && printableDesign && fieldValues ? (
            <BuyBackSlipPreviewScale
              pageCount={pageCount}
              pageWidthPx={page.screenWidthPx}
              pageHeightPx={page.screenHeightPx}
            >
              <MoaDesignPrintPages design={printableDesign} values={fieldValues} />
            </BuyBackSlipPreviewScale>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <p className="text-sm font-bold text-zinc-700">
                {loadError || "No Buy Back Slip design yet"}
              </p>
              <p className="max-w-sm text-[11px] font-medium text-zinc-500">
                Save a Buy Back Slip under Settings → Slip Edit, then try again.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[10px] font-medium text-zinc-500">
            Layout from Settings · values from this buy-back transaction
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void handlePrint()}
              disabled={!ready || isPrinting || isConfirming}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-xs font-black text-zinc-600 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinting ? "Printing…" : "Print"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming || isPrinting}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-xs font-black text-zinc-600 transition-all hover:bg-zinc-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!source || isConfirming || isPrinting}
              className="rounded-xl bg-brand-green px-6 py-2.5 text-xs font-black text-white shadow-md shadow-brand-green/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConfirming ? "Processing…" : "Confirm & Finalize"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyBackSlipPreviewScale({
  children,
  pageCount,
  pageWidthPx,
  pageHeightPx,
}: {
  children: ReactNode;
  pageCount: number;
  pageWidthPx: number;
  pageHeightPx: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const pageGapPx = 24;
  const contentHeight =
    pageHeightPx * Math.max(1, pageCount) +
    pageGapPx * Math.max(0, pageCount - 1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      if (available <= 0) return;
      setScale(Math.min(1, available / pageWidthPx));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-x-hidden p-2 sm:p-4">
      <div
        className="relative mx-auto"
        style={{
          width: pageWidthPx * scale,
          height: contentHeight * scale,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: pageWidthPx,
            height: contentHeight,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
