import type { IncidentTicketRow } from "./types";
import { formatAmountForInput } from "@/lib/currency";

export function getInvolvedUserLabel(
  user: { fullName?: string; email?: string } | null | undefined,
): string {
  const name = user?.fullName?.trim();
  if (name) return name;
  if (user?.email) return user.email;
  return "Current user";
}

export function canEditIncidentTicketContent(
  ticket: Pick<
    IncidentTicketRow,
    "reported_by_user_id" | "escalation_owner_user_id" | "status"
  >,
  userId?: string | null,
): boolean {
  if (!userId || ticket.status === "resolved") return false;
  if (ticket.reported_by_user_id === userId) return true;
  return ticket.escalation_owner_user_id === userId;
}

/** @deprecated Use canEditIncidentTicketContent */
export function canEditOwnIncidentTicket(
  ticket: Pick<
    IncidentTicketRow,
    "reported_by_user_id" | "escalation_owner_user_id" | "status"
  >,
  userId?: string | null,
): boolean {
  return canEditIncidentTicketContent(ticket, userId);
}

export function ticketToEditableFormState(
  ticket: IncidentTicketRow,
): {
  title: string;
  summary: string;
  category: IncidentTicketRow["category"];
  priority: IncidentTicketRow["priority"];
  branchId: string;
  userId: string;
  amountImpact: string;
  transactionRef: string;
  requiresManagerEscalation: boolean;
  escalationOwnerUserId: string;
} {
  return {
    title: ticket.title,
    summary: ticket.summary,
    category: ticket.category,
    priority: ticket.priority,
    branchId: ticket.branch_id,
    userId: ticket.user_id ?? "",
    amountImpact:
      ticket.amount_impact != null
        ? formatAmountForInput(ticket.amount_impact)
        : "",
    transactionRef: ticket.transaction_ref ?? "",
    requiresManagerEscalation: ticket.requires_manager_escalation,
    escalationOwnerUserId: ticket.escalation_owner_user_id ?? "",
  };
}
