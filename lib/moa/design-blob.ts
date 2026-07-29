/** Shared MOA design blob types (API + Settings + Employee print). */

import {
  DEFAULT_MOA_WATERMARK,
  createMoaWatermarkItem,
  type MoaDesignElement,
  type MoaPageSizeId,
  type MoaWatermarkSettings,
} from "@/app/(pages)/settings/_components/moa-design-palette";
import {
  defaultMarginsForPage,
  type MoaDocsMargins,
} from "@/app/(pages)/settings/_components/moa-design/docs-ruler";

export type MoaDesignBlob = {
  elements: MoaDesignElement[];
  pageSizeId: MoaPageSizeId;
  pageCount: number;
  watermark: MoaWatermarkSettings;
  margins: MoaDocsMargins;
};

export function hasMoaDesign(design?: MoaDesignBlob | null): boolean {
  return Boolean(design && Array.isArray(design.elements) && design.elements.length > 0);
}

export function cloneMoaDesignBlob(design: MoaDesignBlob): MoaDesignBlob {
  return {
    pageSizeId: design.pageSizeId,
    pageCount: design.pageCount,
    watermark: {
      enabled: design.watermark.enabled,
      items: (design.watermark.items ?? []).map((item) => ({ ...item })),
    },
    margins: { ...design.margins },
    elements: design.elements.map((el) => ({
      ...el,
      headerFields: (el.headerFields ?? []).map((field) => ({ ...field })),
      tableData: el.tableData?.map((row) => [...row]),
      chartValues: el.chartValues ? [...el.chartValues] : undefined,
      chartValuesB: el.chartValuesB ? [...el.chartValuesB] : undefined,
    })),
  };
}

/** Accept API / local payloads; migrate legacy watermark shape. */
export function normalizeMoaDesignBlob(raw: unknown): MoaDesignBlob | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<MoaDesignBlob> & {
    watermark?: MoaWatermarkSettings & { text?: string; opacity?: number; rotation?: number };
  };
  if (!Array.isArray(data.elements)) return null;

  const pageSizeId =
    data.pageSizeId === "letter" || data.pageSizeId === "a4" || data.pageSizeId === "long"
      ? data.pageSizeId
      : "long";

  let watermark: MoaWatermarkSettings;
  if (data.watermark && Array.isArray(data.watermark.items)) {
    watermark = {
      enabled: Boolean(data.watermark.enabled),
      items: data.watermark.items.map((item) => createMoaWatermarkItem(item)),
    };
  } else if (data.watermark && typeof (data.watermark as { text?: string }).text === "string") {
    const legacy = data.watermark as {
      enabled?: boolean;
      text: string;
      opacity?: number;
      rotation?: number;
    };
    watermark = {
      enabled: Boolean(legacy.enabled),
      items: [
        createMoaWatermarkItem({
          text: legacy.text,
          opacity: legacy.opacity,
          rotation: legacy.rotation,
        }),
      ],
    };
  } else {
    watermark = {
      enabled: DEFAULT_MOA_WATERMARK.enabled,
      items: DEFAULT_MOA_WATERMARK.items.map((item) => ({ ...item })),
    };
  }

  const margins =
    data.margins &&
    typeof data.margins.left === "number" &&
    typeof data.margins.right === "number"
      ? data.margins
      : defaultMarginsForPage(pageSizeId);

  return {
    elements: data.elements as MoaDesignElement[],
    pageSizeId,
    pageCount: Math.max(1, Math.min(10, Number(data.pageCount) || 1)),
    watermark,
    margins,
  };
}
