"use client";

import { useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/components/ui/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { getNavForRole } from "@/lib/constants";
import { getDefaultRouteForRole } from "@/lib/auth";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { OpeningChecklistWrapper } from "@/components/shared/opening-checklist-wrapper";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading: isAuthLoading, isSessionExpiryActive } = useAuth();
  const { selectedBranch } = useBranch();
  const { isComplete: isWorkflowComplete, isOpeningChecklistReady } = useOpeningChecklist();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = isAuthLoading;

  useEffect(() => {
    // Only redirect if definitively not logged in
    if (!isLoading && !user) {
      if (isSessionExpiryActive) {
        return;
      }
      router.replace("/login");
      return;
    }

    if (!isLoading && user && user.role !== "employee") {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isLoading, isSessionExpiryActive, router, user]);

  useEffect(() => {
    if (isLoading || !user || user.role !== "employee" || !isOpeningChecklistReady) {
      return;
    }

    if (
      !isWorkflowComplete &&
      pathname &&
      !pathname.startsWith("/employee/inventory/pawned-items")
    ) {
      router.replace("/employee/inventory/pawned-items");
    }
  }, [isLoading, isWorkflowComplete, isOpeningChecklistReady, pathname, router, user]);

  const navGroups = useMemo(() => getNavForRole("employee"), []);

  const initials = useMemo(() => {
    if (!user) return "U";
    return user.fullName
      ? user.fullName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : user.email.charAt(0).toUpperCase();
  }, [user]);

  if (!user) {
    return null;
  }

  if (user.role !== "employee") {
    return null;
  }

  if (!isOpeningChecklistReady) {
    return null;
  }

  return (
    <AppLayout 
      navGroups={navGroups} 
      userInitials={initials} 
      userName={user.fullName || user.email}
      userRole={user.role}
      onLogout={logout}
      branchName={selectedBranch.name}
      hideBranchSelector={true}
      isRestricted={!isWorkflowComplete}
    >
      <OpeningChecklistWrapper />
      {children}
    </AppLayout>
  );
}
