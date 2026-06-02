"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { ActionButton } from "@/components/shared/action-button";
import { useAuth } from "@/contexts/auth-context";
import { ALL_BRANCHES_OPTION, useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { subscribeToIncidentReportNotifications } from "@/lib/notification-stream";
import { AddIncidentModal } from "./_components/add-incident-modal";
import { IncidentHistoryModal } from "./_components/incident-history-modal";
import { ResolveIncidentModal } from "./_components/resolve-incident-modal";
import type {
  IncidentCategory,
  IncidentPriority,
  IncidentSource,
  IncidentStatus,
  IncidentTicketRow,
  ManualTicketFormState,
  UserRecord,
} from "./_components/types";

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

function getSourceBadgeClasses(source: IncidentSource) {
  return source === "auto"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
}

function getUserName(record: UserRecord | null | undefined) {
  if (!record) return "Unassigned Staff";
  return record.fullName ?? record.full_name ?? record.email;
}

function getUserBranchId(record: UserRecord) {
  return record.branchId ?? record.branch_id ?? null;
}

function getResolvedByName(record: UserRecord | null | undefined, resolvedBy: string | null) {
  if (record) return getUserName(record);
  return resolvedBy ? `User ${resolvedBy}` : "Unassigned Staff";
}

function getPrivateIncidentUserName(
  record: UserRecord | null | undefined,
  currentUser: { id: string; role: string; branchId?: string | null } | null | undefined,
) {
  if (!record) return "Anonymous";
  // SUPER ADMIN: Can see all user names
  if (currentUser?.role === "super_admin") return getUserName(record);
  if (currentUser?.role === "admin") {
    const role = record.role;
    const sameBranch = getUserBranchId(record) === currentUser.branchId;
    if (sameBranch && (role === "admin" || role === "employee")) {
      return getUserName(record);
    }
  }
  if (currentUser?.role === "employee" && record.id === currentUser.id) {
    return getUserName(record);
  }
  return "Anonymous";
}

function buildInitialFormState(defaultBranchId: string): ManualTicketFormState {
  return {
    title: "",
    summary: "",
    category: "other",
    priority: "medium",
    branchId: defaultBranchId,
    userId: "",
    amountImpact: "",
    transactionRef: "",
    requiresManagerEscalation: false,
  };
}

export default function IncidentReportPage() {
  const { user } = useAuth();
  const { branches, selectedBranch, isAllBranches } = useBranch();
  const isSuperAdmin = user?.role === "super_admin";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tickets, setTickets] = useState<IncidentTicketRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ticketToResolve, setTicketToResolve] = useState<IncidentTicketRow | null>(null);
  const [ticketToView, setTicketToView] = useState<IncidentTicketRow | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const realBranches = useMemo(
    () => branches.filter((branch) => branch.id !== ALL_BRANCHES_OPTION.id),
    [branches],
  );
  const defaultBranchId = isAllBranches ? realBranches[0]?.id ?? "" : selectedBranch.id;
  const [formState, setFormState] = useState<ManualTicketFormState>(
    buildInitialFormState(defaultBranchId),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      branchId: current.branchId || defaultBranchId,
    }));
  }, [defaultBranchId]);

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
      const queryString =
        !isAllBranches && selectedBranch.id
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
  }, [isAllBranches, selectedBranch.id]);

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

  const branchNameById = useMemo(() => {
    return new Map(realBranches.map((branch) => [branch.id, branch.name]));
  }, [realBranches]);

  const userById = useMemo(() => {
    const map = new Map<string, UserRecord>();
    users.forEach((record) => {
      if (record.id) {
        map.set(record.id, record);
      }
    });
    return map;
  }, [users]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // SUPER ADMIN: No restrictions - sees all tickets
      const branchName =
        branchNameById.get(ticket.branch_id) ??
        (ticket.branch_id === selectedBranch.id ? selectedBranch.name : ticket.branch_id);
      const userName = getUserName(userById.get(ticket.user_id ?? ""));
      const reportedByName = getUserName(userById.get(ticket.reported_by_user_id ?? ""));

      const matchesSearch =
        searchQuery.trim().length === 0 ||
        [
          ticket.ticket_no,
          ticket.title,
          ticket.summary,
          branchName,
          userName,
          reportedByName,
          ticket.transaction_ref ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesSource = sourceFilter === "all" || ticket.source === sourceFilter;
      const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSource &&
        matchesCategory
      );
    });
  }, [
    branchNameById,
    categoryFilter,
    priorityFilter,
    searchQuery,
    selectedBranch.id,
    selectedBranch.name,
    sourceFilter,
    statusFilter,
    tickets,
    userById,
  ]);

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

  // SUPER ADMIN: Can select any users from selected branches
  const formUsers = useMemo(() => {
    return users.filter((record) => {
      if (!formState.branchId) return true;
      return getUserBranchId(record) === formState.branchId;
    });
  }, [formState.branchId, users]);

  const openCreateModal = () => {
    setFormState(buildInitialFormState(defaultBranchId));
    setIsCreateModalOpen(true);
  };

  const getManagerIdForBranch = (branchId: string) => {
    return (
      users.find((record) => getUserBranchId(record) === branchId && record.role === "admin")
        ?.id ?? null
    );
  };

  const handleCreateTicket = async () => {
    // SUPER ADMIN: Can select branch explicitly
    const selectedBranchId = formState.branchId;
    const branch = realBranches.find((record) => record.id === selectedBranchId);

    if (!user?.id) {
      setErrorMessage("Current user profile is missing.");
      return;
    }

    if (!branch || !formState.title.trim() || !formState.summary.trim()) {
      setToastMessage("Please complete the branch, title, and summary.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post("/incident-tickets", {
        title: formState.title.trim(),
        summary: formState.summary.trim(),
        category: formState.category,
        priority: formState.priority,
        branchId: branch.id,
        userId: formState.userId || user.id,
        amountImpact: formState.amountImpact ? Number(formState.amountImpact) : null,
        transactionRef: formState.transactionRef.trim() || null,
        requiresManagerEscalation: formState.requiresManagerEscalation,
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

  const updateTicket = async (
    ticketId: string,
    patch: Partial<
      Pick<IncidentTicketRow, "status" | "requires_manager_escalation" | "escalation_owner_user_id">
    > & { resolutionNotes?: string },
  ) => {
    // SUPER ADMIN: Can always update tickets
    setErrorMessage(null);

    try {
      await api.fetch(`/incident-tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: patch.status,
          requiresManagerEscalation: patch.requires_manager_escalation,
          escalationOwnerUserId: patch.escalation_owner_user_id,
          resolutionNotes: patch.resolutionNotes,
        }),
      });
    } catch (error) {
      console.error("Failed to update incident ticket:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update incident ticket.";
      setErrorMessage(message);
      return;
    }

    setToastMessage("Incident ticket updated.");
    await fetchTickets();
  };

  const openResolveModal = (ticket: IncidentTicketRow) => {
    setTicketToResolve(ticket);
    setResolutionNotes("");
  };

  const closeResolveModal = () => {
    if (isSubmitting) return;
    setTicketToResolve(null);
    setResolutionNotes("");
  };

  const handleConfirmResolve = async () => {
    if (!ticketToResolve || !resolutionNotes.trim()) return;

    setIsSubmitting(true);
    await updateTicket(ticketToResolve.id, {
      status: "resolved",
      requires_manager_escalation: false,
      resolutionNotes: resolutionNotes.trim(),
    });
    setIsSubmitting(false);
    setTicketToResolve(null);
    setResolutionNotes("");
  };

  const handleReopenTicket = async (ticketId: string) => {
    await updateTicket(ticketId, {
      status: "reopened",
      requires_manager_escalation: false,
    });
  };

  const isLoading = isLoadingTickets || isLoadingUsers;
  // SUPER ADMIN: Always shows all columns (10 columns)
  const tableColumnCount = 10;

  return (
    <div className="space-y-6 dark:[&_.text-text-primary]:text-slate-50 dark:[&_.text-text-secondary]:text-slate-100 dark:[&_.text-text-tertiary]:text-slate-300 dark:[&_.text-text-muted]:text-slate-300 dark:[&_.border-border-main]:border-slate-700/70 dark:[&_.border-border-subtle]:border-slate-700/70 dark:[&_.text-slate-700]:text-slate-200 dark:[&_.text-slate-600]:text-slate-300 dark:[&_.text-slate-500]:text-slate-300 dark:[&_.text-slate-400]:text-slate-300 dark:[&_.text-slate-300]:text-slate-200">
      {toastMessage ? (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl">
            {toastMessage}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <ActionButton variant="primary" onClick={openCreateModal} className="w-full sm:w-auto lg:ml-auto">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Open Incidents</p>
          <p className="mt-2 text-3xl font-black text-text-primary">{summary.openCount}</p>
          <p className="mt-1 text-xs text-text-tertiary">Live count from Supabase table.</p>
        </div>
        <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Escalated</p>
          <p className="mt-2 text-3xl font-black text-violet-700">{summary.escalatedCount}</p>
          <p className="mt-1 text-xs text-text-tertiary">Tickets awaiting manager action.</p>
        </div>
        <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Money Related</p>
          <p className="mt-2 text-3xl font-black text-amber-700">{summary.moneyCount}</p>
          <p className="mt-1 text-xs text-text-tertiary">Rows with amount impact stored in table.</p>
        </div>
        <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Missing Inventory</p>
          <p className="mt-2 text-3xl font-black text-red-700">{summary.missingCount}</p>
          <p className="mt-1 text-xs text-text-tertiary">Rows categorized as inventory discrepancies.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(150px,auto))_auto] xl:items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search ticket, branch, user, or transaction reference..."
            className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none sm:col-span-2 xl:col-span-1"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Priority</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Source</option>
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || sourceFilter !== "all" || categoryFilter !== "all") ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setSourceFilter("all");
                setCategoryFilter("all");
              }}
              className="rounded-lg border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 xl:border-0 xl:px-0"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 xl:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-border-main bg-surface px-4 py-10 text-center text-text-tertiary shadow-sm">
            <LoadingSpinnerLabel
              text="Loading incident tickets from Supabase..."
              className="justify-center text-sm text-text-tertiary"
            />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-border-main bg-surface px-4 py-10 text-center text-sm text-text-tertiary shadow-sm">
            No incident tickets found in the Supabase table.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const branchName =
              branchNameById.get(ticket.branch_id) ??
              (ticket.branch_id === selectedBranch.id ? selectedBranch.name : ticket.branch_id);
            const incidentUser = ticket.user_id ? userById.get(ticket.user_id) : null;
            const reportedByUser = ticket.reported_by_user_id
              ? userById.get(ticket.reported_by_user_id)
              : null;
            const assignableUsers = users.filter((record) => {
              if (!record.id) return false;
              return record.role === "admin" && getUserBranchId(record) === ticket.branch_id;
            });

            return (
              <article
                key={ticket.id}
                className="rounded-xl border border-border-main bg-surface p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-text-primary">
                      {ticket.ticket_no}
                    </p>
                    <h3 className="mt-2 break-words text-base font-bold text-text-primary">
                      {ticket.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{ticket.summary}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(ticket.status)}`}
                    >
                      {ticket.status.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${getSourceBadgeClasses(ticket.source)}`}
                    >
                      {ticket.source}
                    </span>
                  </div>
                </div>

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

                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                      User Involved
                    </dt>
                    <dd className="mt-1 text-text-primary">{getUserName(incidentUser)}</dd>
                    <dd className="mt-1 text-xs text-text-muted">
                      Reported by {getUserName(reportedByUser)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                      Branch
                    </dt>
                    <dd className="mt-1 text-text-primary">{branchName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                      Money Impact
                    </dt>
                    <dd className="mt-1 font-semibold text-text-primary">
                      {formatCurrency(ticket.amount_impact)}
                    </dd>
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
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">
                      Assigned To
                    </dt>
                    <dd className="mt-1">
                      <select
                        value={ticket.escalation_owner_user_id ?? ""}
                        onChange={(event) =>
                          void updateTicket(ticket.id, {
                            escalation_owner_user_id: event.target.value || null,
                            requires_manager_escalation: Boolean(event.target.value),
                          })
                        }
                        disabled={ticket.status === "resolved"}
                        className="w-full rounded-lg border border-border-main bg-surface px-3 py-2 text-xs font-semibold text-text-primary focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Unassigned</option>
                        {assignableUsers.map((record) => (
                          <option key={record.id ?? record.email} value={record.id}>
                            {getUserName(record)}
                          </option>
                        ))}
                      </select>
                    </dd>
                    <dd className="mt-1 text-xs text-text-muted">
                      {ticket.requires_manager_escalation
                        ? "Manager action required"
                        : "Branch handling"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-4">
                  <button
                    type="button"
                    onClick={() => setTicketToView(ticket)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-secondary/80"
                    aria-label={`View history for ${ticket.ticket_no}`}
                    title="History"
                  >
                    <History size={15} />
                  </button>
                  {ticket.status !== "escalated" && ticket.status !== "resolved" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void updateTicket(ticket.id, {
                          status: "escalated",
                          escalation_owner_user_id: getManagerIdForBranch(ticket.branch_id),
                          requires_manager_escalation: true,
                        })
                      }
                      className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100"
                    >
                      Escalate
                    </button>
                  ) : null}
                  {ticket.status !== "resolved" ? (
                    <button
                      type="button"
                      onClick={() => openResolveModal(ticket)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleReopenTicket(ticket.id)}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border-main bg-surface shadow-sm xl:block">
        <table className={`w-full min-w-[1180px] text-sm`}>
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Incident</th>
              <th className="px-4 py-3">User Involved</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Money Impact</th>
              <th className="px-4 py-3">Reported</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-12 text-center text-text-tertiary">
                  <LoadingSpinnerLabel
                    text="Loading incident tickets from Supabase..."
                    className="justify-center text-sm text-text-tertiary"
                  />
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-12 text-center text-text-tertiary">
                  No incident tickets found in the Supabase table.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const branchName =
                  branchNameById.get(ticket.branch_id) ??
                  (ticket.branch_id === selectedBranch.id ? selectedBranch.name : ticket.branch_id);
                const incidentUser = ticket.user_id ? userById.get(ticket.user_id) : null;
                const reportedByUser = ticket.reported_by_user_id
                  ? userById.get(ticket.reported_by_user_id)
                  : null;
                const assignableUsers = users.filter((record) => {
                  if (!record.id) return false;
                  return record.role === "admin" && getUserBranchId(record) === ticket.branch_id;
                });

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
                      <p className="font-medium text-text-primary">{getUserName(incidentUser)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Reported by {getUserName(reportedByUser)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-primary">{branchName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(ticket.amount_impact)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-text-primary">{formatDateTime(ticket.reported_at)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Updated {formatDateTime(ticket.updated_at)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={ticket.escalation_owner_user_id ?? ""}
                        onChange={(event) =>
                          void updateTicket(ticket.id, {
                            escalation_owner_user_id: event.target.value || null,
                            requires_manager_escalation: Boolean(event.target.value),
                          })
                        }
                        disabled={ticket.status === "resolved"}
                        className="w-44 rounded-lg border border-border-main bg-surface px-3 py-2 text-xs font-semibold text-text-primary focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Unassigned</option>
                        {assignableUsers.map((record) => (
                          <option key={record.id ?? record.email} value={record.id}>
                            {getUserName(record)}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-text-muted">
                        {ticket.requires_manager_escalation
                          ? "Manager action required"
                          : "Branch handling"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(ticket.status)}`}
                      >
                        {ticket.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${getSourceBadgeClasses(ticket.source)}`}
                      >
                        {ticket.source}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTicketToView(ticket)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-main bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-secondary/80"
                          aria-label={`View history for ${ticket.ticket_no}`}
                          title="History"
                        >
                          <History size={15} />
                        </button>
                        {ticket.status !== "escalated" && ticket.status !== "resolved" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void updateTicket(ticket.id, {
                                status: "escalated",
                                escalation_owner_user_id: getManagerIdForBranch(ticket.branch_id),
                                requires_manager_escalation: true,
                              })
                            }
                            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100"
                          >
                            Escalate
                          </button>
                        ) : null}
                        {ticket.status !== "resolved" ? (
                          <button
                            type="button"
                            onClick={() => openResolveModal(ticket)}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            Resolve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleReopenTicket(ticket.id)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            Reopen
                          </button>
                        )}
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
          branches={realBranches}
          users={formUsers}
          categoryOptions={categoryOptions}
          priorityOptions={priorityOptions}
          isLoadingUsers={isLoadingUsers}
          isSubmitting={isSubmitting}
          canSelectBranch={true}
          canSelectUser={true}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={() => void handleCreateTicket()}
          getUserName={getUserName}
        />
      ) : null}

      {ticketToResolve ? (
        <ResolveIncidentModal
          ticketNo={ticketToResolve.ticket_no}
          title={ticketToResolve.title}
          notes={resolutionNotes}
          isSubmitting={isSubmitting}
          onNotesChange={setResolutionNotes}
          onClose={closeResolveModal}
          onConfirm={() => void handleConfirmResolve()}
        />
      ) : null}

      {ticketToView
        ? (() => {
            const branchName =
              branchNameById.get(ticketToView.branch_id) ??
              (ticketToView.branch_id === selectedBranch.id
                ? selectedBranch.name
                : ticketToView.branch_id);
            const incidentUser = ticketToView.user_id
              ? userById.get(ticketToView.user_id)
              : null;
            const reportedByUser = ticketToView.reported_by_user_id
              ? userById.get(ticketToView.reported_by_user_id)
              : null;
            const assignedUser = ticketToView.escalation_owner_user_id
              ? userById.get(ticketToView.escalation_owner_user_id)
              : null;
            const resolvedByUser = ticketToView.resolved_by
              ? userById.get(ticketToView.resolved_by)
              : null;

            return (
              <IncidentHistoryModal
                ticket={ticketToView}
                branchName={branchName}
                incidentUserName={getPrivateIncidentUserName(incidentUser, user)}
                reportedByName={getPrivateIncidentUserName(reportedByUser, user)}
                assignedToName={getPrivateIncidentUserName(assignedUser, user)}
                resolvedByName={
                  resolvedByUser
                    ? getPrivateIncidentUserName(resolvedByUser, user)
                    : ticketToView.resolved_by && isSuperAdmin
                      ? getResolvedByName(resolvedByUser, ticketToView.resolved_by)
                      : "Anonymous"
                }
                categoryLabel={getCategoryLabel(ticketToView.category)}
                priorityBadgeClassName={getPriorityBadgeClasses(ticketToView.priority)}
                statusBadgeClassName={getStatusBadgeClasses(ticketToView.status)}
                formatDateTime={formatDateTime}
                formatCurrency={formatCurrency}
                getUserNameById={(userId) =>
                  getPrivateIncidentUserName(userId ? userById.get(userId) : null, user)
                }
                onClose={() => setTicketToView(null)}
              />
            );
          })()
        : null}
    </div>
  );
}
