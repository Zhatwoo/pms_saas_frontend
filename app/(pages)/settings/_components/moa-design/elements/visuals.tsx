"use client";

import type { CSSProperties } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { MoaDesignElement } from "../../moa-design-palette";
import { defaultChartValues, defaultTableData } from "./create";
import { COLUMN_LAYOUT_FRACS, TABLE_THEME_COLORS } from "./options";

function elementTextStyle(element: MoaDesignElement): CSSProperties {
  const size = element.fontSize;
  return {
    fontFamily: element.fontFamily,
    fontSize: typeof size === "number" ? `${size}px` : size,
    textAlign: element.textAlign,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
  };
}

function ShapeVisual({ element }: { element: MoaDesignElement }) {
  const border = element.stroke;
  const fill = element.fill;

  switch (element.shape) {
    case "circle":
      return (
        <div
          className="h-full w-full rounded-full border-2"
          style={{ borderColor: border, background: fill }}
        />
      );
    case "ellipse":
      return (
        <div
          className="h-full w-full rounded-[50%] border-2"
          style={{ borderColor: border, background: fill }}
        />
      );
    case "line":
      return (
        <div className="flex h-full w-full items-center">
          <div className="h-0.5 w-full" style={{ background: border }} />
        </div>
      );
    case "triangle":
      return (
        <div className="relative h-full w-full">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
            <polygon
              points="50,6 6,94 94,94"
              fill={fill}
              stroke={border}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case "diamond":
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="h-[72%] w-[72%] rotate-45 border-2"
            style={{ borderColor: border, background: fill }}
          />
        </div>
      );
    case "rounded":
      return (
        <div
          className="h-full w-full rounded-xl border-2"
          style={{ borderColor: border, background: fill }}
        />
      );
    case "square":
    case "rect":
    default:
      return (
        <div
          className="h-full w-full rounded-sm border-2"
          style={{ borderColor: border, background: fill }}
        />
      );
  }
}

const CHART_PALETTE = ["#3b82f6", "#8b5cf6", "#f97316", "#eab308", "#10b981", "#ec4899"];

