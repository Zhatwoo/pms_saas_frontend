"use client";

import { FileType } from "lucide-react";
import {
  MOA_PAGE_SIZES,
  type MoaPageSize,
  type MoaPageSizeId,
} from "../moa-design-palette";
import { TabHint } from "./ui";

export function MoaCanvasTab({
  enabled,
  pageSize,
  onPageSizeChange,
}: {
  enabled: boolean;
  pageSize: MoaPageSizeId;
  onPageSizeChange: (id: MoaPageSizeId) => void;
}) {
  const active = MOA_PAGE_SIZES[pageSize];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Paper size</h3>
          <TabHint>Choose the page size for the MOA canvas.</TabHint>
        </div>
        <FileType className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(Object.values(MOA_PAGE_SIZES) as MoaPageSize[]).map((size) => {
          const isActive = pageSize === size.id;
          return (
            <button
              key={size.id}
              type="button"
              disabled={!enabled}
              onClick={() => onPageSizeChange(size.id)}
              className={`rounded-lg border px-2 py-2 text-left transition disabled:opacity-50 ${
                isActive
                  ? "border-emerald-600 bg-emerald-50 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/60"
              }`}
            >
              <span
                className={`block text-[10px] font-bold ${
                  isActive ? "text-emerald-800" : "text-zinc-800"
                }`}
              >
                {size.label}
              </span>
              <span className="mt-0.5 block text-[8px] font-medium text-zinc-500">
                {size.subtitle}
              </span>
              <span
                className={`mt-1.5 block rounded border ${
                  isActive ? "border-emerald-400 bg-white" : "border-zinc-200 bg-zinc-50"
                }`}
                style={{
                  width: "100%",
                  aspectRatio: `${size.screenWidthPx} / ${size.screenHeightPx}`,
                  maxHeight: 40,
                }}
              />
            </button>
          );
        })}
      </div>

      <p className="rounded-md bg-zinc-50 px-2 py-1.5 text-[9px] font-medium text-zinc-500">
        Active: {active.label} · {active.subtitle}
      </p>
    </div>
  );
}
