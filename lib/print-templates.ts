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

/** Long bond MOA slip dimensions (8.5 × 13 in). */
export const MOA_LEGAL_PAGE = {
  width: "8.5in",
  height: "13in",
  padding: "0.15in 0.32in",
  screenWidthPx: 816,
  screenHeightPx: 1248,
} as const;

/** MOA: `@page` rule — 8.5 × 13 portrait, zero margin (content carries its own padding). */
export const MOA_PRINT_PAGE_RULE_CSS = `@page { size: 8.5in 13in portrait; margin: 0; }`;

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
    color: rgba(0, 0, 0, 0.06) !important;
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
  @media print {
    .moa-watermark::before {
      color: rgba(0, 0, 0, 0.14) !important;
      -webkit-text-stroke: 1.5px rgba(0, 0, 0, 0.1);
      paint-order: stroke fill;
    }
  }
`;

/** Cut-here divider between original and customer copies — must print. */
export const MOA_CUT_GUIDE_CSS = `
  .moa-cut-guide {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.35rem !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    padding: 0.25rem 0 !important;
    margin: 0 !important;
    flex-shrink: 0 !important;
    pointer-events: none;
    user-select: none;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .moa-slip-halves > .moa-cut-guide {
    grid-column: 1 / -1 !important;
    justify-self: stretch !important;
    align-self: center !important;
  }
  .moa-cut-guide__line {
    display: block !important;
    flex: 1 1 0% !important;
    min-width: 0.75rem !important;
    height: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-top: 1px dashed #a1a1aa !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .moa-cut-guide__text {
    display: block !important;
    flex: 0 0 auto !important;
    background: #fff !important;
    padding: 0 0.25rem !important;
    margin: 0 !important;
    font-size: 8px !important;
    font-weight: 700 !important;
    letter-spacing: 0.05em !important;
    color: #71717a !important;
    white-space: nowrap !important;
    text-align: center !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @media print {
    .moa-cut-guide__line {
      border-top-color: #52525b !important;
    }
    .moa-cut-guide__text {
      color: #3f3f46 !important;
      background: #fff !important;
    }
  }
`;

/** Split slip page into equal top/bottom halves with cut line at vertical center. */
export const MOA_SLIP_HALVES_CSS = `
  .moa-print-page.moa-slip-sheet {
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  .moa-slip-halves {
    display: grid !important;
    grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr) !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: 100% !important;
    width: 100% !important;
  }
  .moa-slip-half {
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .moa-slip-half > .moa-slip-copy,
  .moa-slip-half > .moa-terms-copy {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .moa-slip-copy,
  .moa-terms-copy {
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow: hidden !important;
  }
  .moa-slip-body,
  .moa-terms-body {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }
  .moa-slip-footer,
  .moa-terms-footer {
    flex: 0 0 auto !important;
    flex-shrink: 0 !important;
    margin-top: 0 !important;
    width: 100% !important;
    overflow: visible !important;
  }
  .moa-slip-advise {
    font-size: 7px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    line-height: 1.06 !important;
    letter-spacing: 0.02em !important;
    color: #3f3f46 !important;
    text-align: center !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .moa-slip-renewal-row {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    column-gap: 0.12rem !important;
  }
  .moa-signature-line {
    display: block !important;
    width: 100% !important;
    min-height: 20px !important;
    height: 20px !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-bottom: 1.5px solid #27272a !important;
    box-sizing: border-box !important;
    flex-shrink: 0 !important;
    overflow: visible !important;
    background: transparent !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .moa-signature-line.flex,
  .moa-signature-line[class*="flex"] {
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
  }
  .moa-terms-signatures .moa-signature-line,
  .moa-terms-received .moa-signature-line {
    min-height: 22px !important;
    height: 22px !important;
    border-bottom-width: 1.5px !important;
    border-bottom-color: #27272a !important;
  }
  .moa-signature-block {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 100% !important;
    flex-shrink: 0 !important;
  }
  .moa-signature-label {
    display: block !important;
    flex-shrink: 0 !important;
    overflow: visible !important;
    font-size: 6.5px !important;
    line-height: 1.1 !important;
    margin-top: 0.08rem !important;
    text-align: center !important;
  }
`;

/** Tailwind classes for a visible MOA signature underline (screen + print). */
export const MOA_SIGNATURE_LINE_CLASS =
  "moa-signature-line w-full shrink-0 min-h-[20px] border-b border-zinc-700";

/** Compact typography/spacing for MOA slip halves on 8.5 × 13 in paper. */
export const MOA_SLIP_COMPACT_CSS = `
  .moa-print-page.moa-slip-sheet {
    font-size: 11.5px !important;
    line-height: 1.32 !important;
  }
  .moa-slip-half .moa-slip-copy,
  .moa-slip-half .moa-slip-copy .moa-slip-body {
    font-size: 11.5px !important;
    line-height: 1.32 !important;
  }
  .moa-slip-copy > * + * { margin-top: 0 !important; }
  .moa-slip-body.space-y-0\\.5 > * + * { margin-top: 0.2rem !important; }
  .moa-slip-copy .space-y-1 > * + * { margin-top: 0.24rem !important; }
  .moa-slip-copy .space-y-2 > * + * { margin-top: 0.34rem !important; }
  .moa-slip-copy .gap-8 { gap: 0.6rem !important; }
  .moa-slip-copy .gap-12 { gap: 0.85rem !important; }
  .moa-slip-copy .gap-4 { gap: 0.38rem !important; }
  .moa-slip-copy .gap-x-8 { column-gap: 0.6rem !important; }
  .moa-slip-copy .gap-y-1\\.5 { row-gap: 0.2rem !important; }
  .moa-slip-copy .py-2, .moa-slip-copy .my-2 { margin-top: 0.22rem !important; margin-bottom: 0.22rem !important; padding-top: 0.22rem !important; padding-bottom: 0.22rem !important; }
  .moa-slip-copy .pt-3 { padding-top: 0.34rem !important; }
  .moa-slip-copy .pb-2 { padding-bottom: 0.22rem !important; }
  .moa-slip-copy .text-\\[12px\\] { font-size: 15px !important; }
  .moa-slip-copy .text-\\[11px\\] { font-size: 13.5px !important; }
  .moa-slip-copy .text-\\[9\\.5px\\] { font-size: 12px !important; }
  .moa-slip-copy .text-\\[9px\\] { font-size: 11.5px !important; }
  .moa-slip-copy .text-\\[8\\.5px\\] { font-size: 11px !important; }
  .moa-slip-copy .text-\\[8px\\] { font-size: 10.5px !important; }
  .moa-slip-copy .text-\\[7px\\] { font-size: 9px !important; }
  .moa-slip-copy .moa-watermark::before { font-size: 78px !important; }
  .moa-cut-guide { padding: 0.22rem 0 !important; }
  .moa-cut-guide__text { font-size: 9px !important; }
  .moa-slip-footer { font-size: 11px !important; line-height: 1.32 !important; }
`;

/** Force identical font sizing for the agreement paragraph across BOTH the
 *  Original and Customer copies (text + fill-in blanks). Placed AFTER the
 *  compact rules wherever it is included so it wins equal-specificity ties. */
export const MOA_AGREEMENT_TEXT_CSS = `
  .moa-slip-copy .moa-agreement-text,
  .moa-slip-copy .moa-agreement-text * {
    font-size: 11.5px !important;
    line-height: 1.4 !important;
  }
`;

/** Compact layout for MOA terms halves on 8.5 × 13 in paper. */
export const MOA_TERMS_COMPACT_CSS = `
  .moa-slip-half .moa-terms-copy,
  .moa-slip-half .moa-terms-copy .moa-terms-body {
    font-size: 10px !important;
    line-height: 1.34 !important;
  }
  .moa-terms-copy .space-y-1\\.5 > * + * { margin-top: 0.2rem !important; }
  .moa-terms-copy .space-y-3 > * + * { margin-top: 0.28rem !important; }
  .moa-terms-copy .p-3 { padding: 0.4rem !important; }
  .moa-terms-copy .pt-4 { padding-top: 0.38rem !important; }
  .moa-terms-copy .text-\\[11px\\] { font-size: 12.5px !important; }
  .moa-terms-copy .text-\\[9px\\] { font-size: 10.5px !important; }
  .moa-terms-copy .text-\\[8\\.5px\\] { font-size: 10px !important; }
  .moa-terms-copy .text-\\[8px\\] { font-size: 9.5px !important; }
  .moa-terms-copy .text-\\[7\\.5px\\] { font-size: 9px !important; }
  .moa-terms-signatures { padding-top: 0.4rem !important; row-gap: 0.45rem !important; column-gap: 0.6rem !important; }
  .moa-terms-received { padding-top: 0.38rem !important; }
  .moa-terms-received .space-y-3 > * + * { margin-top: 0.22rem !important; }
  .moa-terms-body .min-h-\\[120px\\] { min-height: 0 !important; }
`;

/** Terms page signature grid. */
export const MOA_TERMS_SIGNATURES_CSS = `
  .moa-terms-signatures {
    display: grid !important;
    grid-template-columns: 1.2fr 1.5fr !important;
    column-gap: 0.5rem !important;
    row-gap: 0.2rem !important;
    padding-top: 0.12rem !important;
    align-items: start !important;
  }
  .moa-terms-signatures .moa-signature-block {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 82% !important;
    max-width: 82% !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .moa-terms-signatures .moa-signature-block + .moa-signature-block {
    margin-top: 0.12rem !important;
  }
  .moa-terms-signatures .moa-signature-label,
  .moa-terms-received .moa-signature-label {
    text-transform: none !important;
    font-weight: 400 !important;
    letter-spacing: 0 !important;
  }
  .moa-terms-received .moa-signature-block {
    width: 50% !important;
    max-width: 50% !important;
    margin-left: 0 !important;
    margin-right: auto !important;
  }
`;

/** Screen layout so the on-page preview matches the printed Legal sheet. */
export const MOA_PRINT_SCREEN_CSS = `
  ${MOA_WATERMARK_CSS}
  ${MOA_CUT_GUIDE_CSS}
  ${MOA_SLIP_HALVES_CSS}
  ${MOA_SLIP_COMPACT_CSS}
  ${MOA_TERMS_COMPACT_CSS}
  ${MOA_TERMS_SIGNATURES_CSS}
  ${MOA_AGREEMENT_TEXT_CSS}
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
  ${MOA_CUT_GUIDE_CSS}
  ${MOA_SLIP_HALVES_CSS}
  ${MOA_SLIP_COMPACT_CSS}
  ${MOA_TERMS_COMPACT_CSS}
  ${MOA_TERMS_SIGNATURES_CSS}
  ${MOA_AGREEMENT_TEXT_CSS}
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
  .moa-print-page .grid { display: grid !important; }
  .moa-print-page .flex { display: flex !important; }
  .moa-print-page .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .moa-print-page .text-center { text-align: center !important; }
  .moa-print-page .text-justify { text-align: justify !important; }
  .moa-print-page .justify-between { justify-content: space-between !important; }
  .moa-print-page .items-center { align-items: center !important; }
  .moa-print-page .items-start { align-items: flex-start !important; }
  .moa-print-page .items-end { align-items: flex-end !important; }
  .moa-print-page .font-bold { font-weight: 700 !important; }
  .moa-print-page .uppercase { text-transform: uppercase !important; }
  .moa-print-page .italic { font-style: italic !important; }
  .moa-print-page .underline { text-decoration: underline !important; }
  .moa-print-page .whitespace-nowrap { white-space: nowrap !important; }
  .moa-print-page .border-b { border-bottom: 1px solid #a1a1aa !important; }
  .moa-print-page .border-y { border-top: 1px solid #e4e4e7 !important; border-bottom: 1px solid #e4e4e7 !important; }
  .moa-print-page .border-t { border-top: 1px solid #e4e4e7 !important; }
  /* --- Tailwind utility fallbacks (iframe print has no Tailwind) --- */
  /* Reset default browser margins on typographic tags — without Tailwind's
     Preflight these inflate the slip spacing dramatically. */
  .moa-print-page p,
  .moa-print-page h1,
  .moa-print-page h2,
  .moa-print-page h3,
  .moa-print-page h4 { margin: 0 !important; }
  .moa-print-page .flex-col { flex-direction: column !important; }
  .moa-print-page .flex-1 { flex: 1 1 0% !important; }
  .moa-print-page .shrink-0 { flex-shrink: 0 !important; }
  .moa-print-page .block { display: block !important; }
  .moa-print-page .inline-block { display: inline-block !important; }
  .moa-print-page .contents { display: contents !important; }
  .moa-print-page .grid-cols-\\[80px_1fr\\] { grid-template-columns: 80px 1fr !important; }
  .moa-print-page .grid-cols-\\[92px_1fr\\] { grid-template-columns: 92px 1fr !important; }
  .moa-print-page .grid-cols-\\[76px_1fr\\] { grid-template-columns: 76px 1fr !important; }
  .moa-print-page .grid-cols-\\[auto_48px_auto_48px_auto_48px\\] { grid-template-columns: auto 48px auto 48px auto 48px !important; }
  .moa-print-page .w-\\[60px\\] { width: 60px !important; }
  .moa-print-page .w-\\[100px\\] { width: 100px !important; }
  .moa-print-page .w-\\[120px\\] { width: 120px !important; }
  .moa-print-page .w-\\[180px\\] { width: 180px !important; }
  .moa-print-page .w-12 { width: 3rem !important; }
  .moa-print-page .w-16 { width: 4rem !important; }
  .moa-print-page .w-20 { width: 5rem !important; }
  .moa-print-page .w-24 { width: 6rem !important; }
  .moa-print-page .w-full { width: 100% !important; }
  .moa-print-page .h-4 { height: 1rem !important; }
  .moa-print-page .gap-1 { gap: 0.25rem !important; }
  .moa-print-page .gap-2 { gap: 0.5rem !important; }
  .moa-print-page .gap-3 { gap: 0.75rem !important; }
  .moa-print-page .gap-x-1 { column-gap: 0.25rem !important; }
  .moa-print-page .px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
  .moa-print-page .px-3 { padding-left: 0.6rem !important; padding-right: 0.6rem !important; }
  .moa-print-page .pt-1 { padding-top: 0.15rem !important; }
  .moa-print-page .py-0\\.5 { padding-top: 0.06rem !important; padding-bottom: 0.06rem !important; }
  .moa-print-page .mt-0\\.5 { margin-top: 0.1rem !important; }
  .moa-print-page .moa-cut-guide { display: flex !important; width: 100% !important; }
  .moa-print-page .moa-cut-guide__line { flex: 1 1 0% !important; border-top: 1px dashed #52525b !important; }
  .moa-print-page .moa-cut-guide__text { flex: 0 0 auto !important; background: #fff !important; }
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
  ${MOA_CUT_GUIDE_CSS}
  ${MOA_SLIP_HALVES_CSS}
  ${MOA_SLIP_COMPACT_CSS}
  ${MOA_TERMS_COMPACT_CSS}
  ${MOA_TERMS_SIGNATURES_CSS}
  ${MOA_AGREEMENT_TEXT_CSS}
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
