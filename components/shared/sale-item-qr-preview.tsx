"use client";

import { buildItemQrImageUrl } from "@/lib/item-qr";

export function SaleItemQrPreview({
  itemId,
  compact = false,
}: {
  itemId: string;
  compact?: boolean;
}) {
  if (!itemId) return null;

  const qrUrl = buildItemQrImageUrl(itemId);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-border-main bg-white p-4 dark:border-white/10 dark:bg-zinc-900 ${
        compact ? "gap-1.5" : "gap-2"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">QR Code</p>
      <img
        src={qrUrl}
        alt={`${itemId} QR code`}
        className={compact ? "h-28 w-28 object-contain" : "h-40 w-40 object-contain"}
      />
      <p className="text-xs font-bold text-brand-green">{itemId}</p>
    </div>
  );
}
