"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/ui/app-layout";
import { useBranch } from "@/contexts/branch-context";
import { getNavForRole } from "@/lib/constants";
import { getDefaultRouteForRole } from "@/lib/auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading, isSessionExpiryActive } = useAuth();
  const { selectedBranch } = useBranch();
  const router = useRouter();

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
      onLogout={logout}
      branchName={selectedBranch.name}
      hideBranchSelector={false}
    >
      {children}
    </AppLayout>
  );
}
