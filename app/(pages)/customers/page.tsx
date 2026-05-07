"use client";

import { useState } from "react";
import { CustomerTable } from "./_components/customer-table";
import { RewardsConfiguration } from "./_components/rewards-configuration";
import { useAuth } from "@/contexts/auth-context";

export default function CustomersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"directory" | "rewards">("directory");
  
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl border border-border-main bg-surface p-1 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`px-5 py-2 text-sm font-semibold transition-all duration-200 rounded-lg ${
            activeTab === "directory"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          }`}
        >
          Customer Directory
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("rewards")}
            className={`px-5 py-2 text-sm font-semibold transition-all duration-200 rounded-lg ${
              activeTab === "rewards"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            }`}
          >
            Reward Rules
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {activeTab === "directory" ? (
          <div className="space-y-4">
            <p className="text-sm text-text-tertiary">
              Manage and view all registered customer profiles across the organization.
            </p>
            <CustomerTable />
          </div>
        ) : (
          <RewardsConfiguration />
        )}
      </div>
    </div>
  );
}
