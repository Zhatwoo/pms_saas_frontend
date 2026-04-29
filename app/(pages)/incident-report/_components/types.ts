export type IncidentCategory =
  | "missing_inventory"
  | "cash_shortage"
  | "opening_cash"
  | "manager_escalation"
  | "transaction_mismatch"
  | "other";

export type IncidentPriority = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "pending_review" | "escalated" | "resolved" | "reopened";
export type IncidentSource = "auto" | "manual";
export type IncidentEventAction =
  | "reported"
  | "assigned"
  | "unassigned"
  | "escalated"
  | "resolved"
  | "reopened";

export interface IncidentTicketEvent {
  id: string;
  action: IncidentEventAction;
  actor_user_id: string | null;
  subject_user_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface IncidentTicketRow {
  id: string;
  ticket_no: string;
  title: string;
  summary: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  source: IncidentSource;
  branch_id: string;
  user_id: string | null;
  reported_by_user_id: string | null;
  escalation_owner_user_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  reopened_at: string | null;
  transaction_ref: string | null;
  amount_impact: number | null;
  requires_manager_escalation: boolean;
  reported_at: string;
  updated_at: string;
  incident_ticket_events?: IncidentTicketEvent[];
}

export interface UserRecord {
  id?: string;
  authId?: string;
  auth_id?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  role: string;
  branchId?: string | null;
  branch_id?: string | null;
}

export interface ManualTicketFormState {
  title: string;
  summary: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  branchId: string;
  userId: string;
  amountImpact: string;
  transactionRef: string;
  requiresManagerEscalation: boolean;
}
