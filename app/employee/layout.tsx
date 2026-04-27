"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const { user, logout, isLoading: isAuthLoading, isSessionExpiryActive, requireReLogin } = useAuth();
  const { selectedBranch } = useBranch();
  const { isComplete: isWorkflowComplete } = useOpeningChecklist();
  const router = useRouter();

  const isLoading = isAuthLoading;

  useEffect(() => {
    // Only redirect if definitively not logged in
    const hasToken = document.cookie.includes("pms_token");
    const hadPreviousSession = document.cookie.includes("pms_was_logged_in=1");
    if (!isLoading && !user && !hasToken) {
      if (hadPreviousSession) {
        requireReLogin();
        return;
      }
      if (isSessionExpiryActive) {
        return;
      }
      router.replace("/login");
      return;
    }

    if (!isLoading && user && user.role !== "employee") {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isLoading, isSessionExpiryActive, requireReLogin, router, user]);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-pawn-content text-emerald-900 font-medium">
        Loading Employee Portal...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "employee") {
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
