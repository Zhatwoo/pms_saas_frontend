"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { AddCustomerModal } from "./add-customer-modal";
import type { Column } from "@/components/shared/data-table";

const columns: Column[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "idType", label: "ID Type" },
  { key: "idNumber", label: "ID" },
  { key: "registered", label: "Registered" },
  { key: "actions", label: "Actions", align: "center" },
];

const customers = [
  {
    name: "Juan Dela Cruz",
    phone: "09123456789",
    email: "juandelacruz@gmail.com",
    idType: "Driver's License",
    idNumber: "N5012345678",
    registered: "February 14, 2022",
  },
  {
    name: "John Doe",
    phone: "09123456789",
    email: "jhondoe@gmail.com",
    idType: "National ID",
    idNumber: "72120002152",
    registered: "February 15, 2022",
  },
  {
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewCustomer = (customerName: string, index: number) => {
    // Navigate to customer detail page
    const customerId = `customer-${index + 1}`;
    router.push(`/admin/customers/${customerId}`);
  };

  return (
    <div className="rounded-lg border border-border-main bg-surface shadow-sm transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-emerald-text">
          Customer Management
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          + Add New Customer
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={customers}
        renderCell={(key, value, row, rowIndex) => {
          if (key === "actions") {
            return (
              <button
                onClick={() => handleViewCustomer(row.name, rowIndex)}
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-hover hover:text-emerald-700"
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

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
