import type { BranchFilter, BranchOption, RoleFilter } from "../page";
import { ActionButton } from "@/components/shared/action-button";

interface UserActionsProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;
  branchOptions: BranchOption[];
  branchFilter: BranchFilter;
  onBranchFilterChange: (value: BranchFilter) => void;
  canCreateUser: boolean;
  onCreateUser: () => void;
  /** Super Admin tab + filter; only for super_admin viewers */
  showSuperAdminRoleTab?: boolean;
}

const baseRoleTabs: { label: string; value: RoleFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Admins", value: "ADMIN" },
];

const superAdminTab: { label: string; value: RoleFilter } = {
  label: "Super Admin",
  value: "SUPER_ADMIN",
};

const searchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const exportIcon = (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const plusIcon = (
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
);

export function UserActions({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  branchOptions,
  branchFilter,
  onBranchFilterChange,
  canCreateUser,
  onCreateUser,
  showSuperAdminRoleTab = false,
}: UserActionsProps) {
  const roleTabs = showSuperAdminRoleTab
    ? [baseRoleTabs[0], baseRoleTabs[1], superAdminTab, ...baseRoleTabs.slice(2)]
    : baseRoleTabs;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {searchIcon}
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search users by name, email, or branch"
            className="h-10 w-full rounded-md border border-input-border bg-input-bg pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton variant="outline">
            <span className="flex items-center gap-1.5">
              {exportIcon}
              Export Users
            </span>
          </ActionButton>
          {canCreateUser && (
            <ActionButton variant="pawn" onClick={onCreateUser}>
              <span className="flex items-center gap-1.5">
                {plusIcon}
                Create User
              </span>
            </ActionButton>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {roleTabs.map((tab) => {
            const isActive = roleFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onRoleFilterChange(tab.value)}
                className={`rounded border px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80 ${
                  isActive
                    ? "border-emerald-700 bg-emerald-100 text-emerald-800"
                    : "border-border-main bg-surface text-text-secondary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="users-branch" className="text-sm font-medium text-text-tertiary">
            Branch
          </label>
          <select
            id="users-branch"
            value={branchFilter}
            onChange={(event) => onBranchFilterChange(event.target.value)}
            className="h-10 min-w-36 rounded-md border border-input-border bg-input-bg px-3 text-sm text-text-secondary outline-none transition-colors focus:border-emerald-700"
          >
            <option value="ALL">All</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
