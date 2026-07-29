"use client";

/** View-only MOA modal — same print layout as New Pawn Transaction. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MOA_PAGE_SIZES } from "@/app/(pages)/settings/_components/moa-design-palette";
import type { MoaDesignBlob } from "./design-blob";
import { hasMoaDesign } from "./design-blob";
import { MoaDesignPrintPages } from "./moa-design-print";
import type { MoaFieldValueContext } from "./resolve-field-values";

function PreviewScale({
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

  const scaledHeight = pageHeightPx * scale * Math.max(1, pageCount);

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-x-hidden p-2 sm:p-4">
      <div
        className="relative mx-auto"
        style={{
          width: pageWidthPx * scale,
          height: scaledHeight,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left space-y-0"
          style={{
            width: pageWidthPx,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function MoaDesignViewModal({
  isOpen,
  onClose,
  design,
  values,
  title = "MOA Preview",
  subtitle = "View only — same layout used in New Pawn Transaction",
}: {
  isOpen: boolean;
  onClose: () => void;
  design: MoaDesignBlob | null | undefined;
  values: MoaFieldValueContext;
  title?: string;
  subtitle?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ready = hasMoaDesign(design);
  const page = ready && design
    ? MOA_PAGE_SIZES[design.pageSizeId] ?? MOA_PAGE_SIZES.long
    : MOA_PAGE_SIZES.long;
  const pageCount = ready && design ? Math.max(1, design.pageCount || 1) : 1;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 text-zinc-900">
      <div
        className="fixed inset-0 bg-brand-green/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-green/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-brand-green via-brand-green to-brand-green px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-tight leading-none sm:text-xl">
              {title}
            </h2>
            <p className="mt-1.5 text-[10px] font-medium text-white/80 sm:text-[11px]">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-100/80">
          {ready && design ? (
            <PreviewScale
              pageCount={pageCount}
              pageWidthPx={page.screenWidthPx}
              pageHeightPx={page.screenHeightPx}
            >
              <MoaDesignPrintPages design={design} values={values} />
            </PreviewScale>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <p className="text-sm font-bold text-zinc-700">No canvas design yet</p>
              <p className="max-w-sm text-[11px] font-medium text-zinc-500">
                Add fields or elements on the Edit Mode canvas, then open this preview again.
                After Save, the same layout appears in New Pawn Transaction.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-6 py-2.5 text-xs font-black text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
