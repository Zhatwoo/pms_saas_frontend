"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/components/ui/app-layout";
import { useBranch } from "@/contexts/branch-context";
import { getNavForRole } from "@/lib/constants";
import { getDefaultRouteForRole } from "@/lib/auth";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { OpeningChecklistGatePlaceholder } from "@/components/shared/opening-checklist-gate-placeholder";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading, isSessionExpiryActive } = useAuth();
  const { selectedBranch } = useBranch();
  const { isComplete, isOpeningChecklistReady } = useOpeningChecklist();
  const pathname = usePathname();
  const router = useRouter();

  const allowModuleContent =
    isComplete || Boolean(pathname?.includes("/incident-report"));

  useEffect(() => {
    if (!isLoading && !user) {
      if (isSessionExpiryActive) {
        return;
      }
      router.replace("/login");
      return;
    }

    if (!isLoading && user && user.role !== "admin") {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isLoading, isSessionExpiryActive, router, user]);

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return null;
  }

  if (!isOpeningChecklistReady) {
    return null;
  }

  const navGroups = getNavForRole(user.role);
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.charAt(0).toUpperCase();

  return (
    <AppLayout
      navGroups={navGroups}
      userInitials={initials}
      userName={user.fullName || user.email}
      userRole={user.role}
      userAvatarUrl={user.avatarUrl}
      onLogout={logout}
      branchName={selectedBranch.name}
      hideBranchSelector={false}
      isRestricted={!allowModuleContent}
    >
      {allowModuleContent ? children : <OpeningChecklistGatePlaceholder />}
    </AppLayout>
  );
}
