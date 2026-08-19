import { api, ApiError } from "@/lib/api";

export type PublicTicketDetail = {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  amount: number;
  pawn_date: string;
  serial_number: string | null;
  condition: string | null;
  items_included: string | null;
  memory_storage: string | null;
  remarks: string | null;
  listing_type?: "pawn" | "sale";
  status?: string;
  profile_photo: string | null;
  item_photos: string[];
  id_photo: string | null;
  id_back_photo: string | null;
  customer?: {
    full_name: string;
    address: string;
    contact_number: string;
  };
  branch_info?: {
    name: string;
    location: string;
    phone: string;
  };
};

function normalizePublicTicket(res: PublicTicketDetail): PublicTicketDetail {
  return {
    ...res,
    item_photos: Array.isArray(res.item_photos) ? res.item_photos : [],
  };
}

function shouldFallbackToSaleLookup(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.statusCode === 400 || error.statusCode === 404;
}

/** Public QR destination: pawn tickets first, then sale items. */
export async function fetchPublicTicketByCode(
  code: string,
): Promise<PublicTicketDetail> {
  const encoded = encodeURIComponent(String(code));
  try {
    const res = await api.get<PublicTicketDetail>(
      `/pawn-tickets/public/${encoded}`,
      { suppressAuthExpired: true },
    );
    return normalizePublicTicket(res);
  } catch (error) {
    if (!shouldFallbackToSaleLookup(error)) {
      throw error;
    }

    const res = await api.get<PublicTicketDetail>(
      `/inventory/public/for-sale/${encoded}`,
      { suppressAuthExpired: true },
    );
    return normalizePublicTicket(res);
  }
}
