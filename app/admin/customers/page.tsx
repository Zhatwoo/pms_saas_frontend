import { CustomerTable } from "./_components/customer-table";

export default function AdminCustomersPage() {
	return (
		<div className="space-y-5">
			<p className="text-sm text-zinc-500">
				Manage customer records and profiles.
			</p>
			<CustomerTable />
		</div>
	);
}
