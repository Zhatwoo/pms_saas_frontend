/** MOA canvas templates — faithful to the QUICKPAWN Agreements PDF layout. */

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

/* ── Shared element builders ────────────────────────────────────────────── */

/** Labeled form field ("Label: ______"). Bound keys auto-fill from New Pawn. */
function cfield(
  prefix: string,
  key: string,
  label: string,
  x: number,
  y: number,
  width = 360,
  pageIndex = 0,
): MoaDesignElement {
  const el = createMoaConfigFieldElement({ key, label }, x, y, { fontSize: 10 });
  el.id = `${prefix}-${key}-${Math.round(x)}-${Math.round(y)}`;
  el.width = width;
  el.height = 28;
  el.pageIndex = pageIndex;
  return el;
}

/** Centered bold document title (supports multi-line). */
function title(
  prefix: string,
  id: string,
  text: string,
  y: number,
  pageIndex = 0,
  fontSize = 20,
  height = 30,
): MoaDesignElement {
  const el = createMoaDesignElement("text", 24, y, {
    pageIndex,
    textAlign: "center",
    fontSize,
  });
  el.id = `${prefix}-${id}`;
  el.width = 736;
  el.height = height;
  el.fontWeight = "bold";
  el.text = text;
  return el;
}

/** Bold section heading (roman numeral clauses / left labels). */
function heading(
  prefix: string,
  id: string,
  text: string,
  y: number,
  pageIndex = 0,
  fontSize = 11,
  align: "left" | "center" = "left",
): MoaDesignElement {
  const el = createMoaDesignElement("text", 24, y, {
    pageIndex,
    textAlign: align,
    fontSize,
  });
  el.id = `${prefix}-${id}`;
  el.width = 736;
  el.height = 22;
  el.fontWeight = "bold";
  el.text = text;
  return el;
}

/** Paragraph / legal body copy. */
function para(
  prefix: string,
  id: string,
  text: string,
  y: number,
  height: number,
  pageIndex = 0,
  x = 24,
  width = 736,
  fontSize = 10,
): MoaDesignElement {
  const el = createMoaDesignElement("body", x, y, { pageIndex, fontSize });
  el.id = `${prefix}-${id}`;
  el.width = width;
  el.height = height;
  el.text = text;
  return el;
}

/** Payment breakdown table (DESCRIPTION | AMOUNT) with a TOTAL row. */
function paymentTable(
  prefix: string,
  id: string,
  rows: string[],
  totalLabel: string,
  y: number,
  pageIndex = 0,
): MoaDesignElement {
  const data = [["DESCRIPTION", "AMOUNT"], ...rows.map((r) => [r, ""]), [totalLabel, ""]];
  const el = createMoaDesignElement("table", 24, y, {
    pageIndex,
    fontSize: 10,
    tableRows: data.length,
    tableCols: 2,
  });
  el.id = `${prefix}-${id}`;
  el.width = 736;
  el.height = 30 + data.length * 26;
  el.tableData = data;
  el.tableStyle = "header";
  el.tableTheme = "green";
  return el;
}

function headerFields(prefix: string): MoaHeaderField[] {
  return [
    {
      id: `${prefix}-hf-shop`,
      key: "shopName",
      x: 96,
      y: 14,
      width: 544,
      height: 26,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "bold",
    },
    {
      id: `${prefix}-hf-address`,
      key: "shopAddress",
      x: 96,
      y: 42,
      width: 544,
      height: 18,
      textAlign: "center",
      fontSize: 10,
    },
    {
      id: `${prefix}-hf-phone`,
      key: "phoneNumber",
      x: 96,
      y: 62,
      width: 262,
      height: 16,
      textAlign: "center",
      fontSize: 10,
    },
    {
      id: `${prefix}-hf-email`,
      key: "email",
      x: 378,
      y: 62,
      width: 262,
      height: 16,
      textAlign: "center",
      fontSize: 10,
    },
  ];
}

/** Logo image + shop name/address/contact header block. */
function shopHeader(prefix: string, pageIndex = 0): MoaDesignElement[] {
  const header = createMoaDesignElement("header", 24, 12, {
    pageIndex,
    textAlign: "center",
    fontSize: 14,
  });
  header.id = `${prefix}-header`;
  header.width = 736;
  header.height = 92;
  header.fill = "transparent";
  header.stroke = "#d4d4d8";
  header.headerFields = headerFields(prefix);
  header.text = "";

  const logo = createMoaDesignElement("photo", 40, 24, { pageIndex });
  logo.id = `${prefix}-logo`;
  logo.width = 68;
  logo.height = 68;
  logo.imageSrc = "/PMS_logo.svg";
  logo.imageFit = "contain";

  return [header, logo];
}

