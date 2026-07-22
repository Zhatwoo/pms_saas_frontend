"use client";

import { useEffect, useState } from "react";
import type { CreateableUserRole } from "../page";

interface BranchOption {
	id: string;
	name: string;
}

interface CreateUserInput {
	fullName: string;
	email: string;
	password: string;
	role: CreateableUserRole;
	branchId: string | null;
}

interface CreateUserModalProps {
	branches: BranchOption[];
	availableRoles: CreateableUserRole[];
	onClose: () => void;
	onCreateUser: (input: CreateUserInput) => Promise<void>;
}

interface FormState {
	fullName: string;
	email: string;
	password: string;
	role: CreateableUserRole;
	branchId: string;
}

function isGlobalRole(role: CreateableUserRole): boolean {
	return role === "SUPER_ADMIN";
}

const initialFormState = (
	branches: BranchOption[],
	availableRoles: CreateableUserRole[],
): FormState => {
	const defaultRole =
		branches.length > 0 && availableRoles.includes("EMPLOYEE")
			? "EMPLOYEE"
			: availableRoles.includes("SUPER_ADMIN")
			? "SUPER_ADMIN"
			: (availableRoles[0] ?? "ADMIN");

	return {
		fullName: "",
		email: "",
		password: "",
		role: defaultRole,
		branchId: isGlobalRole(defaultRole) ? "" : (branches[0]?.id ?? ""),
	};
};

export function CreateUserModal({
	branches,
	availableRoles,
	onClose,
	onCreateUser,
}: CreateUserModalProps) {
	const [form, setForm] = useState<FormState>(() =>
		initialFormState(branches, availableRoles),
	);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isSuperAdminRole = isGlobalRole(form.role);

	useEffect(() => {
		setForm((current) => ({
			...initialFormState(branches, availableRoles),
			fullName: current.fullName,
			email: current.email,
			password: current.password,
			role: current.role,
			branchId:
				current.role === "SUPER_ADMIN"
					? ""
					: current.branchId || branches[0]?.id || "",
		}));
	}, [availableRoles, branches]);

	useEffect(() => {
		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [onClose]);

	function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	function updateRole(role: CreateableUserRole) {
		setForm((current) => ({
			...current,
			role,
			branchId: isGlobalRole(role) ? "" : current.branchId || branches[0]?.id || "",
		}));
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		const trimmedFullName = form.fullName.trim();
		const trimmedEmail = form.email.trim();

		if (
			!trimmedFullName ||
			!trimmedEmail ||
			!form.password ||
			(!isSuperAdminRole && !form.branchId)
		) {
			setError("Complete all required fields before creating the user.");
			return;
		}

		if (form.password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}

		setIsSubmitting(true);

		try {
			await onCreateUser({
				fullName: trimmedFullName,
				email: trimmedEmail,
				password: form.password,
				role: form.role,
				branchId: isSuperAdminRole ? null : form.branchId,
			});
			setForm(initialFormState(branches, availableRoles));
		} catch (createError) {
			setError(
				createError instanceof Error
					? createError.message
					: "Failed to create user.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="bg-pawn-sidebar px-6 py-5">
					<p className="text-xs font-bold uppercase tracking-[0.22em] text-pawn-gold">
						User Management
					</p>
					<div className="mt-2 flex items-start justify-between gap-4">
						<div>
							<h2 className="text-2xl font-bold text-white">Create New User</h2>
							<p className="mt-1 text-base text-white/80">
								{isSuperAdminRole
									? "Create a global account with access across every branch."
									: "Add a new employee or admin account and assign a branch."}
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
							aria-label="Close create user modal"
						>
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
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
							{error}
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-text-tertiary">
								Full Name
							</label>
							<input
								type="text"
								value={form.fullName}
								onChange={(event) => updateField("fullName", event.target.value)}
								placeholder="John Doe"
								className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-colors focus:border-brand-green"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-text-tertiary">
								Email Address
							</label>
							<input
								type="email"
								value={form.email}
								onChange={(event) => updateField("email", event.target.value)}
								placeholder="johndoe@gmail.com"
								className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-colors focus:border-brand-green"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
								Password
							</label>
							<input
								type="password"
								value={form.password}
								onChange={(event) => updateField("password", event.target.value)}
								placeholder="At least 6 characters"
								className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-colors focus:border-brand-green"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
								Role
							</label>
							<select
								value={form.role}
								onChange={(event) => updateRole(event.target.value as CreateableUserRole)}
								className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-colors focus:border-brand-green"
							>
								{availableRoles.map((role) => (
									<option key={role} value={role}>
										{role === "SUPER_ADMIN" ? "SUPER ADMIN" : role}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-text-tertiary">
								{isSuperAdminRole ? "Access Scope" : "Branch"}
							</label>
							<select
								value={form.branchId}
								onChange={(event) => updateField("branchId", event.target.value)}
								className="h-12 w-full rounded-md border border-input-border bg-input-bg px-4 text-base text-text-primary outline-none transition-colors focus:border-brand-green"
								disabled={isSuperAdminRole || branches.length === 0}
							>
								{isSuperAdminRole ? (
									<option value="">All Branches</option>
								) : branches.length === 0 ? (
									<option value="">No branches available</option>
								) : (
									branches.map((branch) => (
										<option key={branch.id} value={branch.id}>
											{branch.name}
										</option>
									))
								)}
							</select>
						</div>
					</div>

					<div className="rounded-xl border border-emerald-border bg-emerald-surface px-4 py-3 text-base text-emerald-text">
						{isSuperAdminRole
							? "Super Admin accounts are global. They are not tied to one branch and can view data across all branches."
							: "Users can only be assigned to branches that already exist in the branches table."}
					</div>

					<div className="flex flex-col-reverse gap-2 border-t border-border-main pt-4 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md border border-border-main px-5 py-3 text-base font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || (!isSuperAdminRole && branches.length === 0)}
							className="rounded-md bg-brand-green px-5 py-3 text-base font-bold text-white transition-colors hover:brightness-110"
						>
							{isSubmitting ? "Creating..." : "Create User"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
