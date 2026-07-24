"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  buildMoaDesignElement,
  defaultChartValues,
  defaultTableData,
  normalizeChartStyle,
  normalizeShapeKind,
} from "./moa-design/elements/create";
import {
  MOA_ELEMENT_OPTIONS_MIME,
  parseElementOptions,
  type MoaElementCreateOptions,
} from "./moa-design/elements/options";
import { MoaElementVisual, SHAPE_CYCLE } from "./moa-design/elements/visuals";

export type { MoaElementCreateOptions };

export type MoaPaletteItemKind =
  | "header"
  | "section"
  | "body"
  | "text"
  | "moaField"
  | "shape"
  | "photo"
  | "table"
  | "chart"
  | "frame"
  | "grid"
  | "columns";

export type MoaTextAlign = "left" | "center" | "right" | "justify";

export type MoaPageSizeId = "letter" | "long" | "a4";

export type MoaPageSize = {
  id: MoaPageSizeId;
  label: string;
  subtitle: string;
  width: string;
  height: string;
  padding: string;
  screenWidthPx: number;
  screenHeightPx: number;
};

/** Screen px ≈ 96dpi: Letter 8.5×11, Long 8.5×13, A4 210×297mm. */
export const MOA_PAGE_SIZES: Record<MoaPageSizeId, MoaPageSize> = {
  letter: {
    id: "letter",
    label: "Letter",
    subtitle: "8.5 × 11 in",
    width: "8.5in",
    height: "11in",
    padding: "0.15in 0.32in",
    screenWidthPx: 816,
    screenHeightPx: 1056,
  },
  long: {
    id: "long",
    label: "Long",
    subtitle: "8.5 × 13 in",
    width: "8.5in",
    height: "13in",
    padding: "0.15in 0.32in",
    screenWidthPx: 816,
    screenHeightPx: 1248,
  },
  a4: {
    id: "a4",
    label: "A4",
    subtitle: "210 × 297 mm",
    width: "210mm",
    height: "297mm",
    padding: "0.15in 0.28in",
    screenWidthPx: 794,
    screenHeightPx: 1123,
  },
};

export type MoaDesignElement = {
  id: string;
  kind: MoaPaletteItemKind;
  /** Which MOA canvas page this element belongs to (0-based). */
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: MoaTextAlign;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  shape: MoaShapeKind;
  fill: string;
  stroke: string;
  /** Branch fields dropped into a Header (name, address, phone…). */
  headerFields: MoaHeaderField[];
  /** Key from MOA Field Config when kind is moaField. */
  fieldKey: string;
  /** Optional image data URL for photo / header elements */
  imageSrc?: string;
  /** Optional table data for table elements (rows x columns) */
  tableData?: string[][];
  /** Bar heights (0–100) for chart elements */
  chartValues?: number[];
  /** Chart render style */
  chartStyle?: MoaChartStyle;
  /** Optional second series for multi-line / stacked charts */
  chartValuesB?: number[];
  /** Grid layout (defaults 2×2) */
  gridCols?: number;
  gridRows?: number;
  /** Frame border style */
  frameStyle?: MoaFrameStyle;
  /** Photo placeholder aspect */
  photoAspect?: MoaPhotoAspect;
  /** Table look */
  tableStyle?: MoaTableStyle;
  tableTheme?: MoaTableTheme;
  /** Columns layout preset */
  columnLayout?: MoaColumnLayout;
  columnPreset?: MoaColumnPreset;
};

export type MoaShapeKind =
  | "rect"
  | "square"
  | "circle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "line"
  | "rounded";

export type MoaFrameStyle = "solid" | "dashed" | "double" | "rounded";
export type MoaChartStyle =
  | "bar"
  | "row"
  | "line"
  | "multiline"
  | "pie"
  | "donut"
  | "area"
  | "stacked";
export type MoaPhotoAspect = "landscape" | "portrait" | "square" | "banner";
export type MoaTableStyle = "outline" | "header" | "filled";
export type MoaTableTheme = "gray" | "red" | "orange" | "blue" | "purple" | "green";
export type MoaColumnLayout =
  | "equal-2"
  | "equal-3"
  | "equal-4"
  | "left-narrow"
  | "right-narrow"
  | "left-media";
export type MoaColumnPreset = "basic" | "styled" | "predesigned";

export type MoaHeaderFieldKey = "shopName" | "shopAddress" | "phoneNumber" | "email";

export type MoaHeaderField = {
  id: string;
  key: MoaHeaderFieldKey;
  /** Position inside the header (px from top-left). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional per-field text styles (override parent header). */
  fontFamily?: string;
  fontSize?: number;
  textAlign?: MoaTextAlign;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  color?: string;
};

export type MoaBranchPreview = {
  shopName: string;
  shopAddress: string;
  phoneNumber: string;
  email: string;
};

export const MOA_HEADER_FIELD_OPTIONS: Array<{
  key: MoaHeaderFieldKey;
  label: string;
  hint: string;
}> = [
  { key: "shopName", label: "Branch name", hint: "Shop / branch name" },
  { key: "shopAddress", label: "Address", hint: "Branch address" },
  { key: "phoneNumber", label: "Phone", hint: "Contact number" },
  { key: "email", label: "Email", hint: "Branch email" },
];

export type MoaTextStylePatch = Partial<
  Pick<
    MoaDesignElement,
    | "fontFamily"
    | "fontSize"
    | "textAlign"
    | "fontWeight"
    | "fontStyle"
    | "textDecoration"
    | "color"
    | "fill"
  >
>;

