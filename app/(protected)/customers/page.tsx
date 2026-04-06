import { CustomerTable } from "@/components/customers/customer-table";

export default function CustomersPage() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-500">
        Manage customer records and profiles.
      </p>
      <CustomerTable />
    </div>
  );
}
