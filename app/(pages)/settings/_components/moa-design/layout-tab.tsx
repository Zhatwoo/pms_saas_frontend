"use client";

import {
  MOA_HEADER_FIELD_MIME,
  MOA_HEADER_FIELD_OPTIONS,
  type MoaHeaderFieldKey,
} from "../moa-design-palette";
import { LAYOUT_ITEMS } from "./palette-catalog";
import { PaletteTile, TabHint } from "./ui";

export function MoaLayoutTab({
  enabled,
  onPaletteDragStateChange,
  onAddHeaderField,
}: {
  enabled: boolean;
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onAddHeaderField?: (key: MoaHeaderFieldKey) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Layout</h3>
        <TabHint>Drag Header, Section, Body, or Text onto the canvas.</TabHint>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {LAYOUT_ITEMS.map((item) => (
            <PaletteTile
              key={item.kind}
              {...item}
              disabled={!enabled}
              onDragStateChange={onPaletteDragStateChange}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Header fields</h3>
        <TabHint>
          Select a Header on the canvas, then drag or click these fields into it.
        </TabHint>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {MOA_HEADER_FIELD_OPTIONS.map((field) => (
            <button
              key={field.key}
              type="button"
              draggable={enabled}
              disabled={!enabled}
              title={field.hint}
              onDragStart={(event) => {
                if (!enabled) return;
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData(MOA_HEADER_FIELD_MIME, field.key);
                event.dataTransfer.setData("text/plain", `header-field:${field.key}`);
                onPaletteDragStateChange?.(true);
              }}
              onDragEnd={() => onPaletteDragStateChange?.(false)}
              onClick={() => {
                if (!enabled || !onAddHeaderField) return;
                onAddHeaderField(field.key);
              }}
              className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 py-2 text-left transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
            >
              <span className="block text-[9px] font-bold text-emerald-900">{field.label}</span>
              <span className="mt-0.5 block text-[8px] text-emerald-700/70">Drop on Header</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