export const MOA_FONT_OPTIONS = [
  { value: "Times New Roman, Times, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Courier New, Courier, monospace", label: "Courier New" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Garamond, serif", label: "Garamond" },
] as const;

export const MOA_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const DESIGN_STORAGE_KEY = "pms.moa.designElements.v1";
const PAGE_SIZE_STORAGE_KEY = "pms.moa.pageSize.v1";
const PAGE_COUNT_STORAGE_KEY = "pms.moa.pageCount.v1";
const WATERMARK_STORAGE_KEY = "pms.moa.watermark.v1";
export const MAX_MOA_PAGES = 10;

export type MoaDocumentType = "moa" | "redeem" | "buy_back";

export const MOA_DOCUMENT_TYPES: Array<{
  id: MoaDocumentType;
  label: string;
  hint: string;
}> = [
  { id: "moa", label: "MOA", hint: "Memorandum of Agreement" },
  { id: "redeem", label: "Redeem slip", hint: "Redeem transaction slip" },
  { id: "buy_back", label: "Buy back slip", hint: "Buy back transaction slip" },
];

export type MoaWatermarkSettings = {
  enabled: boolean;
  text: string;
  opacity: number;
  rotation: number;
};

export const DEFAULT_MOA_WATERMARK: MoaWatermarkSettings = {
  enabled: false,
  text: "ORIGINAL",
  opacity: 0.12,
  rotation: -28,
};

/** Composite localStorage key: document type + category (frontend-only). */
export function moaDesignStorageKey(docType: MoaDocumentType, categoryKey: string) {
  return `${docType}:${categoryKey}`;
}

export const MOA_PALETTE_MIME = "application/x-moa-palette";
export const MOA_HEADER_FIELD_MIME = "application/x-moa-header-field";
export const MOA_CONFIG_FIELD_MIME = "application/x-moa-config-field";

export type MoaConfigFieldPayload = {
  key: string;
  label: string;
};

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const RESIZE_HANDLES: Array<{ handle: ResizeHandle; className: string; cursor: string }> = [
  { handle: "nw", className: "-left-1.5 -top-1.5", cursor: "cursor-nwse-resize" },
  { handle: "n", className: "left-1/2 -top-1.5 -translate-x-1/2", cursor: "cursor-ns-resize" },
  { handle: "ne", className: "-right-1.5 -top-1.5", cursor: "cursor-nesw-resize" },
  { handle: "e", className: "-right-1.5 top-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
  { handle: "se", className: "-bottom-1.5 -right-1.5", cursor: "cursor-nwse-resize" },
  { handle: "s", className: "left-1/2 -bottom-1.5 -translate-x-1/2", cursor: "cursor-ns-resize" },
  { handle: "sw", className: "-bottom-1.5 -left-1.5", cursor: "cursor-nesw-resize" },
  { handle: "w", className: "-left-1.5 top-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
];

export function createMoaDesignElement(
  kind: MoaPaletteItemKind,
  x: number,
  y: number,
  defaults?: MoaElementCreateOptions & {
    textAlign?: MoaTextAlign;
  },
): MoaDesignElement {
  const built = buildMoaDesignElement(kind, x, y, defaults);
  return {
    ...built,
    fontFamily: defaults?.fontFamily ?? MOA_FONT_OPTIONS[0].value,
  };
}

export function createMoaConfigFieldElement(
  payload: MoaConfigFieldPayload,
  x: number,
  y: number,
  defaults?: { fontFamily?: string; fontSize?: number; textAlign?: MoaTextAlign },
): MoaDesignElement {
  return {
    ...createMoaDesignElement("moaField", x, y, defaults),
    text: payload.label,
    fieldKey: payload.key,
  };
}

function normalizeElement(raw: Partial<MoaDesignElement> & { id: string; kind: MoaPaletteItemKind }): MoaDesignElement {
  return {
    id: raw.id,
    kind: raw.kind,
    pageIndex: typeof raw.pageIndex === "number" && raw.pageIndex >= 0 ? raw.pageIndex : 0,
    x: raw.x ?? 8,
    y: raw.y ?? 8,
    width: raw.width ?? 140,
    height: raw.height ?? 60,
    text: raw.text ?? "",
    fontFamily: raw.fontFamily ?? MOA_FONT_OPTIONS[0].value,
    fontSize: (() => {
      const n = Number(raw.fontSize);
      return Number.isFinite(n) && n > 0 ? n : 11;
    })(),
    textAlign: raw.textAlign ?? (raw.kind === "header" ? "center" : "left"),
    fontWeight: raw.fontWeight ?? (raw.kind === "header" ? "bold" : "normal"),
    fontStyle: raw.fontStyle ?? "normal",
    textDecoration: raw.textDecoration ?? "none",
    color: raw.color ?? "#18181b",
    shape: normalizeShapeKind(raw.shape),
    fill: raw.fill ?? (raw.kind === "shape" ? "#ecfdf5" : "transparent"),
    stroke: raw.stroke ?? (raw.kind === "header" ? "#d4d4d8" : "#059669"),
    headerFields: Array.isArray(raw.headerFields)
      ? raw.headerFields.map((field, index) => {
          const legacyRow =
            typeof (field as MoaHeaderField & { row?: number }).row === "number"
              ? (field as MoaHeaderField & { row?: number }).row!
              : index;
          const sameRowIndex = raw.headerFields!
            .slice(0, index)
            .filter((other) => {
              const otherRow =
                typeof (other as MoaHeaderField & { row?: number }).row === "number"
                  ? (other as MoaHeaderField & { row?: number }).row!
                  : raw.headerFields!.indexOf(other);
              return otherRow === legacyRow;
            }).length;
          return {
            id: field.id,
            key: field.key,
            x: typeof field.x === "number" ? field.x : 4 + sameRowIndex * 170,
            y: typeof field.y === "number" ? field.y : 4 + legacyRow * 24,
            width: typeof field.width === "number" ? field.width : defaultHeaderFieldSize(field.key).width,
            height:
              typeof field.height === "number"
                ? field.height
                : defaultHeaderFieldSize(field.key).height,
            fontFamily: typeof field.fontFamily === "string" ? field.fontFamily : undefined,
            fontSize: (() => {
              if (field.fontSize === undefined || field.fontSize === null) return undefined;
              const n = Number(field.fontSize);
              return Number.isFinite(n) && n > 0 ? n : undefined;
            })(),
            textAlign: field.textAlign,
            fontWeight: field.fontWeight,
            fontStyle: field.fontStyle,
            textDecoration: field.textDecoration,
            color: typeof field.color === "string" ? field.color : undefined,
          };
        })
      : [],
    fieldKey: raw.fieldKey ?? "",
    imageSrc: typeof raw.imageSrc === "string" ? raw.imageSrc : undefined,
    tableData: Array.isArray(raw.tableData)
      ? raw.tableData.map((row) =>
          Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [],
        )
      : raw.kind === "table"
        ? defaultTableData()
        : undefined,
    chartValues: Array.isArray(raw.chartValues)
      ? raw.chartValues.map((v) => {
          const n = Number(v);
          return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
        })
      : raw.kind === "chart"
        ? defaultChartValues()
        : undefined,
    chartStyle: raw.kind === "chart" ? normalizeChartStyle(raw.chartStyle) : undefined,
    chartValuesB: Array.isArray(raw.chartValuesB)
      ? raw.chartValuesB.map((v) => {
          const n = Number(v);
          return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
        })
      : undefined,
    gridCols:
      typeof raw.gridCols === "number" && raw.gridCols >= 1
        ? Math.min(6, Math.floor(raw.gridCols))
        : raw.kind === "grid"
          ? 2
          : undefined,
    gridRows:
      typeof raw.gridRows === "number" && raw.gridRows >= 1
        ? Math.min(6, Math.floor(raw.gridRows))
        : raw.kind === "grid"
          ? 2
          : undefined,
    frameStyle:
      raw.frameStyle === "solid" ||
      raw.frameStyle === "dashed" ||
      raw.frameStyle === "double" ||
      raw.frameStyle === "rounded"
        ? raw.frameStyle
        : raw.kind === "frame"
          ? "solid"
          : undefined,
    photoAspect:
      raw.photoAspect === "landscape" ||
      raw.photoAspect === "portrait" ||
      raw.photoAspect === "square" ||
      raw.photoAspect === "banner"
        ? raw.photoAspect
        : raw.kind === "photo"
          ? "landscape"
          : undefined,
    tableStyle:
      raw.tableStyle === "outline" ||
      raw.tableStyle === "header" ||
      raw.tableStyle === "filled"
        ? raw.tableStyle
        : raw.kind === "table"
          ? "header"
          : undefined,
    tableTheme:
      raw.tableTheme === "gray" ||
      raw.tableTheme === "red" ||
      raw.tableTheme === "orange" ||
      raw.tableTheme === "blue" ||
      raw.tableTheme === "purple" ||
      raw.tableTheme === "green"
        ? raw.tableTheme
        : raw.kind === "table"
          ? "green"
          : undefined,
    columnLayout:
      raw.columnLayout === "equal-2" ||
      raw.columnLayout === "equal-3" ||
      raw.columnLayout === "equal-4" ||
      raw.columnLayout === "left-narrow" ||
      raw.columnLayout === "right-narrow" ||
      raw.columnLayout === "left-media"
        ? raw.columnLayout
        : raw.kind === "columns"
          ? "equal-2"
          : undefined,
    columnPreset:
      raw.columnPreset === "basic" ||
      raw.columnPreset === "styled" ||
      raw.columnPreset === "predesigned"
        ? raw.columnPreset
        : raw.kind === "columns"
          ? "basic"
          : undefined,
  };
}

function defaultHeaderFieldSize(key: MoaHeaderFieldKey): { width: number; height: number } {
  switch (key) {
    case "shopName":
      return { width: 320, height: 24 };
    case "shopAddress":
      return { width: 380, height: 36 };
    case "phoneNumber":
    case "email":
      return { width: 180, height: 22 };
    default:
      return { width: 180, height: 22 };
  }
}

function nextHeaderFieldPlacement(
  fields: MoaHeaderField[],
  key: MoaHeaderFieldKey = "shopName",
): { x: number; y: number; width: number; height: number } {
  const size = defaultHeaderFieldSize(key);
  if (fields.length === 0) return { x: 8, y: 8, ...size };
  const lowest = Math.max(...fields.map((field) => field.y + (field.height || 20)));
  return { x: 8, y: lowest + 6, ...size };
}

export function loadMoaDesignElements(storageKey: string): MoaDesignElement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DESIGN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, MoaDesignElement[]>;
    let list = Array.isArray(parsed[storageKey]) ? parsed[storageKey] : [];
    // Migrate legacy MOA keys that were category-only (no docType prefix).
    if (list.length === 0 && storageKey.startsWith("moa:")) {
      const legacyKey = storageKey.slice("moa:".length);
      list = Array.isArray(parsed[legacyKey]) ? parsed[legacyKey] : [];
    }
    return list.map((item) => normalizeElement(item));
  } catch {
    return [];
  }
}

export function saveMoaDesignElements(storageKey: string, elements: MoaDesignElement[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(DESIGN_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, MoaDesignElement[]>) : {};
    parsed[storageKey] = elements;
    window.localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function loadMoaPageSize(storageKey: string): MoaPageSizeId {
  if (typeof window === "undefined") return "long";
  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (!raw) return "long";
    const parsed = JSON.parse(raw) as Record<string, string>;
    let id = parsed[storageKey];
    if (!id && storageKey.startsWith("moa:")) {
      id = parsed[storageKey.slice("moa:".length)];
    }
    if (id === "letter" || id === "long" || id === "a4") return id;
    return "long";
  } catch {
    return "long";
  }
}

export function saveMoaPageSize(storageKey: string, pageSize: MoaPageSizeId) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[storageKey] = pageSize;
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function loadMoaPageCount(storageKey: string, elements?: MoaDesignElement[]): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = window.localStorage.getItem(PAGE_COUNT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    let stored = parsed[storageKey];
    if (typeof stored !== "number" && storageKey.startsWith("moa:")) {
      stored = parsed[storageKey.slice("moa:".length)];
    }
    const fromStorage =
      typeof stored === "number" && stored >= 1
        ? Math.min(MAX_MOA_PAGES, Math.floor(stored))
        : 1;
    if (!elements || elements.length === 0) return fromStorage;
    const maxFromElements = Math.max(0, ...elements.map((el) => el.pageIndex ?? 0)) + 1;
    return Math.min(MAX_MOA_PAGES, Math.max(fromStorage, maxFromElements));
  } catch {
    return 1;
  }
}

export function saveMoaPageCount(storageKey: string, pageCount: number) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PAGE_COUNT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    parsed[storageKey] = Math.min(MAX_MOA_PAGES, Math.max(1, Math.floor(pageCount)));
    window.localStorage.setItem(PAGE_COUNT_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function normalizeWatermark(raw: Partial<MoaWatermarkSettings> | null | undefined): MoaWatermarkSettings {
  return {
    enabled: Boolean(raw?.enabled),
    text: typeof raw?.text === "string" && raw.text.trim() ? raw.text : DEFAULT_MOA_WATERMARK.text,
    opacity:
      typeof raw?.opacity === "number"
        ? Math.min(0.5, Math.max(0.04, raw.opacity))
        : DEFAULT_MOA_WATERMARK.opacity,
    rotation:
      typeof raw?.rotation === "number" ? raw.rotation : DEFAULT_MOA_WATERMARK.rotation,
  };
}

export function loadMoaWatermark(storageKey: string): MoaWatermarkSettings {
  if (typeof window === "undefined") return { ...DEFAULT_MOA_WATERMARK };
  try {
    const raw = window.localStorage.getItem(WATERMARK_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MOA_WATERMARK };
    const parsed = JSON.parse(raw) as Record<string, Partial<MoaWatermarkSettings>>;
    return normalizeWatermark(parsed[storageKey]);
  } catch {
    return { ...DEFAULT_MOA_WATERMARK };
  }
}

export function saveMoaWatermark(storageKey: string, settings: MoaWatermarkSettings) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(WATERMARK_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, MoaWatermarkSettings>)
      : {};
    parsed[storageKey] = normalizeWatermark(settings);
    window.localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

/** Non-interactive diagonal watermark overlay for the design canvas. */
export function MoaCanvasWatermark({ settings }: { settings: MoaWatermarkSettings }) {
  if (!settings.enabled || !settings.text.trim()) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-1/2 max-w-[90%] select-none truncate text-center text-[42px] font-bold uppercase tracking-[0.18em] text-zinc-800"
        style={{
          opacity: settings.opacity,
          transform: `translate(-50%, -50%) rotate(${settings.rotation}deg)`,
        }}
      >
        {settings.text}
      </div>
    </div>
  );
}

function cssFontSize(size: number | string | undefined): string | undefined {
  if (size === undefined || size === null || size === "") return undefined;
  if (typeof size === "number" && Number.isFinite(size)) return `${size}px`;
  const raw = String(size).trim();
  if (!raw) return undefined;
  if (/^\d+(\.\d+)?px$/i.test(raw)) return raw;
  const asNum = Number(raw);
  if (Number.isFinite(asNum)) return `${asNum}px`;
  return raw;
}

function elementTextStyle(element: MoaDesignElement): CSSProperties {
  return {
    fontFamily: element.fontFamily,
    fontSize: cssFontSize(element.fontSize),
    textAlign: element.textAlign,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
  };
}

/** Field styles override parent header when set. */
export function headerFieldTextStyle(
  field: MoaHeaderField,
  parent: MoaDesignElement,
): CSSProperties {
  const size = field.fontSize ?? parent.fontSize;
  return {
    fontFamily: field.fontFamily ?? parent.fontFamily,
    fontSize: cssFontSize(size),
    textAlign: field.textAlign ?? parent.textAlign,
    fontWeight: field.fontWeight ?? parent.fontWeight,
    fontStyle: field.fontStyle ?? parent.fontStyle,
    textDecoration: field.textDecoration ?? parent.textDecoration,
    color: field.color ?? parent.color,
  };
}

/** Header fields keep free x/y so they can sit side-by-side; textAlign only styles text. */
function headerFieldLayoutStyle(
  element: MoaDesignElement,
  field: MoaHeaderField,
): CSSProperties {
  return {
    left: field.x,
    top: field.y,
    width: field.width,
    height: field.height || 22,
    textAlign: element.textAlign,
  };
}

type AlignGuide = { axis: "x" | "y"; at: number };

type SnapBox = { x: number; y: number; width: number; height: number };

const SNAP_THRESHOLD_PX = 6;

function snapMovingBox(
  box: SnapBox,
  others: SnapBox[],
  bounds: { width: number; height: number },
): { x: number; y: number; guides: AlignGuide[] } {
  const xTargets = [0, bounds.width / 2, bounds.width];
  const yTargets = [0, bounds.height / 2, bounds.height];
  for (const other of others) {
    xTargets.push(other.x, other.x + other.width / 2, other.x + other.width);
    yTargets.push(other.y, other.y + other.height / 2, other.y + other.height);
  }

  let bestX = { dist: SNAP_THRESHOLD_PX + 1, x: box.x, at: null as number | null };
  let bestY = { dist: SNAP_THRESHOLD_PX + 1, y: box.y, at: null as number | null };

  const xEdges = [
    { offset: 0, value: box.x },
    { offset: box.width / 2, value: box.x + box.width / 2 },
    { offset: box.width, value: box.x + box.width },
  ];
  const yEdges = [
    { offset: 0, value: box.y },
    { offset: box.height / 2, value: box.y + box.height / 2 },
    { offset: box.height, value: box.y + box.height },
  ];

  for (const edge of xEdges) {
    for (const target of xTargets) {
      const dist = Math.abs(edge.value - target);
      if (dist < bestX.dist) {
        bestX = { dist, x: target - edge.offset, at: target };
      }
    }
  }
  for (const edge of yEdges) {
    for (const target of yTargets) {
      const dist = Math.abs(edge.value - target);
      if (dist < bestY.dist) {
        bestY = { dist, y: target - edge.offset, at: target };
      }
    }
  }

  const guides: AlignGuide[] = [];
  let x = box.x;
  let y = box.y;
  if (bestX.at !== null) {
    x = bestX.x;
    guides.push({ axis: "x", at: bestX.at });
  }
  if (bestY.at !== null) {
    y = bestY.y;
    guides.push({ axis: "y", at: bestY.at });
  }
  return { x, y, guides };
}

/** Group fields on the same row, then left/center/right the row inside the header. */
export function reflowHeaderFieldsAlign(
  header: MoaDesignElement,
  align: MoaTextAlign,
): MoaHeaderField[] {
  if (align === "justify" || header.headerFields.length === 0) {
    return header.headerFields;
  }

  const sorted = [...header.headerFields].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: MoaHeaderField[][] = [];
  for (const field of sorted) {
    const row = rows.find((items) => Math.abs(items[0].y - field.y) < 10);
    if (row) row.push(field);
    else rows.push([field]);
  }

  const rowOffset = new Map<string, number>();
  for (const row of rows) {
    const minX = Math.min(...row.map((f) => f.x));
    const maxX = Math.max(...row.map((f) => f.x + f.width));
    const groupW = maxX - minX;
    let nextLeft = 8;
    if (align === "center") {
      nextLeft = Math.max(0, (header.width - groupW) / 2);
    } else if (align === "right") {
      nextLeft = Math.max(0, header.width - groupW - 8);
    }
    const delta = nextLeft - minX;
    for (const field of row) {
      rowOffset.set(field.id, delta);
    }
  }

  return header.headerFields.map((field) => ({
    ...field,
    x: Math.max(0, field.x + (rowOffset.get(field.id) ?? 0)),
  }));
}

const TEXT_EDITABLE_KINDS = new Set<MoaPaletteItemKind>([
  "section",
  "body",
  "text",
  "moaField",
  "frame",
]);

function isTextEditableKind(kind: MoaPaletteItemKind): boolean {
  return TEXT_EDITABLE_KINDS.has(kind);
}

function ElementVisual({
  element,
  editingTable,
  onTableCellChange,
}: {
  element: MoaDesignElement;
  editingTable?: boolean;
  onTableCellChange?: (row: number, col: number, value: string) => void;
}) {
  return (
    <MoaElementVisual
      element={element}
      editingTable={editingTable}
      onTableCellChange={onTableCellChange}
    />
  );
}

export function resolveHeaderFieldValue(
  key: MoaHeaderFieldKey,
  branch?: MoaBranchPreview | null,
): string {
  if (!branch) {
    const fallback: Record<MoaHeaderFieldKey, string> = {
      shopName: "{{Branch Name}}",
      shopAddress: "{{Branch Address}}",
      phoneNumber: "{{Phone}}",
      email: "{{Email}}",
    };
    return fallback[key];
  }
  if (key === "shopName") return branch.shopName || "{{Branch Name}}";
  if (key === "shopAddress") return branch.shopAddress || "{{Branch Address}}";
  if (key === "phoneNumber") return branch.phoneNumber || "{{Phone}}";
  return branch.email || "{{Email}}";
}

let clipboardElement: MoaDesignElement | null = null;

export function MoaDesignCanvasLayer({
  enabled,
  paletteDragging = false,
  elements,
  selectedId,
  selectedIds,
  onSelect,
  onSelectedIdsChange,
  selectedFieldIds,
  onSelectedFieldIdsChange,
  onChangeElements,
  defaultFontFamily,
  defaultFontSize,
  branchPreview,
}: {
  enabled: boolean;
  paletteDragging?: boolean;
  elements: MoaDesignElement[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string | null) => void;
  onSelectedIdsChange?: (ids: string[]) => void;
  selectedFieldIds?: string[];
  onSelectedFieldIdsChange?: (ids: string[]) => void;
  onChangeElements: (next: MoaDesignElement[]) => void;
  defaultFontFamily: string;
  defaultFontSize: number;
  branchPreview?: MoaBranchPreview | null;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploadTarget, setPhotoUploadTarget] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [headerDropTargetId, setHeaderDropTargetId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<
    | { kind: "field"; headerId: string; fieldId: string; x: number; y: number }
    | { kind: "element"; elementId: string; x: number; y: number; canvasX: number; canvasY: number }
    | { kind: "canvas"; x: number; y: number; canvasX: number; canvasY: number }
    | null
  >(null);
  const [alignGuides, setAlignGuides] = useState<AlignGuide[]>([]);
  const [internalFieldIds, setInternalFieldIds] = useState<string[]>([]);
  // Visual-only: hide element hit-targets while dragging from palette so the layer receives the drop.
  const suppressElementHits = enabled && (paletteDragging || dragOver);

  const activeFieldIds = selectedFieldIds ?? internalFieldIds;
  const setActiveFieldIds = onSelectedFieldIdsChange ?? setInternalFieldIds;
  const activeSelectedIds =
    selectedIds && selectedIds.length > 0
      ? selectedIds
      : selectedId
        ? [selectedId]
        : [];

  const clearFieldSelection = () => setActiveFieldIds([]);
  const clearEditing = () => {
    setEditingTextId(null);
    setEditingTableId(null);
  };

  const selectHeaderFields = (
    headerId: string,
    fieldId: string,
    mode: "replace" | "toggle" | "keep-if-selected",
  ) => {
    onSelect(headerId);
    onSelectedIdsChange?.([headerId]);
    const header = elements.find((el) => el.id === headerId);
    const headerFieldIds = new Set((header?.headerFields ?? []).map((field) => field.id));
    setActiveFieldIds((() => {
      const prev = activeFieldIds;
      if (mode === "keep-if-selected" && prev.includes(fieldId)) {
        return prev.filter((id) => headerFieldIds.has(id));
      }
      if (mode === "toggle") {
        const sameHeader =
          prev.length === 0 || prev.every((id) => headerFieldIds.has(id));
        if (!sameHeader) return [fieldId];
        return prev.includes(fieldId)
          ? prev.filter((id) => id !== fieldId)
          : [...prev, fieldId];
      }
      return [fieldId];
    })());
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        clearFieldSelection();
      }
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  // Drop stale field ids after remove / category switch.
  useEffect(() => {
    if (activeFieldIds.length === 0) return;
    const valid = new Set(
      elements.flatMap((el) =>
        el.kind === "header" ? el.headerFields.map((field) => field.id) : [],
      ),
    );
    const next = activeFieldIds.filter((id) => valid.has(id));
    if (next.length !== activeFieldIds.length) setActiveFieldIds(next);
  }, [elements, activeFieldIds, setActiveFieldIds]);

  const updateElement = (id: string, patch: Partial<MoaDesignElement>) => {
    onChangeElements(elements.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  };

  const applyTextAlignToElement = (id: string, textAlign: MoaTextAlign) => {
    onChangeElements(
      elements.map((el) => {
        if (el.id !== id) return el;
        const next: MoaDesignElement = { ...el, textAlign };
        if (el.kind === "header") {
          next.headerFields = reflowHeaderFieldsAlign(next, textAlign);
        }
        return next;
      }),
    );
  };

  const deleteElement = (id: string) => {
    onChangeElements(elements.filter((el) => el.id !== id));
    if (selectedId === id) {
      onSelect(null);
    }
  };

  const duplicateElement = (id: string) => {
    const source = elements.find((el) => el.id === id);
    if (!source) return;
    const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nextElement: MoaDesignElement = {
      ...source,
      id: newId,
      x: source.x + 16,
      y: source.y + 16,
      headerFields: source.headerFields.map((hf) => ({
        ...hf,
        id: `hf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    onChangeElements([...elements, nextElement]);
    onSelect(newId);
  };

  const copyElement = (id: string) => {
    const source = elements.find((el) => el.id === id);
    if (!source) return;
    clipboardElement = {
      ...source,
      headerFields: source.headerFields.map((hf) => ({ ...hf })),
    };
  };

  const cutElement = (id: string) => {
    copyElement(id);
    deleteElement(id);
  };

  const pasteElement = (canvasX: number, canvasY: number) => {
    if (!clipboardElement) return;
    const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pasted: MoaDesignElement = {
      ...clipboardElement,
      id: newId,
      x: Math.max(8, canvasX - clipboardElement.width / 2),
      y: Math.max(8, canvasY - clipboardElement.height / 2),
      headerFields: clipboardElement.headerFields.map((hf) => ({
        ...hf,
        id: `hf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    onChangeElements([...elements, pasted]);
    onSelect(newId);
  };

  const bringToFront = (id: string) => {
    const target = elements.find((el) => el.id === id);
    if (!target) return;
    onChangeElements([...elements.filter((el) => el.id !== id), target]);
  };

  const sendToBack = (id: string) => {
    const target = elements.find((el) => el.id === id);
    if (!target) return;
    onChangeElements([target, ...elements.filter((el) => el.id !== id)]);
  };

  const addHeaderField = (headerId: string, key: MoaHeaderFieldKey) => {
    const header = elements.find((el) => el.id === headerId && el.kind === "header");
    if (!header) return;
    if (header.headerFields.some((field) => field.key === key)) return;
    const placement = nextHeaderFieldPlacement(header.headerFields, key);
    updateElement(headerId, {
      headerFields: [
        ...header.headerFields,
        {
          id: `hf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          key,
          ...placement,
        },
      ],
    });
    onSelect(headerId);
  };

  const removeHeaderFields = (headerId: string, fieldIds: string[]) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header || fieldIds.length === 0) return;
    const removeSet = new Set(fieldIds);
    updateElement(headerId, {
      headerFields: header.headerFields.filter((field) => !removeSet.has(field.id)),
    });
    setActiveFieldIds(activeFieldIds.filter((id) => !removeSet.has(id)));
  };

  const removeHeaderField = (headerId: string, fieldId: string) => {
    removeHeaderFields(headerId, [fieldId]);
  };

  const placeFieldBesidePrevious = (headerId: string, fieldId: string) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header) return;
    const ordered = [...header.headerFields].sort((a, b) => a.y - b.y || a.x - b.x);
    const index = ordered.findIndex((field) => field.id === fieldId);
    if (index <= 0) return;
    const previous = ordered[index - 1];
    updateElement(headerId, {
      headerFields: header.headerFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              x: previous.x + previous.width + 12,
              y: previous.y,
            }
          : field,
      ),
    });
  };

  const placeFieldOnOwnLine = (headerId: string, fieldId: string) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header) return;
    const field = header.headerFields.find((item) => item.id === fieldId);
    if (!field) return;
    const placement = nextHeaderFieldPlacement(
      header.headerFields.filter((item) => item.id !== fieldId),
      field.key,
    );
    updateElement(headerId, {
      headerFields: header.headerFields.map((item) =>
        item.id === fieldId ? { ...item, x: 8, y: placement.y } : item,
      ),
    });
  };

  const moveSelectedFields = (
    headerId: string,
    fieldIds: string[],
    direction: -1 | 1,
  ) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header || fieldIds.length === 0) return;
    const moveSet = new Set(fieldIds);
    updateElement(headerId, {
      headerFields: header.headerFields.map((item) =>
        moveSet.has(item.id)
          ? { ...item, y: Math.max(0, item.y + direction * 22) }
          : item,
      ),
    });
  };

  const moveFieldRow = (headerId: string, fieldId: string, direction: -1 | 1) => {
    moveSelectedFields(headerId, [fieldId], direction);
  };

  const selectAllHeaderFields = (headerId: string) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header) return;
    onSelect(headerId);
    onSelectedIdsChange?.([headerId]);
    setActiveFieldIds(header.headerFields.map((field) => field.id));
  };

  const startHeaderFieldMove = (
    event: ReactPointerEvent,
    headerId: string,
    fieldId: string,
  ) => {
    if (!enabled) return;
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const multiKey = event.shiftKey || event.ctrlKey || event.metaKey;
    if (multiKey) {
      selectHeaderFields(headerId, fieldId, "toggle");
      return;
    }

    const header = elements.find((el) => el.id === headerId);
    const field = header?.headerFields.find((item) => item.id === fieldId);
    if (!header || !field) return;

    // Single-select unless this field is already part of a multi-selection (group drag).
    const movingIds =
      activeFieldIds.includes(fieldId) && activeFieldIds.length > 0
        ? activeFieldIds.filter((id) =>
            header.headerFields.some((item) => item.id === id),
          )
        : [fieldId];

    onSelect(headerId);
    onSelectedIdsChange?.([headerId]);
    // Set field selection AFTER element selection so toolbar sync keeps field styles
    // (onSelectedIdsChange syncs from the header parent first).
    setActiveFieldIds(movingIds);

    const startX = event.clientX;
    const startY = event.clientY;
    const origins = new Map(
      header.headerFields
        .filter((item) => movingIds.includes(item.id))
        .map(
          (item) =>
            [
              item.id,
              {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height || 22,
              },
            ] as const,
        ),
    );
    const primary = origins.get(fieldId);
    if (!primary) return;

    const movingSet = new Set(movingIds);
    const siblings: SnapBox[] = header.headerFields
      .filter((item) => !movingSet.has(item.id))
      .map((item) => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height || 22,
      }));
    const bounds = { width: header.width, height: header.height };

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const rawX = primary.x + dx;
      const rawY = primary.y + dy;
      const snapped = snapMovingBox(
        { x: rawX, y: rawY, width: primary.width, height: primary.height },
        siblings,
        bounds,
      );
      const snappedDx = snapped.x - primary.x;
      const snappedDy = snapped.y - primary.y;

      setAlignGuides(
        snapped.guides.map((guide) =>
          guide.axis === "x"
            ? { axis: "x", at: header.x + guide.at }
            : { axis: "y", at: header.y + guide.at },
        ),
      );

      onChangeElements(
        elements.map((el) =>
          el.id !== headerId
            ? el
            : {
                ...el,
                headerFields: el.headerFields.map((item) => {
                  const origin = origins.get(item.id);
                  if (!origin) return item;
                  const h = item.height || 22;
                  const nextX = Math.max(
                    0,
                    Math.min(header.width - item.width, origin.x + snappedDx),
                  );
                  const nextY = Math.max(
                    0,
                    Math.min(header.height - h, origin.y + snappedDy),
                  );
                  return { ...item, x: nextX, y: nextY };
                }),
              },
        ),
      );
    };
    const onUp = () => {
      setAlignGuides([]);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const startHeaderFieldResize = (
    event: ReactPointerEvent,
    headerId: string,
    fieldId: string,
    handle: ResizeHandle,
  ) => {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    selectHeaderFields(headerId, fieldId, "keep-if-selected");
    if (!activeFieldIds.includes(fieldId)) {
      setActiveFieldIds([fieldId]);
    }
    onSelect(headerId);
    onSelectedIdsChange?.([headerId]);

    const header = elements.find((el) => el.id === headerId);
    const field = header?.headerFields.find((item) => item.id === fieldId);
    if (!header || !field) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const originX = field.x;
    const originY = field.y;
    const originW = field.width;
    const originH = field.height || 22;
    const minW = 48;
    const minH = 16;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      let nextX = originX;
      let nextY = originY;
      let nextW = originW;
      let nextH = originH;

      if (handle.includes("e")) nextW = Math.max(minW, originW + dx);
      if (handle.includes("s")) nextH = Math.max(minH, originH + dy);
      if (handle.includes("w")) {
        nextW = Math.max(minW, originW - dx);
        nextX = originX + (originW - nextW);
      }
      if (handle.includes("n")) {
        nextH = Math.max(minH, originH - dy);
        nextY = originY + (originH - nextH);
      }

      nextX = Math.max(0, Math.min(header.width - nextW, nextX));
      nextY = Math.max(0, Math.min(header.height - nextH, nextY));
      nextW = Math.min(nextW, header.width - nextX);
      nextH = Math.min(nextH, header.height - nextY);

      onChangeElements(
        elements.map((el) =>
          el.id !== headerId
            ? el
            : {
                ...el,
                headerFields: el.headerFields.map((item) =>
                  item.id === fieldId
                    ? { ...item, x: nextX, y: nextY, width: nextW, height: nextH }
                    : item,
                ),
              },
        ),
      );
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const handlePaletteDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const headerFieldKey = event.dataTransfer.getData(MOA_HEADER_FIELD_MIME) as MoaHeaderFieldKey;
    if (headerFieldKey && MOA_HEADER_FIELD_OPTIONS.some((f) => f.key === headerFieldKey)) {
      event.preventDefault();
      setDragOver(false);
      setHeaderDropTargetId(null);
      const rect = layerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const underHeader = [...elements]
        .reverse()
        .find(
          (el) =>
            el.kind === "header" &&
            px >= el.x &&
            px <= el.x + el.width &&
            py >= el.y &&
            py <= el.y + el.height,
        );
      const selected = selectedId ? elements.find((el) => el.id === selectedId) : null;
      const targetId =
        underHeader?.id ?? (selected?.kind === "header" ? selectedId : null);
      if (targetId) addHeaderField(targetId, headerFieldKey);
      return;
    }

    const configFieldRaw = event.dataTransfer.getData(MOA_CONFIG_FIELD_MIME);
    if (configFieldRaw) {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);
      let payload: MoaConfigFieldPayload | null = null;
      try {
        payload = JSON.parse(configFieldRaw) as MoaConfigFieldPayload;
      } catch {
        payload = null;
      }
      if (!payload?.label) return;
      const rect = layerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left - 40;
      const y = event.clientY - rect.top - 16;
      const next = createMoaConfigFieldElement(payload, x, y, {
        fontFamily: defaultFontFamily,
        fontSize: defaultFontSize,
      });
      onChangeElements([...elements, next]);
      onSelect(next.id);
      return;
    }

    const kind = (event.dataTransfer.getData(MOA_PALETTE_MIME) ||
      event.dataTransfer.getData("text/plain")) as MoaPaletteItemKind;
    const known = new Set<MoaPaletteItemKind>([
      "header",
      "section",
      "body",
      "text",
      "moaField",
      "shape",
      "photo",
      "table",
      "chart",
      "frame",
      "grid",
      "columns",
    ]);
    if (!kind || !known.has(kind)) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left - 40;
    const y = event.clientY - rect.top - 20;
    const options = parseElementOptions(
      event.dataTransfer.getData(MOA_ELEMENT_OPTIONS_MIME),
    );
    const next = createMoaDesignElement(kind, x, y, {
      fontFamily: defaultFontFamily,
      fontSize: defaultFontSize,
      ...options,
    });
    onChangeElements([...elements, next]);
    onSelect(next.id);
  };

  const startMove = (event: ReactPointerEvent, id: string) => {
    if (!enabled || editingTextId === id) return;
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-moa-resize]") || target.closest("[data-moa-no-drag]")) return;
    // Avoid preventDefault here — it blocks dblclick in some browsers.
    event.stopPropagation();

    const multiKey = event.shiftKey || event.ctrlKey || event.metaKey;
    clearFieldSelection();

    let nextIds = [id];
    if (multiKey && onSelectedIdsChange) {
      nextIds = activeSelectedIds.includes(id)
        ? activeSelectedIds.filter((item) => item !== id)
        : [...activeSelectedIds, id];
      if (nextIds.length === 0) nextIds = [id];
      onSelectedIdsChange(nextIds);
      onSelect(id);
      // Ctrl+click toggle off alone — skip drag
      if (!nextIds.includes(id)) return;
    } else {
      onSelectedIdsChange?.([id]);
      onSelect(id);
    }

    const el = elements.find((item) => item.id === id);
    if (!el) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const movingIds =
      nextIds.includes(id) && nextIds.length > 1 ? nextIds : [id];
    const origins = new Map(
      elements
        .filter((item) => movingIds.includes(item.id))
        .map((item) => [item.id, { x: item.x, y: item.y }] as const),
    );
    const others: SnapBox[] = elements
      .filter((item) => !movingIds.includes(item.id))
      .map((item) => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      }));
    let dragging = false;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < 4) return;
        dragging = true;
      }
      const primary = origins.get(id);
      if (!primary) return;
      const rawX = Math.max(0, primary.x + dx);
      const rawY = Math.max(0, primary.y + dy);
      const bounds = {
        width: layerRef.current?.clientWidth ?? 816,
        height: layerRef.current?.clientHeight ?? 1248,
      };
      const snapped = snapMovingBox(
        { x: rawX, y: rawY, width: el.width, height: el.height },
        others,
        bounds,
      );
      const snappedDx = snapped.x - primary.x;
      const snappedDy = snapped.y - primary.y;
      setAlignGuides(snapped.guides);
      onChangeElements(
        elements.map((item) => {
          const origin = origins.get(item.id);
          if (!origin) return item;
          return {
            ...item,
            x: Math.max(0, origin.x + snappedDx),
            y: Math.max(0, origin.y + snappedDy),
          };
        }),
      );
    };
    const onUp = () => {
      setAlignGuides([]);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const startResize = (event: ReactPointerEvent, id: string, handle: ResizeHandle) => {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    clearFieldSelection();
    onSelectedIdsChange?.([id]);
    onSelect(id);
    const el = elements.find((item) => item.id === id);
    if (!el) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = el.x;
    const originY = el.y;
    const originW = el.width;
    const originH = el.height;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      let nextX = originX;
      let nextY = originY;
      let nextW = originW;
      let nextH = originH;

      if (handle.includes("e")) nextW = Math.max(48, originW + dx);
      if (handle.includes("s")) nextH = Math.max(32, originH + dy);
      if (handle.includes("w")) {
        nextW = Math.max(48, originW - dx);
        nextX = originX + (originW - nextW);
      }
      if (handle.includes("n")) {
        nextH = Math.max(32, originH - dy);
        nextY = originY + (originH - nextH);
      }

      updateElement(id, {
        x: Math.max(0, nextX),
        y: Math.max(0, nextY),
        width: nextW,
        height: nextH,
      });
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  if (!enabled && elements.length === 0) return null;

  return (
    <div
      ref={layerRef}
      className={`absolute inset-0 z-30 ${dragOver ? "bg-emerald-50/25 ring-2 ring-inset ring-emerald-400" : ""}`}
      style={{ pointerEvents: enabled ? "auto" : "none" }}
      onDragOver={
        enabled
          ? (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={
        enabled
          ? (event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setDragOver(false);
            }
          : undefined
      }
      onDrop={
        enabled
          ? (event) => {
              setDragOver(false);
              handlePaletteDrop(event);
            }
          : undefined
      }
      onClick={(event) => {
        if (!enabled) return;
        if (event.target === layerRef.current) {
          clearFieldSelection();
          clearEditing();
          onSelectedIdsChange?.([]);
          onSelect(null);
        }
      }}
      onContextMenu={(event) => {
        if (!enabled) return;
        if (event.target !== layerRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        clearFieldSelection();
        
        const rect = layerRef.current?.getBoundingClientRect();
        const canvasX = rect ? event.clientX - rect.left : 0;
        const canvasY = rect ? event.clientY - rect.top : 0;

        setContextMenu({
          kind: "canvas",
          x: event.clientX,
          y: event.clientY,
          canvasX,
          canvasY,
        });
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file || !photoUploadTarget) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            updateElement(photoUploadTarget, { imageSrc: ev.target?.result as string });
            setPhotoUploadTarget(null);
          };
          reader.readAsDataURL(file);
        }}
      />

      {alignGuides.map((guide, index) =>
        guide.axis === "x" ? (
          <div
            key={`guide-x-${guide.at}-${index}`}
            className="pointer-events-none absolute bottom-0 top-0 z-[70] w-px bg-fuchsia-500"
            style={{ left: guide.at }}
          />
        ) : (
          <div
            key={`guide-y-${guide.at}-${index}`}
            className="pointer-events-none absolute left-0 right-0 z-[70] h-px bg-fuchsia-500"
            style={{ top: guide.at }}
          />
        ),
      )}

      {enabled && elements.length === 0 && (
        <div className="pointer-events-none absolute inset-x-6 top-[40%] -translate-y-1/2 rounded-xl border border-dashed border-emerald-400/80 bg-white/90 px-4 py-6 text-center shadow-sm">
          <p className="text-[12px] font-bold text-emerald-900">Blank MOA canvas</p>
          <p className="mt-1 text-[10px] font-medium text-emerald-800/80">
            Drag Header / Layout, or drop Fields from the Fields tab onto the canvas
          </p>
        </div>
      )}

      {elements.map((element) => {
        const selected = activeSelectedIds.includes(element.id);
        const isHeader = element.kind === "header";
        const textStyle = elementTextStyle(element);

        return (
          <div
            key={element.id}
            className={`absolute ${enabled && editingTextId !== element.id ? "cursor-move" : ""} ${
              selected ? "z-40 ring-2 ring-sky-500 ring-offset-1" : "z-30"
            } ${headerDropTargetId === element.id ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              // While palette/field dragging, let drops hit the canvas layer.
              pointerEvents: enabled ? (suppressElementHits ? "none" : "auto") : "none",
            }}
            onClick={(event) => {
              if (!enabled) return;
              event.stopPropagation();
              onSelect(element.id);
            }}
            onPointerDown={(event) => startMove(event, element.id)}
            onDoubleClick={(event) => {
              if (!enabled) return;
              event.stopPropagation();
              if (element.kind === "shape") {
                const cycle = SHAPE_CYCLE;
                const next = cycle[(cycle.indexOf(element.shape) + 1) % cycle.length];
                updateElement(element.id, { shape: next });
                return;
              }
              if (element.kind === "photo") {
                setPhotoUploadTarget(element.id);
                fileInputRef.current?.click();
                onSelect(element.id);
                return;
              }
              if (element.kind === "table") {
                setEditingTableId((prev) => (prev === element.id ? null : element.id));
                setEditingTextId(null);
                onSelect(element.id);
                return;
              }
              if (element.kind === "chart") {
                const values = element.chartValues?.length
                  ? element.chartValues
                  : defaultChartValues();
                const bumped = values.map((v, i) =>
                  i === 0 ? Math.min(100, v + 15 > 100 ? 25 : v + 15) : v,
                );
                updateElement(element.id, { chartValues: bumped });
                onSelect(element.id);
                return;
              }
              // Header text is add/edit/remove via right-click only.
              if (element.kind === "header") return;
              if (!isTextEditableKind(element.kind)) return;
              setEditingTableId(null);
              setEditingTextId(element.id);
              onSelect(element.id);
            }}
            onContextMenu={(event) => {
              if (!enabled) return;
              if (editingTextId === element.id) return;
              event.preventDefault();
              event.stopPropagation();
              onSelect(element.id);

              const rect = layerRef.current?.getBoundingClientRect();
              const canvasX = rect ? event.clientX - rect.left : 0;
              const canvasY = rect ? event.clientY - rect.top : 0;

              setContextMenu({
                kind: "element",
                elementId: element.id,
                x: event.clientX,
                y: event.clientY,
                canvasX,
                canvasY,
              });
            }}
          >
            {isHeader ? (
              <div
                className="relative h-full w-full overflow-hidden rounded border"
                style={{
                  textAlign: element.textAlign,
                  borderColor: selected ? "#38bdf8" : element.stroke || "#d4d4d8",
                  backgroundColor:
                    !element.fill || element.fill === "transparent"
                      ? "transparent"
                      : element.fill,
                }}
                onContextMenu={(event) => {
                  if (!enabled) return;
                  // Only when clicking empty header area (not a field/text child that stops propagation).
                  if ((event.target as HTMLElement).closest("[data-moa-no-drag]")) return;
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect(element.id);

                  const rect = layerRef.current?.getBoundingClientRect();
                  const canvasX = rect ? event.clientX - rect.left : 0;
                  const canvasY = rect ? event.clientY - rect.top : 0;

                  setContextMenu({
                    kind: "element",
                    elementId: element.id,
                    x: event.clientX,
                    y: event.clientY,
                    canvasX,
                    canvasY,
                  });
                }}
              >
                {element.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={element.imageSrc}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                {element.headerFields.length === 0 && !element.text && editingTextId !== element.id ? (
                  <span className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 text-center text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                    Drop branch fields · drag to position · right-click for text
                  </span>
                ) : null}
                {(element.headerFields ?? []).map((field) => {
                  const fieldSelected = activeFieldIds.includes(field.id);
                  const fieldStyle = headerFieldTextStyle(field, element);
                  return (
                  <div
                    key={field.id}
                    data-moa-no-drag
                    data-moa-field-selected={fieldSelected ? "true" : undefined}
                    className={`absolute rounded-sm px-0.5 hover:bg-white/60 ${
                      fieldSelected
                        ? "cursor-grab overflow-visible bg-sky-50/90 shadow-sm ring-2 ring-sky-500 active:cursor-grabbing"
                        : selected
                          ? "cursor-grab overflow-hidden ring-1 ring-sky-300/50 active:cursor-grabbing"
                          : "cursor-grab overflow-hidden active:cursor-grabbing"
                    }`}
                    style={{
                      ...headerFieldLayoutStyle(element, field),
                      ...fieldStyle,
                    }}
                    onPointerDown={(event) => {
                      if ((event.target as HTMLElement).closest("[data-moa-field-resize]")) {
                        return;
                      }
                      startHeaderFieldMove(event, element.id, field.id);
                    }}
                    onContextMenu={(event) => {
                      if (!enabled) return;
                      event.preventDefault();
                      event.stopPropagation();
                      selectHeaderFields(
                        element.id,
                        field.id,
                        activeFieldIds.includes(field.id) ? "keep-if-selected" : "replace",
                      );
                      setContextMenu({
                        kind: "field",
                        headerId: element.id,
                        fieldId: field.id,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                  >
                    <span
                      className={`block h-full w-full overflow-hidden break-words leading-tight ${
                        field.key === "shopName" ? "uppercase tracking-wide" : ""
                      }`}
                      style={{
                        fontFamily: fieldStyle.fontFamily,
                        fontSize: fieldStyle.fontSize,
                        fontWeight: fieldStyle.fontWeight,
                        fontStyle: fieldStyle.fontStyle,
                        textDecoration: fieldStyle.textDecoration,
                        color: fieldStyle.color,
                        textAlign: (field.textAlign ?? element.textAlign) as MoaTextAlign,
                      }}
                    >
                      {resolveHeaderFieldValue(field.key, branchPreview)}
                    </span>
                    {enabled && fieldSelected
                      ? RESIZE_HANDLES.map(({ handle, className, cursor }) => (
                          <button
                            key={handle}
                            type="button"
                            data-moa-field-resize={handle}
                            aria-label={`Resize field ${handle}`}
                            className={`absolute z-50 h-2.5 w-2.5 rounded-sm border border-sky-500 bg-white shadow ${className} ${cursor}`}
                            onPointerDown={(event) =>
                              startHeaderFieldResize(event, element.id, field.id, handle)
                            }
                          />
                        ))
                      : null}
                  </div>
                  );
                })}
                {editingTextId === element.id ? (
                  <textarea
                    data-moa-no-drag
                    autoFocus
                    value={element.text}
                    placeholder="Type header text…"
                    className="absolute inset-x-2 bottom-2 min-h-[28px] resize-none rounded border border-sky-300 bg-white/95 px-1 py-0.5 outline-none"
                    style={textStyle}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => updateElement(element.id, { text: event.target.value })}
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setEditingTextId(null);
                      }
                    }}
                  />
                ) : element.text ? (
                  <div
                    data-moa-no-drag
                    style={textStyle}
                    className="absolute inset-x-2 bottom-2 cursor-context-menu whitespace-pre-wrap break-words rounded-sm px-0.5 hover:bg-white/50"
                    onContextMenu={(event) => {
                      if (!enabled) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(element.id);

                      const rect = layerRef.current?.getBoundingClientRect();
                      const canvasX = rect ? event.clientX - rect.left : 0;
                      const canvasY = rect ? event.clientY - rect.top : 0;

                      setContextMenu({
                        kind: "element",
                        elementId: element.id,
                        x: event.clientX,
                        y: event.clientY,
                        canvasX,
                        canvasY,
                      });
                    }}
                  >
                    {element.text}
                  </div>
                ) : null}
              </div>
            ) : editingTextId === element.id && isTextEditableKind(element.kind) ? (
              <textarea
                data-moa-no-drag
                autoFocus
                value={element.text}
                placeholder="Type here…"
                className="h-full w-full resize-none rounded border border-sky-300 bg-white px-1.5 py-1 outline-none"
                style={textStyle}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => updateElement(element.id, { text: event.target.value })}
                onBlur={() => setEditingTextId(null)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setEditingTextId(null);
                  }
                }}
              />
            ) : (
              <ElementVisual
                element={element}
                editingTable={editingTableId === element.id}
                onTableCellChange={(row, col, value) => {
                  const data = (element.tableData?.length
                    ? element.tableData
                    : defaultTableData()
                  ).map((r) => [...r]);
                  while (data.length <= row) data.push([]);
                  while (data[row].length <= col) data[row].push("");
                  data[row][col] = value;
                  updateElement(element.id, { tableData: data });
                }}
              />
            )}

            {enabled && selected && (
              <>
                {RESIZE_HANDLES.map(({ handle, className, cursor }) => (
                  <button
                    key={handle}
                    type="button"
                    data-moa-resize={handle}
                    aria-label={`Resize ${handle}`}
                    className={`absolute z-50 h-3 w-3 rounded-sm border border-sky-500 bg-white shadow ${className} ${cursor}`}
                    onPointerDown={(event) => startResize(event, element.id, handle)}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}

      {contextMenu &&
        enabled &&
        createPortal(
          <div
            className="fixed z-[9999] min-w-[190px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            {contextMenu.kind === "field" ? (
              <>
                {(() => {
                  const menuFieldIds = activeFieldIds.includes(contextMenu.fieldId)
                    ? activeFieldIds
                    : [contextMenu.fieldId];
                  const multi = menuFieldIds.length > 1;
                  return (
                    <>
                      <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-500">
                        {multi
                          ? `${menuFieldIds.length} fields selected · Ctrl/Shift+click to add`
                          : "1 field selected · Ctrl+click for multi"}
                      </div>
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                        onClick={() => {
                          selectAllHeaderFields(contextMenu.headerId);
                          setContextMenu(null);
                        }}
                      >
                        Select all fields
                      </button>
                      {multi ? (
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            setActiveFieldIds([contextMenu.fieldId]);
                            setContextMenu(null);
                          }}
                        >
                          Select only this field
                        </button>
                      ) : null}
                      <div className="my-1 border-t border-zinc-100" />
                      <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                        Align text
                      </div>
                      {(
                        [
                          ["left", "Align left"],
                          ["center", "Align center"],
                          ["right", "Align right"],
                        ] as const
                      ).map(([align, label]) => (
                        <button
                          key={align}
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            applyTextAlignToElement(contextMenu.headerId, align);
                            setContextMenu(null);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                      <div className="my-1 border-t border-zinc-100" />
                      {!multi ? (
                        <>
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                            onClick={() => {
                              placeFieldBesidePrevious(
                                contextMenu.headerId,
                                contextMenu.fieldId,
                              );
                              setContextMenu(null);
                            }}
                          >
                            Place beside previous
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                            onClick={() => {
                              placeFieldOnOwnLine(contextMenu.headerId, contextMenu.fieldId);
                              setContextMenu(null);
                            }}
                          >
                            Move to new line
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                        onClick={() => {
                          moveSelectedFields(contextMenu.headerId, menuFieldIds, -1);
                          setContextMenu(null);
                        }}
                      >
                        Nudge up{multi ? ` (${menuFieldIds.length})` : ""}
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                        onClick={() => {
                          moveSelectedFields(contextMenu.headerId, menuFieldIds, 1);
                          setContextMenu(null);
                        }}
                      >
                        Nudge down{multi ? ` (${menuFieldIds.length})` : ""}
                      </button>
                      <div className="my-1 border-t border-zinc-100" />
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => {
                          removeHeaderFields(contextMenu.headerId, menuFieldIds);
                          setContextMenu(null);
                        }}
                      >
                        Remove {multi ? `${menuFieldIds.length} fields` : "field"}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : contextMenu.kind === "element" ? (
              <>
                {(() => {
                  const targetEl = elements.find((el) => el.id === contextMenu.elementId);
                  if (targetEl?.kind === "header") {
                    return (
                      <>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            setEditingTextId(targetEl.id);
                            setContextMenu(null);
                          }}
                        >
                          {targetEl.text ? "Edit text" : "Add text"}
                        </button>
                        {targetEl.text ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50"
                            onClick={() => {
                              updateElement(targetEl.id, { text: "" });
                              setEditingTextId(null);
                              setContextMenu(null);
                            }}
                          >
                            Remove text
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            setPhotoUploadTarget(targetEl.id);
                            fileInputRef.current?.click();
                            setContextMenu(null);
                          }}
                        >
                          Insert image
                        </button>
                        {targetEl.imageSrc ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50"
                            onClick={() => {
                              updateElement(targetEl.id, { imageSrc: undefined });
                              setContextMenu(null);
                            }}
                          >
                            Remove image
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            updateElement(targetEl.id, { fill: "transparent" });
                            setContextMenu(null);
                          }}
                        >
                          Clear background color
                        </button>
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  return null;
                })()}
                <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                  Align text
                </div>
                {(
                  [
                    ["left", "Align left"],
                    ["center", "Align center"],
                    ["right", "Align right"],
                  ] as const
                ).map(([align, label]) => {
                  const targetEl = elements.find((el) => el.id === contextMenu.elementId);
                  const active = targetEl?.textAlign === align;
                  return (
                    <button
                      key={align}
                      type="button"
                      className={`block w-full px-3 py-1.5 text-left text-[11px] font-semibold hover:bg-emerald-50 ${
                        active ? "bg-emerald-50 text-emerald-800" : "text-zinc-700"
                      }`}
                      onClick={() => {
                        applyTextAlignToElement(contextMenu.elementId, align);
                        setContextMenu(null);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                <div className="my-1 border-t border-zinc-100" />
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    copyElement(contextMenu.elementId);
                    setContextMenu(null);
                  }}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    cutElement(contextMenu.elementId);
                    setContextMenu(null);
                  }}
                >
                  Cut
                </button>
                <button
                  type="button"
                  disabled={!clipboardElement}
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  onClick={() => {
                    pasteElement(contextMenu.canvasX, contextMenu.canvasY);
                    setContextMenu(null);
                  }}
                >
                  Paste
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    duplicateElement(contextMenu.elementId);
                    setContextMenu(null);
                  }}
                >
                  Duplicate
                </button>
                {(() => {
                  const el = elements.find((e) => e.id === contextMenu.elementId);
                  if (el?.kind === "shape") {
                    return (
                      <>
                        <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                          Shape
                        </div>
                        {(
                          [
                            ["rect", "Rectangle"],
                            ["square", "Square"],
                            ["rounded", "Rounded"],
                            ["circle", "Circle"],
                            ["ellipse", "Ellipse"],
                            ["triangle", "Triangle"],
                            ["diamond", "Diamond"],
                            ["line", "Line"],
                          ] as const
                        ).map(([shape, label]) => (
                          <button
                            key={shape}
                            type="button"
                            className={`block w-full px-3 py-1.5 text-left text-[11px] font-semibold hover:bg-emerald-50 ${
                              el.shape === shape ? "bg-emerald-50 text-emerald-800" : "text-zinc-700"
                            }`}
                            onClick={() => {
                              updateElement(el.id, { shape });
                              setContextMenu(null);
                            }}
                          >
                            {label}
                          </button>
                        ))}
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  if (el?.kind === "photo") {
                    return (
                      <>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            setPhotoUploadTarget(contextMenu.elementId);
                            fileInputRef.current?.click();
                            setContextMenu(null);
                          }}
                        >
                          Insert image
                        </button>
                        {el.imageSrc ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50"
                            onClick={() => {
                              updateElement(el.id, { imageSrc: undefined });
                              setContextMenu(null);
                            }}
                          >
                            Remove image
                          </button>
                        ) : null}
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  if (el?.kind === "table") {
                    const data = el.tableData?.length ? el.tableData : defaultTableData();
                    return (
                      <>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            setEditingTableId(el.id);
                            setContextMenu(null);
                          }}
                        >
                          Edit cells
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            const cols = data[0]?.length ?? 3;
                            updateElement(el.id, {
                              tableData: [...data, Array(cols).fill("")],
                            });
                            setContextMenu(null);
                          }}
                        >
                          Add row
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            updateElement(el.id, {
                              tableData: data.map((row) => [...row, ""]),
                            });
                            setContextMenu(null);
                          }}
                        >
                          Add column
                        </button>
                        {data.length > 1 ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                            onClick={() => {
                              updateElement(el.id, {
                                tableData: data.slice(0, -1),
                              });
                              setContextMenu(null);
                            }}
                          >
                            Remove last row
                          </button>
                        ) : null}
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  if (el?.kind === "chart") {
                    const values = el.chartValues?.length
                      ? el.chartValues
                      : defaultChartValues();
                    return (
                      <>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            updateElement(el.id, {
                              chartValues: [...values, 50].slice(0, 8),
                            });
                            setContextMenu(null);
                          }}
                        >
                          Add bar
                        </button>
                        {values.length > 1 ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                            onClick={() => {
                              updateElement(el.id, {
                                chartValues: values.slice(0, -1),
                              });
                              setContextMenu(null);
                            }}
                          >
                            Remove last bar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            updateElement(el.id, {
                              chartValues: defaultChartValues(),
                            });
                            setContextMenu(null);
                          }}
                        >
                          Reset bars
                        </button>
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  if (el?.kind === "grid") {
                    return (
                      <>
                        <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                          Grid size
                        </div>
                        {(
                          [
                            [2, 2],
                            [3, 2],
                            [3, 3],
                            [4, 3],
                          ] as const
                        ).map(([cols, rows]) => (
                          <button
                            key={`${cols}x${rows}`}
                            type="button"
                            className={`block w-full px-3 py-1.5 text-left text-[11px] font-semibold hover:bg-emerald-50 ${
                              (el.gridCols ?? 2) === cols && (el.gridRows ?? 2) === rows
                                ? "bg-emerald-50 text-emerald-800"
                                : "text-zinc-700"
                            }`}
                            onClick={() => {
                              updateElement(el.id, { gridCols: cols, gridRows: rows });
                              setContextMenu(null);
                            }}
                          >
                            {cols}×{rows}
                          </button>
                        ))}
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  if (el?.kind === "frame") {
                    return (
                      <>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            setEditingTextId(el.id);
                            setContextMenu(null);
                          }}
                        >
                          Edit label
                        </button>
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  return null;
                })()}
                <div className="my-1 border-t border-zinc-100" />
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    bringToFront(contextMenu.elementId);
                    setContextMenu(null);
                  }}
                >
                  Bring to Front
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    sendToBack(contextMenu.elementId);
                    setContextMenu(null);
                  }}
                >
                  Bring back
                </button>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => {
                    deleteElement(contextMenu.elementId);
                    setContextMenu(null);
                  }}
                >
                  Delete
                </button>
              </>
            ) : contextMenu.kind === "canvas" ? (
              <>
                <button
                  type="button"
                  disabled={!clipboardElement}
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  onClick={() => {
                    pasteElement(contextMenu.canvasX, contextMenu.canvasY);
                    setContextMenu(null);
                  }}
                >
                  Paste
                </button>
              </>
            ) : null}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Applies toolbar styles to selected elements and/or header fields. */
export function applyToolbarToSelected(
  elements: MoaDesignElement[],
  selectedId: string | null,
  patch: MoaTextStylePatch,
  options?: {
    selectedIds?: string[];
    selectedFieldIds?: string[];
  },
): MoaDesignElement[] {
  const selectedIds =
    options?.selectedIds && options.selectedIds.length > 0
      ? options.selectedIds
      : selectedId
        ? [selectedId]
        : [];
  const rawFieldIds = options?.selectedFieldIds ?? [];
  const idSet = new Set(selectedIds);

  const allFieldIds = new Set(
    elements.flatMap((el) =>
      el.kind === "header" ? el.headerFields.map((field) => field.id) : [],
    ),
  );
  // Ignore stale field ids that no longer exist
  let targetFieldIds = rawFieldIds.filter((id) => allFieldIds.has(id));

  // Header box selected (no field pick) → style every field inside selected headers
  if (targetFieldIds.length === 0 && selectedIds.length > 0) {
    targetFieldIds = elements.flatMap((el) =>
      idSet.has(el.id) && el.kind === "header"
        ? el.headerFields.map((field) => field.id)
        : [],
    );
  }

  const fieldSet = new Set(targetFieldIds);
  const hasTextPatch =
    patch.fontFamily !== undefined ||
    patch.fontSize !== undefined ||
    patch.textAlign !== undefined ||
    patch.fontWeight !== undefined ||
    patch.fontStyle !== undefined ||
    patch.textDecoration !== undefined ||
    patch.color !== undefined;

  const fieldStyleFromPatch = (field: MoaHeaderField): MoaHeaderField => {
    const nextSize =
      patch.fontSize !== undefined ? Number(patch.fontSize) : field.fontSize;
    const minHeight =
      typeof nextSize === "number" && Number.isFinite(nextSize)
        ? Math.round(nextSize * 1.35) + 6
        : field.height || 22;
    return {
      ...field,
      ...(patch.fontFamily !== undefined ? { fontFamily: patch.fontFamily } : {}),
      ...(patch.fontSize !== undefined && Number.isFinite(Number(patch.fontSize))
        ? { fontSize: Number(patch.fontSize) }
        : {}),
      ...(patch.textAlign !== undefined ? { textAlign: patch.textAlign } : {}),
      ...(patch.fontWeight !== undefined ? { fontWeight: patch.fontWeight } : {}),
      ...(patch.fontStyle !== undefined ? { fontStyle: patch.fontStyle } : {}),
      ...(patch.textDecoration !== undefined
        ? { textDecoration: patch.textDecoration }
        : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.fontSize !== undefined
        ? { height: Math.max(field.height || 22, minHeight) }
        : {}),
    };
  };

  if (selectedIds.length === 0 && fieldSet.size === 0) return elements;

  return elements.map((el) => {
    const elementSelected = idSet.has(el.id);
    const fieldsTouched =
      el.kind === "header" && el.headerFields.some((field) => fieldSet.has(field.id));

    if (!elementSelected && !fieldsTouched) return el;

    const elementPatch: MoaTextStylePatch =
      patch.fontSize !== undefined && Number.isFinite(Number(patch.fontSize))
        ? { ...patch, fontSize: Number(patch.fontSize) }
        : patch;

    let next: MoaDesignElement = elementSelected
      ? { ...el, ...elementPatch }
      : { ...el };

    if (el.kind === "header" && hasTextPatch && (elementSelected || fieldsTouched)) {
      next = {
        ...next,
        headerFields: el.headerFields.map((field) => {
          // Header selected with no field pick → all fields; else only target fields
          const shouldStyle =
            (elementSelected && rawFieldIds.length === 0) || fieldSet.has(field.id);
          return shouldStyle ? fieldStyleFromPatch(field) : field;
        }),
      };
      if (patch.textAlign && elementSelected && rawFieldIds.length === 0) {
        next.headerFields = reflowHeaderFieldsAlign(next, patch.textAlign);
      }
    }

    return next;
  });
}
