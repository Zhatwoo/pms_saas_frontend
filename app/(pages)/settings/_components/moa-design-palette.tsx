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
import { Image as ImageIcon } from "lucide-react";

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
  | "grid";

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
  shape: "rect" | "circle" | "line";
  fill: string;
  stroke: string;
  /** Branch fields dropped into a Header (name, address, phone…). */
  headerFields: MoaHeaderField[];
  /** Key from MOA Field Config when kind is moaField. */
  fieldKey: string;
  /** Optional image data URL for photo elements */
  imageSrc?: string;
  /** Optional table data for table elements (rows x columns) */
  tableData?: string[][];
};

export type MoaHeaderFieldKey = "shopName" | "shopAddress" | "phoneNumber" | "email";

export type MoaHeaderField = {
  id: string;
  key: MoaHeaderFieldKey;
  /** Position inside the header (px from top-left). */
  x: number;
  y: number;
  width: number;
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

function defaultSize(kind: MoaPaletteItemKind): { width: number; height: number } {
  switch (kind) {
    case "header":
      return { width: 420, height: 96 };
    case "section":
      return { width: 300, height: 72 };
    case "body":
      return { width: 320, height: 80 };
    case "text":
      return { width: 180, height: 36 };
    case "moaField":
      return { width: 260, height: 32 };
    case "shape":
      return { width: 96, height: 64 };
    case "photo":
      return { width: 120, height: 90 };
    case "table":
      return { width: 220, height: 90 };
    case "chart":
      return { width: 160, height: 100 };
    case "frame":
      return { width: 180, height: 100 };
    case "grid":
      return { width: 160, height: 100 };
    default:
      return { width: 140, height: 60 };
  }
}

function defaultText(kind: MoaPaletteItemKind): string {
  switch (kind) {
    case "header":
      return "";
    case "section":
      return "Section title";
    case "body":
      return "Body text — double-click to edit.";
    case "text":
      return "Text";
    case "moaField":
      return "Field";
    case "photo":
      return "Photo";
    case "table":
      return "Table";
    case "chart":
      return "Chart";
    case "frame":
      return "Frame";
    case "grid":
      return "Grid";
    case "shape":
      return "";
    default:
      return "";
  }
}

export function createMoaDesignElement(
  kind: MoaPaletteItemKind,
  x: number,
  y: number,
  defaults?: { fontFamily?: string; fontSize?: number; textAlign?: MoaTextAlign },
): MoaDesignElement {
  const size = defaultSize(kind);
  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    x: Math.max(8, x),
    y: Math.max(8, y),
    width: size.width,
    height: size.height,
    text: defaultText(kind),
    fontFamily: defaults?.fontFamily ?? MOA_FONT_OPTIONS[0].value,
    fontSize: defaults?.fontSize ?? (kind === "header" ? 14 : 11),
    textAlign: defaults?.textAlign ?? (kind === "header" ? "center" : "left"),
    fontWeight: kind === "header" || kind === "section" ? "bold" : "normal",
    fontStyle: "normal",
    textDecoration: "none",
    color: "#18181b",
    shape: "rect",
    fill: kind === "shape" ? "#ecfdf5" : "transparent",
    stroke: "#059669",
    headerFields: [],
    fieldKey: "",
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
    x: raw.x ?? 8,
    y: raw.y ?? 8,
    width: raw.width ?? 140,
    height: raw.height ?? 60,
    text: raw.text ?? "",
    fontFamily: raw.fontFamily ?? MOA_FONT_OPTIONS[0].value,
    fontSize: raw.fontSize ?? 11,
    textAlign: raw.textAlign ?? (raw.kind === "header" ? "center" : "left"),
    fontWeight: raw.fontWeight ?? (raw.kind === "header" ? "bold" : "normal"),
    fontStyle: raw.fontStyle ?? "normal",
    textDecoration: raw.textDecoration ?? "none",
    color: raw.color ?? "#18181b",
    shape: raw.shape ?? "rect",
    fill: raw.fill ?? (raw.kind === "shape" ? "#ecfdf5" : "transparent"),
    stroke: raw.stroke ?? "#059669",
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
            width: typeof field.width === "number" ? field.width : 160,
          };
        })
      : [],
    fieldKey: raw.fieldKey ?? "",
  };
}

function nextHeaderFieldPlacement(fields: MoaHeaderField[]): { x: number; y: number; width: number } {
  if (fields.length === 0) return { x: 8, y: 8, width: 180 };
  const lowest = Math.max(...fields.map((field) => field.y + 20));
  return { x: 8, y: lowest + 6, width: 180 };
}