/** Signature block: Customer, optional Pawnshop rep, optional witness.
 *  Name / Signature / Date are the same moaField row type so Edit and View match. */
function signatures(
  prefix: string,
  y: number,
  pageIndex: number,
  opts: { rep?: boolean; witness?: boolean } = {},
): MoaDesignElement[] {
  const block = (
    id: string,
    label: string,
    nameKey: string,
    x: number,
    top: number,
  ): MoaDesignElement[] => {
    const labelEl = para(prefix, `sig-${id}-label`, label, top, 18, pageIndex, x, 356, 10);
    labelEl.fontWeight = "bold";
    return [
      labelEl,
      cfield(prefix, nameKey, "Name", x, top + 22, 356, pageIndex),
      cfield(prefix, "signatureBlank", "Signature", x, top + 54, 356, pageIndex),
      cfield(prefix, "agreementDate", "Date", x, top + 86, 356, pageIndex),
    ];
  };

  const out: MoaDesignElement[] = [
    heading(prefix, "sig-title", "SIGNATURES", y, pageIndex, 11, "center"),
    ...block("customer", "CUSTOMER / PAWNER:", "customerName", 24, y + 28),
  ];
  if (opts.rep) {
    out.push(
      ...block(
        "rep",
        "AUTHORIZED REPRESENTATIVE (Pawnshop):",
        "processedBy",
        400,
        y + 28,
      ),
    );
  }
  if (opts.witness) {
    out.push(...block("witness", "WITNESS (Optional):", "witnessName", 24, y + 150));
  }
  return out;
}

function footer(prefix: string, y: number, pageIndex: number): MoaDesignElement {
  const el = para(
    prefix,
    "footer",
    "Generated via QuickPawn Pawnshop Management System, 2026.",
    y,
    18,
    pageIndex,
    24,
    736,
    9,
  );
  el.textAlign = "right";
  el.color = "#71717a";
  return el;
}

function baseBlob(
  pageCount: number,
  elements: MoaDesignElement[],
  withWatermark = false,
): MoaDesignBlob {
  return {
    pageSizeId: "long",
    pageCount,
    watermark: withWatermark
      ? {
          enabled: false,
          items: [
            createMoaWatermarkItem({
              id: "wm-1",
              text: "ORIGINAL",
              opacity: 0.1,
              rotation: -28,
              xPercent: 50,
              yPercent: 50,
            }),
          ],
        }
      : { enabled: false, items: [] },
    margins: defaultMarginsForPage("long"),
    elements,
  };
}

/* ── Starter (kept for Edit Mode seed) ──────────────────────────────────── */

export function createDefaultMoaDesign(): MoaDesignBlob {
  const p = "tpl";
  return baseBlob(
    1,
    [
      ...shopHeader(p),
      title(p, "title", "MEMORANDUM OF AGREEMENT SLIP", 116, 0, 15, 26),
      cfield(p, "unitCode", "Unit code / Ticket no.", 24, 156, 360),
      cfield(p, "purchasedDate", "Pawn date", 400, 156, 360),
      cfield(p, "customerName", "Customer name", 24, 190, 736),
      cfield(p, "customerAddress", "Customer address", 24, 224, 736),
      cfield(p, "contactNo", "Contact no.", 24, 258, 360),
      cfield(p, "idPresented", "ID presented", 400, 258, 360),
      cfield(p, "brandModel", "Brand and model", 24, 300, 736),
      cfield(p, "serialNo", "Serial no.", 24, 334, 360),
      cfield(p, "itemsIncluded", "Accessories", 400, 334, 360),
      cfield(p, "amount", "Loan amount", 24, 368, 360),
      cfield(p, "storageFee", "Interest / storage", 400, 368, 360),
      cfield(p, "maturityDate", "Maturity date", 24, 402, 360),
      cfield(p, "expiryDate", "Expiry date", 400, 402, 360),
      cfield(p, "netProceeds", "Total redemption", 24, 436, 360),
    ],
    true,
  );
}

export function emptyMoaDesignFallback(): MoaDesignBlob {
  return {
    pageSizeId: "long",
    pageCount: 1,
    watermark: {
      ...DEFAULT_MOA_WATERMARK,
      items: DEFAULT_MOA_WATERMARK.items.map((i) => ({ ...i })),
    },
    margins: defaultMarginsForPage("long"),
    elements: [],
  };
}

/* ── 1. General MOA / Pawn Loan Agreement (PDF pages 16–19) ─────────────── */
/** Packed for Legal (8.5×13) so page 1 fills the sheet instead of a large blank bottom. */

