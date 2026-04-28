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
  const { user, logout, isLoading, isSessionExpiryActive, requireReLogin } = useAuth();
  const router = useRouter();

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

    if (!isLoading && user && user.role !== "super_admin") {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [isLoading, isSessionExpiryActive, requireReLogin, router, user]);

  if (!user) {
    return null;
  }

  if (user.role !== "super_admin") {
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
