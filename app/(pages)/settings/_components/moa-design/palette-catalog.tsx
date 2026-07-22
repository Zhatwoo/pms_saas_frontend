"use client";

import type { ReactNode } from "react";
import {
  AlignLeft,
  BarChart3,
  Frame,
  Heading,
  Image as ImageIcon,
  LayoutGrid,
  Rows3,
  Shapes,
  Table2,
  Type,
} from "lucide-react";
import type { MoaPaletteItemKind } from "../moa-design-palette";

export type MoaPaletteCatalogItem = {
  kind: MoaPaletteItemKind;
  label: string;
  icon: ReactNode;
  hint: string;
};

export const LAYOUT_ITEMS: MoaPaletteCatalogItem[] = [
  { kind: "header", label: "Header", icon: <Heading className="h-4 w-4" />, hint: "Shop / title block" },
  { kind: "section", label: "Section", icon: <Rows3 className="h-4 w-4" />, hint: "Grouped content" },
  { kind: "body", label: "Body", icon: <AlignLeft className="h-4 w-4" />, hint: "Paragraph text" },
  { kind: "text", label: "Text", icon: <Type className="h-4 w-4" />, hint: "Free text box" },
];

export const ELEMENT_ITEMS: MoaPaletteCatalogItem[] = [
  { kind: "shape", label: "Shape", icon: <Shapes className="h-4 w-4" />, hint: "Box / circle / line" },
  { kind: "photo", label: "Photo", icon: <ImageIcon className="h-4 w-4" />, hint: "Image placeholder" },
  { kind: "table", label: "Table", icon: <Table2 className="h-4 w-4" />, hint: "Simple table" },
  { kind: "chart", label: "Chart", icon: <BarChart3 className="h-4 w-4" />, hint: "Bar chart stub" },
  { kind: "frame", label: "Frame", icon: <Frame className="h-4 w-4" />, hint: "Bordered frame" },
  { kind: "grid", label: "Grid", icon: <LayoutGrid className="h-4 w-4" />, hint: "2×2 grid" },
];
