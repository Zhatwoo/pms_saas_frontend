"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { ActionButton } from "@/components/shared/action-button";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { AddIncidentModal } from "@/app/(pages)/incident-report/_components/add-incident-modal";
import { IncidentHistoryModal } from "@/app/(pages)/incident-report/_components/incident-history-modal";
import type {
  IncidentCategory,
  IncidentPriority,
  IncidentSource,
  IncidentStatus,
  IncidentTicketRow,
  ManualTicketFormState,
  UserRecord,
} from "@/app/(pages)/incident-report/_components/types";

const LEGACY_STORAGE_KEY = "pms-incident-tickets-v1";

const categoryOptions: Array<{ value: IncidentCategory; label: string }> = [
  { value: "missing_inventory", label: "Missing Inventory" },
  { value: "cash_shortage", label: "Cash Shortage" },
  { value: "opening_cash", label: "Opening Cash Issue" },
  { value: "manager_escalation", label: "Escalation to Manager" },
  { value: "transaction_mismatch", label: "Transaction Mismatch" },
  { value: "other", label: "Other Money Incident" },
];

const priorityOptions: Array<{ value: IncidentPriority; label: string }> = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusOptions: Array<{ value: IncidentStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "pending_review", label: "Pending Review" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "reopened", label: "Reopened" },
];

