"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  CheckSquare,
  ChevronDown,
  Circle,
  Columns2,
  Crop,
  Highlighter,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MinusSquare,
  Paintbrush,
  Plus,
  Printer,
  QrCode,
  Redo2,
  RemoveFormatting,
  Search,
  Shapes,
  SpellCheck,
  Strikethrough,
  Table2,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import {
  MOA_FONT_OPTIONS,
  MOA_FONT_SIZES,
  type MoaDesignElement,
  type MoaPaletteItemKind,
  type MoaTextAlign,
  type MoaTextStylePatch,
} from "../moa-design-palette";

/* ── Presets ── */

const DOCS_STYLES = [
  { id: "normal", label: "Normal text", fontSize: 11, fontWeight: "normal" as const, fontStyle: "normal" as const },
  { id: "title", label: "Title", fontSize: 26, fontWeight: "bold" as const, fontStyle: "normal" as const },
  { id: "h1", label: "Heading 1", fontSize: 20, fontWeight: "bold" as const, fontStyle: "normal" as const },
  { id: "h2", label: "Heading 2", fontSize: 16, fontWeight: "bold" as const, fontStyle: "normal" as const },
  { id: "h3", label: "Heading 3", fontSize: 14, fontWeight: "bold" as const, fontStyle: "normal" as const },
  { id: "subtitle", label: "Subtitle", fontSize: 14, fontWeight: "normal" as const, fontStyle: "italic" as const },
];

const ZOOM_OPTIONS = [50, 75, 90, 100, 125, 150, 200];

const LINE_SPACING_OPTIONS = [
  { label: "Single", value: 1 },
  { label: "1.15", value: 1.15 },
  { label: "1.5", value: 1.5 },
  { label: "Double", value: 2 },
];

type InsertItem = {
  id: string;
  label: string;
  icon: ReactNode;
  kind: MoaPaletteItemKind;
};

const INSERT_ITEMS: InsertItem[] = [
  { id: "text", label: "Text box", icon: <Type className="h-4 w-4" />, kind: "text" },
  { id: "image", label: "Image", icon: <ImageIcon className="h-4 w-4" />, kind: "photo" },
  { id: "table", label: "Table", icon: <Table2 className="h-4 w-4" />, kind: "table" },
  { id: "chart", label: "Chart", icon: <BarChart3 className="h-4 w-4" />, kind: "chart" },
  { id: "shape", label: "Shape", icon: <Shapes className="h-4 w-4" />, kind: "shape" },
  { id: "columns", label: "Columns", icon: <Columns2 className="h-4 w-4" />, kind: "columns" },
  { id: "hline", label: "Horizontal line", icon: <MinusSquare className="h-4 w-4" />, kind: "shape" },
];

/* ── Shared button ── */

