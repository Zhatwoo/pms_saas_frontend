import {
  formatDeviceAuthorizationOverview,
  formatDeviceAuthorizationTitle,
} from "@/lib/notifications";

describe("formatDeviceAuthorizationOverview", () => {
  it("formats legacy multiline device-auth messages without encrypted requester codes", () => {
    const legacyMessage = [
      "Device: Unknown Device (DESKTOP)",
      "Requested by: abc123456789:def456789012:ghi789012345 (employee@example.com)",
      "IP Address: 192.168.1.10",
    ].join("\n");

    expect(formatDeviceAuthorizationOverview(legacyMessage)).toBe(
      "Device: Unknown Device · Email: employee@example.com · IP Address: 192.168.1.10",
    );
  });

  it("keeps concise single-line device-auth messages unchanged", () => {
    const message =
      "Device: Unknown Device · Email: employee@example.com · IP Address: 192.168.1.10";

    expect(formatDeviceAuthorizationOverview(message)).toBe(message);
  });
});

describe("formatDeviceAuthorizationTitle", () => {
  it("replaces legacy titles that contain encrypted requester names", () => {
    expect(
      formatDeviceAuthorizationTitle(
        "Device Authorization Request from abc123456789:def456789012:ghi789012345",
      ),
    ).toBe("Device Authorization Request");
  });

  it("preserves readable requester names in titles", () => {
    expect(
      formatDeviceAuthorizationTitle("Device Authorization Request from Jane Doe"),
    ).toBe("Device Authorization Request from Jane Doe");
  });
});
