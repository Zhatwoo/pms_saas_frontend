"use client";

import { useState, type ReactNode } from "react";
import {
  FileType,
  LayoutTemplate,
  ListChecks,
  Shapes,
  Type,
} from "lucide-react";
import type {
  MoaHeaderFieldKey,
  MoaPageSizeId,
  MoaTextAlign,
  MoaTextStylePatch,
} from "../moa-design-palette";
import { MoaCanvasTab } from "./canvas-tab";
import { MoaElementsTab } from "./elements-tab";
import { MoaLayoutTab } from "./layout-tab";
import { MoaTextTab } from "./text-tab";

type MoaToolsTabId = "canvas" | "layout" | "elements" | "text" | "fields";

const TABS: Array<{
  id: MoaToolsTabId;
  label: string;
  icon: typeof FileType;
}> = [
  { id: "canvas", label: "Canvas", icon: FileType },
  { id: "layout", label: "Layout", icon: LayoutTemplate },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "text", label: "Text", icon: Type },
  { id: "fields", label: "Fields", icon: ListChecks },
];

export type MoaDesignToolsPanelProps = {
  enabled: boolean;
  pageSize: MoaPageSizeId;
  onPageSizeChange: (id: MoaPageSizeId) => void;
  fontFamily: string;
  fontSize: number;
  textAlign: MoaTextAlign;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onTextStyleChange: (patch: MoaTextStylePatch) => void;
  selectedId: string | null;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onAddHeaderField?: (key: MoaHeaderFieldKey) => void;
  /** MOA Field Config content (Financial / Unit fields). */
  fieldConfig?: ReactNode;
};

/** Tabbed MOA design sidebar — Canvas / Layout / Elements / Text / Fields. */
export function MoaDesignToolsPanel({
  enabled,
  pageSize,
  onPageSizeChange,
  fontFamily,
  fontSize,
  textAlign,
  fontWeight,
  fontStyle,
  textDecoration,
  color,
  onFontFamilyChange,
  onFontSizeChange,
  onTextStyleChange,
  selectedId,
  onDeleteSelected,
  onClearAll,
  onPaletteDragStateChange,
  onAddHeaderField,
  fieldConfig,
}: MoaDesignToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<MoaToolsTabId>("layout");

  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
      <div
        role="tablist"
        aria-label="MOA design tools"
        className="grid grid-cols-5 border-b border-border-main bg-zinc-50/80"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-0.5 py-2.5 text-[8px] font-bold transition sm:text-[9px] ${
                active
                  ? "bg-white text-emerald-800 shadow-[inset_0_-2px_0_0_#059669]"
                  : "text-zinc-500 hover:bg-white/70 hover:text-zinc-700"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-emerald-700" : "text-zinc-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className={`overflow-y-auto p-3 ${
          activeTab === "fields"
            ? "max-h-[min(70vh,560px)]"
            : "max-h-[min(52vh,420px)]"
        }`}
      >
        {activeTab === "canvas" ? (
          <MoaCanvasTab
            enabled={enabled}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null}

        {activeTab === "layout" ? (
          <MoaLayoutTab
            enabled={enabled}
            onPaletteDragStateChange={onPaletteDragStateChange}
            onAddHeaderField={onAddHeaderField}
          />
        ) : null}

        {activeTab === "elements" ? (
          <MoaElementsTab
            enabled={enabled}
            onPaletteDragStateChange={onPaletteDragStateChange}
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
            selectedId={selectedId}
            onFontFamilyChange={onFontFamilyChange}
            onFontSizeChange={onFontSizeChange}
            onTextStyleChange={onTextStyleChange}
            onDeleteSelected={onDeleteSelected}
            onClearAll={onClearAll}
          />
        ) : null}

        {activeTab === "fields" ? fieldConfig : null}
      </div>
    </div>
  );
}
