"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

const INCH_PX = 96;

export type MoaDocsMargins = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Horizontal ruler (Google Docs–style) synced to paper width. */
export function MoaDocsRuler({
  paperWidthPx,
  margins,
  enabled,
  onMarginsChange,
}: {
  paperWidthPx: number;
  margins: MoaDocsMargins;
  enabled: boolean;
  onMarginsChange: (next: MoaDocsMargins) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const widthIn = paperWidthPx / INCH_PX;
  const majorTicks = Math.floor(widthIn);

  const pxToIn = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(1, rect.width);
      return Math.max(0, Math.min(widthIn, ratio * widthIn));
    },
    [widthIn],
  );

  const startDrag = (side: "left" | "right") => (event: ReactPointerEvent) => {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const onMove = (ev: PointerEvent) => {
      const inches = pxToIn(ev.clientX);
      if (side === "left") {
        const maxLeft = Math.max(0.25, widthIn - margins.right - 1);
        onMarginsChange({
          ...margins,
          left: Math.round(Math.min(maxLeft, Math.max(0.15, inches)) * 100) / 100,
        });
      } else {
        const fromRight = widthIn - inches;
        const maxRight = Math.max(0.25, widthIn - margins.left - 1);
        onMarginsChange({
          ...margins,
          right: Math.round(Math.min(maxRight, Math.max(0.15, fromRight)) * 100) / 100,
        });
      }
    };

    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const leftPct = (margins.left / widthIn) * 100;
  const rightPct = (margins.right / widthIn) * 100;

  return (
    <div className="border-b border-[#c4c7c5] bg-white px-2 py-0">
      <div
        ref={trackRef}
        className="relative mx-auto h-6 select-none"
        style={{ width: "100%", maxWidth: paperWidthPx }}
      >
        <div className="absolute inset-x-0 bottom-0 top-1.5">
          {Array.from({ length: majorTicks * 4 + 1 }, (_, i) => {
            const inches = i / 4;
            const isMajor = i % 4 === 0;
            const isHalf = i % 2 === 0;
            return (
              <div
                key={i}
                className="absolute bottom-0 flex flex-col items-center"
                style={{
                  left: `${(inches / widthIn) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {isMajor ? (
                  <span className="mb-0.5 text-[9px] leading-none text-[#5f6368]">
                    {inches || ""}
                  </span>
                ) : null}
                <span
                  className="w-px bg-[#9aa0a6]"
                  style={{ height: isMajor ? 8 : isHalf ? 5 : 3 }}
                />
              </div>
            );
          })}
        </div>

        <div
          className="pointer-events-none absolute bottom-0 top-0 bg-[#e8eaed]/80"
          style={{ left: 0, width: `${leftPct}%` }}
        />
        <div
          className="pointer-events-none absolute bottom-0 top-0 bg-[#e8eaed]/80"
          style={{ right: 0, width: `${rightPct}%` }}
        />

        <button
          type="button"
          title={`Left margin ${margins.left.toFixed(2)} in`}
          disabled={!enabled}
          onPointerDown={startDrag("left")}
          className="absolute bottom-0 z-10 -translate-x-1/2 cursor-ew-resize disabled:cursor-not-allowed"
          style={{ left: `${leftPct}%` }}
        >
          <span className="block h-0 w-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-[#1a73e8]" />
          <span className="mx-auto mt-px block h-1.5 w-2.5 rounded-[1px] bg-[#1a73e8]" />
        </button>

        <button
          type="button"
          title={`Right margin ${margins.right.toFixed(2)} in`}
          disabled={!enabled}
          onPointerDown={startDrag("right")}
          className="absolute bottom-0 z-10 -translate-x-1/2 cursor-ew-resize disabled:cursor-not-allowed"
          style={{ left: `${100 - rightPct}%` }}
        >
          <span className="block h-0 w-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-[#1a73e8]" />
        </button>
      </div>
    </div>
  );
}

export function marginsToPadding(margins: MoaDocsMargins): string {
  return `${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in`;
}

export function defaultMarginsForPage(pageSizeId: "letter" | "long" | "a4"): MoaDocsMargins {
  return {
    top: 0.15,
    bottom: 0.15,
    left: pageSizeId === "a4" ? 0.28 : 0.32,
    right: pageSizeId === "a4" ? 0.28 : 0.32,
  };
}
