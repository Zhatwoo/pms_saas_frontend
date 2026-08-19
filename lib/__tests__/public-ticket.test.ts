import { ApiError, api } from "@/lib/api";
import { fetchPublicTicketByCode } from "@/lib/public-ticket";

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    api: {
      get: jest.fn(),
    },
  };
});

const mockedGet = api.get as jest.MockedFunction<typeof api.get>;

describe("fetchPublicTicketByCode", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("returns pawn ticket content from the public pawn-tickets endpoint", async () => {
    mockedGet.mockResolvedValueOnce({
      item_id: "PN-001",
      item_name: "Laptop",
      listing_type: "pawn",
      item_photos: ["https://example.com/a.jpg"],
    });

    const ticket = await fetchPublicTicketByCode("PN-001");

    expect(mockedGet).toHaveBeenCalledWith("/pawn-tickets/public/PN-001", {
      suppressAuthExpired: true,
    });
    expect(ticket.listing_type).toBe("pawn");
  });

  it("falls back to sale items when pawn lookup returns not found", async () => {
    mockedGet
      .mockRejectedValueOnce(
        new ApiError("Item not found or unit code is invalid.", 400),
      )
      .mockResolvedValueOnce({
        item_id: "SALE-123456",
        item_name: "Gold Ring",
        listing_type: "sale",
        status: "Available",
        item_photos: null,
      });

    const ticket = await fetchPublicTicketByCode("SALE-123456");

    expect(mockedGet).toHaveBeenNthCalledWith(
      2,
      "/inventory/public/for-sale/SALE-123456",
      { suppressAuthExpired: true },
    );
    expect(ticket.listing_type).toBe("sale");
    expect(ticket.item_photos).toEqual([]);
  });
});
