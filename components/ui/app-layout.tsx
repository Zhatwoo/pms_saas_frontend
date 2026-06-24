"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { NavGroup, Role } from "@/types";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useBranch } from "@/contexts/branch-context";
import { OpeningChecklistWrapper } from "@/components/shared/opening-checklist-wrapper";
import { BranchTransferAcknowledgement } from "@/components/shared/branch-transfer-acknowledgement";

interface AppLayoutProps {
  navGroups: NavGroup[];
  userInitials?: string;
  userName?: string;
  userRole?: Role;
  userAvatarUrl?: string;
  notificationCount?: number;
  branchName?: string;
  hideBranchSelector?: boolean;
  onLogout?: () => void;
  isRestricted?: boolean;
  children: React.ReactNode;
}

export function AppLayout({
  navGroups,
  userInitials,
  userName,
  userRole,
  userAvatarUrl,
  notificationCount,
  branchName,
  hideBranchSelector = false,
  onLogout,
  isRestricted = false,
  children,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedBranch, isAllBranches } = useBranch();
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="no-print">
        <Sidebar
          navGroups={navGroups}
          collapsed={collapsed}
        isMobileOpen={mobileMenuOpen}
          onToggle={() => setCollapsed((prev) => !prev)}
        onMobileClose={() => setMobileMenuOpen(false)}
        onNavigate={() => setMobileMenuOpen(false)}
          userName={userName}
          userRole={userRole}
          userAvatarUrl={userAvatarUrl}
          onLogout={onLogout}
          disabled={isRestricted}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userInitials={userInitials}
          notificationCount={notificationCount}
          branchName={branchName || (isAllBranches ? "All Branches" : selectedBranch.name)}
          hideBranchSelector={hideBranchSelector}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-pawn-content p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <BranchTransferAcknowledgement />
          <OpeningChecklistWrapper />
          {children}
        </main>
      </div>
    </div>
  );
}
