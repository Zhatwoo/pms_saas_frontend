"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  FileType,
  Heading,
  LayoutTemplate,
  Library,
  ListChecks,
  Search,
  Shapes,
  Upload,
} from "lucide-react";
import type {
  MoaDesignElement,
  MoaElementCreateOptions,
  MoaHeaderFieldKey,
  MoaPageSizeId,
  MoaPaletteItemKind,
  MoaWatermarkSettings,
} from "../moa-design-palette";
import type { MoaDesignBlob } from "@/lib/moa";
import type { MoaComponentTemplate } from "@/lib/moa/component-templates";
import { MoaCanvasTab } from "./canvas-tab";
import { MoaElementsTab } from "./elements-tab";
import { MoaLayoutTab } from "./layout-tab";
import { MoaTemplatesTab } from "./templates-tab";
import { MoaUploadsTab } from "./uploads-tab";

type MoaToolsTabId =
  | "layout"
  | "header"
  | "elements"
  | "uploads"
  | "fields"
  | "templates"
  | "canvas";

const NAV: Array<{
  id: MoaToolsTabId;
  label: string;
  icon: typeof FileType;
}> = [
  { id: "layout", label: "Layout", icon: LayoutTemplate },
  { id: "header", label: "Header", icon: Heading },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "fields", label: "Fields", icon: ListChecks },
  { id: "templates", label: "Templates", icon: Library },
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
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onAddHeaderField?: (key: MoaHeaderFieldKey) => void;
  onAddElement?: (kind: MoaPaletteItemKind, options?: MoaElementCreateOptions) => void;
  /** Apply an uploaded image to the selected element. */
  onUseUploadedImage?: (dataUrl: string) => void;
  /** MOA Field Config content (Financial / Unit fields). */
  fieldConfig?: ReactNode;
  currentDesign: MoaDesignBlob;
  selectedElements: MoaDesignElement[];
  onApplyTemplatePack: (template: MoaComponentTemplate) => void;
  onApplyTemplateFull: (template: MoaComponentTemplate) => void;
};

/**
 * Canva-like MOA designer chrome:
 * narrow icon rail + secondary browse panel (Layout / Header / Elements / …).
 * Search styling lives in the Docs toolbar above the canvas.
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
  onPaletteDragStateChange,
  onAddHeaderField,
  onAddElement,
  onUseUploadedImage,
  fieldConfig,
  currentDesign,
  selectedElements,
  onApplyTemplatePack,
  onApplyTemplateFull,
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
                      : activeTab === "uploads"
                        ? "Your image library"
                        : activeTab === "fields"
                          ? "MOA financial & unit fields"
                          : activeTab === "templates"
                            ? "Ready-made packs & saved layouts"
                            : "Page size, pages, watermark"}
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

          {activeTab !== "canvas" && activeTab !== "uploads" ? (
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

            {activeTab === "uploads" ? (
              <MoaUploadsTab
                enabled={enabled}
                onUseImage={(dataUrl) => onUseUploadedImage?.(dataUrl)}
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

            {activeTab === "templates" ? (
              <MoaTemplatesTab
                enabled={enabled}
                searchQuery={query}
                currentDesign={currentDesign}
                selectedElements={selectedElements}
                onApplyPack={onApplyTemplatePack}
                onApplyFull={onApplyTemplateFull}
              />
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
