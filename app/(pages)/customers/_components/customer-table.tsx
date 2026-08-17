"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import type { Column } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

interface CustomerApiRecord {
  id: string;
  full_name: string | null;
  contact_number: string | null;
  email: string | null;
  id_presented: string | null;
  branch_id: string | null;
  created_at: string;
}

interface CustomerListResponse {
  data?: CustomerApiRecord[];
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  idPresented: string;
  registered: string;
  branch: string;
  branchId: string | null;
}

const editIcon = (
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
    <path d="m18 2 4 4-10 10H8v-4L18 2z" />
    <path d="M13 6 18 11" />
  </svg>
);

const searchIcon = (
  <svg
    width="15"
    height="15"
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

const branchIcon = (
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
    <path d="M6 3v12" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

function formatRegisteredDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function mapCustomerRecord(
  customer: CustomerApiRecord,
  branchNames: Map<string, string>,
): CustomerRow {
  const branchLabel =
    (customer.branch_id && branchNames.get(customer.branch_id)) ||
    customer.branch_id ||
    "Unassigned";

  return {
    id: customer.id,
    name: customer.full_name?.trim() || "Unnamed Customer",
    phone: customer.contact_number?.trim() || "—",
    email: customer.email?.trim() || "—",
    idPresented: customer.id_presented?.trim() || "—",
    registered: formatRegisteredDate(customer.created_at),
    branch: branchLabel,
    branchId: customer.branch_id || null,
  };
}

export function CustomerTable() {
  const router = useRouter();
  const { branches, selectedBranch, isAllBranches } = useBranch();
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function openCustomer(customerId: string, mode?: "edit") {
    router.push(`/customers/view_user?id=${customerId}${mode ? `&mode=${mode}` : ""}`);
  }

  const branchNames = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const availableBranches = useMemo(
    () => branches.filter((b) => b.id !== "__all__"),
    [branches],
  );

  const columns = useMemo<Column[]>(() => {
    const baseColumns: Column[] = [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "idPresented", label: "ID Presented" },
    ];

    if (isAllBranches || branchFilter === "ALL") {
      baseColumns.push({ key: "branch", label: "Branch" });
    }

    baseColumns.push({ key: "registered", label: "Registered" });

    return baseColumns;
  }, [isAllBranches, branchFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setIsLoading(true);
      setError(null);

      if (cancelled) return;

      try {
        const queryParams = new URLSearchParams();
        if (!isAllBranches) {
          queryParams.set("branchId", selectedBranch.id);
        }
        queryParams.set("limit", "500");

        const response = await api.get<CustomerApiRecord[] | CustomerListResponse>(
          `/customers?${queryParams.toString()}`,
        );
        const data = Array.isArray(response) ? response : response.data ?? [];

        if (cancelled) return;

        const rows = data.map((customer) =>
          mapCustomerRecord(customer as CustomerApiRecord, branchNames),
        );
        setCustomers(rows);
      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : "Failed to load customers.";
        setCustomers([]);
        setError(message);
      }

      if (cancelled) return;

      setIsLoading(false);
    }

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [branchNames, isAllBranches, selectedBranch.id]);

  // Client-side filtering across customer name, phone, email, id, branch
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesBranch =
        branchFilter === "ALL" || customer.branchId === branchFilter;

      if (!matchesBranch) return false;

      if (!query) return true;

      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.idPresented.toLowerCase().includes(query) ||
        customer.branch.toLowerCase().includes(query)
      );
    });
  }, [customers, branchFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageCustomers = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPageSafe]);

  const hasActiveFilters = searchQuery.trim().length > 0 || branchFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setBranchFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-border-main bg-surface p-4 shadow-sm transition-colors duration-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                {searchIcon}
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by customer name, phone, email..."
                className="h-10 w-full rounded-lg border border-input-border bg-input-bg pl-9 pr-8 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-green"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Clear search"
                >
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Branch Filter Dropdown */}
            <div className="relative min-w-[180px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                {branchIcon}
              </span>
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-input-border bg-input-bg pl-9 pr-8 text-sm font-medium text-text-primary outline-none transition-colors focus:border-brand-green cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
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
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-3.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors rounded-lg border border-border-main bg-surface-secondary hover:bg-surface w-fit"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Customer Count Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-text-tertiary">
            <span>
              Showing <strong className="text-text-primary font-semibold">{filteredCustomers.length}</strong> of {customers.length} customers
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-main/50">
          <h3 className="text-base font-semibold text-emerald-text flex items-center gap-2">
            Customer Directory
            {branchFilter !== "ALL" && (
              <span className="text-xs font-normal text-text-tertiary">
                ({availableBranches.find((b) => b.id === branchFilter)?.name || "Branch"})
              </span>
            )}
          </h3>
        </div>

        <DataTable
          columns={columns}
          data={pageCustomers}
          onRowClick={(row) => openCustomer(row.id)}
          isLoading={isLoading}
          loadingMessage="Loading customers..."
          emptyMessage={
            error
              ? error
              : hasActiveFilters
              ? "No customers match your search criteria. Try adjusting your search term or branch filter."
              : "No customers found for the selected branch."
          }
          renderCell={(key, value, row) => {
            if (key === "actions") {
              return (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openCustomer(row.id, "edit");
                  }}
                  className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-emerald-text transition-colors hover:bg-emerald-surface/50"
                  title={`Edit ${row.name}`}
                >
                  {editIcon}
                </button>
              );
            }

            return value as ReactNode;
          }}
        />

        {!isLoading && filteredCustomers.length > 0 && (
          <PaginationFooter
            currentPage={currentPageSafe}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
