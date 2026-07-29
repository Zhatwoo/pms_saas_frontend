"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import type { MoaDesignElement } from "../moa-design-palette";

type Section = "size" | "adjustments" | "crop" | "border" | null;

export function ImageOptionsPanel({
  element,
  onUpdate,
  onClose,
  onReplaceImage,
}: {
  element: MoaDesignElement;
  onUpdate: (patch: Partial<MoaDesignElement>) => void;
  onClose: () => void;
  onReplaceImage: () => void;
}) {
  const [open, setOpen] = useState<Section>("size");
  const toggle = (s: Section) => setOpen((prev) => (prev === s ? null : s));

  return (
    <div className="flex h-full flex-col border-l border-zinc-200 bg-[#f8f9fa]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800">Image options</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-200"
        >
          <X className="h-4 w-4 text-zinc-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Size and rotation */}
        <SectionHeader
          label="Size and rotation"
          open={open === "size"}
          onClick={() => toggle("size")}
        />
        {open === "size" && (
          <div className="space-y-3 px-4 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Width" value={element.width} onChange={(v) => onUpdate({ width: v })} unit="px" />
              <Field label="Height" value={element.height} onChange={(v) => onUpdate({ height: v })} unit="px" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Rotation</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={element.imageRotation ?? 0}
                  onChange={(e) => onUpdate({ imageRotation: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600"
                />
                <span className="min-w-[32px] text-right text-[11px] text-zinc-600">{element.imageRotation ?? 0}°</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Fit mode</label>
              <select
                value={element.imageFit || "cover"}
                onChange={(e) => onUpdate({ imageFit: e.target.value as MoaDesignElement["imageFit"] })}
                className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Stretch</option>
                <option value="none">Original</option>
              </select>
            </div>
          </div>
        )}

        {/* Crop */}
        <SectionHeader
          label="Crop"
          open={open === "crop"}
          onClick={() => toggle("crop")}
        />
        {open === "crop" && (
          <div className="space-y-3 px-4 pb-4 pt-2">
            <p className="text-[10px] text-zinc-400">Trim edges by percentage. Drag the handles on the canvas for visual cropping.</p>
            <div className="grid grid-cols-2 gap-2">
              <CropField label="Top" value={element.imageCropTop ?? 0} onChange={(v) => onUpdate({ imageCropTop: v })} />
              <CropField label="Right" value={element.imageCropRight ?? 0} onChange={(v) => onUpdate({ imageCropRight: v })} />
              <CropField label="Bottom" value={element.imageCropBottom ?? 0} onChange={(v) => onUpdate({ imageCropBottom: v })} />
              <CropField label="Left" value={element.imageCropLeft ?? 0} onChange={(v) => onUpdate({ imageCropLeft: v })} />
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ imageCropTop: undefined, imageCropRight: undefined, imageCropBottom: undefined, imageCropLeft: undefined })}
              className="w-full rounded bg-zinc-100 px-2 py-1.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-200"
            >
              Reset crop
            </button>
          </div>
        )}

        {/* Adjustments */}
        <SectionHeader
          label="Adjustments"
          open={open === "adjustments"}
          onClick={() => toggle("adjustments")}
        />
        {open === "adjustments" && (
          <div className="space-y-3 px-4 pb-4 pt-2">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Opacity</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={element.imageOpacity ?? 100}
                  onChange={(e) => onUpdate({ imageOpacity: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600"
                />
                <span className="min-w-[32px] text-right text-[11px] text-zinc-600">{element.imageOpacity ?? 100}%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Filter</label>
              <select
                value={element.imageFilter || "none"}
                onChange={(e) => onUpdate({ imageFilter: e.target.value as MoaDesignElement["imageFilter"] })}
                className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none"
              >
                <option value="none">None</option>
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="blur">Blur</option>
                <option value="brightness">Brightness</option>
                <option value="contrast">Contrast</option>
                <option value="saturate">Saturate</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Shadow</label>
              <select
                value={element.imageShadow || "none"}
                onChange={(e) => onUpdate({ imageShadow: e.target.value as MoaDesignElement["imageShadow"] })}
                className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra large</option>
                <option value="3d">3D</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Rounded corners</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={element.imageBorderRadius ?? 0}
                  onChange={(e) => onUpdate({ imageBorderRadius: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600"
                />
                <span className="min-w-[32px] text-right text-[11px] text-zinc-600">{element.imageBorderRadius ?? 0}px</span>
              </div>
            </div>
          </div>
        )}

        {/* Border */}
        <SectionHeader
          label="Border"
          open={open === "border"}
          onClick={() => toggle("border")}
        />
        {open === "border" && (
          <div className="space-y-3 px-4 pb-4 pt-2">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500">Width</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={element.imageBorderWidth ?? 0}
                  onChange={(e) => onUpdate({ imageBorderWidth: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600"
                />
                <span className="min-w-[28px] text-right text-[11px] text-zinc-600">{element.imageBorderWidth ?? 0}px</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-zinc-500">Color</label>
              <input
                type="color"
                value={element.imageBorderColor || "#000000"}
                onChange={(e) => onUpdate({ imageBorderColor: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded border border-zinc-200"
              />
              <span className="text-[10px] text-zinc-500">{element.imageBorderColor || "#000000"}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-zinc-200 px-4 py-3 space-y-2">
          <button
            type="button"
            onClick={onReplaceImage}
            className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Replace image
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                imageBorderRadius: undefined,
                imageShadow: undefined,
                imageOpacity: undefined,
                imageFit: undefined,
                imageFilter: undefined,
                imageBorderWidth: undefined,
                imageBorderColor: undefined,
                imageCropTop: undefined,
                imageCropRight: undefined,
                imageCropBottom: undefined,
                imageCropLeft: undefined,
                imageRotation: undefined,
              })
            }
            className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold text-orange-600 hover:bg-orange-50"
          >
            Reset all effects
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 border-b border-zinc-100 px-4 py-3 text-left text-[12px] font-semibold transition hover:bg-zinc-100 ${
        open ? "bg-[#e8f0fe] text-[#1967d2]" : "text-zinc-700"
      }`}
    >
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      />
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-zinc-500">{label} ({unit})</label>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n > 0) onChange(Math.round(n));
        }}
        className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-blue-400"
      />
    </div>
  );
}

function CropField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-zinc-500">{label} (%)</label>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="range"
          min={0}
          max={80}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-emerald-600"
        />
        <span className="min-w-[24px] text-right text-[10px] text-zinc-600">{value}</span>
      </div>
    </div>
  );
}
