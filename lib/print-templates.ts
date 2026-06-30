/**
 * Shared print HTML/CSS aligned with the MOA slip print rules
 * (`app/employee/pawn-transaction/_components/moa-modal.tsx`):
 * portrait, 10mm margins, exact color output, emerald + amber brand band.
 */

export const PRINT_BRAND = {
  primary: "#064e3b",
  accent: "#f59e0b",
  ink: "#18181b",
  mutedInk: "#52525b",
} as const;

/** Base rules shared by document + QR sheet prints. */
export const PMS_PRINT_BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.35;
    color: ${PRINT_BRAND.ink};
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page {
    size: portrait;
    margin: 10mm;
  }
`;

/** Tables, header band, footer — system reports & ledger. */
export const PMS_PRINT_DOCUMENT_CSS = `
  ${PMS_PRINT_BASE_CSS}
  .pms-print-header {
    background: ${PRINT_BRAND.primary};
    color: #fff;
    padding: 28px 20px;
    text-align: center;
    margin: 0 0 20px;
    border-bottom: 6px solid ${PRINT_BRAND.accent};
  }
  .pms-print-header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.1;
  }
  .pms-print-header p {
    margin: 10px 0 0;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.28em;
    opacity: 0.92;
  }
  .pms-print-content { padding: 0 8px 24px; }
  .pms-print-meta p { margin: 0 0 6px; font-size: 11px; }
  .pms-print-divider { border-top: 2px solid ${PRINT_BRAND.ink}; margin: 14px 0 20px; }
  .pms-print-section { margin-top: 18px; }
  .pms-print-section h2 {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${PRINT_BRAND.primary};
    border-bottom: 1px solid ${PRINT_BRAND.primary};
    padding-bottom: 3px;
  }
  .pms-summary-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 22px;
    padding: 8px 0;
  }
  .pms-summary-item {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pms-summary-label {
    font-size: 9px;
    font-weight: 800;
    color: ${PRINT_BRAND.mutedInk};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .pms-summary-value {
    font-size: 16px;
    font-weight: 900;
    color: ${PRINT_BRAND.ink};
  }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td {
    border-bottom: 1px solid #e4e4e7;
    padding: 8px 6px;
    font-size: 11px;
    text-align: left;
    vertical-align: top;
  }
  thead th {
    background: #f4f4f5;
    border-top: 2px solid ${PRINT_BRAND.primary};
    border-bottom: 2px solid ${PRINT_BRAND.primary};
    font-weight: 800;
    color: ${PRINT_BRAND.primary};
  }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
  .empty { color: ${PRINT_BRAND.mutedInk}; font-style: italic; text-align: center; }
  .total-row { background: #f4f4f5 !important; font-weight: 800; border-top: 2px solid ${PRINT_BRAND.ink}; }
  .net-row { font-size: 12px; font-weight: 800; border-top: 2px solid ${PRINT_BRAND.ink}; }
  .cash-out { color: #b91c1c; }
  .pms-print-footer {
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #e4e4e7;
    font-size: 10px;
    color: ${PRINT_BRAND.mutedInk};
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
`;

export const PMS_QR_SHEET_CSS = `
  ${PMS_PRINT_BASE_CSS}
  .pms-qr-print-header {
    width: 100%;
    text-align: center;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 2px solid ${PRINT_BRAND.primary};
  }
  .pms-qr-print-header .brand {
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: ${PRINT_BRAND.primary};
  }
  .pms-qr-print-header .sheet {
    margin-top: 4px;
    font-size: 10px;
    font-weight: 700;
    color: ${PRINT_BRAND.mutedInk};
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .pms-qr-grid {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  }
`;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type PrintHtmlDocumentOptions = {
  /** Extra delay before calling print() so remote images (e.g. QR) can load. */
  printDelayMs?: number;
};

export function printHtmlDocument(html: string, options?: PrintHtmlDocumentOptions): void {
  const printDelayMs = options?.printDelayMs ?? 250;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  let printed = false;
  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 500);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    if (printed) return;
    printed = true;

    const pw = frameWindow as Window & { onafterprint?: () => void };
    if ("onafterprint" in pw) {
      pw.onafterprint = cleanup;
    } else {
      cleanup();
    }

    try {
      frameWindow.focus();
      window.setTimeout(() => frameWindow.print(), printDelayMs);
    } catch {
      cleanup();
    }
  };

  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    cleanup();
    throw new Error("Unable to create print document.");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
}

export function buildPmsPrintDocument(params: {
  documentTitle: string;
  headerTitle?: string;
  headerSubtitle: string;
  metaHtml: string;
  bodyHtml: string;
}): string {
  const headerTitle = params.headerTitle ?? "JCLB Buy Back Shop";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.documentTitle)}</title>
  <style>${PMS_PRINT_DOCUMENT_CSS}</style>
</head>
<body>
  <div class="pms-print-header">
    <h1>${escapeHtml(headerTitle)}</h1>
    <p>${escapeHtml(params.headerSubtitle)}</p>
  </div>
  <div class="pms-print-content">
    <div class="pms-print-meta">${params.metaHtml}</div>
    <div class="pms-print-divider"></div>
    ${params.bodyHtml}
  </div>
  <div class="pms-print-footer">Pawnshop Management System</div>
</body>
</html>`;
}

export function buildQrSheetDocument(params: { sheetTitle: string; cardsHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.sheetTitle)}</title>
  <style>${PMS_QR_SHEET_CSS}</style>
</head>
<body>
  <header class="pms-qr-print-header">
    <div class="brand">JCLB Buy Back Shop</div>
    <div class="sheet">${escapeHtml(params.sheetTitle)}</div>
  </header>
  <main class="pms-qr-grid">${params.cardsHtml}</main>
</body>
</html>`;
}

/** Legal MOA slip dimensions (8.5 × 14 in). */
export const MOA_LEGAL_PAGE = {
  width: "8.5in",
  height: "14in",
  padding: "0.35in 0.4in",
  screenWidthPx: 816,
  screenHeightPx: 1344,
} as const;

/** MOA modal: `@page` rule — Legal portrait, zero margin (content carries its own padding). */
export const MOA_PRINT_PAGE_RULE_CSS = `@page { size: 8.5in 14in portrait; margin: 0; }`;

/** JCLB diagonal watermark — shared by settings preview, MOA modal, and print iframe. */
export const MOA_WATERMARK_CSS = `
  .moa-watermark {
    position: relative;
  }
  .moa-watermark::before {
    content: "JCLB";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 120px;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.035) !important;
    z-index: 0;
    pointer-events: none;
    user-select: none;
    letter-spacing: 0.1em;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .moa-watermark > * {
    position: relative;
    z-index: 1;
  }
`;

/** Screen layout so the on-page preview matches the printed Legal sheet. */
export const MOA_PRINT_SCREEN_CSS = `
  ${MOA_WATERMARK_CSS}
  body.moa-print-document {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  #moa-slip-printable {
    display: block !important;
    margin: 0 auto !important;
    padding: 0 !important;
    width: ${MOA_LEGAL_PAGE.width} !important;
    max-width: ${MOA_LEGAL_PAGE.width} !important;
    background: #fff !important;
  }
  #moa-slip-printable .moa-print-page {
    box-sizing: border-box !important;
    width: ${MOA_LEGAL_PAGE.width} !important;
    height: ${MOA_LEGAL_PAGE.height} !important;
    max-width: ${MOA_LEGAL_PAGE.width} !important;
    max-height: ${MOA_LEGAL_PAGE.height} !important;
    min-height: ${MOA_LEGAL_PAGE.height} !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: ${MOA_LEGAL_PAGE.padding} !important;
    page-break-after: always !important;
    break-after: page !important;
    background: #fff !important;
    position: relative !important;
  }
  #moa-slip-printable .moa-print-page:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  #moa-slip-printable .no-print,
  #moa-slip-printable .no-print * {
    display: none !important;
  }
`;

/** Shared `@media print` rules for MOA slips (settings page + modal iframe). */
export const MOA_PRINT_CSS = `
  ${MOA_WATERMARK_CSS}
  ${MOA_PRINT_PAGE_RULE_CSS}
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #moa-slip-printable,
  #moa-preview-page1,
  #moa-preview-page2 {
    display: block !important;
    margin: 0 auto !important;
    padding: 0 !important;
    width: ${MOA_LEGAL_PAGE.width} !important;
    max-width: ${MOA_LEGAL_PAGE.width} !important;
    background: #fff !important;
  }
  .moa-print-page,
  #moa-preview-page1,
  #moa-preview-page2 {
    box-sizing: border-box !important;
    width: ${MOA_LEGAL_PAGE.width} !important;
    height: ${MOA_LEGAL_PAGE.height} !important;
    max-width: ${MOA_LEGAL_PAGE.width} !important;
    max-height: ${MOA_LEGAL_PAGE.height} !important;
    min-height: unset !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: ${MOA_LEGAL_PAGE.padding} !important;
    page-break-after: always !important;
    break-after: page !important;
    background: #fff !important;
    position: relative !important;
    box-shadow: none !important;
    border: none !important;
  }
  .moa-print-page:last-child,
  #moa-preview-page2:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .break-before-page {
    page-break-before: always !important;
    break-before: page !important;
  }
  .no-print,
  .no-print * {
    display: none !important;
  }
  .moa-print-page .space-y-2 > * + * { margin-top: 0.35rem !important; }
  .moa-print-page .space-y-3 > * + * { margin-top: 0.45rem !important; }
  .moa-print-page .space-y-4 > * + * { margin-top: 0.5rem !important; }
  .moa-print-page .grid { display: grid !important; }
  .moa-print-page .flex { display: flex !important; }
  .moa-print-page .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .moa-print-page .text-center { text-align: center !important; }
  .moa-print-page .text-justify { text-align: justify !important; }
  .moa-print-page .justify-between { justify-content: space-between !important; }
  .moa-print-page .items-center { align-items: center !important; }
  .moa-print-page .items-end { align-items: flex-end !important; }
  .moa-print-page .font-bold { font-weight: 700 !important; }
  .moa-print-page .uppercase { text-transform: uppercase !important; }
  .moa-print-page .italic { font-style: italic !important; }
  .moa-print-page .border-b { border-bottom: 1px solid #a1a1aa !important; }
  .moa-print-page .border-y { border-top: 1px solid #e4e4e7 !important; border-bottom: 1px solid #e4e4e7 !important; }
  .moa-print-page .border-t { border-top: 1px solid #e4e4e7 !important; }
  .moa-print-page:nth-child(2) {
    font-size: 8.5px !important;
    line-height: 1.12 !important;
  }
  .moa-print-page:nth-child(2) .space-y-3 > * + * { margin-top: 0.3rem !important; }
  .moa-print-page:nth-child(2) .pt-4 { padding-top: 0.35rem !important; }
  .moa-print-page:nth-child(2) .my-6 { margin-top: 0.35rem !important; margin-bottom: 0.35rem !important; }
`;

/** Minimal layout CSS for MOA slip iframe print (Tailwind-independent). */
export const MOA_PRINT_LAYOUT_CSS = `
  ${MOA_WATERMARK_CSS}
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #moa-slip-printable {
    display: block;
    margin: 0 auto;
    padding: 0;
    width: ${MOA_LEGAL_PAGE.width};
    background: #fff;
    color: #18181b;
    font-size: 9.5px;
    line-height: 1.15;
  }
`;

export function buildMoaSlipPrintHtml(slipHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>MOA Slip</title>
  <style>
    ${MOA_PRINT_LAYOUT_CSS}
    ${MOA_PRINT_SCREEN_CSS}
    @media print {
      ${MOA_PRINT_CSS}
    }
  </style>
</head>
<body class="moa-print-document">
  ${slipHtml}
</body>
</html>`;
}

/** MOA modal: exact color on root when printing. */
export const MOA_BODY_PRINT_COLOR_SNIPPET = `print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;`;
