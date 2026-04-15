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

export function CustomerTable({ branchName }: CustomerTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveCustomer = async (input: {
    fullName: string;
    phoneNumber: string;
    email: string;
    idType: string;
    idNumber: string;
    address: string;
  }) => {
    console.log("Customer saved:", input, branchName);
    setIsModalOpen(false);
  };

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

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-emerald-800">
            Internal Customer Records
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          + Add New Customer
        </button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        renderCell={(key, value, row) => {
          if (key === "actions") {
            return (
              <button
                onClick={() => router.push(`/employee/customers/view_user?id=${row.id}`)}
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-emerald-700"
                title={`View ${row.name}`}
              >
                {eyeIcon}
              </button>
            );
          }
          return value;
        }}
      />

      <div className="border-t border-zinc-100 italic px-5 py-3 text-[10px] text-zinc-400">
        Showing customers registered under this branch.
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={1}
        totalItems={customers.length}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
      />

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
