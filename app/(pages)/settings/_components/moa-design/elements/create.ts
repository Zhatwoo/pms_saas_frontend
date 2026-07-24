import type {
  MoaChartStyle,
  MoaColumnLayout,
  MoaColumnPreset,
  MoaDesignElement,
  MoaFrameStyle,
  MoaPaletteItemKind,
  MoaPhotoAspect,
  MoaShapeKind,
  MoaTableStyle,
  MoaTableTheme,
  MoaTextAlign,
} from "../../moa-design-palette";
import type { MoaElementCreateOptions } from "./options";

const SHAPE_KINDS = new Set<MoaShapeKind>([
  "rect",
  "square",
  "circle",
  "ellipse",
  "triangle",
  "diamond",
  "line",
  "rounded",
]);

const CHART_STYLES = new Set<MoaChartStyle>([
  "bar",
  "row",
  "line",
  "multiline",
  "pie",
  "donut",
  "area",
  "stacked",
]);

export function normalizeShapeKind(value: unknown): MoaShapeKind {
  if (typeof value === "string" && SHAPE_KINDS.has(value as MoaShapeKind)) {
    return value as MoaShapeKind;
  }
  return "rect";
}

export function normalizeChartStyle(value: unknown): MoaChartStyle {
  if (typeof value === "string" && CHART_STYLES.has(value as MoaChartStyle)) {
    return value as MoaChartStyle;
  }
  return "bar";
}

export function defaultTableData(rows = 4, cols = 3): string[][] {
  const safeRows = Math.max(1, Math.min(12, Math.floor(rows)));
  const safeCols = Math.max(1, Math.min(8, Math.floor(cols)));
  const header = Array.from({ length: safeCols }, (_, i) =>
    String.fromCharCode(65 + (i % 26)),
  );
  const body = Array.from({ length: safeRows - 1 }, () =>
    Array.from({ length: safeCols }, () => ""),
  );
  return [header, ...body];
}

export function defaultChartValues(bars = 4): number[] {
  const presets = [40, 70, 55, 85, 45, 65, 50, 75];
  const count = Math.max(2, Math.min(8, Math.floor(bars)));
  return presets.slice(0, count);
}

function sizeForKind(
  kind: MoaPaletteItemKind,
  options?: MoaElementCreateOptions,
): { width: number; height: number } {
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
    case "shape": {
      const shape = options?.shape ?? "rect";
      if (shape === "square" || shape === "circle" || shape === "diamond") {
        return { width: 88, height: 88 };
      }
      if (shape === "line") return { width: 160, height: 24 };
      if (shape === "ellipse") return { width: 120, height: 72 };
      if (shape === "triangle") return { width: 96, height: 84 };
      return { width: 112, height: 72 };
    }
    case "photo": {
      switch (options?.photoAspect ?? "landscape") {
        case "portrait":
          return { width: 90, height: 120 };
        case "square":
          return { width: 100, height: 100 };
        case "banner":
          return { width: 220, height: 64 };
        default:
          return { width: 140, height: 90 };
      }
    }
    case "table": {
      const rows = options?.tableRows ?? 4;
      const cols = options?.tableCols ?? 3;
      return {
        width: Math.min(320, 70 + cols * 52),
        height: Math.min(220, 36 + rows * 22),
      };
    }
    case "chart":
      return { width: 200, height: 130 };
    case "columns": {
      const layout = options?.columnLayout ?? "equal-2";
      const cols =
        layout === "equal-4" ? 4 : layout === "equal-3" ? 3 : 2;
      return { width: Math.min(420, 120 + cols * 90), height: 120 };
    }
    case "frame":
      return { width: 180, height: 110 };
    case "grid": {
      const cols = options?.gridCols ?? 2;
      const rows = options?.gridRows ?? 2;
      return {
        width: Math.min(280, 60 + cols * 48),
        height: Math.min(200, 48 + rows * 40),
      };
    }
    default:
      return { width: 140, height: 60 };
  }
}

function defaultText(kind: MoaPaletteItemKind): string {
  switch (kind) {
    case "section":
      return "Section title";
    case "body":
      return "Body text — double-click to edit.";
    case "text":
      return "Text";
    case "moaField":
      return "Field";
    default:
      return "";
  }
}

const FONT_FALLBACK = "Times New Roman, Times, serif";

/**
 * Creates a canvas element with optional Elements-tab variant options.
 */
export function buildMoaDesignElement(
  kind: MoaPaletteItemKind,
  x: number,
  y: number,
  options?: MoaElementCreateOptions & {
    textAlign?: MoaTextAlign;
  },
): MoaDesignElement {
  const size = sizeForKind(kind, options);
  const shape = normalizeShapeKind(options?.shape ?? "rect");
  const frameStyle: MoaFrameStyle = options?.frameStyle ?? "solid";
  const chartStyle = normalizeChartStyle(options?.chartStyle);
  const photoAspect: MoaPhotoAspect = options?.photoAspect ?? "landscape";
  const tableStyle: MoaTableStyle = options?.tableStyle ?? "header";
  const tableTheme: MoaTableTheme = options?.tableTheme ?? "green";
  const columnLayout: MoaColumnLayout = options?.columnLayout ?? "equal-2";
  const columnPreset: MoaColumnPreset = options?.columnPreset ?? "basic";

  const fill =
    options?.fill ??
    (kind === "shape"
      ? "#ecfdf5"
      : kind === "frame"
        ? "transparent"
        : kind === "grid" || kind === "columns"
          ? "#fafafa"
          : kind === "chart"
            ? "#059669"
            : "transparent");

  const stroke =
    options?.stroke ??
    (kind === "header"
      ? "#d4d4d8"
      : kind === "frame" || kind === "columns"
        ? "#52525b"
        : kind === "shape"
          ? "#059669"
          : "#a1a1aa");

  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    pageIndex: options?.pageIndex ?? 0,
    x: Math.max(8, x),
    y: Math.max(8, y),
    width: size.width,
    height: size.height,
    text: defaultText(kind),
    fontFamily: options?.fontFamily ?? FONT_FALLBACK,
    fontSize: options?.fontSize ?? (kind === "header" ? 14 : 11),
    textAlign: options?.textAlign ?? (kind === "header" ? "center" : "left"),
    fontWeight: kind === "header" || kind === "section" ? "bold" : "normal",
    fontStyle: "normal",
    textDecoration: "none",
    color: "#18181b",
    shape,
    fill,
    stroke,
    headerFields: [],
    fieldKey: "",
    ...(kind === "table"
      ? {
          tableData: defaultTableData(options?.tableRows ?? 4, options?.tableCols ?? 3),
          tableStyle,
          tableTheme,
        }
      : {}),
    ...(kind === "chart"
      ? {
          chartStyle,
          chartValues: defaultChartValues(options?.chartBars ?? 4),
          chartValuesB:
            chartStyle === "multiline" || chartStyle === "stacked"
              ? defaultChartValues(options?.chartBars ?? 4).map((v) =>
                  Math.max(10, Math.min(100, v - 15)),
                )
              : undefined,
        }
      : {}),
    ...(kind === "grid"
      ? {
          gridCols: options?.gridCols ?? 2,
          gridRows: options?.gridRows ?? 2,
        }
      : {}),
    ...(kind === "columns"
      ? {
          columnLayout,
          columnPreset,
        }
      : {}),
    ...(kind === "frame" ? { frameStyle } : {}),
    ...(kind === "photo" ? { photoAspect } : {}),
  };
}
