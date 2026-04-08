"use client";

import { Suspense, useState } from "react";
import { AuthLandingPage } from "../_components/auth-landing-page";
import { LoginModal } from "../_components/login-modal";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginExperience />
    </Suspense>
  );
}

function LoginExperience() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <AuthLandingPage onLoginClick={() => setShowLogin(true)} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

export const dynamic = "force-dynamic";
