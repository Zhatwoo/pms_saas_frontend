"use client";

import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/ui/app-layout";
import { getNavForRole } from "@/lib/constants";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-pawn-content">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
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
    <AppLayout navGroups={navGroups} userInitials={initials} onLogout={logout}>
      {children}
    </AppLayout>
  );
}
