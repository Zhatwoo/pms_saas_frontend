"use client";

import type { PawnTicketFormData } from "./new-pawn-ticket-modal";

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData?: PawnTicketFormData | null;
  onConfirmPrint: () => void;
}

function formatField(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrintableHtml(ticketData: PawnTicketFormData) {
  const rowHtml = [
    ["Unit Code", ticketData.unitCode],
    ["Purchased Date", ticketData.purchasedDate],
    ["Maturity Date", ticketData.maturityDate],
    ["Expiry Date", ticketData.expiryDate],
    ["ID(s) Presented", ticketData.idsPresented],
    ["Full Name", ticketData.fullName],
    ["Residence / Address", ticketData.residence],
    ["Contact Number", ticketData.contactNumber],
    ["Email Address", ticketData.email],
    ["Amount in Words", ticketData.amountInWords],
    ["Principal Amount", ticketData.principalAmount],
    ["Storage Fee", ticketData.storageFee],
    ["Parking Fee", ticketData.parkingFee],
    ["Net Proceeds", ticketData.netProceeds],
    ["Brand & Model", ticketData.brandModel],
    ["Items Included", ticketData.itemsIncluded],
    ["Condition", ticketData.condition],
    ["Serial No.", ticketData.serialNo],
    ["Memory / Storage", ticketData.memoryStorage],
  ]
    .map(
      ([label, value]) => `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(formatField(value))}</div>
        </div>`,
    );

  const contractRows = rowHtml.slice(0, 5).join("");
  const customerRows = rowHtml.slice(5, 9).join("");
  const financialRows = rowHtml.slice(9, 14).join("");
  const unitRows = rowHtml.slice(14).join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Pawn Ticket</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          background: #ffffff;
        }
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
          }
          body {
            zoom: 0.92;
          }
        }
        .sheet {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .brand {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0f766e;
          font-weight: 700;
        }
        h1 {
          margin: 4px 0 0;
          font-size: 22px;
          line-height: 1.1;
        }
        .meta {
          font-size: 10px;
          color: #4b5563;
          text-align: right;
          min-width: 130px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px 8px;
        }
        .section {
          margin-top: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .field {
          padding: 6px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fafafa;
          min-height: 40px;
        }
        .label {
          font-size: 9px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }
        .value {
          font-size: 11px;
          color: #111827;
          word-break: break-word;
          white-space: pre-wrap;
          line-height: 1.25;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div>
            <div class="brand">Pawnshop Management System</div>
            <h1>Pawn Ticket</h1>
          </div>
          <div class="meta">
            <div>Printed on</div>
            <div>${escapeHtml(new Date().toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contract Details</div>
          <div class="grid">
            ${contractRows}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="grid">
            ${customerRows}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Financial Details</div>
          <div class="grid">
            ${financialRows}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Unit Description</div>
          <div class="grid">
            ${unitRows}
          </div>
        </div>
      </div>

    </body>
  </html>`;
}

export function PrintTicketModal({
  isOpen,
  onClose,
  ticketData,
  onConfirmPrint,
}: PrintTicketModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    if (!ticketData) return;

    const html = buildPrintableHtml(ticketData);
    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    let didPrint = false;

    iframe.onload = () => {
      if (didPrint) return;
      didPrint = true;

      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        URL.revokeObjectURL(blobUrl);
        iframe.remove();
        return;
      }

      frameWindow.focus();
      frameWindow.print();

      frameWindow.onafterprint = () => {
        URL.revokeObjectURL(blobUrl);
        iframe.remove();
      };

      window.setTimeout(() => {
        if (iframe.isConnected) {
          URL.revokeObjectURL(blobUrl);
          iframe.remove();
        }
      }, 10_000);
    };

    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    onConfirmPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-2xl">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Ticket Saved</h2>
          <p className="text-sm text-zinc-500">
            Do you want to print this pawn ticket now?
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Your pawn ticket has been saved successfully.
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            {!ticketData ? (
              <p className="text-sm text-zinc-600">
                No ticket data was provided for printing.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
                        Pawn Ticket Preview
                      </p>
                      <h3 className="text-xl font-semibold text-zinc-900">
                        {formatField(ticketData.unitCode)}
                      </h3>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      <div>{formatField(ticketData.purchasedDate)}</div>
                      <div>{formatField(ticketData.fullName)}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <PreviewGroup title="Contract Details" items={[
                      ["Unit Code", ticketData.unitCode],
                      ["Purchased Date", ticketData.purchasedDate],
                      ["Maturity Date", ticketData.maturityDate],
                      ["Expiry Date", ticketData.expiryDate],
                      ["ID(s) Presented", ticketData.idsPresented],
                    ]} />
                    <PreviewGroup title="Customer Details" items={[
                      ["Full Name", ticketData.fullName],
                      ["Residence / Address", ticketData.residence],
                      ["Contact Number", ticketData.contactNumber],
                      ["Email Address", ticketData.email],
                    ]} />
                    <PreviewGroup title="Financial Details" items={[
                      ["Amount in Words", ticketData.amountInWords],
                      ["Principal Amount", ticketData.principalAmount],
                      ["Storage Fee", ticketData.storageFee],
                      ["Parking Fee", ticketData.parkingFee],
                      ["Net Proceeds", ticketData.netProceeds],
                    ]} />
                    <PreviewGroup title="Unit Description" items={[
                      ["Brand & Model", ticketData.brandModel],
                      ["Items Included", ticketData.itemsIncluded],
                      ["Condition", ticketData.condition],
                      ["Serial No.", ticketData.serialNo],
                      ["Memory / Storage", ticketData.memoryStorage],
                    ]} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[30px] border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!ticketData}
              className="rounded-[30px] bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Print Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewGroup({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
      <div className="mt-3 space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {label}
            </div>
            <div className="mt-1 text-sm text-zinc-900">
              {formatField(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}