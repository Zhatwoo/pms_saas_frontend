"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import type { Column } from "@/components/shared/data-table";

interface CustomerData {
  id: string;
  full_name: string;
  contact_number: string;
  email: string;
  id_presented: string;
  id_number?: string | null;
  created_at: string;
}

interface CustomerListResponse {
  data?: CustomerData[];
}

type CustomerDetailData = CustomerData & {
  address?: string | null;
  branch_name?: string | null;
};

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  registered: string;
}

const columns: Column[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "idType", label: "ID Type" },
  { key: "idNumber", label: "ID Number" },
  { key: "registered", label: "Registered" },
];


function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function mapCustomerToRow(customer: CustomerData): CustomerRow {
  const idPresented = customer.id_presented?.trim() || "";

  return {
    id: customer.id,
    name: customer.full_name || "Unnamed Customer",
    phone: customer.contact_number || "-",
    email: customer.email?.trim() || "-",
    idType: idPresented || "-",
    idNumber: customer.id_number?.trim() || idPresented || "-",
    registered: formatDate(customer.created_at),
  };
}

async function loadCustomerDetails(customers: CustomerData[]) {
  return Promise.all(
    customers.map(async (customer) => {
      try {
        const details = await api.get<CustomerDetailData | null>(
          `/customers/${encodeURIComponent(customer.id)}`,
        );

        return details ? { ...customer, ...details } : customer;
      } catch {
        return customer;
      }
    }),
  );
}

export function CustomerTable() {
  const router = useRouter();
  const { selectedBranch, isAllBranches } = useBranch();
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      setError(null);
      try {
        const branchParam = isAllBranches ? "" : `?branchId=${encodeURIComponent(selectedBranch.id)}`;
        const response = await api.get<CustomerData[] | CustomerListResponse>(
          `/customers${branchParam}`,
        );
        const data = Array.isArray(response) ? response : response.data ?? [];
        const enrichedCustomers = await loadCustomerDetails(data);
        setCustomers(enrichedCustomers.map(mapCustomerToRow));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load customers.";
        setError(message);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCustomers();
  }, [selectedBranch.id, isAllBranches]);

  useEffect(() => {
    setCurrentPage(1);
  }, [customers.length]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage]);

  return (
    <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-emerald-text">
          Customer Management
        </h3>
      </div>

      {error && (
        <p className="px-5 pb-2 text-xs text-red-500">{error}</p>
      )}

        <DataTable
          columns={columns}
          data={paginatedCustomers}
          isLoading={isLoading}
          loadingMessage="Loading customers..."
          onRowClick={(row) => router.push(`/employee/customers/view_user?id=${row.id}`)}
          renderCell={(key, value) => {
            return value as ReactNode;
          }}
        />

        {/* Pagination */}
        {customers.length > 0 && !isLoading && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={customers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
    </div>
  );
}
