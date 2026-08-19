import {
  canEditOwnIncidentTicket,
  canEditIncidentTicketContent,
  getInvolvedUserLabel,
  ticketToEditableFormState,
} from "@/app/(pages)/incident-report/_components/incident-permissions";
import type { IncidentTicketRow } from "@/app/(pages)/incident-report/_components/types";

const baseTicket: IncidentTicketRow = {
  id: "ticket-1",
  ticket_no: "INC-001",
  title: "Missing item",
  summary: "A watch is missing from storage.",
  category: "missing_inventory",
  priority: "high",
  status: "open",
  source: "manual",
  branch_id: "branch-1",
  user_id: "user-1",
  reported_by_user_id: "user-1",
  escalation_owner_user_id: null,
  resolved_by: null,
  resolved_at: null,
  resolution_notes: null,
  reopened_at: null,
  transaction_ref: "TX-100",
  amount_impact: 4500,
  requires_manager_escalation: false,
  reported_at: "2026-08-18T08:00:00.000Z",
  updated_at: "2026-08-18T08:00:00.000Z",
};

describe("getInvolvedUserLabel", () => {
  it("uses the signed-in user's name for the read-only field", () => {
    expect(getInvolvedUserLabel({ fullName: "Ryan Bang", email: "ryan@example.com" })).toBe(
      "Ryan Bang",
    );
    expect(getInvolvedUserLabel({ fullName: "", email: "ryan@example.com" })).toBe(
      "ryan@example.com",
    );
    expect(getInvolvedUserLabel(null)).toBe("Current user");
  });
});

describe("canEditIncidentTicketContent", () => {
  it("allows the creator or assigned manager to edit unresolved tickets", () => {
    expect(canEditIncidentTicketContent(baseTicket, "user-1")).toBe(true);
    expect(
      canEditIncidentTicketContent(
        { ...baseTicket, escalation_owner_user_id: "manager-1" },
        "manager-1",
      ),
    ).toBe(true);
  });

  it("blocks other users and resolved tickets", () => {
    expect(canEditIncidentTicketContent(baseTicket, "user-2")).toBe(false);
    expect(
      canEditIncidentTicketContent({ ...baseTicket, status: "resolved" }, "user-1"),
    ).toBe(false);
    expect(
      canEditIncidentTicketContent(
        { ...baseTicket, escalation_owner_user_id: "manager-1", status: "resolved" },
        "manager-1",
      ),
    ).toBe(false);
  });
});

describe("canEditOwnIncidentTicket", () => {
  it("delegates to canEditIncidentTicketContent", () => {
    expect(canEditOwnIncidentTicket(baseTicket, "user-1")).toBe(true);
    expect(canEditOwnIncidentTicket(baseTicket, "user-2")).toBe(false);
    expect(
      canEditOwnIncidentTicket({ ...baseTicket, status: "resolved" }, "user-1"),
    ).toBe(false);
  });
});

describe("ticketToEditableFormState", () => {
  it("maps ticket fields into the edit form state", () => {
    expect(ticketToEditableFormState(baseTicket)).toEqual({
      title: "Missing item",
      summary: "A watch is missing from storage.",
      category: "missing_inventory",
      priority: "high",
      branchId: "branch-1",
      userId: "user-1",
      amountImpact: "4,500",
      transactionRef: "TX-100",
      requiresManagerEscalation: false,
      escalationOwnerUserId: "",
    });
  });
});
