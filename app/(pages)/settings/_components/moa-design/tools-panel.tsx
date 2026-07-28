"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  FileType,
  Heading,
  LayoutTemplate,
  ListChecks,
  Search,
  Shapes,
  Type,
} from "lucide-react";
import type {
  MoaElementCreateOptions,
  MoaHeaderFieldKey,
  MoaPageSizeId,
  MoaPaletteItemKind,
  MoaTextAlign,
  MoaTextStylePatch,
  MoaWatermarkSettings,
} from "../moa-design-palette";
import { MoaCanvasTab } from "./canvas-tab";
import { MoaElementsTab } from "./elements-tab";
import { MoaLayoutTab } from "./layout-tab";
import { MoaTextTab } from "./text-tab";

type MoaToolsTabId = "layout" | "header" | "elements" | "text" | "fields" | "canvas";

const NAV: Array<{
  id: MoaToolsTabId;
  label: string;
  icon: typeof FileType;
}> = [
  { id: "layout", label: "Layout", icon: LayoutTemplate },
  { id: "header", label: "Header", icon: Heading },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "text", label: "Text", icon: Type },
  { id: "fields", label: "Fields", icon: ListChecks },
  { id: "canvas", label: "Canvas", icon: FileType },
];

export type MoaDesignToolsPanelProps = {
  enabled: boolean;
  pageSize: MoaPageSizeId;
  onPageSizeChange: (id: MoaPageSizeId) => void;
  pageCount: number;
  onAddPage: () => void;
  onRemovePage: () => void;
  watermark: MoaWatermarkSettings;
  onWatermarkChange: (next: MoaWatermarkSettings) => void;
  fontFamily: string;
  fontSize: number;
  textAlign: MoaTextAlign;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  fill: string;
  selectedKind: MoaPaletteItemKind | null;
  hasImage: boolean;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextStyleChange: (patch: MoaTextStylePatch) => void;
  onInsertImage: () => void;
  onClearImage: () => void;
  selectedId: string | null;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onAddHeaderField?: (key: MoaHeaderFieldKey) => void;
  onAddElement?: (kind: MoaPaletteItemKind, options?: MoaElementCreateOptions) => void;
  /** MOA Field Config content (Financial / Unit fields). */
  fieldConfig?: ReactNode;
};

/**
 * Canva-like MOA designer chrome:
 * narrow icon rail + secondary browse panel (Layout / Header / Elements / …).
 */
export function MoaDesignToolsPanel({
  enabled,
  pageSize,
  onPageSizeChange,
  pageCount,
  onAddPage,
  onRemovePage,
  watermark,
  onWatermarkChange,
  fontFamily,
  fontSize,
  textAlign,
  fontWeight,
  fontStyle,
  textDecoration,
  color,
  fill,
  selectedKind,
  hasImage,
  onFontFamilyChange,
  onFontSizeChange,
  onTextStyleChange,
  onInsertImage,
  onClearImage,
  selectedId,
  onDeleteSelected,
  onClearAll,
  onPaletteDragStateChange,
  onAddHeaderField,
  onAddElement,
  fieldConfig,
}: MoaDesignToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<MoaToolsTabId>("layout");
  const [panelOpen, setPanelOpen] = useState(true);
  const [query, setQuery] = useState("");

  const activeMeta = useMemo(
    () => NAV.find((item) => item.id === activeTab) ?? NAV[0],
    [activeTab],
  );

  const selectTab = (id: MoaToolsTabId) => {
    if (activeTab === id && panelOpen) {
      setPanelOpen(false);
      return;
    }
    setActiveTab(id);
    setPanelOpen(true);
    setQuery("");
  };

  return (
    <div className="flex h-full min-h-[min(75vh,860px)] shrink-0 overflow-hidden border-r border-zinc-200 bg-white">
      {/* Icon rail */}
      <nav
        aria-label="MOA design categories"
        className="flex w-16 flex-col items-stretch gap-0.5 border-r border-zinc-200 bg-zinc-50 py-2"
      >
        {NAV.map((tab) => {
          const Icon = tab.icon;
          const active = panelOpen && activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              title={tab.label}
              onClick={() => selectTab(tab.id)}
              className={`mx-1 flex flex-col items-center gap-0.5 rounded-lg px-1 py-2.5 text-[8px] font-bold transition ${
                active
                  ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200"
                  : "text-zinc-500 hover:bg-white/80 hover:text-zinc-800"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-emerald-700" : "text-zinc-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Secondary panel */}
      {panelOpen ? (
        <div className="flex w-[min(100vw-4rem,280px)] flex-col bg-white sm:w-[300px]">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-900">{activeMeta.label}</p>
              <p className="truncate text-[9px] text-zinc-500">
                {activeTab === "header"
                  ? "Branch fields for the Header block"
                  : activeTab === "layout"
                    ? "Page structure blocks"
                    : activeTab === "elements"
                      ? "Shapes, media, and structure"
                      : activeTab === "fields"
                        ? "MOA financial & unit fields"
                        : activeTab === "canvas"
                          ? "Page size, pages, watermark"
                          : "Style the selected item"}
              </p>
            </div>
            <button
              type="button"
              title="Collapse panel"
              onClick={() => setPanelOpen(false)}
              className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeTab !== "canvas" && activeTab !== "text" ? (
            <div className="border-b border-zinc-100 px-3 py-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${activeMeta.label.toLowerCase()}…`}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-2 text-[11px] outline-none focus:border-emerald-500 focus:bg-white"
                />
              </label>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activeTab === "layout" ? (
              <MoaLayoutTab
                enabled={enabled}
                section="layout"
                onPaletteDragStateChange={onPaletteDragStateChange}
                onAddHeaderField={onAddHeaderField}
                onAddElement={onAddElement}
              />
            ) : null}

            {activeTab === "header" ? (
              <MoaLayoutTab
                enabled={enabled}
                section="header"
                onPaletteDragStateChange={onPaletteDragStateChange}
                onAddHeaderField={onAddHeaderField}
                onAddElement={onAddElement}
              />
            ) : null}

            {activeTab === "elements" ? (
              <MoaElementsTab
                enabled={enabled}
                searchQuery={query}
                onPaletteDragStateChange={onPaletteDragStateChange}
                onAddElement={onAddElement}
              />
            ) : null}

            {activeTab === "text" ? (
              <MoaTextTab
                enabled={enabled}
                fontFamily={fontFamily}
                fontSize={fontSize}
                textAlign={textAlign}
                fontWeight={fontWeight}
                fontStyle={fontStyle}
                textDecoration={textDecoration}
                color={color}
                fill={fill}
                selectedId={selectedId}
                selectedKind={selectedKind}
                hasImage={hasImage}
                onFontFamilyChange={onFontFamilyChange}
                onFontSizeChange={onFontSizeChange}
                onTextStyleChange={onTextStyleChange}
                onInsertImage={onInsertImage}
                onClearImage={onClearImage}
                onDeleteSelected={onDeleteSelected}
                onClearAll={onClearAll}
              />
            ) : null}

            {activeTab === "fields" ? (
              <div className="space-y-2">
                {query.trim() ? (
                  <p className="text-[9px] text-zinc-500">
                    Showing field config (search filters labels in the lists below when available).
                  </p>
                ) : null}
                {fieldConfig}
              </div>
            ) : null}

            {activeTab === "canvas" ? (
              <MoaCanvasTab
                enabled={enabled}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                pageCount={pageCount}
                onAddPage={onAddPage}
                onRemovePage={onRemovePage}
                watermark={watermark}
                onWatermarkChange={onWatermarkChange}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
