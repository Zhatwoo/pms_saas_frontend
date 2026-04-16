"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import type { Column } from "@/components/shared/data-table";
import { ActionButton } from "@/components/shared/action-button";
import { AddCustomerModal } from "./add-customer-modal";
import type { CustomerFormInput } from "./add-customer-modal";

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
  { key: "actions", label: "Actions", align: "center" },
];

const customers = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    phone: "09123456789",
    email: "juandelacruz@gmail.com",
    idType: "Driver's License",
    idNumber: "N5012345678",
    registered: "February 14, 2022",
  },
  {
    id: "2",
    name: "John Doe",
    phone: "09123456789",
    email: "jhondoe@gmail.com",
    idType: "National ID",
    idNumber: "72120002152",
    registered: "February 15, 2022",
  },
  {
    id: "3",
    name: "Park Jimin Neutron",
    phone: "09123456789",
    email: "jiminneutron@gmail.com",
    idType: "Passport",
    idNumber: "44443334444",
    registered: "February 16, 2022",
  },
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

export function CustomerTable() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  async function handleSaveCustomer(input: CustomerFormInput) {
    // TODO: Replace with actual API call once backend endpoint is ready
    console.log("New customer data:", input);
    setIsAddModalOpen(false);
  }

  return (
    <>
      <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-emerald-text">
            Customer Management
          </h3>
          <ActionButton variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <span className="flex items-center justify-center gap-1.5">
              {plusIcon}
              Add New Customer
            </span>
          </ActionButton>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={customers}
          renderCell={(key, value, row) => {
            if (key === "actions") {
              return (
                <button
                  onClick={() => router.push(`/admin/customers/view_user?id=${row.id}`)}
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
          totalPages={3}
          totalItems={3}
          itemsPerPage={10}
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

