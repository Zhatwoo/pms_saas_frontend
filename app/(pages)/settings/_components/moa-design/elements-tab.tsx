"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Columns2,
  Frame,
  Image as ImageIcon,
  LayoutGrid,
  Shapes,
  Table2,
} from "lucide-react";
import {
  MOA_PALETTE_MIME,
  type MoaPaletteItemKind,
} from "../moa-design-palette";
import { TabHint } from "./ui";
import {
  ELEMENT_CATEGORIES,
  MOA_ELEMENT_OPTIONS_MIME,
  type MoaElementCategory,
  type MoaElementCreateOptions,
  type MoaElementSection,
  type MoaElementVariant,
} from "./elements/variants";

const CATEGORY_ICONS: Record<MoaElementCategory["kind"], typeof Shapes> = {
  shape: Shapes,
  columns: Columns2,
  photo: ImageIcon,
  table: Table2,
  chart: BarChart3,
  frame: Frame,
  grid: LayoutGrid,
};

function VariantCard({
  kind,
  variant,
  enabled,
  onPaletteDragStateChange,
  onPlace,
}: {
  kind: MoaPaletteItemKind;
  variant: MoaElementVariant;
  enabled: boolean;
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onPlace: () => void;
}) {
  return (
    <button
      type="button"
      draggable={enabled}
      disabled={!enabled}
      title={`${variant.hint} · Click to add · Drag to place`}
      onDragStart={(event) => {
        if (!enabled) return;
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(MOA_PALETTE_MIME, kind);
        event.dataTransfer.setData("text/plain", kind);
        event.dataTransfer.setData(
          MOA_ELEMENT_OPTIONS_MIME,
          JSON.stringify(variant.options),
        );
        onPaletteDragStateChange?.(true);
      }}
      onDragEnd={() => onPaletteDragStateChange?.(false)}
      onClick={onPlace}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-3 text-center transition hover:border-emerald-500 hover:bg-white disabled:opacity-50"
    >
      <span className="flex h-10 w-12 items-center justify-center rounded-md bg-white text-emerald-800 shadow-sm ring-1 ring-zinc-100">
        {variant.icon}
      </span>
      <span className="text-[10px] font-bold text-zinc-800">{variant.label}</span>
    </button>
  );
}

function SectionBlock({
  section,
  kind,
  enabled,
  showAll,
  onToggleShowAll,
  onPaletteDragStateChange,
  onPlace,
}: {
  section: MoaElementSection;
  kind: MoaPaletteItemKind;
  enabled: boolean;
  showAll: boolean;
  onToggleShowAll: () => void;
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onPlace: (variant: MoaElementVariant) => void;
}) {
  const visible = showAll ? section.variants : section.variants.slice(0, 3);
  const hasMore = section.variants.length > 3;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-zinc-700">{section.label}</p>
        {hasMore ? (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-[10px] font-semibold text-emerald-700 hover:underline"
          >
            {showAll ? "Show less" : "See all"}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((variant) => (
          <VariantCard
            key={variant.id}
            kind={kind}
            variant={variant}
            enabled={enabled}
            onPaletteDragStateChange={onPaletteDragStateChange}
            onPlace={() => onPlace(variant)}
          />
        ))}
      </div>
    </div>
  );
}

export function MoaElementsTab({
  enabled,
  searchQuery = "",
  onPaletteDragStateChange,
  onAddElement,
}: {
  enabled: boolean;
  searchQuery?: string;
  onPaletteDragStateChange?: (dragging: boolean) => void;
  onAddElement?: (
    kind: MoaPaletteItemKind,
    options?: MoaElementCreateOptions,
  ) => void;
}) {
  const [openKind, setOpenKind] = useState<MoaElementCategory["kind"] | null>("shape");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const q = searchQuery.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!q) return ELEMENT_CATEGORIES;
    return ELEMENT_CATEGORIES.map((category) => {
      const variants = category.variants.filter(
        (variant) =>
          variant.label.toLowerCase().includes(q) ||
          variant.hint.toLowerCase().includes(q) ||
          category.label.toLowerCase().includes(q),
      );
      const sections = category.sections
        ?.map((section) => ({
          ...section,
          variants: section.variants.filter(
            (variant) =>
              variant.label.toLowerCase().includes(q) ||
              variant.hint.toLowerCase().includes(q) ||
              section.label.toLowerCase().includes(q) ||
              category.label.toLowerCase().includes(q),
          ),
        }))
        .filter((section) => section.variants.length > 0);
      return { ...category, variants, sections };
    }).filter(
      (category) =>
        category.variants.length > 0 || category.label.toLowerCase().includes(q),
    );
  }, [q]);

  const openCategory =
    filteredCategories.find((item) => item.kind === openKind) ??
    filteredCategories[0] ??
    null;

  const placeVariant = (kind: MoaPaletteItemKind, variant: MoaElementVariant) => {
    if (!enabled || !onAddElement) return;
    onAddElement(kind, variant.options);
  };

  const sectionKey = (sectionId: string) =>
    `${openCategory?.kind ?? "none"}:${sectionId}`;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
          Browse categories
        </p>
        <TabHint>
          Pick a category, then click or drag a style onto the canvas.
        </TabHint>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {filteredCategories.map((category) => {
          const Icon = CATEGORY_ICONS[category.kind];
          const active = openCategory?.kind === category.kind;
          return (
            <button
              key={category.kind}
              type="button"
              disabled={!enabled}
              title={category.hint}
              onClick={() => setOpenKind(category.kind)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/60"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-bold text-zinc-700">{category.label}</span>
            </button>
          );
        })}
      </div>

      {openCategory ? (
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-800">
            {openCategory.label}
          </p>

          {openCategory.sections?.length ? (
            openCategory.sections.map((section) => {
              const key = sectionKey(section.id);
              return (
                <SectionBlock
                  key={section.id}
                  section={section}
                  kind={openCategory.kind}
                  enabled={enabled}
                  showAll={Boolean(q) || Boolean(expandedSections[key])}
                  onToggleShowAll={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  onPaletteDragStateChange={onPaletteDragStateChange}
                  onPlace={(variant) => placeVariant(openCategory.kind, variant)}
                />
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {openCategory.variants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  kind={openCategory.kind}
                  variant={variant}
                  enabled={enabled}
                  onPaletteDragStateChange={onPaletteDragStateChange}
                  onPlace={() => placeVariant(openCategory.kind, variant)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[9px] text-zinc-500">No matches for “{searchQuery}”.</p>
      )}
    </div>
  );
}