export function createGeneralMoaDesign(): MoaDesignBlob {
  const p = "moa";
  // Usable content height on Legal ≈ 1180px after margins — fill page 0 through VIII.
  const page0: MoaDesignElement[] = [
    ...shopHeader(p),
    title(p, "title", "MEMORANDUM OF AGREEMENT", 108, 0, 18, 26),
    heading(p, "subtitle", "PAWN LOAN AGREEMENT", 136, 0, 11),
    cfield(p, "agreementNo", "Agreement No.", 24, 160, 360),
    cfield(p, "agreementDate", "Date entered into", 400, 160, 360),
    para(
      p,
      "intro",
      'This Memorandum of Agreement ("Agreement") is entered into on the date stated above, by and between:',
      192,
      24,
    ),
    heading(p, "pawnshop-label", "PAWNSHOP", 220, 0, 11, "center"),
    cfield(p, "shopName", "Business Name", 24, 242, 736),
    cfield(p, "representedBy", "Represented by", 24, 272, 736),
    para(p, "pawnshop-note", 'Hereinafter referred to as the "Pawnshop";', 302, 16),
    heading(p, "and", "- and -", 320, 0, 11, "center"),
    heading(p, "customer-label", "CUSTOMER / PAWNER", 340, 0, 11, "center"),
    cfield(p, "customerName", "Full Name", 24, 362, 736),
    cfield(p, "customerAddress", "Address", 24, 392, 736),
    cfield(p, "contactNo", "Contact Number", 24, 422, 360),
    cfield(p, "idPresented", "Government ID Presented", 400, 422, 360),
    cfield(p, "idNumber", "ID Number", 24, 452, 360),
    para(
      p,
      "customer-note",
      'Hereinafter referred to as the "Customer." Both parties agree to the following terms and conditions:',
      482,
      26,
    ),
    heading(p, "s1", "I. PURPOSE", 512),
    para(
      p,
      "s1-body",
      "The Customer voluntarily pawns the item(s) described below as security for a loan granted by the Pawnshop under the terms of this Agreement.",
      532,
      28,
    ),
    heading(p, "s2", "II. DESCRIPTION OF PAWNED ITEM", 564),
    cfield(p, "pawnTicketNo", "Pawn Ticket No.", 24, 586, 360),
    cfield(p, "brandModel", "Item Description", 400, 586, 360),
    cfield(p, "brand", "Brand", 24, 616, 360),
    cfield(p, "model", "Model", 400, 616, 360),
    cfield(p, "serialNo", "Serial Number", 24, 646, 360),
    cfield(p, "itemsIncluded", "Accessories Included", 400, 646, 360),
    cfield(p, "condition", "Condition upon acceptance", 24, 676, 360),
    cfield(p, "appraisedValue", "Declared / Appraised Value (PHP)", 400, 676, 360),
    heading(p, "s3", "III. LOAN DETAILS", 710),
    cfield(p, "amount", "Loan Amount (PHP)", 24, 732, 360),
    cfield(p, "interestRate", "Interest Rate (% per)", 400, 732, 360),
    cfield(p, "storageFee", "Service Charges (PHP)", 24, 762, 360),
    cfield(p, "purchasedDate", "Date Pawned", 400, 762, 360),
    cfield(p, "maturityDate", "Maturity Date", 24, 792, 360),
    cfield(p, "expiryDate", "Expiry Date", 400, 792, 360),
    cfield(p, "netProceeds", "Total Amount for Redemption (PHP)", 24, 822, 736),
    heading(p, "s4", "IV. CUSTOMER DECLARATIONS", 856),
    para(
      p,
      "s4-body",
      "The Customer represents and warrants that: (a) the pawned item is legally owned by the Customer or the Customer has full authority to pawn it; (b) the item is free from any known legal claims, liens, or encumbrances; (c) all information provided is true, accurate, and complete; and (d) the Customer understands the loan amount, interest, fees, maturity date, and redemption terms.",
      876,
      52,
    ),
    heading(p, "s5", "V. REDEMPTION", 936),
    para(
      p,
      "s5-body",
      "The Customer may redeem the pawned item upon payment of the total amount due, including the principal loan, accrued interest, and any applicable charges, on or before the applicable redemption period allowed by the Pawnshop and applicable laws.",
      956,
      36,
    ),
    heading(p, "s6", "VI. RENEWAL", 1000),
    para(
      p,
      "s6-body",
      "Subject to the Pawnshop's policies and applicable laws, this loan may be renewed upon payment of the required interest, charges, or other applicable fees. Approval of any renewal shall remain at the sole discretion of the Pawnshop.",
      1020,
      36,
    ),
    heading(p, "s7", "VII. DEFAULT", 1064),
    para(
      p,
      "s7-body",
      "If the Customer fails to redeem or renew the pawned item within the applicable redemption period, the Pawnshop shall have the rights provided under applicable laws, rules, regulations, and the Pawnshop's policies.",
      1084,
      34,
    ),
    heading(p, "s8", "VIII. CUSTOMER RESPONSIBILITY", 1126),
    para(
      p,
      "s8-body",
      "The Customer shall immediately notify the Pawnshop of any correction regarding personal information provided under this Agreement, and acknowledges that the Pawnshop relied upon the information provided during this transaction.",
      1146,
      34,
    ),
  ];

  const page1: MoaDesignElement[] = [
    heading(p, "s9", "IX. DATA PRIVACY ACT", 24, 1),
    para(
      p,
      "s9-body",
      "The parties acknowledge that personal information collected in connection with this transaction shall be processed in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable laws. The Customer authorizes the Pawnshop to collect, record, store, and process personal information solely for purposes related to this pawn transaction, legal compliance, customer verification, record keeping, and fraud prevention.",
      46,
      64,
      1,
    ),
    heading(p, "s10", "X. GOVERNING LAW", 120, 1),
    para(
      p,
      "s10-body",
      "This Agreement shall be governed by the laws of the Republic of the Philippines.",
      142,
      22,
      1,
    ),
    heading(p, "s11", "XI. ENTIRE AGREEMENT", 174, 1),
    para(
      p,
      "s11-body",
      "This document constitutes the entire agreement between the parties relating to this pawn transaction unless otherwise required by applicable law. Any amendments must be made in writing and acknowledged by both parties.",
      196,
      40,
      1,
    ),
    ...signatures(p, 256, 1, { rep: true, witness: true }),
    footer(p, 560, 1),
  ];

  return baseBlob(2, [...page0, ...page1], true);
}

