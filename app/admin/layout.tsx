"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/ui/app-layout";
import { getNavForRole } from "@/lib/constants";
import { getDefaultRouteForRole } from "@/lib/auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hasToken = document.cookie.includes("pms_token");
    if (!isLoading && !user && !hasToken) {
      router.replace("/login");
      return;
    }

    if (!isLoading && user && user.role !== "admin") {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-pawn-content">
        <div className="text-sm text-text-tertiary">Loading...</div>
      </div>
    );
  }

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
    >
      {children}
    </AppLayout>
  );
}
