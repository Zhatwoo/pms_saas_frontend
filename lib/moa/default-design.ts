/** Default drag-and-drop MOA canvas template (Settings Edit Mode seed). */

import {
  DEFAULT_MOA_WATERMARK,
  createMoaConfigFieldElement,
  createMoaDesignElement,
  createMoaWatermarkItem,
  type MoaDesignElement,
  type MoaHeaderField,
} from "@/app/(pages)/settings/_components/moa-design-palette";
import { defaultMarginsForPage } from "@/app/(pages)/settings/_components/moa-design/docs-ruler";
import type { MoaDesignBlob } from "./design-blob";

function field(
  key: string,
  label: string,
  x: number,
  y: number,
  width = 340,
): MoaDesignElement {
  const el = createMoaConfigFieldElement({ key, label }, x, y, { fontSize: 11 });
  el.id = `tpl-${key}`;
  el.width = width;
  el.height = 26;
  el.pageIndex = 0;
  return el;
}

function headerFields(): MoaHeaderField[] {
  return [
    {
      id: "tpl-hf-shop",
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
      id: "tpl-hf-address",
      key: "shopAddress",
      x: 12,
      y: 38,
      width: 680,
      height: 20,
      textAlign: "center",
      fontSize: 10,
    },
    {
      id: "tpl-hf-phone",
      key: "phoneNumber",
      x: 12,
      y: 58,
      width: 330,
      height: 18,
      textAlign: "center",
      fontSize: 10,
    },
    {
      id: "tpl-hf-email",
      key: "email",
      x: 360,
      y: 58,
      width: 330,
      height: 18,
      textAlign: "center",
      fontSize: 10,
    },
  ];
}

/** Clean starter layout: header + customer/ticket + financial + unit fields. */
export function createDefaultMoaDesign(): MoaDesignBlob {
  const header = createMoaDesignElement("header", 24, 16, {
    pageIndex: 0,
    textAlign: "center",
    fontSize: 14,
  });
  header.id = "tpl-header";
  header.width = 768;
  header.height = 84;
  header.fill = "transparent";
  header.stroke = "#d4d4d8";
  header.headerFields = headerFields();
  header.text = "";

  const title = createMoaDesignElement("text", 24, 112, {
    pageIndex: 0,
    textAlign: "center",
    fontSize: 13,
  });
  title.id = "tpl-title";
  title.width = 768;
  title.height = 28;
  title.fontWeight = "bold";
  title.text = "MEMORANDUM OF AGREEMENT SLIP";

  const customerFields = [
    field("unitCode", "Unit code", 24, 156, 360),
    field("purchasedDate", "Purchased date", 400, 156, 360),
    field("idPresented", "ID presented", 24, 190, 360),
    field("maturityDate", "Maturity date", 400, 190, 360),
    field("customerName", "Customer name", 24, 230, 736),
    field("customerAddress", "Customer address", 24, 264, 736),
    field("contactNo", "Contact no.", 24, 298, 360),
    field("expiryDate", "Expiry / grace", 400, 298, 360),
  ];

  const moneyFields = [
    field("amount", "Amount", 24, 350, 360),
    field("storageFee", "Storage fee", 400, 350, 360),
    field("parkingFee", "Parking fee", 24, 384, 360),
    field("netProceeds", "Net proceeds", 400, 384, 360),
  ];

  const unitFields = [
    field("brandModel", "Brand and model", 24, 430, 736),
    field("serialNo", "Serial no.", 24, 464, 360),
    field("memory", "Memory", 400, 464, 360),
    field("itemsIncluded", "Items included", 24, 498, 360),
    field("condition", "Condition", 400, 498, 360),
    field("remarks", "Remarks", 24, 532, 736),
  ];

  const seller = field("sellerName", "Seller name", 24, 580, 360);

  return {
    pageSizeId: "long",
    pageCount: 1,
    watermark: {
      enabled: false,
      items: [
        createMoaWatermarkItem({
          id: "tpl-wm-1",
          text: "ORIGINAL",
          opacity: 0.1,
          rotation: -28,
          xPercent: 50,
          yPercent: 50,
        }),
      ],
    },
    margins: defaultMarginsForPage("long"),
    elements: [header, title, ...customerFields, ...moneyFields, ...unitFields, seller],
  };
}

export function emptyMoaDesignFallback(): MoaDesignBlob {
  return {
    pageSizeId: "long",
    pageCount: 1,
    watermark: { ...DEFAULT_MOA_WATERMARK, items: DEFAULT_MOA_WATERMARK.items.map((i) => ({ ...i })) },
    margins: defaultMarginsForPage("long"),
    elements: [],
  };
}