function formatCurrency(value: number | null) {
  if (value == null) return "-";
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCategoryLabel(value: IncidentCategory) {
  return categoryOptions.find((option) => option.value === value)?.label ?? value;
}

function getPriorityBadgeClasses(priority: IncidentPriority) {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "low":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getStatusBadgeClasses(status: IncidentStatus) {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-700 border-red-200";
    case "pending_review":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "escalated":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "resolved":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "reopened":
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function getUserName(record: UserRecord | null | undefined) {
  if (!record) return "Unassigned Staff";
  return record.fullName ?? record.full_name ?? record.email;
}

function buildInitialFormState(branchId: string): ManualTicketFormState {
  return {
    title: "",
    summary: "",
    category: "other",
    priority: "medium",
    branchId: branchId,
    userId: "",
    amountImpact: "",
    transactionRef: "",
    requiresManagerEscalation: false,
  };
}

export default function EmployeeIncidentReportPage() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tickets, setTickets] = useState<IncidentTicketRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ticketToView, setTicketToView] = useState<IncidentTicketRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formState, setFormState] = useState<ManualTicketFormState>(
    buildInitialFormState(selectedBranch.id),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      branchId: selectedBranch.id,
    }));
  }, [selectedBranch.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoadingUsers(true);
      try {
        const response = await api.get<UserRecord[]>("/users").catch(() => [] as UserRecord[]);
        if (isMounted) {
          setUsers(response ?? []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load users for incident report:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setErrorMessage(null);
    try {
      const queryString = selectedBranch.id
        ? `?branch=${encodeURIComponent(selectedBranch.id)}`
        : "";
      const data = await api.get<IncidentTicketRow[]>(`/incident-tickets${queryString}`);
      setTickets(data ?? []);
    } catch (error) {
      console.error("Failed to load incident tickets:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load incident tickets.";
      setErrorMessage(message);
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [selectedBranch.id]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const userById = useMemo(() => {
    const map = new Map<string, UserRecord>();
    users.forEach((record) => {
      if (record.id) {
        map.set(record.id, record);
      }
    });
    return map;
  }, [users]);

  // EMPLOYEE RESTRICTION: Only show tickets reported by the current employee
  const employeeTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.reported_by_user_id === user?.id);
  }, [tickets, user?.id]);

  const filteredTickets = useMemo(() => {
    return employeeTickets.filter((ticket) => {
      const userName = getUserName(userById.get(ticket.user_id ?? ""));
      const reportedByName = getUserName(userById.get(ticket.reported_by_user_id ?? ""));

      const matchesSearch =
        searchQuery.trim().length === 0 ||
        [
          ticket.ticket_no,
          ticket.title,
          ticket.summary,
          selectedBranch.name,
          userName,
          reportedByName,
          ticket.transaction_ref ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employeeTickets, userById, searchQuery, statusFilter, selectedBranch.name]);

  const summary = useMemo(() => {
    const openCount = filteredTickets.filter((ticket) => ticket.status !== "resolved").length;
    const escalatedCount = filteredTickets.filter(
      (ticket) => ticket.status === "escalated" || ticket.requires_manager_escalation,
    ).length;
    const moneyCount = filteredTickets.filter((ticket) => ticket.amount_impact != null).length;
    const missingCount = filteredTickets.filter(
      (ticket) => ticket.category === "missing_inventory",
    ).length;

    return { openCount, escalatedCount, moneyCount, missingCount };
  }, [filteredTickets]);

  const openCreateModal = () => {
    setFormState(buildInitialFormState(selectedBranch.id));
    setIsCreateModalOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!user?.id) {
      setErrorMessage("Current user profile is missing.");
      return;
    }

    if (!formState.title.trim() || !formState.summary.trim()) {
      setToastMessage("Please complete the title and summary.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // EMPLOYEE RESTRICTION: Employee can only create tickets for themselves
      await api.post("/incident-tickets", {
        title: formState.title.trim(),
        summary: formState.summary.trim(),
        category: formState.category,
        priority: formState.priority,
        branchId: selectedBranch.id,
        userId: user.id,
        amountImpact: formState.amountImpact ? Number(formState.amountImpact) : null,
        transactionRef: formState.transactionRef.trim() || null,
        requiresManagerEscalation: false,
      });
    } catch (error) {
      console.error("Failed to create incident ticket:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create incident ticket.";
      setErrorMessage(message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsCreateModalOpen(false);
    setToastMessage("Incident ticket saved.");
    await fetchTickets();
  };

  const isLoading = isLoadingTickets || isLoadingUsers;
  const tableColumnCount = 5;

  return (
    <div className="space-y-6">
      {toastMessage ? (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl">
            {toastMessage}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-primary">My Incident Tickets</h2>
          <p className="text-xs text-text-muted">
            You can only view incident tickets you have submitted. Submit a new ticket to report any issues or concerns.
          </p>
        </div>
        <ActionButton variant="primary" onClick={openCreateModal}>
          <span className="flex items-center justify-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add Incident Ticket
          </span>
        </ActionButton>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border-main bg-surface shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Incident</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Reported</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-12 text-center text-text-tertiary">
                  <LoadingSpinnerLabel
                    text="Loading your incident tickets..."
                    className="justify-center text-sm text-text-tertiary"
                  />
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-12 text-center text-text-tertiary">
                  No incident tickets found. Start by adding one!
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const reportedByUser = ticket.reported_by_user_id
                  ? userById.get(ticket.reported_by_user_id)
                  : null;

                return (
                  <tr
                    key={ticket.id}
                    className="border-b border-border-subtle align-top transition-colors hover:bg-surface-secondary/50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-primary">{ticket.ticket_no}</p>
                      <p className="mt-1 text-xs text-text-muted">{ticket.transaction_ref ?? "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-text-primary">{ticket.title}</p>
                        <p className="max-w-[280px] text-xs leading-5 text-text-secondary">
                          {ticket.summary}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-border-main bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                            {getCategoryLabel(ticket.category)}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPriorityBadgeClasses(ticket.priority)}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-primary">{selectedBranch.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-text-primary">{formatDateTime(ticket.reported_at)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Updated {formatDateTime(ticket.updated_at)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(ticket.status)}`}
                        >
                          {ticket.status.replaceAll("_", " ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTicketToView(ticket)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-secondary/80"
                          aria-label={`View history for ${ticket.ticket_no}`}
                          title="History"
                        >
                          <History size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen ? (
        <AddIncidentModal
          formState={formState}
          setFormState={setFormState}
          branches={[selectedBranch]}
          users={[]}
          categoryOptions={categoryOptions}
          priorityOptions={priorityOptions}
          isLoadingUsers={isLoadingUsers}
          isSubmitting={isSubmitting}
          canSelectBranch={false}
          canSelectUser={false}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={() => void handleCreateTicket()}
          getUserName={getUserName}
        />
      ) : null}

      {ticketToView
        ? (() => {
            const reportedByUser = ticketToView.reported_by_user_id
              ? userById.get(ticketToView.reported_by_user_id)
              : null;

            return (
              <IncidentHistoryModal
                ticket={ticketToView}
                branchName={selectedBranch.name}
                incidentUserName="Anonymous"
                reportedByName={getUserName(reportedByUser)}
                assignedToName="Anonymous"
                resolvedByName="Anonymous"
                categoryLabel={getCategoryLabel(ticketToView.category)}
                priorityBadgeClassName={getPriorityBadgeClasses(ticketToView.priority)}
                statusBadgeClassName={getStatusBadgeClasses(ticketToView.status)}
                formatDateTime={formatDateTime}
                formatCurrency={formatCurrency}
                getUserNameById={() => "Anonymous"}
                onClose={() => setTicketToView(null)}
              />
            );
          })()
        : null}
    </div>
  );
}
