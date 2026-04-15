"use client";

import { CustomerTable } from "./_components/customer-table";

export default function EmployeeCustomersPage() {
  const branchName = "Makati Main Branch";

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900 leading-tight">Customer Management</h1>
        <p className="text-sm font-medium text-zinc-500 mt-1">
          Manage customer records and profiles specifically for your branch.
        </p>
      </div>

      <CustomerTable branchName={branchName} />
    </div>
  );
}