/* ── 2. Redemption Slip (PDF pages 21–23) ───────────────────────────────── */

export function createRedemptionDesign(): MoaDesignBlob {
  const p = "red";
  return baseBlob(1, [
    ...shopHeader(p),
    title(p, "title", "REDEMPTION SLIP", 112, 0, 20, 30),
    heading(p, "s1", "I. REDEMPTION DETAILS", 156),
    cfield(p, "redemptionSlipNo", "Redemption Slip No.", 24, 180, 360),
    cfield(p, "pawnTicketNo", "Pawn Ticket No.", 400, 180, 360),
    cfield(p, "purchasedDate", "Date Redeemed", 24, 214, 360),
    cfield(p, "processedBy", "Processed By", 400, 214, 360),
    heading(p, "s2", "II. CUSTOMER INFORMATION", 254),
    cfield(p, "customerName", "Customer Name", 24, 278, 736),
    cfield(p, "customerAddress", "Address", 24, 312, 736),
    cfield(p, "contactNo", "Contact Number", 24, 346, 360),
    cfield(p, "idPresented", "Government ID Presented", 400, 346, 360),
    heading(p, "s3", "III. PAWNED ITEM INFORMATION", 386),
    cfield(p, "brandModel", "Item Description", 24, 410, 736),
    cfield(p, "serialNo", "Serial Number", 24, 444, 360),
    cfield(p, "itemsIncluded", "Accessories Returned", 400, 444, 360),
    heading(p, "s4", "IV. PAYMENT DETAILS", 484),
    paymentTable(
      p,
      "paytable",
      ["Principal Loan Amount", "Accrued Interest", "Service Charges", "Other Charges"],
      "TOTAL AMOUNT PAID",
      508,
    ),
    para(
      p,
      "paymethod",
      "Payment Method:   [ ] Cash    [ ] Bank Transfer    [ ] GCash    [ ] Maya    [ ] Others: __________\n\nOfficial Receipt No.: _______________________________",
      690,
      50,
    ),
    heading(p, "s5", "V. ACKNOWLEDGEMENT OF REDEMPTION", 748),
    para(
      p,
      "ack",
      "I hereby acknowledge that I have fully redeemed the pawned item described above after paying all applicable obligations. I confirm that I have received the item in satisfactory condition together with its listed accessories, if any. Upon release of the item, this pawn transaction shall be considered fully settled and completed, subject to applicable laws and the policies of the Pawnshop.",
      772,
      64,
    ),
    ...signatures(p, 846, 0, { rep: false, witness: false }),
    footer(p, 980, 0),
  ]);
}

/* ── 3. Buy Back Slip (PDF pages 25–27) ─────────────────────────────────── */

