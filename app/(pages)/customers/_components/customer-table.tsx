"use client";

import { useEffect, useMemo, useState } from "react";
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

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  idPresented: string;
  registered: string;
  branch: string;
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
  };
}

export function CustomerTable() {
  const router = useRouter();
  const { branches, selectedBranch, isAllBranches } = useBranch();
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function openCustomer(customerId: string, mode?: "edit") {
    router.push(`/customers/view_user?id=${customerId}${mode ? `&mode=${mode}` : ""}`);
  }

  const branchNames = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const columns = useMemo<Column[]>(() => {
    const baseColumns: Column[] = [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "idPresented", label: "ID Presented" },
    ];

    if (isAllBranches) {
      baseColumns.push({ key: "branch", label: "Branch" });
    }

    baseColumns.push(
      { key: "registered", label: "Registered" },
      { key: "actions", label: "Actions", align: "center" },
    );

    return baseColumns;
  }, [isAllBranches]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setIsLoading(true);
      setError(null);

      if (cancelled) return;

      try {
        const branchParam = isAllBranches
          ? ""
          : `?branchId=${encodeURIComponent(selectedBranch.id)}`;
        const data = await api.get<CustomerApiRecord[]>(`/customers${branchParam}`);

        if (cancelled) return;

        const rows = (data ?? []).map((customer) =>
          mapCustomerRecord(customer as CustomerApiRecord, branchNames),
        );
        setCustomers(rows);
      } catch (error) {
        if (cancelled) return;

        const message = error instanceof Error ? error.message : "Failed to load customers.";
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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch.id, isAllBranches]);

  const totalPages = Math.max(1, Math.ceil(customers.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const pageCustomers = customers.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-emerald-text">
          Customer Management
        </h3>
      </div>

      <DataTable
        columns={columns}
        data={pageCustomers}
        onRowClick={(row) => openCustomer(row.id)}
        isLoading={isLoading}
        loadingMessage="Loading customers..."
        emptyMessage={error ? error : "No customers found for the selected branch."}
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

          return value;
        }}
      />

      {!isLoading && customers.length > 0 && (
        <PaginationFooter
          currentPage={currentPageSafe}
          totalPages={totalPages}
          totalItems={customers.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
