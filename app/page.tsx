"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getDefaultRouteForRole } from "@/lib/auth";
import { AuthLandingPage } from "./(auth)/_components/auth-landing-page";
import { LoginModal } from "./(auth)/_components/login-modal";


export default function Home() {
  const router = useRouter();
  const { user, isLoading, isSessionExpiryActive } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    router.replace(getDefaultRouteForRole(user.role));
  }, [isLoading, router, user]);

  if (isLoading || user || isSessionExpiryActive) {
    return null;
  }

  return (
    <>
      <AuthLandingPage
        onLoginClick={() => {
          setShowLogin(true);
        }}
      />
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
        />
      )}

    </>
  );
}
