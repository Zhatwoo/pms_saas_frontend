import type {
  MoaChartStyle,
  MoaColumnLayout,
  MoaColumnPreset,
  MoaFrameStyle,
  MoaPhotoAspect,
  MoaShapeKind,
  MoaTableStyle,
  MoaTableTheme,
} from "../../moa-design-palette";

/** Options applied when placing an element from the Elements picker. */
export type MoaElementCreateOptions = {
  fontFamily?: string;
  fontSize?: number;
  pageIndex?: number;
  shape?: MoaShapeKind;
  frameStyle?: MoaFrameStyle;
  chartStyle?: MoaChartStyle;
  photoAspect?: MoaPhotoAspect;
  tableRows?: number;
  tableCols?: number;
  tableStyle?: MoaTableStyle;
  tableTheme?: MoaTableTheme;
  gridCols?: number;
  gridRows?: number;
  chartBars?: number;
  columnLayout?: MoaColumnLayout;
  columnPreset?: MoaColumnPreset;
  fill?: string;
  stroke?: string;
};

export const MOA_ELEMENT_OPTIONS_MIME = "application/x-moa-element-options";

export function parseElementOptions(raw: string): MoaElementCreateOptions | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as MoaElementCreateOptions;
  } catch {
    return undefined;
  }
}

export const TABLE_THEME_COLORS: Record<
  MoaTableTheme,
  { border: string; header: string; row: string; alt: string }
> = {
  gray: { border: "#52525b", header: "#3f3f46", row: "#f4f4f5", alt: "#e4e4e7" },
  red: { border: "#e11d48", header: "#e11d48", row: "#ffe4e6", alt: "#fecdd3" },
  orange: { border: "#ea580c", header: "#ea580c", row: "#ffedd5", alt: "#fed7aa" },
  blue: { border: "#2563eb", header: "#2563eb", row: "#dbeafe", alt: "#bfdbfe" },
  purple: { border: "#7c3aed", header: "#7c3aed", row: "#ede9fe", alt: "#ddd6fe" },
  green: { border: "#059669", header: "#059669", row: "#d1fae5", alt: "#a7f3d0" },
};

export const COLUMN_LAYOUT_FRACS: Record<MoaColumnLayout, number[]> = {
  "equal-2": [1, 1],
  "equal-3": [1, 1, 1],
  "equal-4": [1, 1, 1, 1],
  "left-narrow": [1, 2],
  "right-narrow": [2, 1],
  "left-media": [1, 1],
};