function DocsBtn({
  title,
  active,
  disabled,
  onClick,
  children,
  className = "",
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-[#444746] transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? "bg-[#c2e7ff] text-[#001d35]" : "hover:bg-[#e8eaed]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-[#c4c7c5]" />;
}

/* ── Popover wrapper ── */

function Popover({
  trigger,
  children,
  disabled,
}: {
  trigger: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-7 items-center gap-0.5 rounded px-1.5 text-[#444746] transition hover:bg-[#e8eaed] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {trigger}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function PopoverItem({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition hover:bg-[#e8eaed] ${
        active ? "font-bold text-[#1a73e8]" : "text-[#3c4043]"
      }`}
    >
      {icon ? <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span> : null}
      {label}
    </button>
  );
}

/* ── Helpers ── */

function AlignIcon({ align }: { align: MoaTextAlign }) {
  const Icon =
    align === "center"
      ? AlignCenter
      : align === "right"
        ? AlignRight
        : align === "justify"
          ? AlignJustify
          : AlignLeft;
  return <Icon className="h-4 w-4" />;
}

function currentStyleId(fontSize: number, fontWeight: string, fontStyle: string) {
  const match = DOCS_STYLES.find(
    (s) =>
      s.fontSize === fontSize &&
      s.fontWeight === fontWeight &&
      s.fontStyle === fontStyle,
  );
  return match?.id ?? "normal";
}

function IconLinesSpacing() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h10M4 12h10M4 18h10" />
      <path d="M18 4v16M15 7l3-3 3 3M15 17l3 3 3-3" />
    </svg>
  );
}

/* ── Main toolbar ── */

/** Google Docs / Canva Docs–style formatting toolbar for MOA edit mode. */
export function MoaDocsToolbar({
  enabled,
  hasSelection,
  canUndo,
  canRedo,
  zoom,
  fontFamily,
  fontSize,
  textAlign,
  fontWeight,
  fontStyle,
  textDecoration,
  color,
  highlight,
  lineSpacing = 1.15,
  spellCheck = true,
  onUndo,
  onRedo,
  onZoomChange,
  onFontFamilyChange,
  onFontSizeChange,
  onTextStyleChange,
  onLineSpacingChange,
  onIndent,
  onInsertElement,
  onInsertLink,
  onInsertQr,
  onListFormat,
  onToggleSpellCheck,
  onPrint,
  onClearFormatting,
  selectedElement,
  onImageStyleChange,
  onToggleCropMode,
  onOpenImageOptions,
  onReplaceImage,
  isCropMode,
}: {
  enabled: boolean;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  fontFamily: string;
  fontSize: number;
  textAlign: MoaTextAlign;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  highlight: string;
  lineSpacing?: number;
  spellCheck?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomChange: (zoom: number) => void;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextStyleChange: (patch: MoaTextStylePatch) => void;
  onLineSpacingChange?: (value: number) => void;
  onIndent: (direction: -1 | 1) => void;
  onInsertElement: (kind: MoaPaletteItemKind, options?: Record<string, unknown>) => void;
  onInsertLink?: () => void;
  onInsertQr?: () => void;
  onListFormat?: (kind: "bullet" | "number" | "check") => void;
  onToggleSpellCheck?: () => void;
  onPrint: () => void;
  onClearFormatting: () => void;
  selectedElement?: MoaDesignElement | null;
  onImageStyleChange?: (patch: Partial<MoaDesignElement>) => void;
  onToggleCropMode?: () => void;
  onOpenImageOptions?: () => void;
  onReplaceImage?: () => void;
  isCropMode?: boolean;
}) {
  const styleDisabled = !enabled || !hasSelection;
  const styleId = currentStyleId(fontSize, fontWeight, fontStyle);

  const bumpSize = (dir: -1 | 1) => {
    const idx = MOA_FONT_SIZES.indexOf(
      MOA_FONT_SIZES.includes(fontSize) ? fontSize : 11,
    );
    const next = MOA_FONT_SIZES[Math.max(0, Math.min(MOA_FONT_SIZES.length - 1, idx + dir))];
    if (next != null) onFontSizeChange(next);
  };

  const applyStylePreset = (id: string) => {
    const preset = DOCS_STYLES.find((s) => s.id === id);
    if (!preset) return;
    onFontSizeChange(preset.fontSize);
    onTextStyleChange({
      fontWeight: preset.fontWeight,
      fontStyle: preset.fontStyle,
      fontSize: preset.fontSize,
    });
  };

  const cycleAlign = () => {
    const order: MoaTextAlign[] = ["left", "center", "right", "justify"];
    const next = order[(order.indexOf(textAlign) + 1) % order.length];
    onTextStyleChange({ textAlign: next });
  };

  const handleInsertItem = (item: InsertItem) => {
    if (item.id === "hline") {
      onInsertElement("shape", { shape: "line" });
    } else {
      onInsertElement(item.kind);
    }
  };

  return (
    <>
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[#c4c7c5] bg-[#edf2fa] px-2 py-1.5">
      {/* Search / Menus */}
      <DocsBtn title="Menus" disabled className="gap-1 px-2 text-[11px] font-medium">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Menus</span>
      </DocsBtn>

      <Sep />

      {/* History */}
      <DocsBtn title="Undo (Ctrl+Z)" disabled={!enabled || !canUndo} onClick={onUndo}>
        <Undo2 className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn title="Redo (Ctrl+Y / Ctrl+Shift+Z)" disabled={!enabled || !canRedo} onClick={onRedo}>
        <Redo2 className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn title="Print" disabled={!enabled} onClick={onPrint}>
        <Printer className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title={spellCheck ? "Spelling on — click to turn off" : "Spelling off — click to turn on"}
        disabled={!enabled}
        active={spellCheck}
        onClick={onToggleSpellCheck}
      >
        <SpellCheck className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn title="Paint format (coming soon)" disabled>
        <Paintbrush className="h-4 w-4" />
      </DocsBtn>

      <Sep />

      {/* Zoom */}
      <select
        value={zoom}
        disabled={!enabled}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="h-7 rounded border-0 bg-transparent px-1 text-[12px] text-[#444746] outline-none hover:bg-[#e8eaed] disabled:opacity-40"
        title="Zoom"
      >
        {ZOOM_OPTIONS.map((z) => (
          <option key={z} value={z}>
            {z}%
          </option>
        ))}
      </select>

      <Sep />

      {/* Styles */}
      <select
        value={styleId}
        disabled={styleDisabled}
        onChange={(e) => applyStylePreset(e.target.value)}
        className="h-7 max-w-[110px] rounded border-0 bg-transparent px-1 text-[12px] text-[#444746] outline-none hover:bg-[#e8eaed] disabled:opacity-40"
        title="Styles"
      >
        {DOCS_STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Font family */}
      <select
        value={fontFamily}
        disabled={styleDisabled}
        onChange={(e) => onFontFamilyChange(e.target.value)}
        className="h-7 max-w-[120px] rounded border-0 bg-transparent px-1 text-[12px] text-[#444746] outline-none hover:bg-[#e8eaed] disabled:opacity-40"
        title="Font"
      >
        {MOA_FONT_OPTIONS.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      {/* Font size ± */}
      <div className="inline-flex h-7 items-center rounded hover:bg-[#e8eaed]">
        <DocsBtn title="Decrease font size" disabled={styleDisabled} onClick={() => bumpSize(-1)}>
          <Minus className="h-3.5 w-3.5" />
        </DocsBtn>
        <input
          type="number"
          value={fontSize}
          disabled={styleDisabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0) onFontSizeChange(Math.min(96, Math.max(6, Math.round(n))));
          }}
          className="w-8 border-0 bg-transparent text-center text-[12px] text-[#444746] outline-none disabled:opacity-40"
          title="Font size"
        />
        <DocsBtn title="Increase font size" disabled={styleDisabled} onClick={() => bumpSize(1)}>
          <Plus className="h-3.5 w-3.5" />
        </DocsBtn>
      </div>

      <Sep />

      {/* Bold / Italic / Underline / Strikethrough */}
      <DocsBtn
        title="Bold (Ctrl+B)"
        disabled={styleDisabled}
        active={fontWeight === "bold"}
        onClick={() =>
          onTextStyleChange({ fontWeight: fontWeight === "bold" ? "normal" : "bold" })
        }
      >
        <Bold className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title="Italic (Ctrl+I)"
        disabled={styleDisabled}
        active={fontStyle === "italic"}
        onClick={() =>
          onTextStyleChange({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })
        }
      >
        <Italic className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title="Underline (Ctrl+U)"
        disabled={styleDisabled}
        active={textDecoration === "underline"}
        onClick={() =>
          onTextStyleChange({
            textDecoration: textDecoration === "underline" ? "none" : "underline",
          })
        }
      >
        <Underline className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title="Strikethrough"
        disabled={styleDisabled}
        active={textDecoration === "line-through"}
        onClick={() =>
          onTextStyleChange({
            textDecoration: textDecoration === "line-through" ? "none" : "line-through",
          })
        }
      >
        <Strikethrough className="h-4 w-4" />
      </DocsBtn>

      {/* Text color */}
      <label
        title="Text color"
        className={`inline-flex h-7 w-7 cursor-pointer flex-col items-center justify-center rounded ${
          styleDisabled ? "opacity-35" : "hover:bg-[#e8eaed]"
        }`}
      >
        <span className="text-[11px] font-bold leading-none text-[#444746]">A</span>
        <span className="mt-0.5 h-1 w-4 rounded-sm" style={{ background: color }} />
        <input
          type="color"
          value={color}
          disabled={styleDisabled}
          onChange={(e) => onTextStyleChange({ color: e.target.value })}
          className="sr-only"
        />
      </label>

      {/* Highlight */}
      <label
        title="Highlight color"
        className={`inline-flex h-7 w-7 cursor-pointer flex-col items-center justify-center rounded ${
          styleDisabled ? "opacity-35" : "hover:bg-[#e8eaed]"
        }`}
      >
        <Highlighter className="h-3.5 w-3.5 text-[#444746]" />
        <span
          className="mt-0.5 h-1 w-4 rounded-sm"
          style={{
            background:
              !highlight || highlight === "transparent" ? "#fef08a" : highlight,
          }}
        />
        <input
          type="color"
          value={
            !highlight || highlight === "transparent" ? "#fef08a" : highlight
          }
          disabled={styleDisabled}
          onChange={(e) => onTextStyleChange({ fill: e.target.value })}
          className="sr-only"
        />
      </label>

      <Sep />

      {/* Insert dropdown */}
      <Popover
        disabled={!enabled}
        trigger={
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#444746]">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Insert</span>
          </span>
        }
      >
        {INSERT_ITEMS.map((item) => (
          <PopoverItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            onClick={() => handleInsertItem(item)}
          />
        ))}
        <div className="my-1 h-px bg-zinc-100" />
        <PopoverItem
          label="QR code"
          icon={<QrCode className="h-4 w-4" />}
          onClick={() => onInsertQr?.()}
        />
        <PopoverItem
          label="Link"
          icon={<Link2 className="h-4 w-4" />}
          onClick={() => onInsertLink?.()}
        />
      </Popover>

      <Sep />

      {/* Alignment */}
      <DocsBtn
        title={`Align (${textAlign}) — click to cycle`}
        disabled={styleDisabled}
        onClick={cycleAlign}
        className="gap-0.5 px-1.5"
      >
        <AlignIcon align={textAlign} />
      </DocsBtn>

      {/* Line spacing */}
      <Popover
        disabled={styleDisabled}
        trigger={<IconLinesSpacing />}
      >
        {LINE_SPACING_OPTIONS.map((opt) => (
          <PopoverItem
            key={opt.value}
            label={opt.label}
            active={lineSpacing === opt.value}
            onClick={() => onLineSpacingChange?.(opt.value)}
          />
        ))}
      </Popover>

      {/* Lists */}
      <DocsBtn
        title="Checklist"
        disabled={styleDisabled}
        onClick={() => onListFormat?.("check")}
      >
        <CheckSquare className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title="Bulleted list"
        disabled={styleDisabled}
        onClick={() => onListFormat?.("bullet")}
      >
        <List className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title="Numbered list"
        disabled={styleDisabled}
        onClick={() => onListFormat?.("number")}
      >
        <ListOrdered className="h-4 w-4" />
      </DocsBtn>

      {/* Indent */}
      <DocsBtn
        title="Decrease indent"
        disabled={styleDisabled}
        onClick={() => onIndent(-1)}
      >
        <IndentDecrease className="h-4 w-4" />
      </DocsBtn>
      <DocsBtn
        title="Increase indent"
        disabled={styleDisabled}
        onClick={() => onIndent(1)}
      >
        <IndentIncrease className="h-4 w-4" />
      </DocsBtn>

      <Sep />

      {/* Clear formatting */}
      <DocsBtn
        title="Clear formatting"
        disabled={styleDisabled}
        onClick={onClearFormatting}
      >
        <RemoveFormatting className="h-4 w-4" />
      </DocsBtn>
    </div>

    {/* Image toolbar row — shown when a photo/header with image is selected */}
    {selectedElement?.imageSrc ? (
      <div className="flex items-center gap-1 border-b border-[#c4c7c5] bg-[#f0f4e8] px-2 py-1">
        <DocsBtn
          title="Crop image"
          active={isCropMode}
          onClick={onToggleCropMode}
        >
          <Crop className="h-4 w-4" />
        </DocsBtn>

        <Sep />

        <button
          type="button"
          onClick={onOpenImageOptions}
          className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[11px] font-medium text-[#444746] hover:bg-[#e8eaed]"
        >
          Image options
        </button>

        <button
          type="button"
          onClick={onReplaceImage}
          className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[11px] font-medium text-[#444746] hover:bg-[#e8eaed]"
        >
          Replace image
        </button>
      </div>
    ) : null}
    </>
  );
}