export function createBuyBackDesign(): MoaDesignBlob {
  const p = "bb";
  return baseBlob(1, [
    ...shopHeader(p),
    title(p, "title", "BUY BACK SLIP", 112, 0, 20, 30),
    heading(p, "s1", "I. BUY BACK TRANSACTION", 156),
    cfield(p, "buyBackSlipNo", "Buy Back Slip No.", 24, 180, 360),
    cfield(p, "purchasedDate", "Date", 400, 180, 360),
    cfield(p, "processedBy", "Processed By", 24, 214, 360),
    heading(p, "s2", "II. CUSTOMER INFORMATION", 254),
    cfield(p, "customerName", "Customer Name", 24, 278, 736),
    cfield(p, "customerAddress", "Address", 24, 312, 736),
    cfield(p, "contactNo", "Contact Number", 24, 346, 360),
    cfield(p, "idPresented", "Government ID Presented", 400, 346, 360),
    heading(p, "s3", "III. ITEM INFORMATION", 386),
    cfield(p, "pawnTicketNo", "Reference / Pawn Ticket No.", 24, 410, 360),
    cfield(p, "brandModel", "Item Description", 400, 410, 360),
    cfield(p, "brand", "Brand", 24, 444, 360),
    cfield(p, "model", "Model", 400, 444, 360),
    cfield(p, "serialNo", "Serial Number", 24, 478, 360),
    cfield(p, "condition", "Item Condition", 400, 478, 360),
    heading(p, "s4", "IV. BUY BACK DETAILS", 518),
    paymentTable(
      p,
      "paytable",
      ["Buy Back Price", "Processing Fee (if any)", "Other Charges"],
      "TOTAL AMOUNT PAID",
      542,
    ),
    heading(p, "ack-label", "CUSTOMER ACKNOWLEDGEMENT", 700),
    para(
      p,
      "ack",
      "I acknowledge that I have voluntarily purchased or bought back the item described above after paying the total amount due. I confirm that I have inspected the item and received it in satisfactory condition together with any listed accessories.",
      722,
      44,
    ),
    heading(p, "decl-label", "PAWNSHOP DECLARATION", 772),
    para(
      p,
      "decl",
      "The Pawnshop certifies that the above-described item has been released to the Customer upon full payment of the Buy Back amount and completion of the required verification procedures.",
      794,
      40,
    ),
    ...signatures(p, 844, 0, { rep: true, witness: false }),
    footer(p, 980, 0),
  ]);
}

/* ── 4. Pawn Renewal Slip (PDF pages 29–31) ─────────────────────────────── */

export function createPawnRenewalDesign(): MoaDesignBlob {
  const p = "rn";
  return baseBlob(1, [
    ...shopHeader(p),
    title(p, "title", "PAWN RENEWAL SLIP", 112, 0, 20, 30),
    heading(p, "s1", "I. RENEWAL SLIP", 156),
    cfield(p, "renewalSlipNo", "Renewal Slip No.", 24, 180, 360),
    cfield(p, "pawnTicketNo", "Pawn Ticket No.", 400, 180, 360),
    cfield(p, "transactionNo", "Transaction No.", 24, 214, 360),
    cfield(p, "purchasedDate", "Date & Time", 400, 214, 360),
    cfield(p, "processedBy", "Processed By", 24, 248, 360),
    heading(p, "s2", "II. CUSTOMER INFORMATION", 288),
    cfield(p, "customerName", "Customer Name", 24, 312, 736),
    cfield(p, "customerAddress", "Address", 24, 346, 736),
    cfield(p, "contactNo", "Contact Number", 24, 380, 360),
    cfield(p, "idPresented", "Government ID Presented", 400, 380, 360),
    heading(p, "s3", "III. PAWNED ITEM", 420),
    cfield(p, "brandModel", "Item Description", 24, 444, 736),
    heading(p, "s4", "IV. RENEWAL DETAILS", 484),
    paymentTable(
      p,
      "paytable",
      ["Original Loan Amount", "Interest Paid", "Service Fee", "Other Charges"],
      "TOTAL AMOUNT PAID",
      508,
    ),
    heading(p, "s5", "V. UPDATED LOAN PERIOD", 690),
    cfield(p, "purchasedDate", "Original Pawn Date", 24, 714, 360),
    cfield(p, "prevMaturityDate", "Previous Maturity Date", 400, 714, 360),
    cfield(p, "maturityDate", "New Maturity Date", 24, 748, 360),
    cfield(p, "expiryDate", "New Expiry Date", 400, 748, 360),
    heading(p, "ack-label", "CUSTOMER ACKNOWLEDGEMENT", 790),
    para(
      p,
      "ack",
      "I acknowledge that I have paid the required amount for the renewal of my pawn loan. I understand that the loan has been extended based on the new maturity and expiry dates stated above.",
      812,
      44,
    ),
    ...signatures(p, 866, 0, { rep: true, witness: false }),
    para(
      p,
      "note",
      "This Renewal Slip serves as proof that your pawn loan has been successfully renewed. Please keep this slip together with your Pawn Ticket for future transactions.",
      1010,
      40,
    ),
    footer(p, 1060, 0),
  ]);
}

