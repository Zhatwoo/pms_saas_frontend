"use client";

import { useState } from "react";
import type { NavGroup, Role } from "@/types";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useBranch } from "@/contexts/branch-context";

interface AppLayoutProps {
  navGroups: NavGroup[];
  userInitials?: string;
  userName?: string;
  userRole?: Role;
  notificationCount?: number;
  branchName?: string;
  hideBranchSelector?: boolean;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  navGroups,
  userInitials,
  userName,
  userRole,
  notificationCount,
  branchName,
  hideBranchSelector = false,
  onLogout,
  children,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedBranch, isAllBranches } = useBranch();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        navGroups={navGroups}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        userName={userName}
        userRole={userRole}
        onLogout={onLogout}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userInitials={userInitials}
          notificationCount={notificationCount}
          branchName={branchName}
          hideBranchSelector={hideBranchSelector}
        />
        <main className="flex-1 overflow-y-auto bg-pawn-content p-6 transition-colors duration-300">
          <div className="mb-4 rounded-lg border border-emerald-border bg-emerald-surface px-4 py-2 text-xs text-emerald-text">
            Showing data from:{" "}
            <span className="font-semibold">
              {isAllBranches ? "All Branches" : selectedBranch.name}
            </span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
