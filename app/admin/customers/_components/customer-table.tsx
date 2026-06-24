"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { PaginationFooter } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import type { Column } from "@/components/shared/data-table";
import { ActionButton } from "@/components/shared/action-button";
import { AddCustomerModal } from "./add-customer-modal";
import type { CustomerFormInput } from "./add-customer-modal";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

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

const columns: Column[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "idType", label: "ID Type" },
  { key: "idNumber", label: "ID Number" },
  { key: "registered", label: "Registered" },
];

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

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  registered: string;
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

export function CustomerTable() {
  const router = useRouter();
  const { selectedBranch, isAllBranches } = useBranch();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const branchParam = isAllBranches ? "" : `?branchId=${encodeURIComponent(selectedBranch.id)}`;
      const response = await api.get<CustomerData[] | CustomerListResponse>(
        `/customers${branchParam}`,
      );
      const data = Array.isArray(response) ? response : response.data ?? [];
      setCustomers(data.map(mapCustomerToRow));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load customers.";
      setError(message);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAllBranches, selectedBranch.id]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [customers.length]);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return customers.slice(start, start + itemsPerPage);
  }, [customers, currentPage]);

  async function handleSaveCustomer(input: CustomerFormInput) {
    try {
      await api.post("/customers", {
        full_name: input.fullName,
        contact_number: input.phoneNumber,
        email: input.email,
        address: input.address,
        id_presented: input.idType,
        id_number: input.idNumber,
        branch_id: selectedBranch.id,
      });
      setIsAddModalOpen(false);
      await loadCustomers();
    } catch (err) {
      console.error("Failed to save customer:", err);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-emerald-text">
            Customer Management
            {!isAllBranches && (
              <span className="ml-2 text-xs font-normal text-text-tertiary">
                — {selectedBranch.name}
              </span>
            )}
          </h3>
          <ActionButton variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <span className="flex items-center justify-center gap-1.5">
              {plusIcon}
              Add New Customer
            </span>
          </ActionButton>
        </div>


        {error && (
          <p className="px-5 pb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginatedCustomers}
          isLoading={isLoading}
          loadingMessage="Loading customers..."
          onRowClick={(row) => router.push(`/admin/customers/view_user?id=${row.id}`)}
          renderCell={(key, value, row) => {
            
            return value;
          }}
        />

        {/* Pagination */}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={customers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveCustomer}
        />
      )}
    </>
  );
}