export function loadMoaDesignElements(categoryKey: string): MoaDesignElement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DESIGN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, MoaDesignElement[]>;
    const list = Array.isArray(parsed[categoryKey]) ? parsed[categoryKey] : [];
    return list.map((item) => normalizeElement(item));
  } catch {
    return [];
  }
}

export function saveMoaDesignElements(categoryKey: string, elements: MoaDesignElement[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(DESIGN_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, MoaDesignElement[]>) : {};
    parsed[categoryKey] = elements;
    window.localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function loadMoaPageSize(categoryKey: string): MoaPageSizeId {
  if (typeof window === "undefined") return "long";
  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (!raw) return "long";
    const parsed = JSON.parse(raw) as Record<string, string>;
    const id = parsed[categoryKey];
    if (id === "letter" || id === "long" || id === "a4") return id;
    return "long";
  } catch {
    return "long";
  }
}

export function saveMoaPageSize(categoryKey: string, pageSize: MoaPageSizeId) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[categoryKey] = pageSize;
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function elementTextStyle(element: MoaDesignElement): CSSProperties {
  return {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    textAlign: element.textAlign,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
  };
}

const TEXT_EDITABLE_KINDS = new Set<MoaPaletteItemKind>([
  "section",
  "body",
  "text",
  "moaField",
  "photo",
  "chart",
  "frame",
]);

function isTextEditableKind(kind: MoaPaletteItemKind): boolean {
  return TEXT_EDITABLE_KINDS.has(kind);
}

function ElementVisual({ element }: { element: MoaDesignElement }) {
  const textStyle = elementTextStyle(element);

  switch (element.kind) {
    case "shape":
      if (element.shape === "circle") {
        return (
          <div
            className="h-full w-full rounded-full border-2"
            style={{ borderColor: element.stroke, background: element.fill }}
          />
        );
      }
      if (element.shape === "line") {
        return (
          <div className="flex h-full w-full items-center">
            <div className="h-0.5 w-full" style={{ background: element.stroke }} />
          </div>
        );
      }
      return (
        <div
          className="h-full w-full rounded-sm border-2"
          style={{ borderColor: element.stroke, background: element.fill }}
        />
      );
    case "photo":
      return (
        <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-zinc-400 bg-zinc-100">
          {element.imageSrc ? (
            <img src={element.imageSrc} alt="Photo" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-zinc-500" />
          )}
        </div>
      );
case "table":
        return (
          <div className="h-full w-full overflow-hidden rounded border border-zinc-400 bg-white text-[8px]">
            <div className="grid grid-cols-3 border-b border-zinc-300 bg-emerald-50 font-bold">
              <span className="border-r border-zinc-300 px-1 py-0.5">A</span>
              <span className="border-r border-zinc-300 px-1 py-0.5">B</span>
              <span className="px-1 py-0.5">C</span>
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="grid grid-cols-3 border-b border-zinc-200 last:border-b-0">
                <span className="border-r border-zinc-200 px-1 py-0.5">&nbsp;</span>
                <span className="border-r border-zinc-200 px-1 py-0.5">&nbsp;</span>
                <span className="px-1 py-0.5">&nbsp;</span>
              </div>
            ))}
          </div>
        );
    case "chart":
      return (
        <div className="flex h-full w-full flex-col rounded border border-zinc-300 bg-white p-1.5">

          <div className="flex flex-1 items-end justify-around gap-1 px-1">
            {[40, 70, 55, 85].map((h, i) => (
              <div
                key={i}
                className="w-3 rounded-t bg-emerald-600/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      );
    case "frame":
      return (
        <div className="flex h-full w-full items-center justify-center rounded border-2 border-zinc-500 bg-transparent px-1">
          {/* No text placeholder */}
        </div>
      );
    case "grid":
      return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 rounded border border-zinc-300 bg-zinc-50 p-0.5">
          {[0, 1, 2, 3].map((cell) => (
            <div key={cell} className="rounded-sm border border-dashed border-zinc-300 bg-white" />
          ))}
        </div>
      );
    case "header":
      return (
        <div className="relative h-full w-full overflow-hidden rounded border border-emerald-400 bg-emerald-50/80">
          {(element.headerFields?.length ?? 0) === 0 && !element.text ? (
            <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center text-[9px] font-semibold uppercase tracking-wide text-emerald-700/70">
              Header
            </span>
          ) : null}
          {(element.headerFields ?? []).map((field) => (
            <div
              key={field.id}
              className="absolute truncate px-0.5"
              style={{
                left: field.x,
                top: field.y,
                width: field.width,
                ...textStyle,
              }}
            >
              {field.key === "shopName" ? "Branch" : field.key}
            </div>
          ))}
          {element.text ? (
            <span
              style={textStyle}
              className="absolute inset-x-2 bottom-2 whitespace-pre-wrap break-words"
            >
              {element.text}
            </span>
          ) : null}
        </div>
      );
    case "section":
      return (
        <div className="flex h-full w-full flex-col rounded border border-sky-300 bg-sky-50/60 px-2 py-1">
          <span style={textStyle} className="w-full">
            {element.text || "Section"}
          </span>
          <span className="mt-0.5 text-[8px] text-sky-700/80">Section content area</span>
        </div>
      );
    case "moaField":
      return (
        <div className="flex h-full w-full items-end gap-1.5 rounded border border-emerald-200 bg-white/95 px-1.5 py-1">
          <span style={textStyle} className="shrink-0 font-semibold whitespace-nowrap">
            {element.text || "Field"}
          </span>
          <span className="mb-0.5 min-w-0 flex-1 border-b border-zinc-400" />
        </div>
      );
    case "body":
    case "text":
    default:
      return (
        <div
          className="h-full w-full overflow-hidden rounded border border-dashed border-zinc-300 bg-white/90 px-1.5 py-1"
          style={textStyle}
        >
          {element.text || "Text"}
        </div>
      );
  }
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
  onSelect,
  onChangeElements,
  defaultFontFamily,
  defaultFontSize,
  branchPreview,
}: {
  enabled: boolean;
  paletteDragging?: boolean;
  elements: MoaDesignElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
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
  const [contextMenu, setContextMenu] = useState<
    | { kind: "field"; headerId: string; fieldId: string; x: number; y: number }
    | { kind: "element"; elementId: string; x: number; y: number; canvasX: number; canvasY: number }
    | { kind: "canvas"; x: number; y: number; canvasX: number; canvasY: number }
    | null
  >(null);
  const dropActive = enabled && paletteDragging;

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
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

  const updateElement = (id: string, patch: Partial<MoaDesignElement>) => {
    onChangeElements(elements.map((el) => (el.id === id ? { ...el, ...patch } : el)));
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
    const placement = nextHeaderFieldPlacement(header.headerFields);
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

  const removeHeaderField = (headerId: string, fieldId: string) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header) return;
    updateElement(headerId, {
      headerFields: header.headerFields.filter((field) => field.id !== fieldId),
    });
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
    );
    updateElement(headerId, {
      headerFields: header.headerFields.map((item) =>
        item.id === fieldId ? { ...item, x: 8, y: placement.y } : item,
      ),
    });
  };

  const moveFieldRow = (headerId: string, fieldId: string, direction: -1 | 1) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header) return;
    const field = header.headerFields.find((item) => item.id === fieldId);
    if (!field) return;
    updateElement(headerId, {
      headerFields: header.headerFields.map((item) =>
        item.id === fieldId
          ? { ...item, y: Math.max(0, item.y + direction * 22) }
          : item,
      ),
    });
  };

  const startHeaderFieldMove = (
    event: ReactPointerEvent,
    headerId: string,
    fieldId: string,
  ) => {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(headerId);
    const header = elements.find((el) => el.id === headerId);
    const field = header?.headerFields.find((item) => item.id === fieldId);
    if (!header || !field) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const originX = field.x;
    const originY = field.y;

    const onMove = (moveEvent: PointerEvent) => {
      const nextX = Math.max(0, Math.min(header.width - field.width, originX + (moveEvent.clientX - startX)));
      const nextY = Math.max(0, Math.min(header.height - 18, originY + (moveEvent.clientY - startY)));
      onChangeElements(
        elements.map((el) =>
          el.id !== headerId
            ? el
            : {
                ...el,
                headerFields: el.headerFields.map((item) =>
                  item.id === fieldId ? { ...item, x: nextX, y: nextY } : item,
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
    ]);
    if (!kind || !known.has(kind)) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left - 40;
    const y = event.clientY - rect.top - 20;
    const next = createMoaDesignElement(kind, x, y, {
      fontFamily: defaultFontFamily,
      fontSize: defaultFontSize,
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
    onSelect(id);
    const el = elements.find((item) => item.id === id);
    if (!el) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = el.x;
    const originY = el.y;
    let dragging = false;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < 4) return;
        dragging = true;
      }
      updateElement(id, {
        x: Math.max(0, originX + dx),
        y: Math.max(0, originY + dy),
      });
    };
    const onUp = () => {
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
        dropActive
          ? (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={dropActive ? () => setDragOver(false) : undefined}
      onDrop={dropActive ? handlePaletteDrop : undefined}
      onClick={(event) => {
        if (!enabled) return;
        if (event.target === layerRef.current) {
          onSelect(null);
        }
      }}
      onContextMenu={(event) => {
        if (!enabled) return;
        if (event.target !== layerRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        
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
      {enabled && elements.length === 0 && (
        <div className="pointer-events-none absolute inset-x-6 top-[40%] -translate-y-1/2 rounded-xl border border-dashed border-emerald-400/80 bg-white/90 px-4 py-6 text-center shadow-sm">
          <p className="text-[12px] font-bold text-emerald-900">Blank MOA canvas</p>
          <p className="mt-1 text-[10px] font-medium text-emerald-800/80">
            Drag Header / Layout, or drop Fields from the Fields tab onto the canvas
          </p>
        </div>
      )}

      {elements.map((element) => {
        const selected = selectedId === element.id;
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
              pointerEvents: enabled ? (dropActive ? "none" : "auto") : "none",
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
                const cycle: Array<MoaDesignElement["shape"]> = ["rect", "circle", "line"];
                const next = cycle[(cycle.indexOf(element.shape) + 1) % cycle.length];
                updateElement(element.id, { shape: next });
                return;
              }
              // Header text is add/edit/remove via right-click only.
              if (element.kind === "header") return;
              if (!isTextEditableKind(element.kind)) return;
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
                className="relative h-full w-full overflow-hidden rounded border border-emerald-400 bg-emerald-50/90"
                style={{ textAlign: element.textAlign }}
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
                {element.headerFields.length === 0 && !element.text && editingTextId !== element.id ? (
                  <span className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 text-center text-[9px] font-semibold uppercase tracking-wide text-emerald-700/70">
                    Drop branch fields · drag to position · right-click for text
                  </span>
                ) : null}
                {element.headerFields.map((field) => (
                  <div
                    key={field.id}
                    data-moa-no-drag
                    className={`absolute cursor-grab rounded-sm px-0.5 hover:bg-white/60 active:cursor-grabbing ${
                      selected ? "ring-1 ring-sky-300/80" : ""
                    }`}
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      ...textStyle,
                    }}
                    onPointerDown={(event) => startHeaderFieldMove(event, element.id, field.id)}
                    onContextMenu={(event) => {
                      if (!enabled) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(element.id);
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
                      className={`block w-full truncate ${
                        field.key === "shopName" ? "uppercase tracking-wide" : ""
                      }`}
                    >
                      {resolveHeaderFieldValue(field.key, branchPreview)}
                    </span>
                  </div>
                ))}
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
              <ElementVisual element={element} />
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
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    placeFieldBesidePrevious(contextMenu.headerId, contextMenu.fieldId);
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
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    moveFieldRow(contextMenu.headerId, contextMenu.fieldId, -1);
                    setContextMenu(null);
                  }}
                >
                  Nudge up
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                  onClick={() => {
                    moveFieldRow(contextMenu.headerId, contextMenu.fieldId, 1);
                    setContextMenu(null);
                  }}
                >
                  Nudge down
                </button>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => {
                    removeHeaderField(contextMenu.headerId, contextMenu.fieldId);
                    setContextMenu(null);
                  }}
                >
                  Remove field
                </button>
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
                        <div className="my-1 border-t border-zinc-100" />
                      </>
                    );
                  }
                  return null;
                })()}
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
                  if (el?.kind === "photo") {
                    return (
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                        onClick={() => {
                          setPhotoUploadTarget(contextMenu.elementId);
                          fileInputRef.current?.click();
                          setContextMenu(null);
                        }}
                      >
                        Insert Image
                      </button>
                    );
                  }
                  if (el?.kind === "table") {
                    return (
                      <>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            const rows = el.tableData?.length ?? 0;
                            const cols = el.tableData?.[0]?.length ?? 3;
                            const newRows = [...(el.tableData ?? [])];
                            newRows.push(Array(cols).fill(""));
                            updateElement(el.id, { tableData: newRows });
                            setContextMenu(null);
                          }}
                        >
                          Add Row
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50"
                          onClick={() => {
                            const rows = el.tableData?.length ?? 3;
                            const newRows = (el.tableData ?? Array.from({ length: rows }, () => Array(3).fill(""))).map((row) => {
                              const newRow = [...row, ""];
                              return newRow;
                            });
                            updateElement(el.id, { tableData: newRows });
                            setContextMenu(null);
                          }}
                        >
                          Add Column
                        </button>
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

/** Applies toolbar styles to the selected canvas element. */
export function applyToolbarToSelected(
  elements: MoaDesignElement[],
  selectedId: string | null,
  patch: MoaTextStylePatch,
): MoaDesignElement[] {
  if (!selectedId) return elements;
  return elements.map((el) =>
    el.id === selectedId ? { ...el, ...patch } : el,
  );
}
