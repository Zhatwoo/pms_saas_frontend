import type { BranchFilter, BranchOption, RoleFilter } from "../page";
import { ActionButton } from "@/components/shared/action-button";

interface UserActionsProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;
  onExportUsers: () => void;
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

const downloadIcon = (
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
  onExportUsers,
  canCreateUser,
  onCreateUser,
  showSuperAdminRoleTab = false,
}: UserActionsProps) {
  const roleTabs = showSuperAdminRoleTab
    ? [baseRoleTabs[0], baseRoleTabs[1], superAdminTab, ...baseRoleTabs.slice(2)]
    : baseRoleTabs;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-center">
          {/* Search Field */}
          <div className="relative w-full shrink-0 md:w-[200px] xl:w-[240px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {searchIcon}
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search users..."
              className="h-10 w-full rounded-md border border-input-border bg-input-bg pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-green"
            />
          </div>

          {/* Role Filters */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {roleTabs.map((tab) => {
              const isActive = roleFilter === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onRoleFilterChange(tab.value)}
                  className={`shrink-0 rounded border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all hover:opacity-80 active:scale-95 ${
                    isActive
                      ? "border-brand-green bg-brand-green text-white shadow-sm"
                      : "border-border-main bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex w-full shrink-0 flex-col gap-2 border-t border-border-main pt-4 sm:flex-row sm:items-stretch lg:w-auto lg:border-none lg:pt-0">
          <ActionButton
            variant="outline"
            className="w-full h-10 min-w-0 border-brand-green bg-brand-green/10 text-brand-green sm:flex-1 lg:w-auto lg:flex-none"
            onClick={onExportUsers}
          >
            <span className="flex min-w-0 items-center justify-center gap-1.5">
              {downloadIcon}
              <span className="truncate">Export CSV</span>
            </span>
          </ActionButton>
          {canCreateUser && (
            <ActionButton
              variant="primary"
              onClick={onCreateUser}
              className="w-full h-10 min-w-0 sm:flex-1 lg:w-auto lg:flex-none"
            >
              <span className="flex min-w-0 items-center justify-center gap-1.5">
                {plusIcon}
                <span className="truncate">Create User</span>
              </span>
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
