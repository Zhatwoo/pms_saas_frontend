import { StatCard } from "@/components/shared/stat-card";

interface UserStatsProps {
	totalUsers: number;
	totalBranches: number;
	activeUsers: number;
	pendingUsers: number;
}

const totalUsersIcon = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>
);

const branchIcon = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="4" y="2" width="16" height="20" rx="2" />
		<path d="M9 22v-4h6v4" />
		<path d="M8 6h.01" />
		<path d="M16 6h.01" />
		<path d="M8 10h.01" />
		<path d="M16 10h.01" />
		<path d="M8 14h.01" />
		<path d="M16 14h.01" />
	</svg>
);

const activeUsersIcon = (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<circle cx="8" cy="8" r="6" className="fill-brand-green/20" />
		<circle cx="8" cy="8" r="3.5" className="fill-brand-green" />
	</svg>
);

const pendingUsersIcon = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="text-amber-600"
	>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 6v6l4 2" />
	</svg>
);

export function UserStats({
	totalUsers,
	totalBranches,
	activeUsers,
	pendingUsers,
}: UserStatsProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				label="Total Users"
				value={totalUsers}
				subtitle="Registered system users"
				icon={totalUsersIcon}
				borderColor="bg-blue-600"
			/>
			<StatCard
				label="Pending approval"
				value={pendingUsers}
				subtitle="Awaiting Super Admin"
				icon={pendingUsersIcon}
				borderColor="bg-amber-500"
			/>
			<StatCard
				label="Active Users"
				value={activeUsers}
				subtitle="Approved and can sign in"
				icon={activeUsersIcon}
				borderColor="bg-brand-green"
			/>
			<StatCard
				label="Branches"
				value={totalBranches}
				subtitle="Branches with assigned users"
				icon={branchIcon}
				borderColor="bg-orange-500"
			/>
		</div>
	);
}
