"use client";

import { useMemo } from "react";
import { AppLayout } from "@/components/ui/app-layout";
import { useAuth } from "@/contexts/auth-context";
import { getNavForRole } from "@/lib/constants";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const navGroups = useMemo(() => getNavForRole("branch"), []);

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

  return (
    <AppLayout 
      navGroups={navGroups} 
      userInitials={initials} 
      onLogout={logout}
      branchName="Taguig Branch"
      hideBranchSelector={true}
    >
      {children}
    </AppLayout>
  );
}
