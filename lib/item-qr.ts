const QR_IMAGE_API = "https://api.qrserver.com/v1/create-qr-code/";

function resolveOrigin(origin?: string): string {
  if (origin) return origin.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Public ticket URL encoded into sale/pawn item QR codes. */
export function buildItemPublicViewUrl(itemId: string, origin?: string): string {
  return `${resolveOrigin(origin)}/view-ticket/${encodeURIComponent(itemId)}`;
}

/** QR image URL used by Add Item For Sale and Item Overview. */
export function buildItemQrImageUrl(itemId: string, origin?: string): string {
  const encoded = encodeURIComponent(buildItemPublicViewUrl(itemId, origin));
  return `${QR_IMAGE_API}?data=${encoded}&size=250x250&color=065f46&bgcolor=f0fdf4&margin=2`;
}
