"use client";

import { Suspense, useState } from "react";
import { AuthLandingPage } from "../_components/auth-landing-page";
import { LoginModal } from "../_components/login-modal";
import { SignupModal } from "../_components/signup-modal";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginExperience />
    </Suspense>
  );
}

function LoginExperience() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <AuthLandingPage
        onLoginClick={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onSignUpClick={() => {
          setShowLogin(false);
          setShowSignup(true);
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
