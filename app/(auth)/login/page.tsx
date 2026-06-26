"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLandingPage } from "../_components/auth-landing-page";
import { LoginModal } from "../_components/login-modal";
import { SignupModal } from "../_components/signup-modal";
import { toast } from "sonner";

const SESSION_EXPIRED_REASON = "session-expired";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginExperience />
    </Suspense>
  );
}

function LoginExperience() {
  const searchParams = useSearchParams();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const hasShownSessionExpiredRef = useRef(false);
  const hasShownNoticeRef = useRef(false);

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (!notice || hasShownNoticeRef.current) return;
    hasShownNoticeRef.current = true;
    setShowSignup(false);
    setShowLogin(true);
    toast.info(notice);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("reason") !== SESSION_EXPIRED_REASON) return;
    if (hasShownSessionExpiredRef.current) return;

    hasShownSessionExpiredRef.current = true;
    setShowSignup(false);
    setShowLogin(true);

    const alreadyShown =
      typeof window !== "undefined" &&
      sessionStorage.getItem("pms_session_expired_notice") === "shown";

    if (alreadyShown) {
      sessionStorage.removeItem("pms_session_expired_notice");
      return;
    }

    toast.error("Your session expired. Please sign in again.");
  }, [searchParams]);

  return (
    <>
      <AuthLandingPage
        onLoginClick={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onRequestSignUp={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}

export const dynamic = "force-dynamic";
