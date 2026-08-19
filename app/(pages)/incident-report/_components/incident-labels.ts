import type { IncidentStatus } from "./types";

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "OPEN",
  pending_review: "PENDING REVIEW",
  escalated: "ESCALATED",
  resolved: "RESOLVED",
  reopened: "REOPENED",
};

export function getIncidentStatusLabel(status: IncidentStatus): string {
  return INCIDENT_STATUS_LABELS[status];
}
