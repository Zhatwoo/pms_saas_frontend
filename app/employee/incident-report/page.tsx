"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { History } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { ActionButton } from "@/components/shared/action-button";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { subscribeToIncidentReportNotifications } from "@/lib/notification-stream";
import { AddIncidentModal } from "@/app/(pages)/incident-report/_components/add-incident-modal";
import { IncidentHistoryModal } from "@/app/(pages)/incident-report/_components/incident-history-modal";
import type {
  IncidentCategory,
  IncidentPriority,
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
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/30";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/30";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30";
    case "low":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/40";
  }
}

function getStatusBadgeClasses(status: IncidentStatus) {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/30";
    case "pending_review":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30";
    case "escalated":
      return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/30";
    case "resolved":
      return "bg-brand-green/10 text-brand-green border-brand-green/20";
    case "reopened":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30";
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
  const router = useRouter();
  const pathname = usePathname();
  const startingMismatchHandled = useRef(false);

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
    if (startingMismatchHandled.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("startingMismatch") !== "1") return;
    startingMismatchHandled.current = true;

    const expected = Number(params.get("expected"));
    const entered = Number(params.get("entered"));
    const businessDate = params.get("businessDate")?.trim() ?? "";
    if (!Number.isFinite(expected) || !Number.isFinite(entered)) {
      router.replace(pathname ?? "/employee/incident-report");
      return;
    }

    const variance = Number((entered - expected).toFixed(2));
    setFormState({
      ...buildInitialFormState(selectedBranch.id),
      title: `Branch opening cash variance (${businessDate || "Manila date"})`,
      summary: [
        "The system blocked starting the branch day because the entered starting cash did not match the expected amount from the last closed business day (ledger book ending).",
        "",
        `Expected (last book ending / suggested): PHP ${expected.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `Entered: PHP ${entered.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `Variance: PHP ${variance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        "",
        "Add any context for management (e.g. cash handed over, fund transfers) below, then submit this ticket.",
      ].join("\n"),
      category: "opening_cash",
      priority: "high",
      amountImpact: String(Math.abs(variance)),
      transactionRef: `branch-day-start:${businessDate || "unknown"}`,
    });
    setIsCreateModalOpen(true);
    setToastMessage(
      "Kailangan ng incident report dahil hindi tumugma ang starting cash sa inaasahang halaga.",
    );
    router.replace(pathname ?? "/employee/incident-report");
  }, [selectedBranch.id, router, pathname]);

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
    return subscribeToIncidentReportNotifications(() => {
      void fetchTickets();
    });
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
          <div className="rounded-xl border border-brand-green/40 bg-brand-green/10 px-5 py-3 text-sm font-semibold text-brand-green shadow-xl">
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
        <ActionButton variant="primary" onClick={openCreateModal} className="w-full sm:w-auto">
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

      <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,auto)_auto] sm:items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search ticket, branch, or transaction reference..."
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-green focus:outline-none"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:border-brand-green focus:outline-none"
          >
            <option value="all">All Status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {searchQuery || statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="rounded-lg border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-border-main bg-surface px-4 py-10 text-center text-text-tertiary shadow-sm">
            <LoadingSpinnerLabel
              text="Loading your incident tickets..."
              className="justify-center text-sm text-text-tertiary"
            />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-border-main bg-surface px-4 py-10 text-center text-sm text-text-tertiary shadow-sm">
            No incident tickets found. Start by adding one!
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-xl border border-border-main bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-text-primary">
                    {ticket.ticket_no}
                  </p>
                  <h3 className="mt-2 break-words text-base font-bold text-text-primary">
                    {ticket.title}
                  </h3>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(ticket.status)}`}
                >
                  {ticket.status.replaceAll("_", " ")}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-text-secondary">{ticket.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border-main bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                  {getCategoryLabel(ticket.category)}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPriorityBadgeClasses(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                    Branch
                  </dt>
                  <dd className="mt-1 text-text-primary">{selectedBranch.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                    Reported
                  </dt>
                  <dd className="mt-1 text-text-primary">{formatDateTime(ticket.reported_at)}</dd>
                  <dd className="mt-1 text-xs text-text-muted">
                    Updated {formatDateTime(ticket.updated_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                    Transaction
                  </dt>
                  <dd className="mt-1 break-words text-text-primary">
                    {ticket.transaction_ref ?? "-"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex justify-end border-t border-border-subtle pt-4">
                <button
                  type="button"
                  onClick={() => setTicketToView(ticket)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-secondary/80"
                  aria-label={`View history for ${ticket.ticket_no}`}
                  title="History"
                >
                  <History size={15} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20 md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-pawn-sidebar text-pawn-gold">
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Ticket</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Incident</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Branch</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Reported</th>
              <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">Status</th>
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
                return (
                  <tr
                    key={ticket.id}
                    className="border-t border-border-subtle align-top transition-colors bg-surface-secondary hover:bg-emerald-surface/60"
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
