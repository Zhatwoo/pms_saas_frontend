"use client";

import type { ReactNode } from "react";
import type { MoaElementCreateOptions } from "./options";
import { COLUMN_LAYOUT_FRACS, TABLE_THEME_COLORS } from "./options";
import type {
  MoaColumnLayout,
  MoaTableStyle,
  MoaTableTheme,
} from "../../moa-design-palette";

export type MoaElementVariant = {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  options: MoaElementCreateOptions;
};

export type MoaElementSection = {
  id: string;
  label: string;
  variants: MoaElementVariant[];
};

function ColumnThumb({
  layout,
  styled,
  predesigned,
}: {
  layout: MoaColumnLayout;
  styled?: boolean;
  predesigned?: boolean;
}) {
  const fracs = COLUMN_LAYOUT_FRACS[layout];
  const border = styled
    ? "border-2 border-violet-500"
    : "border-2 border-zinc-800";
  return (
    <div className={`flex h-9 w-12 gap-0.5 rounded-sm bg-white p-0.5 ${border}`}>
      {fracs.map((fr, i) => (
        <div
          key={i}
          className={`min-w-0 rounded-[1px] ${
            predesigned ? "bg-zinc-200" : "border border-zinc-400 bg-white"
          }`}
          style={{ flex: fr }}
        >
          {predesigned ? (
            <div className="flex h-full flex-col gap-0.5 p-0.5">
              <div className="h-2 rounded-[1px] bg-zinc-300" />
              <div className="h-0.5 rounded bg-zinc-300" />
              <div className="h-0.5 w-2/3 rounded bg-zinc-300" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TableThumb({
  style,
  theme,
}: {
  style: MoaTableStyle;
  theme: MoaTableTheme;
}) {
  const c = TABLE_THEME_COLORS[theme];
  return (
    <div
      className="grid h-9 w-11 grid-cols-3 gap-px overflow-hidden rounded-sm border"
      style={{ borderColor: c.border, background: c.border }}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 3);
        let bg = "#fff";
        if (style === "outline") bg = "#fff";
        else if (style === "header") bg = row === 0 ? c.header : "#fff";
        else bg = row === 0 ? c.header : row % 2 === 0 ? c.row : c.alt;
        return <div key={i} style={{ background: bg }} />;
      })}
    </div>
  );
}

function ChartThumb({ kind }: { kind: string }) {
  if (kind === "pie" || kind === "donut") {
    return (
      <svg viewBox="0 0 40 40" className="h-9 w-9">
        <circle cx="20" cy="20" r="16" fill="#3b82f6" />
        <path d="M20 20 L20 4 A16 16 0 0 1 34 28 Z" fill="#a855f7" />
        <path d="M20 20 L34 28 A16 16 0 0 1 8 30 Z" fill="#f59e0b" />
        {kind === "donut" ? <circle cx="20" cy="20" r="7" fill="white" /> : null}
      </svg>
    );
  }
  if (kind === "row") {
    return (
      <div className="flex h-9 w-11 flex-col justify-center gap-1">
        {[70, 45, 85].map((w, i) => (
          <div
            key={i}
            className="h-1.5 rounded-sm bg-sky-500"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  }
  if (kind === "line" || kind === "multiline") {
    return (
      <svg viewBox="0 0 44 36" className="h-9 w-11">
        <polyline
          points="2,28 12,18 22,22 32,8 42,14"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        />
        {kind === "multiline" ? (
          <polyline
            points="2,30 12,24 22,16 32,20 42,10"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
          />
        ) : null}
      </svg>
    );
  }
  if (kind === "area" || kind === "stacked") {
    return (
      <svg viewBox="0 0 44 36" className="h-9 w-11">
        <polygon points="2,34 2,24 14,16 26,20 42,8 42,34" fill="#93c5fd" />
        {kind === "stacked" ? (
          <polygon points="2,34 2,28 14,22 26,26 42,16 42,34" fill="#c4b5fd" />
        ) : null}
      </svg>
    );
  }
  // bar
  return (
    <div className="flex h-9 w-11 items-end justify-between gap-0.5 px-0.5">
      {[40, 70, 50, 85].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-emerald-600"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export const COLUMNS_SECTIONS: MoaElementSection[] = [
  {
    id: "basic",
    label: "Basic columns",
    variants: [
      {
        id: "basic-3",
        label: "3 equal",
        hint: "Three equal columns",
        icon: <ColumnThumb layout="equal-3" />,
        options: { columnLayout: "equal-3", columnPreset: "basic" },
      },
      {
        id: "basic-left",
        label: "1/3 + 2/3",
        hint: "Narrow left, wide right",
        icon: <ColumnThumb layout="left-narrow" />,
        options: { columnLayout: "left-narrow", columnPreset: "basic" },
      },
      {
        id: "basic-4",
        label: "4 equal",
        hint: "Four equal columns",
        icon: <ColumnThumb layout="equal-4" />,
        options: { columnLayout: "equal-4", columnPreset: "basic" },
      },
      {
        id: "basic-2",
        label: "2 equal",
        hint: "Two equal columns",
        icon: <ColumnThumb layout="equal-2" />,
        options: { columnLayout: "equal-2", columnPreset: "basic" },
      },
    ],
  },
  {
    id: "styled",
    label: "Styled columns",
    variants: [
      {
        id: "styled-2",
        label: "2 styled",
        hint: "Two columns with accent border",
        icon: <ColumnThumb layout="equal-2" styled />,
        options: {
          columnLayout: "equal-2",
          columnPreset: "styled",
          stroke: "#7c3aed",
        },
      },
      {
        id: "styled-left",
        label: "Split styled",
        hint: "Narrow / wide with accent",
        icon: <ColumnThumb layout="left-narrow" styled />,
        options: {
          columnLayout: "left-narrow",
          columnPreset: "styled",
          stroke: "#ea580c",
        },
      },
      {
        id: "styled-3",
        label: "3 styled",
        hint: "Three accent columns",
        icon: <ColumnThumb layout="equal-3" styled />,
        options: {
          columnLayout: "equal-3",
          columnPreset: "styled",
          stroke: "#059669",
        },
      },
    ],
  },
  {
    id: "predesigned",
    label: "Pre-designed columns",
    variants: [
      {
        id: "pre-2-cards",
        label: "2 cards",
        hint: "Image + text columns",
        icon: <ColumnThumb layout="equal-2" predesigned />,
        options: { columnLayout: "equal-2", columnPreset: "predesigned" },
      },
      {
        id: "pre-media",
        label: "Media + text",
        hint: "Side image with text",
        icon: <ColumnThumb layout="left-media" predesigned />,
        options: { columnLayout: "left-media", columnPreset: "predesigned" },
      },
      {
        id: "pre-3-cards",
        label: "3 cards",
        hint: "Three content cards",
        icon: <ColumnThumb layout="equal-3" predesigned />,
        options: { columnLayout: "equal-3", columnPreset: "predesigned" },
      },
    ],
  },
];

const TABLE_THEMES: MoaTableTheme[] = ["gray", "red", "orange", "blue", "purple"];
const TABLE_STYLES: Array<{ style: MoaTableStyle; label: string }> = [
  { style: "outline", label: "Outline" },
  { style: "header", label: "Header" },
  { style: "filled", label: "Filled" },
];

export const TABLES_SECTIONS: MoaElementSection[] = [
  {
    id: "styles",
    label: "Table styles",
    variants: TABLE_THEMES.flatMap((theme) =>
      TABLE_STYLES.map(({ style, label }) => ({
        id: `${theme}-${style}`,
        label: `${theme} ${label}`,
        hint: `${label} table · ${theme}`,
        icon: <TableThumb style={style} theme={theme} />,
        options: {
          tableRows: 4,
          tableCols: 3,
          tableStyle: style,
          tableTheme: theme,
        },
      })),
    ),
  },
];

export const CHARTS_SECTIONS: MoaElementSection[] = [
  {
    id: "bar",
    label: "Bar charts",
    variants: [
      {
        id: "bar",
        label: "Bar",
        hint: "Vertical bars",
        icon: <ChartThumb kind="bar" />,
        options: { chartStyle: "bar", chartBars: 4 },
      },
      {
        id: "row",
        label: "Row",
        hint: "Horizontal bars",
        icon: <ChartThumb kind="row" />,
        options: { chartStyle: "row", chartBars: 4 },
      },
    ],
  },
  {
    id: "line",
    label: "Line charts",
    variants: [
      {
        id: "line",
        label: "Line",
        hint: "Single line",
        icon: <ChartThumb kind="line" />,
        options: { chartStyle: "line", chartBars: 5 },
      },
      {
        id: "multiline",
        label: "Multi-line",
        hint: "Two series",
        icon: <ChartThumb kind="multiline" />,
        options: { chartStyle: "multiline", chartBars: 5 },
      },
    ],
  },
  {
    id: "pie",
    label: "Pie and donut",
    variants: [
      {
        id: "pie",
        label: "Pie",
        hint: "Pie chart",
        icon: <ChartThumb kind="pie" />,
        options: { chartStyle: "pie", chartBars: 4 },
      },
      {
        id: "donut",
        label: "Donut",
        hint: "Donut chart",
        icon: <ChartThumb kind="donut" />,
        options: { chartStyle: "donut", chartBars: 4 },
      },
    ],
  },
  {
    id: "area",
    label: "Area charts",
    variants: [
      {
        id: "area",
        label: "Area",
        hint: "Filled area",
        icon: <ChartThumb kind="area" />,
        options: { chartStyle: "area", chartBars: 5 },
      },
      {
        id: "stacked",
        label: "Stacked",
        hint: "Stacked areas",
        icon: <ChartThumb kind="stacked" />,
        options: { chartStyle: "stacked", chartBars: 5 },
      },
    ],
  },
];
