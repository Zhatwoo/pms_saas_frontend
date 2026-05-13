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

/** MOA modal: `@page` rule (single source of truth with `PMS_PRINT_BASE_CSS`). */
export const MOA_PRINT_PAGE_RULE_CSS = `@page { size: portrait; margin: 10mm; }`;

/** MOA modal: exact color on root when printing. */
export const MOA_BODY_PRINT_COLOR_SNIPPET = `print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;`;
