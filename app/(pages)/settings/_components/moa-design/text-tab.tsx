"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Trash2,
  Underline,
} from "lucide-react";
import {
  MOA_FONT_OPTIONS,
  MOA_FONT_SIZES,
  type MoaTextAlign,
  type MoaTextStylePatch,
} from "../moa-design-palette";
import { TabHint, ToolBtn } from "./ui";

export function MoaTextTab({
  enabled,
  fontFamily,
  fontSize,
  textAlign,
  fontWeight,
  fontStyle,
  textDecoration,
  color,
  selectedId,
  onFontFamilyChange,
  onFontSizeChange,
  onTextStyleChange,
  onDeleteSelected,
  onClearAll,
}: {
  enabled: boolean;
  fontFamily: string;
  fontSize: number;
  textAlign: MoaTextAlign;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  selectedId: string | null;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextStyleChange: (patch: MoaTextStylePatch) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
}) {
  const toolsDisabled = !enabled;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Text tools</h3>
        <TabHint>Style the selected canvas element.</TabHint>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <span className="text-[9px] font-semibold text-zinc-600">Font</span>
          <select
            value={fontFamily}
            disabled={toolsDisabled}
            onChange={(event) => onFontFamilyChange(event.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {MOA_FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[9px] font-semibold text-zinc-600">Size</span>
          <select
            value={fontSize}
            disabled={toolsDisabled}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {MOA_FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-1">
        <span className="text-[9px] font-semibold text-zinc-600">Align</span>
        <div className="flex flex-wrap gap-1">
          <ToolBtn
            title="Align left"
            disabled={toolsDisabled}
            active={textAlign === "left"}
            onClick={() => onTextStyleChange({ textAlign: "left" })}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Align center"
            disabled={toolsDisabled}
            active={textAlign === "center"}
            onClick={() => onTextStyleChange({ textAlign: "center" })}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Align right"
            disabled={toolsDisabled}
            active={textAlign === "right"}
            onClick={() => onTextStyleChange({ textAlign: "right" })}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Justify"
            disabled={toolsDisabled}
            active={textAlign === "justify"}
            onClick={() => onTextStyleChange({ textAlign: "justify" })}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[9px] font-semibold text-zinc-600">Style</span>
        <div className="flex flex-wrap gap-1">
          <ToolBtn
            title="Bold"
            disabled={toolsDisabled}
            active={fontWeight === "bold"}
            onClick={() =>
              onTextStyleChange({ fontWeight: fontWeight === "bold" ? "normal" : "bold" })
            }
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Italic"
            disabled={toolsDisabled}
            active={fontStyle === "italic"}
            onClick={() =>
              onTextStyleChange({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })
            }
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Underline"
            disabled={toolsDisabled}
            active={textDecoration === "underline"}
            onClick={() =>
              onTextStyleChange({
                textDecoration: textDecoration === "underline" ? "none" : "underline",
              })
            }
          >
            <Underline className="h-3.5 w-3.5" />
          </ToolBtn>
          <label
            title="Text color"
            className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded border border-zinc-200 bg-white ${
              toolsDisabled ? "opacity-40" : "hover:border-emerald-400"
            }`}
          >
            <input
              type="color"
              value={color}
              disabled={toolsDisabled}
              onChange={(event) => onTextStyleChange({ color: event.target.value })}
              className="h-8 w-8 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>
      </div>

      <div className="flex gap-1 border-t border-zinc-100 pt-3">
        <button
          type="button"
          disabled={!enabled || !selectedId}
          onClick={onDeleteSelected}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-red-200 bg-white px-2 py-1.5 text-[9px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
        <button
          type="button"
          disabled={!enabled}
          onClick={onClearAll}
          className="inline-flex flex-1 items-center justify-center rounded border border-zinc-300 bg-white px-2 py-1.5 text-[9px] font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
