"use client";

import {
  Clock,
  FileText,
  GitPullRequestArrow,
  RotateCcw,
  ShieldCheck,
  UserMinus,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { IncidentEventAction, IncidentTicketEvent, IncidentTicketRow } from "./types";

interface IncidentHistoryModalProps {
  ticket: IncidentTicketRow;
  branchName: string;
  incidentUserName: string;
  reportedByName: string;
  assignedToName: string;
  resolvedByName: string;
  categoryLabel: string;
  priorityBadgeClassName: string;
  statusBadgeClassName: string;
  formatDateTime: (value: string) => string;
  formatCurrency: (value: number | null) => string;
  getUserNameById: (userId: string | null | undefined) => string;
  onClose: () => void;
}

interface TimelineItem {
  key: string;
  title: string;
  description: string;
  timestamp?: string | null;
  meta?: string;
  icon: ReactNode;
  tone: string;
}

export function IncidentHistoryModal({
  ticket,
  branchName,
  incidentUserName,
  reportedByName,
  assignedToName,
  resolvedByName,
  categoryLabel,
  priorityBadgeClassName,
  statusBadgeClassName,
  formatDateTime,
  formatCurrency,
  getUserNameById,
  onClose,
}: IncidentHistoryModalProps) {
  const fallbackTimeline: TimelineItem[] = [
    {
      key: "reported",
      title: "Incident reported",
      description: ticket.summary,
      timestamp: ticket.reported_at,
      meta: `Reported by ${reportedByName}`,
      icon: <FileText size={16} />,
      tone: "bg-slate-100 text-slate-700",
    },
  ];

  if (ticket.requires_manager_escalation || ticket.escalation_owner_user_id) {
    fallbackTimeline.push({
      key: "current-assignment",
      title: ticket.requires_manager_escalation ? "Escalated for manager action" : "Assigned",
      description:
        ticket.escalation_owner_user_id && assignedToName !== "Unassigned Staff"
          ? `Assigned to ${assignedToName}.`
          : "Awaiting manager assignment.",
      timestamp: ticket.updated_at,
      meta: branchName,
      icon: <GitPullRequestArrow size={16} />,
      tone: "bg-violet-100 text-violet-700",
    });
  }

  if (ticket.resolved_at || ticket.resolution_notes || ticket.resolved_by) {
    fallbackTimeline.push({
      key: "current-resolution",
      title: "Ticket resolved",
      description: ticket.resolution_notes || "No resolution notes recorded.",
      timestamp: ticket.resolved_at,
      meta: `Resolved by ${resolvedByName}`,
      icon: <ShieldCheck size={16} />,
      tone: "bg-emerald-100 text-emerald-700",
    });
  }

  if (ticket.reopened_at) {
    fallbackTimeline.push({
      key: "current-reopen",
      title: "Ticket reopened",
      description: "Ticket was reopened. Resolution records remain attached for audit.",
      timestamp: ticket.reopened_at,
      meta: branchName,
      icon: <RotateCcw size={16} />,
      tone: "bg-amber-100 text-amber-700",
    });
  }

  const timeline =
    ticket.incident_ticket_events && ticket.incident_ticket_events.length > 0
      ? ticket.incident_ticket_events.map((event) =>
          mapEventToTimelineItem(event, branchName, getUserNameById),
        )
      : fallbackTimeline;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4 dark:[&_.text-text-primary]:text-slate-50 dark:[&_.text-text-secondary]:text-slate-100 dark:[&_.text-text-tertiary]:text-slate-300 dark:[&_.text-text-muted]:text-slate-300 dark:[&_.text-slate-700]:text-slate-200 dark:[&_.text-slate-600]:text-slate-300 dark:[&_.text-slate-500]:text-slate-300 dark:[&_.text-slate-400]:text-slate-200">
      <div className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                {ticket.ticket_no}
              </p>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBadgeClassName}`}
              >
                {ticket.status.replaceAll("_", " ")}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-text-primary">{ticket.title}</h2>
            <p className="mt-1 text-sm text-text-tertiary">{branchName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-main p-2 text-text-secondary transition-colors hover:bg-surface-secondary"
            aria-label="Close incident history modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="space-y-4">
              <div className="rounded-xl border border-border-main bg-surface-secondary/40 p-4">
                <h3 className="text-sm font-bold text-text-primary">Ticket Details</h3>
                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Category</dt>
                    <dd className="mt-1 text-text-primary">{categoryLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Priority</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${priorityBadgeClassName}`}
                      >
                        {ticket.priority}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">User Involved</dt>
                    <dd className="mt-1 text-text-primary">{incidentUserName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Reported By</dt>
                    <dd className="mt-1 text-text-primary">{reportedByName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Assigned To</dt>
                    <dd className="mt-1 text-text-primary">{assignedToName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Money Impact</dt>
                    <dd className="mt-1 text-text-primary">{formatCurrency(ticket.amount_impact)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Transaction Reference</dt>
                    <dd className="mt-1 text-text-primary">{ticket.transaction_ref || "-"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-border-main bg-surface-secondary/40 p-4">
                <h3 className="text-sm font-bold text-text-primary">Summary</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                  {ticket.summary}
                </p>
              </div>
            </section>

            <section className="flex min-h-0 max-h-[60vh] flex-col rounded-xl border border-border-main bg-surface-secondary/40 lg:max-h-[560px]">
              <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-5 py-4">
                <Clock size={16} className="text-text-muted" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary">History</h3>
                  <p className="text-xs text-text-tertiary">Ticket events and resolution audit trail</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-0 overflow-y-auto px-5 py-2 pr-3">
                {timeline.map((item, index) => (
                  <div key={item.key} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-4 flex h-9 w-9 items-center justify-center rounded-full ${item.tone}`}
                      >
                        {item.icon}
                      </span>
                      {index < timeline.length - 1 ? (
                        <span className="h-full min-h-10 w-px bg-border-subtle" />
                      ) : null}
                    </div>
                    <div className="py-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-text-primary">{item.title}</p>
                          {item.meta ? (
                            <p className="mt-1 text-xs text-text-muted">{item.meta}</p>
                          ) : null}
                        </div>
                        <p className="text-xs text-text-tertiary">
                          {item.timestamp ? formatDateTime(item.timestamp) : "-"}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapEventToTimelineItem(
  event: IncidentTicketEvent,
  branchName: string,
  getUserNameById: (userId: string | null | undefined) => string,
): TimelineItem {
  const actorName = getUserNameById(event.actor_user_id);
  const subjectName = getUserNameById(event.subject_user_id);
  const actionConfig = getActionConfig(event.action);
  const description = getEventDescription(event.action, event.notes, subjectName);

  return {
    key: event.id,
    title: actionConfig.title,
    description,
    timestamp: event.created_at,
    meta: event.action === "reported" ? `Reported by ${actorName}` : `${actorName} • ${branchName}`,
    icon: actionConfig.icon,
    tone: actionConfig.tone,
  };
}

function getActionConfig(action: IncidentEventAction) {
  switch (action) {
    case "reported":
      return {
        title: "Incident reported",
        icon: <FileText size={16} />,
        tone: "bg-slate-100 text-slate-700",
      };
    case "assigned":
      return {
        title: "Assigned",
        icon: <GitPullRequestArrow size={16} />,
        tone: "bg-violet-100 text-violet-700",
      };
    case "unassigned":
      return {
        title: "Assignment removed",
        icon: <UserMinus size={16} />,
        tone: "bg-slate-100 text-slate-700",
      };
    case "escalated":
      return {
        title: "Escalated",
        icon: <GitPullRequestArrow size={16} />,
        tone: "bg-violet-100 text-violet-700",
      };
    case "resolved":
      return {
        title: "Ticket resolved",
        icon: <ShieldCheck size={16} />,
        tone: "bg-emerald-100 text-emerald-700",
      };
    case "reopened":
      return {
        title: "Ticket reopened",
        icon: <RotateCcw size={16} />,
        tone: "bg-amber-100 text-amber-700",
      };
  }
}

function getEventDescription(
  action: IncidentEventAction,
  notes: string | null,
  subjectName: string,
) {
  if (notes?.trim()) return notes;

  switch (action) {
    case "assigned":
      return `Assigned to ${subjectName}.`;
    case "unassigned":
      return "Ticket assignment was removed.";
    case "escalated":
      return subjectName === "Unassigned Staff"
        ? "Ticket escalated for manager action."
        : `Ticket escalated to ${subjectName}.`;
    case "resolved":
      return "Ticket was resolved.";
    case "reopened":
      return "Ticket was reopened. Resolution records remain attached for audit.";
    case "reported":
      return "Ticket was created.";
  }
}
