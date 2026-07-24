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
  type MoaPaletteItemKind,
  type MoaTextAlign,
  type MoaTextStylePatch,
} from "../moa-design-palette";
import { ToolBtn } from "./ui";

/** Canva-style top bar — text tools for the current selection. */
export function MoaContextualToolbar({
  enabled,
  hasSelection,
  fontFamily,
  fontSize,
  textAlign,
  fontWeight,
  fontStyle,
  textDecoration,
  color,
  selectedKind,
  onFontFamilyChange,
  onFontSizeChange,
  onTextStyleChange,
  onDeleteSelected,
}: {
  enabled: boolean;
  hasSelection: boolean;
  fontFamily: string;
  fontSize: number;
  textAlign: MoaTextAlign;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  selectedKind: MoaPaletteItemKind | null;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextStyleChange: (patch: MoaTextStylePatch) => void;
  onDeleteSelected: () => void;
}) {
  const disabled = !enabled || !hasSelection;
  const kindLabel = selectedKind
    ? selectedKind === "moaField"
      ? "Field"
      : selectedKind.charAt(0).toUpperCase() + selectedKind.slice(1)
    : "Nothing selected";

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 bg-white px-3 py-2">
      <span className="mr-1 hidden rounded-md bg-zinc-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500 sm:inline">
        {kindLabel}
      </span>

      <select
        value={fontFamily}
        disabled={disabled}
        onChange={(event) => onFontFamilyChange(event.target.value)}
        className="max-w-[140px] rounded border border-zinc-200 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500 disabled:opacity-40"
        title="Font"
      >
        {MOA_FONT_OPTIONS.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      <select
        value={MOA_FONT_SIZES.includes(fontSize) ? fontSize : 11}
        disabled={disabled}
        onChange={(event) => onFontSizeChange(Number(event.target.value))}
        className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500 disabled:opacity-40"
        title="Size"
      >
        {MOA_FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <label
        title="Text color"
        className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded border border-zinc-200 ${
          disabled ? "opacity-40" : "hover:border-emerald-400"
        }`}
      >
        <input
          type="color"
          value={color}
          disabled={disabled}
          onChange={(event) => onTextStyleChange({ color: event.target.value })}
          className="h-8 w-8 cursor-pointer border-0 bg-transparent p-0"
        />
      </label>

      <div className="mx-0.5 h-5 w-px bg-zinc-200" />

      <ToolBtn
        title="Bold"
        disabled={disabled}
        active={fontWeight === "bold"}
        onClick={() =>
          onTextStyleChange({ fontWeight: fontWeight === "bold" ? "normal" : "bold" })
        }
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Italic"
        disabled={disabled}
        active={fontStyle === "italic"}
        onClick={() =>
          onTextStyleChange({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })
        }
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Underline"
        disabled={disabled}
        active={textDecoration === "underline"}
        onClick={() =>
          onTextStyleChange({
            textDecoration: textDecoration === "underline" ? "none" : "underline",
          })
        }
      >
        <Underline className="h-3.5 w-3.5" />
      </ToolBtn>

      <div className="mx-0.5 h-5 w-px bg-zinc-200" />

      <ToolBtn
        title="Align left"
        disabled={disabled}
        active={textAlign === "left"}
        onClick={() => onTextStyleChange({ textAlign: "left" })}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Align center"
        disabled={disabled}
        active={textAlign === "center"}
        onClick={() => onTextStyleChange({ textAlign: "center" })}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Align right"
        disabled={disabled}
        active={textAlign === "right"}
        onClick={() => onTextStyleChange({ textAlign: "right" })}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Justify"
        disabled={disabled}
        active={textAlign === "justify"}
        onClick={() => onTextStyleChange({ textAlign: "justify" })}
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolBtn>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={onDeleteSelected}
          className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1.5 text-[9px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
