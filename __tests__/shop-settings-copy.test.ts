import { SHOP_INFORMATION_NOTICE, SLIP_EDIT_NOTICE } from "@/lib/shop-settings-copy";

describe("SHOP_INFORMATION_NOTICE", () => {
  it("documents that shop info appears on system-generated documents", () => {
    expect(SHOP_INFORMATION_NOTICE).toBe(
      "The information saved here will appear on system-generated slips and documents, such as MOAs, acknowledgment receipts, tickets, and other forms.",
    );
  });
});

describe("SLIP_EDIT_NOTICE", () => {
  it("documents that slip edits appear on printable system documents", () => {
    expect(SLIP_EDIT_NOTICE).toBe(
      "Create and customize system-generated forms and documents. Information entered here will appear on printable forms such as MOAs, acknowledgment receipts, tickets, and other documents.",
    );
  });
});
