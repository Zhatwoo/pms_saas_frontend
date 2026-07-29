"use client";

import { Droplets, FilePlus2, FileType, Plus, Trash2 } from "lucide-react";
import {
  MAX_MOA_PAGES,
  MOA_PAGE_SIZES,
  createMoaWatermarkItem,
  type MoaPageSize,
  type MoaPageSizeId,
  type MoaWatermarkSettings,
} from "../moa-design-palette";
import { TabHint } from "./ui";

export function MoaCanvasTab({
  enabled,
  pageSize,
  onPageSizeChange,
  pageCount,
  onAddPage,
  onRemovePage,
  watermark,
  onWatermarkChange,
}: {
  enabled: boolean;
  pageSize: MoaPageSizeId;
  onPageSizeChange: (id: MoaPageSizeId) => void;
  pageCount: number;
  onAddPage: () => void;
  onRemovePage: () => void;
  watermark: MoaWatermarkSettings;
  onWatermarkChange: (next: MoaWatermarkSettings) => void;
}) {
  const active = MOA_PAGE_SIZES[pageSize];
  const canAdd = enabled && pageCount < MAX_MOA_PAGES;
  const canRemove = enabled && pageCount > 1;
  const items = watermark.items ?? [];

  const updateItem = (id: string, patch: Partial<(typeof items)[number]>) => {
    onWatermarkChange({
      ...watermark,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const addWatermark = () => {
    const offset = items.length * 8;
    onWatermarkChange({
      ...watermark,
      enabled: true,
      items: [
        ...items,
        createMoaWatermarkItem({
          text: "ORIGINAL",
          opacity: 0.12,
          rotation: -28,
          xPercent: Math.min(90, 50 + offset),
          yPercent: Math.min(90, 50 + offset),
        }),
      ],
    });
  };

  const removeWatermark = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    onWatermarkChange({
      ...watermark,
      items:
        nextItems.length > 0
          ? nextItems
          : [createMoaWatermarkItem({ text: "ORIGINAL" })],
      enabled: nextItems.length > 0 ? watermark.enabled : false,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Paper size</h3>
          <TabHint>Choose the page size for the canvas.</TabHint>
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
                  ? "border-emerald-600 bg-emerald-50"
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

      <div className="border-t border-zinc-100 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Pages</h3>
            <TabHint>Add another blank canvas below the current page.</TabHint>
          </div>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
            {pageCount} / {MAX_MOA_PAGES}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          <button
            type="button"
            disabled={!canAdd}
            onClick={onAddPage}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            Add another canvas
          </button>

          {pageCount > 1 ? (
            <button
              type="button"
              disabled={!canRemove}
              onClick={onRemovePage}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Remove last page
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Watermark</h3>
            <TabHint>Add overlays and drag them on the canvas to arrange.</TabHint>
          </div>
          <Droplets className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
        </div>

        <label className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 shadow-none">
          <input
            type="checkbox"
            disabled={!enabled}
            checked={watermark.enabled}
            onChange={(event) =>
              onWatermarkChange({ ...watermark, enabled: event.target.checked })
            }
            className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
          />
          <span className="text-[10px] font-bold text-zinc-700">Show watermark</span>
        </label>

        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 p-2 shadow-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  Watermark {index + 1}
                </span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => removeWatermark(item.id)}
                    className="rounded p-0.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title="Remove watermark"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              <label className="block space-y-1">
                <span className="text-[9px] font-semibold text-zinc-600">Text</span>
                <input
                  type="text"
                  disabled={!enabled || !watermark.enabled}
                  value={item.text}
                  onChange={(event) => updateItem(item.id, { text: event.target.value })}
                  placeholder="ORIGINAL"
                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-[10px] text-zinc-800 shadow-none outline-none focus:border-emerald-500 focus:ring-0 disabled:opacity-50"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[9px] font-semibold text-zinc-600">
                  Opacity · {Math.round(item.opacity * 100)}%
                </span>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={1}
                  disabled={!enabled || !watermark.enabled}
                  value={Math.round(item.opacity * 100)}
                  onChange={(event) =>
                    updateItem(item.id, { opacity: Number(event.target.value) / 100 })
                  }
                  className="w-full accent-emerald-600 disabled:opacity-50"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[9px] font-semibold text-zinc-600">
                  Rotation · {item.rotation}°
                </span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={1}
                  disabled={!enabled || !watermark.enabled}
                  value={item.rotation}
                  onChange={(event) =>
                    updateItem(item.id, { rotation: Number(event.target.value) })
                  }
                  className="w-full accent-emerald-600 disabled:opacity-50"
                />
              </label>

              <p className="text-[8px] font-medium text-zinc-400">
                Drag this watermark on the canvas to place it.
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={!enabled}
          onClick={addWatermark}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add another watermark
        </button>
      </div>
    </div>
  );
}
