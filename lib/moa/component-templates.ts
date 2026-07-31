/** Pre-combined MOA component packs + user-saved templates (Edit Mode). */

import {
  createMoaConfigFieldElement,
  createMoaDesignElement,
  type MoaDesignElement,
  type MoaHeaderField,
  type MoaPageSizeId,
  type MoaWatermarkSettings,
} from "@/app/(pages)/settings/_components/moa-design-palette";
import type { MoaDocsMargins } from "@/app/(pages)/settings/_components/moa-design/docs-ruler";
import { cloneMoaDesignBlob, type MoaDesignBlob } from "./design-blob";
import {
  createBuyBackDesign,
  createDefaultMoaDesign,
  createGeneralMoaDesign,
  createPawnRenewalDesign,
  createPrivacyPolicyDesign,
  createRedemptionDesign,
  createTermsOfServiceDesign,
} from "./default-design";

export type MoaComponentTemplateKind = "pack" | "full";

export type MoaComponentTemplate = {
  id: string;
  name: string;
  description: string;
  kind: MoaComponentTemplateKind;
  /** Built-in packs cannot be deleted; can be duplicated to edit. */
  builtin: boolean;
  updatedAt: string;
  elements: MoaDesignElement[];
  pageSizeId?: MoaPageSizeId;
  pageCount?: number;
  watermark?: MoaWatermarkSettings;
  margins?: MoaDocsMargins;
};

const STORAGE_KEY = "moa-component-templates-v1";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function field(
  key: string,
  label: string,
  x: number,
  y: number,
  width = 340,
  idPrefix = "pack",
): MoaDesignElement {
  const el = createMoaConfigFieldElement({ key, label }, x, y, { fontSize: 11 });
  el.id = `${idPrefix}-${key}`;
  el.width = width;
  el.height = 26;
  el.pageIndex = 0;
  return el;
}

function shopHeaderBlock(idPrefix: string): MoaDesignElement[] {
  const headerFields: MoaHeaderField[] = [
    {
      id: `${idPrefix}-hf-shop`,
      key: "shopName",
      x: 12,
      y: 10,
      width: 680,
      height: 26,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "bold",
    },
    {
      id: `${idPrefix}-hf-address`,
      key: "shopAddress",
      x: 12,
      y: 38,
      width: 680,
      height: 20,
      textAlign: "center",
      fontSize: 10,
    },
    {
      id: `${idPrefix}-hf-phone`,
      key: "phoneNumber",
      x: 12,
      y: 58,
      width: 330,
      height: 18,
      textAlign: "center",
      fontSize: 10,
    },
    {
      id: `${idPrefix}-hf-email`,
      key: "email",
      x: 360,
      y: 58,
      width: 330,
      height: 18,
      textAlign: "center",
      fontSize: 10,
    },
  ];

  const header = createMoaDesignElement("header", 24, 16, {
    pageIndex: 0,
    textAlign: "center",
    fontSize: 14,
  });
  header.id = `${idPrefix}-header`;
  header.width = 768;
  header.height = 84;
  header.fill = "transparent";
  header.stroke = "#d4d4d8";
  header.headerFields = headerFields;
  header.text = "";
  return [header];
}

function customerTicketBlock(idPrefix: string, y0 = 0): MoaDesignElement[] {
  return [
    field("unitCode", "Unit code", 24, y0, 360, idPrefix),
    field("purchasedDate", "Purchased date", 400, y0, 360, idPrefix),
    field("idPresented", "ID presented", 24, y0 + 34, 360, idPrefix),
    field("maturityDate", "Maturity date", 400, y0 + 34, 360, idPrefix),
    field("customerName", "Customer name", 24, y0 + 74, 736, idPrefix),
    field("customerAddress", "Customer address", 24, y0 + 108, 736, idPrefix),
    field("contactNo", "Contact no.", 24, y0 + 142, 360, idPrefix),
    field("expiryDate", "Expiry / grace", 400, y0 + 142, 360, idPrefix),
  ];
}

function financialBlock(idPrefix: string, y0 = 0): MoaDesignElement[] {
  return [
    field("amount", "Amount", 24, y0, 360, idPrefix),
    field("storageFee", "Storage fee", 400, y0, 360, idPrefix),
    field("parkingFee", "Parking fee", 24, y0 + 34, 360, idPrefix),
    field("netProceeds", "Net proceeds", 400, y0 + 34, 360, idPrefix),
  ];
}

function unitBlock(idPrefix: string, y0 = 0): MoaDesignElement[] {
  return [
    field("brandModel", "Brand and model", 24, y0, 736, idPrefix),
    field("serialNo", "Serial no.", 24, y0 + 34, 360, idPrefix),
    field("memory", "Memory", 400, y0 + 34, 360, idPrefix),
    field("itemsIncluded", "Items included", 24, y0 + 68, 360, idPrefix),
    field("condition", "Condition", 400, y0 + 68, 360, idPrefix),
    field("remarks", "Remarks", 24, y0 + 102, 736, idPrefix),
  ];
}

