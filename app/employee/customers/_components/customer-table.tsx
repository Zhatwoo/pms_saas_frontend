"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
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
  { key: "actions", label: "Actions", align: "center" },
];

const eyeIcon = (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

interface CustomerTableProps {
  branchName?: string;
}

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
  return {
    id: customer.id,
    name: customer.full_name || "Unnamed Customer",
    phone: customer.contact_number || "-",
    email: customer.email || "-",
    idType: customer.id_presented || "-",
    idNumber: customer.id_number || "-",
    registered: formatDate(customer.created_at),
  };
}

export function CustomerTable({ branchName: _branchName }: CustomerTableProps) {
  const router = useRouter();
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
        const data = await api.get<CustomerData[]>("/customers");
        setCustomers((data || []).map(mapCustomerToRow));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load customers.";
        setError(message);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCustomers();
  }, []);

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

      {isLoading && (
        <p className="px-5 pb-2 text-xs text-text-tertiary">Loading customers...</p>
      )}
      {error && (
        <p className="px-5 pb-2 text-xs text-red-500">{error}</p>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedCustomers}
        renderCell={(key, value, row) => {
          if (key === "actions") {
            return (
              <button
                onClick={() => router.push(`/employee/customers/view_user?id=${row.id}`)}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-emerald-text transition-colors hover:bg-emerald-surface/50"
                title={`View ${row.name}`}
              >
                {eyeIcon}
              </button>
            );
          }
          return value;
        }}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={customers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
