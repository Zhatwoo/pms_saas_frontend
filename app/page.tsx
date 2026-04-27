"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getDefaultRouteForRole } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isSessionExpiryActive, requireReLogin } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      const hasToken = document.cookie.includes("pms_token");
      const hadPreviousSession = document.cookie.includes("pms_was_logged_in=1");
      if (!hasToken && hadPreviousSession) {
        requireReLogin();
        return;
      }
      if (isSessionExpiryActive) {
        return;
      }
      router.replace("/login");
      return;
    }

    router.replace(getDefaultRouteForRole(user.role));
  }, [isLoading, isSessionExpiryActive, requireReLogin, router, user]);

  return (
    <div className="flex h-screen items-center justify-center bg-pawn-content">
      <div className="text-sm text-text-tertiary">Redirecting...</div>
    </div>
  );
}