function titleBlock(idPrefix: string, y = 112): MoaDesignElement[] {
  const title = createMoaDesignElement("text", 24, y, {
    pageIndex: 0,
    textAlign: "center",
    fontSize: 13,
  });
  title.id = `${idPrefix}-title`;
  title.width = 768;
  title.height = 28;
  title.fontWeight = "bold";
  title.text = "MEMORANDUM OF AGREEMENT SLIP";
  return [title];
}

function sellerBlock(idPrefix: string, y0 = 0): MoaDesignElement[] {
  return [field("sellerName", "Seller name", 24, y0, 360, idPrefix)];
}

function cloneElementsFresh(elements: MoaDesignElement[]): MoaDesignElement[] {
  const stamp = Date.now().toString(36);
  return elements.map((el, index) => ({
    ...el,
    id: `inst-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    headerFields: (el.headerFields ?? []).map((fieldItem, fi) => ({
      ...fieldItem,
      id: `inst-${stamp}-hf-${index}-${fi}`,
    })),
    tableData: el.tableData?.map((row) => [...row]),
    chartValues: el.chartValues ? [...el.chartValues] : undefined,
    chartValuesB: el.chartValuesB ? [...el.chartValuesB] : undefined,
  }));
}

/** Shift pack so it sits below existing content on the target page. */
export function placePackOnPage(
  packElements: MoaDesignElement[],
  existing: MoaDesignElement[],
  pageIndex: number,
): MoaDesignElement[] {
  const pageEls = existing.filter((el) => (el.pageIndex ?? 0) === pageIndex);
  const maxBottom = pageEls.reduce(
    (max, el) => Math.max(max, el.y + el.height),
    0,
  );
  const packMinY = packElements.reduce(
    (min, el) => Math.min(min, el.y),
    packElements[0]?.y ?? 0,
  );
  const gap = pageEls.length > 0 ? 16 : 0;
  const offsetY = Math.max(0, maxBottom + gap - packMinY);

  return cloneElementsFresh(packElements).map((el) => ({
    ...el,
    pageIndex,
    y: el.y + offsetY,
    headerFields: (el.headerFields ?? []).map((f) => ({
      ...f,
      // header fields are relative inside the header box — keep local coords
    })),
  }));
}

function builtin(
  id: string,
  name: string,
  description: string,
  kind: MoaComponentTemplateKind,
  elements: MoaDesignElement[],
  extra?: Partial<MoaComponentTemplate>,
): MoaComponentTemplate {
  return {
    id,
    name,
    description,
    kind,
    builtin: true,
    updatedAt: "builtin",
    elements,
    ...extra,
  };
}

export function getBuiltinMoaComponentTemplates(): MoaComponentTemplate[] {
  const starter = createDefaultMoaDesign();
  const generalMoa = createGeneralMoaDesign();
  const redemption = createRedemptionDesign();
  const buyBack = createBuyBackDesign();
  const renewal = createPawnRenewalDesign();
  const tos = createTermsOfServiceDesign();
  const privacy = createPrivacyPolicyDesign();

  const asFull = (
    id: string,
    name: string,
    description: string,
    design: MoaDesignBlob,
  ) =>
    builtin(id, name, description, "full", design.elements, {
      pageSizeId: design.pageSizeId,
      pageCount: design.pageCount,
      watermark: design.watermark,
      margins: design.margins,
    });

  return [
    asFull(
      "builtin-full-starter",
      "Full starter slip",
      "Complete MOA layout — replaces the whole canvas",
      starter,
    ),
    asFull(
      "builtin-full-general-moa",
      "General MOA / Pawn Loan",
      "QUICKPAWN Agreements PDF — pawn loan agreement with terms & signatures",
      generalMoa,
    ),
    asFull(
      "builtin-full-redemption",
      "Redemption Slip",
      "QUICKPAWN Agreements PDF — redemption form with payment breakdown",
      redemption,
    ),
    asFull(
      "builtin-full-buyback",
      "Buy Back Slip",
      "QUICKPAWN Agreements PDF — buy back transaction slip",
      buyBack,
    ),
    asFull(
      "builtin-full-renewal",
      "Pawn Renewal Slip",
      "QUICKPAWN Agreements PDF — renewal payment & new loan period",
      renewal,
    ),
    asFull(
      "builtin-full-tos",
      "Terms of Service",
      "QUICKPAWN Agreements PDF — platform Terms of Service (pages 2–9)",
      tos,
    ),
    asFull(
      "builtin-full-privacy",
      "Privacy Policy",
      "QUICKPAWN Agreements PDF — Privacy Policy (pages 11–14)",
      privacy,
    ),
    builtin(
      "builtin-shop-header",
      "Shop header block",
      "Branch name, address, phone, email header",
      "pack",
      shopHeaderBlock("bh"),
    ),
    builtin(
      "builtin-title",
      "MOA title",
      "Centered memorandum title text",
      "pack",
      titleBlock("bt", 0),
    ),
    builtin(
      "builtin-customer",
      "Customer & ticket",
      "Unit code, dates, name, address, contact",
      "pack",
      customerTicketBlock("bc", 0),
    ),
    builtin(
      "builtin-financial",
      "Financial details",
      "Amount, storage, parking, net proceeds",
      "pack",
      financialBlock("bf", 0),
    ),
    builtin(
      "builtin-unit",
      "Unit description",
      "Brand, serial, memory, condition, remarks",
      "pack",
      unitBlock("bu", 0),
    ),
    builtin(
      "builtin-seller",
      "Seller line",
      "Seller name field",
      "pack",
      sellerBlock("bs", 0),
    ),
  ];
}

function normalizeCustom(raw: unknown): MoaComponentTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<MoaComponentTemplate>;
  if (!data.id || !data.name || !Array.isArray(data.elements)) return null;
  return {
    id: String(data.id),
    name: String(data.name).trim() || "Untitled template",
    description: String(data.description ?? ""),
    kind: data.kind === "full" ? "full" : "pack",
    builtin: false,
    updatedAt: data.updatedAt || new Date().toISOString(),
    elements: data.elements as MoaDesignElement[],
    pageSizeId: data.pageSizeId,
    pageCount: data.pageCount,
    watermark: data.watermark,
    margins: data.margins,
  };
}

export function loadCustomMoaComponentTemplates(): MoaComponentTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeCustom)
      .filter((item): item is MoaComponentTemplate => Boolean(item));
  } catch {
    return [];
  }
}

export function saveCustomMoaComponentTemplates(
  templates: MoaComponentTemplate[],
): void {
  if (typeof window === "undefined") return;
  const customOnly = templates.filter((t) => !t.builtin);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
}

export function listMoaComponentTemplates(): MoaComponentTemplate[] {
  return [...getBuiltinMoaComponentTemplates(), ...loadCustomMoaComponentTemplates()];
}

export function createTemplateFromDesign(
  name: string,
  design: MoaDesignBlob,
  kind: MoaComponentTemplateKind = "full",
  description = "",
): MoaComponentTemplate {
  const cloned = cloneMoaDesignBlob(design);
  return {
    id: uid("custom"),
    name: name.trim() || "My template",
    description: description.trim(),
    kind,
    builtin: false,
    updatedAt: new Date().toISOString(),
    elements: cloned.elements,
    pageSizeId: cloned.pageSizeId,
    pageCount: cloned.pageCount,
    watermark: cloned.watermark,
    margins: cloned.margins,
  };
}

export function createTemplateFromElements(
  name: string,
  elements: MoaDesignElement[],
  description = "",
): MoaComponentTemplate {
  return {
    id: uid("custom"),
    name: name.trim() || "My pack",
    description: description.trim(),
    kind: "pack",
    builtin: false,
    updatedAt: new Date().toISOString(),
    elements: cloneElementsFresh(elements).map((el) => ({
      ...el,
      // normalize pack to top of pack coords
    })),
  };
}

export function renameMoaComponentTemplate(
  templates: MoaComponentTemplate[],
  id: string,
  name: string,
): MoaComponentTemplate[] {
  const nextName = name.trim();
  if (!nextName) return templates;
  return templates.map((t) =>
    t.id === id && !t.builtin
      ? { ...t, name: nextName, updatedAt: new Date().toISOString() }
      : t,
  );
}

export function deleteMoaComponentTemplate(
  templates: MoaComponentTemplate[],
  id: string,
): MoaComponentTemplate[] {
  return templates.filter((t) => t.id !== id || t.builtin);
}

export function updateCustomTemplateFromDesign(
  templates: MoaComponentTemplate[],
  id: string,
  design: MoaDesignBlob,
): MoaComponentTemplate[] {
  const cloned = cloneMoaDesignBlob(design);
  return templates.map((t) =>
    t.id === id && !t.builtin
      ? {
          ...t,
          kind: "full" as const,
          elements: cloned.elements,
          pageSizeId: cloned.pageSizeId,
          pageCount: cloned.pageCount,
          watermark: cloned.watermark,
          margins: cloned.margins,
          updatedAt: new Date().toISOString(),
        }
      : t,
  );
}

export function templateToDesignBlob(
  template: MoaComponentTemplate,
): MoaDesignBlob {
  const base = createDefaultMoaDesign();
  return {
    pageSizeId: template.pageSizeId ?? base.pageSizeId,
    pageCount: template.pageCount ?? 1,
    watermark: template.watermark
      ? {
          enabled: template.watermark.enabled,
          items: (template.watermark.items ?? []).map((item) => ({ ...item })),
        }
      : base.watermark,
    margins: template.margins ? { ...template.margins } : base.margins,
    elements: cloneElementsFresh(template.elements),
  };
}
