"use client";

import {
  Circle,
  Diamond,
  Frame,
  Grid2x2,
  Grid3x3,
  Image as ImageIcon,
  Minus,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Triangle,
} from "lucide-react";
import type { MoaPaletteItemKind } from "../../moa-design-palette";
import {
  CHARTS_SECTIONS,
  COLUMNS_SECTIONS,
  TABLES_SECTIONS,
  type MoaElementSection,
  type MoaElementVariant,
} from "./catalogs";

export type { MoaElementCreateOptions } from "./options";
export { MOA_ELEMENT_OPTIONS_MIME, parseElementOptions } from "./options";
export type { MoaElementVariant, MoaElementSection } from "./catalogs";

export type MoaElementCategory = {
  kind: Extract<
    MoaPaletteItemKind,
    "shape" | "photo" | "table" | "chart" | "frame" | "grid" | "columns"
  >;
  label: string;
  hint: string;
  /** Flat list used for search / simple grids */
  variants: MoaElementVariant[];
  /** Optional Canva-style grouped sections */
  sections?: MoaElementSection[];
};

const iconClass = "h-3.5 w-3.5";

const SHAPE_VARIANTS: MoaElementVariant[] = [
  {
    id: "rect",
    label: "Rectangle",
    hint: "Wide rectangle",
    icon: <RectangleHorizontal className={iconClass} />,
    options: { shape: "rect" },
  },
  {
    id: "square",
    label: "Square",
    hint: "Equal sides",
    icon: <Square className={iconClass} />,
    options: { shape: "square" },
  },
  {
    id: "rounded",
    label: "Rounded",
    hint: "Rounded rectangle",
    icon: <Square className={`${iconClass} rounded-sm`} />,
    options: { shape: "rounded" },
  },
  {
    id: "circle",
    label: "Circle",
    hint: "Perfect circle",
    icon: <Circle className={iconClass} />,
    options: { shape: "circle" },
  },
  {
    id: "ellipse",
    label: "Ellipse",
    hint: "Oval shape",
    icon: <Circle className={`${iconClass} scale-x-125`} />,
    options: { shape: "ellipse" },
  },
  {
    id: "triangle",
    label: "Triangle",
    hint: "Pointed triangle",
    icon: <Triangle className={iconClass} />,
    options: { shape: "triangle" },
  },
  {
    id: "diamond",
    label: "Diamond",
    hint: "Rotated square",
    icon: <Diamond className={iconClass} />,
    options: { shape: "diamond" },
  },
  {
    id: "line",
    label: "Line",
    hint: "Horizontal divider",
    icon: <Minus className={iconClass} />,
    options: { shape: "line" },
  },
];

function flattenSections(sections: MoaElementSection[]): MoaElementVariant[] {
  return sections.flatMap((section) => section.variants);
}

export const ELEMENT_CATEGORIES: MoaElementCategory[] = [
  {
    kind: "shape",
    label: "Shapes",
    hint: "Pick a shape to place",
    variants: SHAPE_VARIANTS,
  },
  {
    kind: "columns",
    label: "Columns",
    hint: "Column layouts",
    sections: COLUMNS_SECTIONS,
    variants: flattenSections(COLUMNS_SECTIONS),
  },
  {
    kind: "table",
    label: "Tables",
    hint: "Styled table templates",
    sections: TABLES_SECTIONS,
    variants: flattenSections(TABLES_SECTIONS),
  },
  {
    kind: "chart",
    label: "Charts",
    hint: "Bar, line, pie, and more",
    sections: CHARTS_SECTIONS,
    variants: flattenSections(CHARTS_SECTIONS),
  },
  {
    kind: "photo",
    label: "Photos",
    hint: "Photo frame sizes",
    variants: [
      {
        id: "landscape",
        label: "Landscape",
        hint: "Wide photo",
        icon: <RectangleHorizontal className={iconClass} />,
        options: { photoAspect: "landscape" },
      },
      {
        id: "portrait",
        label: "Portrait",
        hint: "Tall photo",
        icon: <RectangleVertical className={iconClass} />,
        options: { photoAspect: "portrait" },
      },
      {
        id: "square",
        label: "Square",
        hint: "1:1 photo",
        icon: <Square className={iconClass} />,
        options: { photoAspect: "square" },
      },
      {
        id: "wide",
        label: "Banner",
        hint: "Extra-wide banner",
        icon: <ImageIcon className={iconClass} />,
        options: { photoAspect: "banner" },
      },
    ],
  },
  {
    kind: "frame",
    label: "Frames",
    hint: "Border styles",
    variants: [
      {
        id: "solid",
        label: "Solid",
        hint: "Solid border",
        icon: <Frame className={iconClass} />,
        options: { frameStyle: "solid" },
      },
      {
        id: "dashed",
        label: "Dashed",
        hint: "Dashed border",
        icon: <Frame className={iconClass} />,
        options: { frameStyle: "dashed" },
      },
      {
        id: "double",
        label: "Double",
        hint: "Double border",
        icon: <Frame className={iconClass} />,
        options: { frameStyle: "double" },
      },
      {
        id: "rounded",
        label: "Rounded",
        hint: "Rounded corners",
        icon: <Square className={`${iconClass} rounded`} />,
        options: { frameStyle: "rounded" },
      },
    ],
  },
  {
    kind: "grid",
    label: "Grids",
    hint: "Layout grids",
    variants: [
      {
        id: "2x2",
        label: "2×2",
        hint: "Four cells",
        icon: <Grid2x2 className={iconClass} />,
        options: { gridCols: 2, gridRows: 2 },
      },
      {
        id: "3x2",
        label: "3×2",
        hint: "Six cells",
        icon: <Grid3x3 className={iconClass} />,
        options: { gridCols: 3, gridRows: 2 },
      },
      {
        id: "3x3",
        label: "3×3",
        hint: "Nine cells",
        icon: <Grid3x3 className={iconClass} />,
        options: { gridCols: 3, gridRows: 3 },
      },
      {
        id: "4x3",
        label: "4×3",
        hint: "Twelve cells",
        icon: <Grid2x2 className={iconClass} />,
        options: { gridCols: 4, gridRows: 3 },
      },
    ],
  },
];