/* ── 5. Terms of Service (PDF pages 2–9) ────────────────────────────────── */

export function createTermsOfServiceDesign(): MoaDesignBlob {
  const p = "tos";
  const page0: MoaDesignElement[] = [
    title(p, "title", "QUICKPAWN TERMS OF SERVICE", 24, 0, 16, 28),
    para(p, "eff", "EFFECTIVITY DATE / LAST UPDATED: August 2026", 60, 20),
    para(
      p,
      "intro",
      'These Terms of Service ("Terms") govern your access to and use of the QUICKPAWN Pawnshop Management System ("QUICKPAWN", "Service", or "Platform"), a software-as-a-service platform owned and operated by Inspire Next Global Inc. ("Inspire", "we", "us", or "our"). By accessing or using QUICKPAWN, you agree to comply with these Terms. If you are using QUICKPAWN on behalf of a business, you confirm that you have authority to do so. If you do not agree to these Terms, you must not use QUICKPAWN.',
      88,
      90,
    ),
    heading(p, "s1", "I. THE QUICKPAWN SERVICE", 186),
    para(
      p,
      "s1b",
      "QUICKPAWN is a cloud-based pawnshop management system designed to help businesses manage customer records, pawn transactions, pawned items, loans, payments, renewals, redemptions, and reports. Available features may depend on your subscription plan. QUICKPAWN does not provide legal, accounting, tax, or regulatory advice.",
      208,
      64,
    ),
    heading(p, "s2", "II. ACCOUNT REGISTRATION AND SECURITY", 278),
    para(
      p,
      "s2b",
      "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials, ensuring only authorized users access your account, keeping information updated, and all activities conducted through your account. Notify Inspire promptly of any suspected unauthorized access.",
      300,
      64,
    ),
    heading(p, "s3", "III. SUBSCRIPTION AND LICENSING", 370),
    para(
      p,
      "s3b",
      "Subject to these Terms and payment of applicable fees, Inspire grants you a limited, non-exclusive, non-transferable, non-sublicensable right to access and use QUICKPAWN during your active subscription. You do not receive ownership of QUICKPAWN or its intellectual property, and may not copy, modify, reverse engineer, resell, or use it to build a competing product.",
      392,
      64,
    ),
    heading(p, "s4", "IV. FEES AND PAYMENT", 462),
    para(
      p,
      "s4b",
      "You agree to pay the subscription fees applicable to your selected plan. Fees, billing frequency, user limits, and feature limits are stated in the applicable pricing plan, order, or invoice. Fees are non-refundable except where required by law, applicable taxes may apply, and failed or overdue payments may result in restricted or suspended access.",
      484,
      64,
    ),
    heading(p, "s5", "V. CUSTOMER DATA & PRIVACY", 554),
    para(
      p,
      "s5b",
      'You retain ownership of Customer Data entered into QUICKPAWN and are responsible for its accuracy, legality, and lawful collection. You authorize Inspire to host, store, process, and use Customer Data as reasonably necessary to provide the Service. Both parties agree to comply with the Data Privacy Act of 2012 (Republic Act No. 10173).',
      576,
      64,
    ),
    heading(p, "s6", "VI. ACCEPTABLE USE", 646),
    para(
      p,
      "s6b",
      "You must use QUICKPAWN only for lawful business purposes. You must not use it for unlawful, fraudulent, or abusive activities; violate the rights of others; upload harmful code; attempt unauthorized access; circumvent security; reverse engineer the Platform; resell unauthorized access; or use it to operate a competing service.",
      668,
      64,
    ),
    heading(p, "s7", "VII. SERVICE AVAILABILITY", 738),
    para(
      p,
      "s7b",
      "Inspire will use reasonable efforts to maintain QUICKPAWN. The Service may occasionally be unavailable due to maintenance, upgrades, technical issues, or events beyond Inspire's reasonable control. Inspire does not guarantee uninterrupted or error-free operation of the Service.",
      760,
      60,
    ),
    heading(p, "s8", "VIII. SUSPENSION AND TERMINATION", 826),
    para(
      p,
      "s8b",
      "Inspire may suspend or restrict access to protect the security of the Service, prevent fraud, address a serious violation of these Terms, comply with law, or address unpaid fees. Upon termination or expiration, your right to use QUICKPAWN ends, access may be disabled, unpaid fees remain payable, and Customer Data may be retained or deleted per applicable practices.",
      848,
      70,
    ),
  ];

  const page1: MoaDesignElement[] = [
    heading(p, "s9", "IX. INTELLECTUAL PROPERTY", 24, 1),
    para(
      p,
      "s9b",
      "QUICKPAWN and all related software, technology, design, content, documentation, trademarks, logos, and branding are owned by or licensed to Inspire Next Global Inc. You retain ownership of your Customer Data. You may not use Inspire or QUICKPAWN trademarks without prior written permission.",
      46,
      60,
      1,
    ),
    heading(p, "s10", "X. DISCLAIMER", 112, 1),
    para(
      p,
      "s10b",
      'To the maximum extent permitted by law, QUICKPAWN is provided on an "AS IS" and "AS AVAILABLE" basis. Inspire does not guarantee the Service will be uninterrupted, error-free, or meet every specific business requirement. You remain responsible for verifying important information and business transactions.',
      134,
      60,
      1,
    ),
    heading(p, "s11", "XI. LIMITATION OF LIABILITY", 200, 1),
    para(
      p,
      "s11b",
      "To the maximum extent permitted by law, Inspire will not be liable for indirect, incidental, special, consequential, or punitive damages. Inspire's total aggregate liability will not exceed the total subscription fees paid during the twelve (12) months preceding the event giving rise to the claim.",
      222,
      60,
      1,
    ),
    heading(p, "s12", "XII. INDEMNIFICATION", 288, 1),
    para(
      p,
      "s12b",
      "To the extent permitted by law, you agree to defend, indemnify, and hold harmless Inspire and its affiliates, officers, directors, employees, and representatives from claims, damages, liabilities, costs, and expenses arising from your breach of these Terms, misuse of QUICKPAWN, violation of law, Customer Data, or business operations.",
      310,
      64,
      1,
    ),
    heading(p, "s13", "XIII. CONFIDENTIALITY", 380, 1),
    para(
      p,
      "s13b",
      "Each party agrees to protect the other party's confidential information and use it only for purposes related to the business relationship. This obligation does not apply to information that is publicly available, already lawfully known, independently developed, or required to be disclosed by law.",
      402,
      56,
      1,
    ),
    heading(p, "s14", "XIV. CHANGES TO TERMS", 464, 1),
    para(
      p,
      "s14b",
      "Inspire may update these Terms from time to time. Updated Terms may be posted on the QUICKPAWN website or provided through the Platform, email, or other reasonable means. Continued use of QUICKPAWN after the updated Terms become effective constitutes acceptance of the revised Terms.",
      486,
      56,
      1,
    ),
    heading(p, "s15", "XV. GOVERNING LAW AND DISPUTES", 548, 1),
    para(
      p,
      "s15b",
      "These Terms are governed by the laws of the Republic of the Philippines. The parties will first attempt in good faith to resolve disputes through discussion and negotiation. If a dispute cannot be resolved, the parties may pursue remedies available under applicable Philippine law before the proper courts with jurisdiction.",
      570,
      60,
      1,
    ),
    heading(p, "s16", "XVI. CONTACT INFORMATION", 636, 1),
    para(
      p,
      "s16b",
      "Inspire Next Global Inc.\nName: Inspire Neo\nEmail: inquire.quickpawn.pms@gmail.com\nContact Number: 09929718800\nAddress: 6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig",
      658,
      96,
      1,
    ),
    para(
      p,
      "closing",
      "QUICKPAWN Pawnshop Management System (2026). All rights reserved.",
      770,
      20,
      1,
      24,
      736,
      9,
    ),
  ];

  return baseBlob(2, [...page0, ...page1]);
}

