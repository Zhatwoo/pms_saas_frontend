"use client";

import { X } from "lucide-react";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { BranchOption } from "@/contexts/branch-context";
import { formatAmountInput } from "@/lib/currency";
import {
  getBranchManagers,
  getDefaultEscalationOwnerUserId,
  resolveEscalationOwnerUserId,
} from "./incident-manager";
import type {
  IncidentCategory,
  IncidentPriority,
  ManualTicketFormState,
  UserRecord,
} from "./types";

interface IncidentOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface AddIncidentModalProps {
  formState: ManualTicketFormState;
  setFormState: Dispatch<SetStateAction<ManualTicketFormState>>;
  branches: BranchOption[];
  users: UserRecord[];
  allUsers?: UserRecord[];
  categoryOptions: Array<IncidentOption<IncidentCategory>>;
  priorityOptions: Array<IncidentOption<IncidentPriority>>;
  isLoadingUsers: boolean;
  isSubmitting: boolean;
  canSelectBranch: boolean;
  canSelectUser: boolean;
  involvedUserName?: string;
  mode?: "create" | "edit";
  onClose: () => void;
  onSubmit: () => void;
  getUserName: (record: UserRecord | null | undefined) => string;
}

export function AddIncidentModal({
  formState,
  setFormState,
  branches,
  users,
  allUsers,
  categoryOptions,
  priorityOptions,
  isLoadingUsers,
  isSubmitting,
  canSelectBranch,
  canSelectUser,
  involvedUserName = "Current user",
  mode = "create",
  onClose,
  onSubmit,
  getUserName,
}: AddIncidentModalProps) {
  const isEditMode = mode === "edit";
  const managerSource = allUsers ?? users;
  const branchManagers = useMemo(
    () => getBranchManagers(managerSource, formState.branchId),
    [managerSource, formState.branchId],
  );
  const selectedManager = branchManagers.find(
    (record) => record.id === formState.escalationOwnerUserId,
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4">
      <div
        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {isEditMode ? "Edit Incident Ticket" : "Create Incident Ticket"}
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">
              {isEditMode
                ? "Update the details of your submitted ticket. Changes apply only to tickets you created."
                : "Use this form to report an incident. Your submission will be logged and reviewed by our team."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-main p-2 text-text-secondary transition-colors hover:bg-surface-secondary"
            aria-label="Close incident ticket modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Title</span>
            <input
              type="text"
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Short incident title"
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-green focus:outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Category</span>
            <select
              value={formState.category}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  category: event.target.value as IncidentCategory,
                }))
              }
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:border-brand-green focus:outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Summary</span>
            <textarea
              value={formState.summary}
              onChange={(event) =>
                setFormState((current) => ({ ...current, summary: event.target.value }))
              }
              rows={4}
              placeholder="Describe what happened and why the ticket needs attention."
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-green focus:outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Priority</span>
            <select
              value={formState.priority}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  priority: event.target.value as IncidentPriority,
                }))
              }
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:border-brand-green focus:outline-none"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Branch</span>
            <select
              value={formState.branchId}
              onChange={(event) => {
                const branchId = event.target.value;
                setFormState((current) => ({
                  ...current,
                  branchId,
                  userId: "",
                  escalationOwnerUserId: current.requiresManagerEscalation
                    ? getDefaultEscalationOwnerUserId(managerSource, branchId)
                    : "",
                }));
              }}
              disabled={!canSelectBranch}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:border-brand-green focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          {!isEditMode ? (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
                User Involved
              </span>
              <div
                aria-readonly="true"
                className="w-full cursor-default rounded-lg border border-input-border bg-surface-secondary px-3 py-2.5 text-sm font-medium text-text-primary"
              >
                {involvedUserName}
              </div>
            </div>
          ) : null}

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Amount Impact</span>
            <input
              type="text"
              inputMode="decimal"
              value={formState.amountImpact}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  amountImpact: formatAmountInput(event.target.value),
                }))
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-green focus:outline-none"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Transaction Reference</span>
            <input
              type="text"
              value={formState.transactionRef}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  transactionRef: event.target.value,
                }))
              }
              placeholder="Ticket no., transaction no., inventory reference, or note"
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-green focus:outline-none"
            />
          </label>

          {canSelectUser ? (
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-start gap-3 rounded-xl border border-border-main bg-surface-secondary/50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formState.requiresManagerEscalation}
                  onChange={(event) => {
                    const requiresManagerEscalation = event.target.checked;
                    setFormState((current) => ({
                      ...current,
                      requiresManagerEscalation,
                      escalationOwnerUserId: requiresManagerEscalation
                        ? getDefaultEscalationOwnerUserId(
                            managerSource,
                            current.branchId,
                          )
                        : "",
                    }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-border-main"
                />
                <span>
                  <span className="block text-sm font-semibold text-text-primary">
                    Escalate directly to manager
                  </span>
                  <span className="mt-1 block text-xs text-text-tertiary">
                    This will save the ticket with escalated status and assign a
                    manager if one is available.
                  </span>
                </span>
              </label>

              {formState.requiresManagerEscalation ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <span className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                    Assigned Manager / Approver
                  </span>
                  {branchManagers.length === 0 ? (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      No branch admin is available for this branch. The ticket
                      will still be escalated without an assignee.
                    </p>
                  ) : branchManagers.length === 1 ? (
                    <p className="mt-2 text-sm font-semibold text-text-primary">
                      {getUserName(branchManagers[0])}
                    </p>
                  ) : (
                    <select
                      value={resolveEscalationOwnerUserId(
                        formState.escalationOwnerUserId,
                        managerSource,
                        formState.branchId,
                      )}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          escalationOwnerUserId: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:border-brand-green focus:outline-none"
                    >
                      {branchManagers.map((record) => (
                        <option key={record.id} value={record.id}>
                          {getUserName(record)}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedManager ? (
                    <p className="mt-2 text-xs text-text-tertiary">
                      This manager will be assigned as the approver when the
                      ticket is saved.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-text-muted">
            {isLoadingUsers
              ? "Loading branch users..."
              : "This form writes directly to the Supabase table."}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-main px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="rounded-lg border border-brand-green bg-brand-green px-4 py-2 text-sm font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