function ChartVisual({ element }: { element: MoaDesignElement }) {
  const values = element.chartValues?.length ? element.chartValues : defaultChartValues();
  const valuesB = element.chartValuesB?.length ? element.chartValuesB : [28, 42, 35, 55, 48];
  const max = Math.max(...values, ...valuesB, 1);
  const style = element.chartStyle ?? "bar";
  const accent =
    element.fill && element.fill !== "transparent"
      ? element.fill
      : element.stroke || "#3b82f6";

  if (style === "line" || style === "multiline") {
    const toPoints = (vals: number[]) =>
      vals
        .map((value, index) => {
          const x = (index / Math.max(vals.length - 1, 1)) * 100;
          const y = 100 - (value / max) * 85 - 5;
          return `${x},${y}`;
        })
        .join(" ");
    return (
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full rounded border border-zinc-300 bg-white p-1"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          points={toPoints(values)}
          vectorEffect="non-scaling-stroke"
        />
        {style === "multiline" ? (
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            points={toPoints(valuesB)}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
    );
  }

  if (style === "row") {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1.5">
        {values.map((value, index) => (
          <div key={index} className="h-2.5 overflow-hidden rounded-sm bg-zinc-100">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.max(8, (value / max) * 100)}%`,
                background: CHART_PALETTE[index % CHART_PALETTE.length],
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (style === "pie" || style === "donut") {
    const total = values.reduce((sum, v) => sum + v, 0) || 1;
    let cursor = 0;
    const slices = values.map((value, index) => {
      const start = cursor;
      const portion = (value / total) * 360;
      cursor += portion;
      return { start, end: cursor, color: CHART_PALETTE[index % CHART_PALETTE.length] };
    });
    const gradient = slices
      .map((slice) => `${slice.color} ${slice.start}deg ${slice.end}deg`)
      .join(", ");
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-zinc-300 bg-white p-2">
        <div
          className="relative aspect-square h-full max-h-full w-full max-w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          {style === "donut" ? (
            <div className="absolute inset-[28%] rounded-full bg-white" />
          ) : null}
        </div>
      </div>
    );
  }

  if (style === "area" || style === "stacked") {
    const toArea = (vals: number[], fill: string, opacity: number) => {
      const pts = vals.map((value, index) => {
        const x = (index / Math.max(vals.length - 1, 1)) * 100;
        const y = 100 - (value / max) * 80 - 8;
        return `${x},${y}`;
      });
      return (
        <polygon
          key={fill}
          fill={fill}
          fillOpacity={opacity}
          points={`0,100 ${pts.join(" ")} 100,100`}
        />
      );
    };
    return (
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full rounded border border-zinc-300 bg-white p-1"
        preserveAspectRatio="none"
      >
        {style === "stacked"
          ? toArea(
              valuesB.map((v, i) => v + (values[i] ?? 0)),
              "#93c5fd",
              0.85,
            )
          : null}
        {toArea(values, accent, style === "area" ? 0.45 : 0.9)}
      </svg>
    );
  }

  return (
    <div className="flex h-full w-full items-end gap-1 rounded border border-zinc-300 bg-white px-1.5 pb-1 pt-2">
      {values.map((value, index) => (
        <div
          key={index}
          className="min-w-0 flex-1 rounded-t"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
            background: CHART_PALETTE[index % CHART_PALETTE.length],
          }}
          title={String(value)}
        />
      ))}
    </div>
  );
}

function ColumnsVisual({ element }: { element: MoaDesignElement }) {
  const layout = element.columnLayout ?? "equal-2";
  const preset = element.columnPreset ?? "basic";
  const fracs = COLUMN_LAYOUT_FRACS[layout] ?? [1, 1];
  const isStyled = preset === "styled";
  const isPre = preset === "predesigned";
  const border = element.stroke || (isStyled ? "#8b5cf6" : "#18181b");
  const fill =
    element.fill && element.fill !== "transparent"
      ? element.fill
      : isStyled
        ? "#f5f3ff"
        : "#ffffff";

  return (
    <div
      className="grid h-full w-full gap-1.5 rounded p-1.5"
      style={{
        gridTemplateColumns: fracs.map((f) => `${f}fr`).join(" "),
        border: `${isStyled ? 3 : 2}px solid ${border}`,
        background: fill,
      }}
    >
      {fracs.map((_, index) => (
        <div
          key={index}
          className="flex min-h-0 flex-col overflow-hidden rounded-sm"
          style={{
            border: `1.5px solid ${border}`,
            background: isPre ? "#fff" : "transparent",
          }}
        >
          {isPre ? (
            <>
              <div className="h-[38%] bg-gradient-to-br from-zinc-200 to-zinc-300" />
              <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 py-1">
                <div className="h-1 rounded bg-zinc-300" />
                <div className="h-1 w-4/5 rounded bg-zinc-200" />
                <div className="h-1 w-3/5 rounded bg-zinc-200" />
              </div>
            </>
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
      ))}
    </div>
  );
}

function FrameVisual({ element }: { element: MoaDesignElement }) {
  const style = element.frameStyle ?? "solid";
  const borderStyle =
    style === "dashed" ? "dashed" : style === "double" ? "double" : "solid";
  const radius = style === "rounded" ? 12 : 4;
  const textStyle = elementTextStyle(element);

  return (
    <div
      className="flex h-full w-full items-center justify-center px-1"
      style={{
        borderColor: element.stroke || "#52525b",
        borderWidth: style === "double" ? 4 : 2,
        borderStyle,
        borderRadius: radius,
        background:
          !element.fill || element.fill === "transparent" ? "transparent" : element.fill,
      }}
    >
      {element.text ? (
        <span style={textStyle} className="text-center">
          {element.text}
        </span>
      ) : null}
    </div>
  );
}

/** Renders non-header element kinds used by the canvas layer. */
export function MoaElementVisual({
  element,
  editingTable,
  onTableCellChange,
}: {
  element: MoaDesignElement;
  editingTable?: boolean;
  onTableCellChange?: (row: number, col: number, value: string) => void;
}) {
  const textStyle = elementTextStyle(element);

  switch (element.kind) {
    case "shape":
      return <ShapeVisual element={element} />;
    case "photo":
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded border border-dashed border-zinc-400 bg-zinc-100">
          {element.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={element.imageSrc}
              alt="Photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-zinc-500">
              <ImageIcon className="h-5 w-5" />
              <span className="text-[8px] font-semibold">Double-click to upload</span>
            </div>
          )}
        </div>
      );
    case "table": {
      const data = element.tableData?.length ? element.tableData : defaultTableData();
      const cols = Math.max(1, ...data.map((row) => row.length));
      const theme = element.tableTheme ?? "gray";
      const tableStyle = element.tableStyle ?? "header";
      const colors = TABLE_THEME_COLORS[theme];
      return (
        <div
          className="h-full w-full overflow-auto rounded bg-white text-[8px]"
          style={{ border: `1.5px solid ${colors.border}` }}
        >
          {data.map((row, rowIndex) => {
            const isHeader = rowIndex === 0;
            let rowBg = "transparent";
            if (tableStyle === "filled") {
              rowBg = isHeader ? colors.header : rowIndex % 2 === 0 ? colors.alt : colors.row;
            } else if (tableStyle === "header" && isHeader) {
              rowBg = colors.header;
            }
            const cellBorder = `1px solid ${colors.border}`;
            const textColor =
              (tableStyle === "filled" || tableStyle === "header") && isHeader
                ? "#ffffff"
                : "#18181b";
            return (
              <div
                key={rowIndex}
                className={`grid ${isHeader ? "font-bold" : ""}`}
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  background: rowBg,
                  color: textColor,
                  borderBottom: tableStyle === "outline" || !isHeader ? cellBorder : undefined,
                }}
              >
                {Array.from({ length: cols }, (_, colIndex) => {
                  const value = row[colIndex] ?? "";
                  if (editingTable && onTableCellChange) {
                    return (
                      <input
                        key={colIndex}
                        data-moa-no-drag
                        value={value}
                        onChange={(event) =>
                          onTableCellChange(rowIndex, colIndex, event.target.value)
                        }
                        className="min-w-0 bg-transparent px-1 py-0.5 outline-none last:border-r-0 focus:bg-sky-50/80"
                        style={{ borderRight: cellBorder, color: textColor }}
                      />
                    );
                  }
                  return (
                    <span
                      key={colIndex}
                      className="min-w-0 truncate px-1 py-0.5 last:border-r-0"
                      style={{ borderRight: cellBorder }}
                    >
                      {value || "\u00a0"}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }
    case "chart":
      return <ChartVisual element={element} />;
    case "columns":
      return <ColumnsVisual element={element} />;
    case "frame":
      return <FrameVisual element={element} />;
    case "grid": {
      const cols = element.gridCols ?? 2;
      const rows = element.gridRows ?? 2;
      const cells = cols * rows;
      return (
        <div
          className="grid h-full w-full gap-0.5 rounded border border-zinc-300 p-0.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            background:
              !element.fill || element.fill === "transparent"
                ? "#fafafa"
                : element.fill,
          }}
        >
          {Array.from({ length: cells }, (_, cell) => (
            <div
              key={cell}
              className="rounded-sm border border-dashed bg-white"
              style={{ borderColor: element.stroke || "#d4d4d8" }}
            />
          ))}
        </div>
      );
    }
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

export const SHAPE_CYCLE: MoaDesignElement["shape"][] = [
  "rect",
  "square",
  "rounded",
  "circle",
  "ellipse",
  "triangle",
  "diamond",
  "line",
];
