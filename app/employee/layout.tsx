"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/ui/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { getNavForRole } from "@/lib/constants";
import { getDefaultRouteForRole } from "@/lib/auth";
import {
  OpeningChecklistProvider,
  useOpeningChecklist,
} from "@/contexts/opening-checklist-context";
import { OpeningChecklistWrapper } from "@/components/shared/opening-checklist-wrapper";

function EmployeeLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading: isAuthLoading, isSessionExpiryActive } = useAuth();
  const { selectedBranch } = useBranch();
  const { isOpeningChecklistReady } = useOpeningChecklist();
  const router = useRouter();

  const isLoading = isAuthLoading;

  useEffect(() => {
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
    >
      <OpeningChecklistWrapper />
      {children}
    </AppLayout>
  );
}

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OpeningChecklistProvider>
      <EmployeeLayoutInner>{children}</EmployeeLayoutInner>
    </OpeningChecklistProvider>
  );
}