/* ── 6. Privacy Policy (PDF pages 11–14) ────────────────────────────────── */

export function createPrivacyPolicyDesign(): MoaDesignBlob {
  const p = "priv";
  const page0: MoaDesignElement[] = [
    title(p, "title", "QUICKPAWN PRIVACY POLICY", 24, 0, 16, 28),
    para(p, "eff", "EFFECTIVITY DATE / LAST UPDATED: August 2026", 60, 20),
    para(
      p,
      "intro",
      'This Privacy Policy explains how Inspire Next Global Inc. ("Inspire", "we", "us", or "our") collects, uses, stores, and protects personal information in connection with the QUICKPAWN Pawnshop Management System ("QUICKPAWN", "Service", or "Platform"). By accessing or using QUICKPAWN, you acknowledge this Privacy Policy.',
      88,
      64,
    ),
    heading(p, "s1", "I. INFORMATION WE COLLECT", 160),
    para(
      p,
      "s1b",
      "Depending on how you use QUICKPAWN, we may collect or process: name and contact information; account and login information; business and user information; customer and transaction information entered into the Platform; pawn, payment, loan, renewal, and redemption records; device, browser, log, and technical information; and other information necessary to provide and operate the Service.",
      182,
      70,
    ),
    heading(p, "s2", "II. HOW WE USE INFORMATION", 258),
    para(
      p,
      "s2b",
      "Information may be used to provide, operate, and maintain QUICKPAWN; create and manage user accounts; process and manage transactions; provide customer and technical support; maintain system security and prevent unauthorized access, fraud, and abuse; improve and develop the Service; perform backups and business continuity; and comply with applicable laws and legal obligations.",
      280,
      70,
    ),
    heading(p, "s3", "III. CUSTOMER DATA", 356),
    para(
      p,
      "s3b",
      "Information entered into QUICKPAWN by a subscribing pawnshop or business ('Customer Data') generally remains under the control and ownership of that customer. The customer is responsible for ensuring that personal information is collected and processed lawfully and in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). Where applicable, the customer acts as the Personal Information Controller while Inspire acts as a Personal Information Processor.",
      378,
      80,
    ),
    heading(p, "s4", "IV. DATA SHARING AND SERVICE PROVIDERS", 464),
    para(
      p,
      "s4b",
      "We may share or provide access to information only as reasonably necessary to operate QUICKPAWN, including with authorized service providers such as hosting, cloud infrastructure, security, communication, and payment providers. We may disclose information when required by law or to protect the rights, property, security, and operation of Inspire, QUICKPAWN, our customers, or other persons. We do not sell personal information.",
      486,
      80,
    ),
    heading(p, "s5", "V. DATA SECURITY", 572),
    para(
      p,
      "s5b",
      "We implement reasonable technical, organizational, and administrative measures designed to protect personal information against unauthorized access, disclosure, alteration, loss, destruction, or unlawful processing. However, no system can guarantee absolute security. Users and customers are also responsible for protecting their account credentials.",
      594,
      64,
    ),
    heading(p, "s6", "VI. DATA RETENTION", 664),
    para(
      p,
      "s6b",
      "We retain information only for as long as reasonably necessary to provide the Service, fulfill legitimate business purposes, comply with legal obligations, resolve disputes, enforce agreements, and maintain records. After an account or subscription ends, Customer Data may be retained or deleted in accordance with applicable retention practices and legal requirements.",
      686,
      70,
    ),
  ];

  const page1: MoaDesignElement[] = [
    heading(p, "s7", "VII. RIGHTS OF DATA SUBJECTS", 24, 1),
    para(
      p,
      "s7b",
      "Subject to applicable law, data subjects may have rights under the Data Privacy Act of 2012, including the right to be informed, access, correct, object to certain processing, request erasure or blocking where applicable, and lodge a complaint with the National Privacy Commission. Requests should generally first be directed to the customer or organization that collected the information.",
      46,
      70,
      1,
    ),
    heading(p, "s8", "VIII. COOKIES AND TECHNICAL INFORMATION", 122, 1),
    para(
      p,
      "s8b",
      "QUICKPAWN and related websites may use cookies, logs, and similar technologies to support functionality, security, authentication, performance, and system improvement. You may be able to control certain cookie settings through your browser or device. Disabling certain technologies may affect the availability or functionality of some features.",
      144,
      64,
      1,
    ),
    heading(p, "s9", "IX. CHANGES TO THIS PRIVACY POLICY", 214, 1),
    para(
      p,
      "s9b",
      "We may update this Privacy Policy from time to time to reflect changes in our services, practices, technology, or legal requirements. The updated version will be posted on the QUICKPAWN website with its updated effective date. Your continued use of QUICKPAWN after an updated Privacy Policy becomes effective constitutes your acknowledgment of the updated Policy.",
      236,
      64,
      1,
    ),
    heading(p, "s10", "X. CONTACT INFORMATION", 306, 1),
    para(
      p,
      "s10b",
      "Inspire Next Global Inc.\nName: Inspire Neo\nEmail: inquire.quickpawn.pms@gmail.com\nContact Number: 09929718800\nAddress: 6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig",
      328,
      96,
      1,
    ),
    para(
      p,
      "closing",
      "QUICKPAWN Pawnshop Management System (2026). All rights reserved.",
      440,
      20,
      1,
      24,
      736,
      9,
    ),
  ];

  return baseBlob(2, [...page0, ...page1]);
}
