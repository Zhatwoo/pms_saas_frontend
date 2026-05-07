"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getDefaultRouteForRole } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isSessionExpiryActive } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      if (isSessionExpiryActive) {
        return;
      }
      router.replace("/login");
      return;
    }

    router.replace(getDefaultRouteForRole(user.role));
  }, [isLoading, isSessionExpiryActive, router, user]);

  return null;
}
