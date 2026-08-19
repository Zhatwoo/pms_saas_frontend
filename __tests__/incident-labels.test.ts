import { getIncidentStatusLabel } from "@/app/(pages)/incident-report/_components/incident-labels";

describe("getIncidentStatusLabel", () => {
  it("returns uppercase incident status labels", () => {
    expect(getIncidentStatusLabel("open")).toBe("OPEN");
    expect(getIncidentStatusLabel("pending_review")).toBe("PENDING REVIEW");
    expect(getIncidentStatusLabel("escalated")).toBe("ESCALATED");
    expect(getIncidentStatusLabel("resolved")).toBe("RESOLVED");
    expect(getIncidentStatusLabel("reopened")).toBe("REOPENED");
  });
});
