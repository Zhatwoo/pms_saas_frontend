"use client";

import { X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { BranchOption } from "@/contexts/branch-context";
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
  categoryOptions: Array<IncidentOption<IncidentCategory>>;
  priorityOptions: Array<IncidentOption<IncidentPriority>>;
  isLoadingUsers: boolean;
  isSubmitting: boolean;
  canSelectBranch: boolean;
  canSelectUser: boolean;
  onClose: () => void;
  onSubmit: () => void;
  getUserName: (record: UserRecord | null | undefined) => string;
}

export function AddIncidentModal({
  formState,
  setFormState,
  branches,
  users,
  categoryOptions,
  priorityOptions,
  isLoadingUsers,
  isSubmitting,
  canSelectBranch,
  canSelectUser,
  onClose,
  onSubmit,
  getUserName,
}: AddIncidentModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4 dark:[&_.text-text-primary]:text-slate-50 dark:[&_.text-text-secondary]:text-slate-100 dark:[&_.text-text-tertiary]:text-slate-300 dark:[&_.text-text-muted]:text-slate-300 dark:[&_.text-slate-700]:text-slate-200 dark:[&_.text-slate-600]:text-slate-300 dark:[&_.text-slate-500]:text-slate-300 dark:[&_.text-slate-400]:text-slate-200">
      <div
        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl sm:rounded-[1.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Create Incident Ticket</h2>
            <p className="mt-1 text-sm text-text-tertiary">
              Use this form to report an incident. Your submission will be logged and reviewed by our team.
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
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
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
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
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
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
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
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
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
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  branchId: event.target.value,
                  userId: "",
                }))
              }
              disabled={!canSelectBranch}
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          {canSelectUser ? (
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-muted">User Involved</span>
              <select
                value={formState.userId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, userId: event.target.value }))
                }
                className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Use current user</option>
                {users.filter((record) => record.id).map((record) => (
                  <option key={record.id ?? record.email} value={record.id}>
                    {getUserName(record)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Amount Impact</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.amountImpact}
              onChange={(event) =>
                setFormState((current) => ({ ...current, amountImpact: event.target.value }))
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
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
              className="w-full rounded-lg border border-border-main bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:outline-none"
            />
          </label>

          {canSelectUser ? (
            <label className="flex items-start gap-3 rounded-xl border border-border-main bg-surface-secondary/50 px-4 py-3 md:col-span-2">
              <input
                type="checkbox"
                checked={formState.requiresManagerEscalation}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    requiresManagerEscalation: event.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-border-main"
              />
              <span>
                <span className="block text-sm font-semibold text-text-primary">Escalate directly to manager</span>
                <span className="mt-1 block text-xs text-text-tertiary">
                  This will save the ticket with escalated status and assign a manager if one is available.
                </span>
              </span>
            </label>
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
              className="rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
