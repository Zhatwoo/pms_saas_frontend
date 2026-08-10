"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getAuthorizedRedirect, getDefaultRouteForRole } from "@/lib/auth";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { api, ApiError } from "@/lib/api";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { QuickPawnLogo } from "@/components/ui/quickpawn-logo";

interface LoginModalProps {
  onClose: () => void;

}

type ViewState =
  | "login"
  | "unauthorized-device"
  | "request-sent"
  | "forgot-password"
  | "reset-otp"
  | "reset-success";
type LegalModalType = "privacy" | "terms" | null;

type LegalSection = {
  title: string;
  body: string;
  contactItems?: { label: string; value: string }[];
};

const DEVICE_AUTH_CODES = new Set([
  "UNKNOWN_DEVICE",
  "DEVICE_PENDING",
  "DEVICE_BLOCKED",
  "MISSING_DEVICE_FINGERPRINT",
]);

function getDeviceAuthFailure(
  err: unknown,
): { code?: string; message: string; autoRequested?: boolean } | null {
  if (err instanceof ApiError) {
    const code =
      typeof err.payload.code === "string" ? err.payload.code : undefined;
    const autoRequested = err.payload.autoRequested === true;

    if (code && DEVICE_AUTH_CODES.has(code)) {
      return { code, message: err.message, autoRequested };
    }

    if (err.statusCode === 403) {
      const msg = err.message;
      if (
        /device|unauthorized device|fingerprint|blocked|pending/i.test(msg)
      ) {
        return {
          code: code ?? "UNKNOWN_DEVICE",
          message: msg,
          autoRequested,
        };
      }
    }
  }

  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("Unauthorized Device") ||
    msg.includes("Device not authorized") ||
    msg.includes("Device authorization is pending") ||
    msg.includes("Device fingerprint is required") ||
    msg.includes("This device has been blocked")
  ) {
    return { message: msg };
  }

  return null;
}

const termsSections: LegalSection[] = [
  {
    title: "I. The QuickPawn Service",
    body: "QuickPawn is a cloud-based pawnshop management system designed to help businesses manage operations such as customer records, pawn transactions, pawned items, loans, payments, renewals, redemptions, reports, and other available features. The features available to you may depend on your selected subscription plan. QuickPawn is a business management tool and does not provide legal, accounting, tax, financial, valuation, appraisal, or regulatory advice. You remain responsible for your business operations, decisions, records, and compliance with applicable laws.",
  },
  {
    title: "II. Account Registration and Security",
    body: "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials, ensuring only authorized users access your account, keeping your account information accurate and updated, and all activities conducted through your account. You must promptly notify Inspire if you suspect unauthorized access to your account, and you are responsible for ensuring your employees, representatives, and other authorized users comply with these Terms.",
  },
  {
    title: "III. Subscription and Right to Use",
    body: "Subject to these Terms and payment of applicable fees, Inspire grants you a limited, non-exclusive, non-transferable, non-sublicensable right to access and use QuickPawn during your active subscription solely for your internal business operations. You do not receive ownership of QuickPawn, its software, source code, design, interface, trademarks, or other intellectual property. You may not copy, modify, reverse engineer, resell, sublicense, distribute, or use QuickPawn to create or operate a competing product.",
  },
  {
    title: "IV. Fees and Payment",
    body: "You agree to pay the subscription fees applicable to your selected plan. Fees, billing frequency, user limits, feature limits, and other subscription conditions will be stated in the applicable pricing plan, order, invoice, or written agreement. Unless otherwise stated, fees are payable according to the selected billing schedule, applicable taxes and government charges may apply, subscription fees are non-refundable except where required by law or expressly agreed in writing, and failed or overdue payments may result in restricted or suspended access. If your subscription automatically renews, it will renew according to the applicable subscription terms unless cancelled before the renewal date.",
  },
  {
    title: "V. Customer Data",
    body: "“Customer Data” means information, records, files, personal information, transaction information, and other data submitted to or stored in QuickPawn by or on behalf of the Customer. As between the parties, you retain your rights and ownership interests in Customer Data. You are responsible for the accuracy and legality of Customer Data, having the necessary rights and authority to provide Customer Data to QuickPawn, complying with applicable privacy and data protection laws, and ensuring that your collection and use of personal information is lawful. You authorize Inspire to host, store, process, transmit, and use Customer Data as reasonably necessary to provide, maintain, secure, support, and improve QuickPawn, comply with legal obligations, and prevent fraud or abuse.",
  },
  {
    title: "VI. Data Privacy",
    body: "The use of QuickPawn may involve the processing of personal information. Inspire Next Global Inc. and its customers agree to comply with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable Philippine data privacy laws and regulations. Customers are responsible for ensuring that personal information entered into QuickPawn is collected and processed lawfully. Inspire Next Global Inc. will take reasonable measures to protect information processed through the Service. For more information about how personal information is handled, please refer to the QuickPawn Privacy Policy.",
  },
  {
    title: "VII. Acceptable Use",
    body: "You must use QuickPawn only for lawful business purposes. You must not use QuickPawn for unlawful, fraudulent, or abusive activities; violate applicable laws or the rights of others; upload viruses, malware, ransomware, or other harmful code; attempt to gain unauthorized access to QuickPawn or related systems; circumvent security features or usage limitations; reverse engineer, copy, or modify the Platform; resell, sublicense, or provide unauthorized access to QuickPawn; or use QuickPawn to develop or operate a competing service.",
  },
  {
    title: "VIII. Service Availability and Changes",
    body: "Inspire will use reasonable efforts to maintain QuickPawn. However, the Service may occasionally be unavailable due to maintenance, upgrades, technical issues, internet or third-party service failures, cybersecurity incidents, or events beyond Inspire's reasonable control. Inspire may update, modify, improve, or discontinue features of QuickPawn from time to time. Unless otherwise agreed in writing, Inspire does not guarantee uninterrupted or error-free operation of the Service.",
  },
  {
    title: "IX. Suspension and Termination",
    body: "Inspire may suspend or restrict access to QuickPawn if reasonably necessary to protect the security or integrity of the Service, prevent fraud, abuse, or unauthorized access, address a serious violation of these Terms, comply with applicable law, or address unpaid fees. You may cancel your subscription according to the applicable cancellation procedure. Upon termination or expiration of your subscription, your right to use QuickPawn ends, access to your account may be disabled, unpaid fees remain payable, and Customer Data may be retained or deleted in accordance with Inspire's applicable data retention practices and legal obligations. You are responsible for requesting and obtaining any necessary data export before the end of the applicable retention period.",
  },
  {
    title: "X. Intellectual Property",
    body: "QuickPawn and all related software, technology, design, content, documentation, trademarks, logos, and branding are owned by or licensed to Inspire Next Global Inc. You retain ownership of your Customer Data. You may not use Inspire or QuickPawn trademarks, logos, or branding without prior written permission.",
  },
  {
    title: "XI. Disclaimers",
    body: "To the maximum extent permitted by law, QuickPawn is provided on an “AS IS” and “AS AVAILABLE” basis. Inspire does not guarantee that the Service will always be uninterrupted, error-free, that all defects will be corrected, that QuickPawn will meet every specific business requirement, or that use of QuickPawn alone will ensure compliance with any law or regulation. You remain responsible for verifying important information and business transactions.",
  },
  {
    title: "XII. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, Inspire will not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, business opportunities, goodwill, data, or business interruption. Inspire's total aggregate liability arising out of or relating to QuickPawn or these Terms will not exceed the total subscription fees actually paid by the Customer to Inspire for QuickPawn during the twelve (12) months preceding the event giving rise to the claim. Nothing in these Terms limits liability that cannot legally be limited or excluded.",
  },
  {
    title: "XIII. Customer Indemnification",
    body: "To the extent permitted by law, you agree to defend, indemnify, and hold harmless Inspire, its affiliates, officers, directors, employees, contractors, and representatives from claims, damages, liabilities, costs, and expenses arising from your breach of these Terms, your misuse of QuickPawn, your violation of applicable law, your Customer Data, your violation of another person's rights, or your business operations and transactions.",
  },
  {
    title: "XIV. Confidentiality",
    body: "Each party agrees to protect the other party's confidential information and use it only for purposes related to the business relationship. This obligation does not apply to information that is publicly available, already lawfully known, independently developed, or required to be disclosed by law.",
  },
  {
    title: "XV. Changes to These Terms",
    body: "Inspire may update these Terms from time to time. Updated Terms may be posted on the QuickPawn website or provided through the Platform, email, or other reasonable means. If you continue to use QuickPawn after the updated Terms become effective, you agree to the revised Terms.",
  },
  {
    title: "XVI. Governing Law and Disputes",
    body: "These Terms are governed by the laws of the Republic of the Philippines. The parties will first attempt in good faith to resolve disputes through discussion and negotiation. If a dispute cannot be resolved, the parties may pursue remedies available under applicable Philippine law before the proper courts with jurisdiction.",
  },
  {
    title: "XVII. Contact Information",
    body: "Inspire Next Global Inc.",
    contactItems: [
      { label: "Name", value: "Inspire Neo" },
      { label: "Email", value: "quickpawn.pms@gmail.com" },
      { label: "Contact Number", value: "09929718800" },
      { label: "Address", value: "6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig" },
    ],
  },
];

const privacySections: LegalSection[] = [
  {
    title: "Information We May Collect",
    body: `When customers contact us or complete branch transactions, ${BRAND_CONFIG.companyName} may collect information such as name, contact details, identification details, item descriptions, photos, transaction records, and service-related documents.`,
  },
  {
    title: "How We Use Information",
    body: "We use customer information to verify identity, evaluate pawned or sold items, process transactions, issue receipts or pawn tickets, manage renewals and redemptions, respond to inquiries, improve service, and comply with legal or regulatory requirements.",
  },
  {
    title: "Branch and Transaction Records",
    body: "Customer and transaction records may be stored in our internal Pawnshop Management System so authorized personnel can manage customer service, item inventory, payments, audit reviews, reports, and required business documentation.",
  },
  {
    title: "Sharing of Information",
    body: "We do not sell customer personal information. We may share information only when needed for business operations, customer requests, legal compliance, fraud prevention, security review, or cooperation with authorized government or regulatory offices.",
  },
  {
    title: "Data Protection",
    body: "We use reasonable administrative, technical, and access-control safeguards to protect customer information. Only authorized employees and administrators may access customer records when needed for legitimate pawnshop operations.",
  },
  {
    title: "Customer Choices",
    body: `Customers may contact ${BRAND_CONFIG.companyName} to ask about their records, request corrections, or raise privacy concerns, subject to identity verification, record retention rules, and applicable law.`,
  },
  {
    title: "Website Visitors",
    body: "Public visitors can browse the landing page without logging in. Basic technical information may still be processed by normal website hosting, browser, security, or analytics tools if they are enabled.",
  },
  {
    title: "Policy Updates",
    body: "We may update this Privacy Policy as our services, systems, or legal requirements change. Updated policy content will apply once posted or otherwise made available.",
  },
];

const legalModalContent = {
  privacy: {
    title: "Privacy Policy",
    ariaLabel: "Close privacy policy",
    intro: `This policy explains how ${BRAND_CONFIG.companyName} handles customer and visitor information for inquiries, branch transactions, item records, customer support, and required business documentation.`,
    sections: privacySections,
  },
  terms: {
    title: "Terms of Service",
    ariaLabel: "Close terms of service",
    intro: "These Terms of Service govern your access to and use of the QuickPawn Pawnshop Management System, a software-as-a-service platform owned and operated by Inspire Next Global Inc. By accessing or using QuickPawn, you agree to comply with these Terms.",
    sections: termsSections,
  },
};

export function LoginModal({ onClose }: LoginModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<ViewState>("login");
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("");
  const [fingerprintError, setFingerprintError] = useState<string>("");
  const [isRequestingAuth, setIsRequestingAuth] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isRequestingResetOtp, setIsRequestingResetOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setResetError("Please enter your email address.");
      return;
    }
    setResetError("");
    setIsRequestingResetOtp(true);
    try {
      const res = await api.post<{ message: string }>("/auth/forgot-password", {
        email: targetEmail,
      });
      setResetSuccessMessage(res.message || "Verification code sent to your email.");
      setView("reset-otp");
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsRequestingResetOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!resetOtp.trim()) {
      setResetError("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const targetEmail = (resetEmail || email).trim();
      await api.post("/auth/reset-password", {
        email: targetEmail,
        otp: resetOtp.trim(),
        newPassword: newPassword.trim(),
      });
      setView("reset-success");
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : "Failed to reset password. Please try again.",
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  useEffect(() => {
    getDeviceFingerprint()
      .then((fp) => {
        setDeviceFingerprint(fp);
        setFingerprintError("");
      })
      .catch(() => {
        setFingerprintError(
          "Unable to verify this device. Disable ad blockers or try another browser.",
        );
      });
  }, []);

  const resolveFingerprint = async (): Promise<string> => {
    if (deviceFingerprint) return deviceFingerprint;
    try {
      const fp = await getDeviceFingerprint();
      setDeviceFingerprint(fp);
      setFingerprintError("");
      return fp;
    } catch {
      const message =
        "Unable to verify this device. Disable ad blockers or try another browser.";
      setFingerprintError(message);
      throw new Error(message);
    }
  };

  const submitDeviceAuthorizationRequest = async (fp: string) => {
    await api.post("/devices/request-authorization", {
      deviceFingerprint: fp,
      deviceName: `${navigator.platform || "Device"} — ${new Date().toLocaleDateString()}`,
      deviceType: "DESKTOP",
      email: email.trim(),
    });
  };

  const handleDeviceAuthFailure = async (
    failure: { code?: string; message: string; autoRequested?: boolean },
    fp: string,
  ) => {
    if (failure.code === "DEVICE_BLOCKED") {
      setError(failure.message);
      setView("unauthorized-device");
      return;
    }

    if (failure.code === "DEVICE_PENDING" || failure.autoRequested) {
      setView("request-sent");
      return;
    }

    setIsRequestingAuth(true);
    try {
      await submitDeviceAuthorizationRequest(fp);
      setView("request-sent");
    } catch (reqErr) {
      const msg =
        reqErr instanceof Error
          ? reqErr.message
          : "Failed to send authorization request. Please try again.";
      setError(msg);
      setView("unauthorized-device");
    } finally {
      setIsRequestingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const fp = await resolveFingerprint();
      const user = await login(email, password, fp);
      const requestedRedirect =
        searchParams.get("reason") === "session-expired"
          ? null
          : searchParams.get("redirect");
      const redirect = getAuthorizedRedirect(user.role, requestedRedirect);
      router.replace(redirect || getDefaultRouteForRole(user.role));
      router.refresh();
    } catch (err) {
      const deviceFailure = getDeviceAuthFailure(err);
      if (deviceFailure) {
        try {
          const fp = await resolveFingerprint();
          await handleDeviceAuthFailure(deviceFailure, fp);
        } catch (fpErr) {
          setError(fpErr instanceof Error ? fpErr.message : "Login failed");
        }
        return;
      }

      const msg = err instanceof Error ? err.message : "Login failed";
      if (
        err instanceof ApiError &&
        err.statusCode === 401 &&
        msg === "Unauthorized request"
      ) {
        setError(
          "Invalid email or password, or your account is not yet approved. Device authorization only applies after your password is verified.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAuthorization = async () => {
    setIsRequestingAuth(true);
    setError("");
    try {
      const fp = await resolveFingerprint();
      await submitDeviceAuthorizationRequest(fp);
      setView("request-sent");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to send authorization request. Please try again.";
      setError(msg);
      if (!msg.includes("Unable to verify this device")) {
        setView("login");
      }
    } finally {
      setIsRequestingAuth(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        className="relative w-[90%] max-w-[340px] sm:w-[85%] sm:max-w-[420px] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-1.5 top-1.5 sm:right-3 sm:top-3 z-20 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/5 text-zinc-500 hover:bg-black/10 hover:text-zinc-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="relative bg-white px-4 pb-4 pt-6 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="relative flex flex-col items-center">
            <div className="w-full max-w-[260px] sm:max-w-[320px]">
              <QuickPawnLogo variant="full" showTagline className="h-auto w-full" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-stone-100 px-4 pb-5 pt-3 sm:px-8 sm:pb-8 sm:pt-6">
          {view === "login" && (
            <>
              <h3 className="text-base sm:text-xl font-bold text-brand-green">Welcome back</h3>
              <p className="mt-0.5 text-[10px] sm:text-xs text-zinc-500">Sign in to access your branch portal</p>

              {(error || fingerprintError) && (
                <div className="mt-2.5 sm:mt-4 rounded-lg bg-red-50 px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-medium text-red-600">
                  {error || fingerprintError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-3 sm:mt-6 space-y-2.5 sm:space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] sm:text-xs font-bold text-zinc-700">USERNAME / EMAIL</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 sm:h-11 flex-1 bg-transparent px-2 sm:px-3 text-[10px] sm:text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Enter username or email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] sm:text-xs font-bold text-zinc-700">PASSWORD</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 sm:h-11 flex-1 bg-transparent px-2 sm:px-3 text-[10px] sm:text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Enter password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-1 sm:mt-2 flex justify-end gap-1 text-[10px] sm:text-xs">
                    <span className="text-zinc-500">Forgot password?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetError("");
                        setView("forgot-password");
                      }}
                      className="font-bold text-brand-green hover:underline"
                    >
                      Reset here
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isRequestingAuth}
                  className="w-full bg-brand-green py-2 sm:py-3 text-xs sm:text-base font-bold text-white transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting
                    ? isRequestingAuth
                      ? "Sending device request..."
                      : "Signing in..."
                    : "Sign In"}
                </button>
              </form>

              <div className="my-2.5 sm:my-4 h-px bg-zinc-200" />

              <div className="mt-2.5 sm:mt-4 text-center text-[8px] sm:text-[10px] text-zinc-400">
                <p>
                  {BRAND_CONFIG.companyName} ·{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("privacy")}
                    className="font-semibold text-brand-green transition-colors hover:brightness-125 hover:underline"
                  >
                    Privacy Policy
                  </button>
                </p>
                <p className="mt-0.5">
                  &copy; 2026 All rights reserved ·{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("terms")}
                    className="font-semibold text-brand-green transition-colors hover:brightness-125 hover:underline"
                  >
                    Terms of Service
                  </button>
                </p>
              </div>
            </>
          )}

          {view === "unauthorized-device" && (
            <div className="flex flex-col items-center py-2.5 sm:py-4 text-center">
              <div className="flex h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
                </svg>
              </div>
              <h3 className="mt-2 sm:mt-4 text-sm sm:text-lg font-bold text-zinc-900">Unauthorized Device</h3>
              <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-500 leading-relaxed">
                This device is not authorized for your account. Request authorization from your Super Admin.
              </p>

              {deviceFingerprint && (
                <div className="mt-2.5 sm:mt-4 w-full rounded-lg bg-zinc-100 px-2.5 py-1.5 sm:px-4 sm:py-3 text-left">
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase text-zinc-400">Device ID</p>
                  <p className="mt-0.5 break-all font-mono text-[8px] sm:text-[10px] text-zinc-600">{deviceFingerprint}</p>
                </div>
              )}

              {error && (
                <div className="mt-2 sm:mt-3 w-full rounded-lg bg-red-50 px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-medium text-red-600">{error}</div>
              )}

              <button
                onClick={handleRequestAuthorization}
                disabled={isRequestingAuth}
                className="mt-3 sm:mt-6 w-full bg-brand-green py-2 sm:py-3 text-[11px] sm:text-sm font-bold text-white transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {isRequestingAuth ? "Sending Request..." : "Request Device Authorization"}
              </button>
              <button
                onClick={() => { setView("login"); setError(""); }}
                className="mt-1.5 w-full py-1.5 text-[10px] sm:text-xs text-zinc-500 hover:text-zinc-700"
              >
                Back to Login
              </button>
            </div>
          )}

          {view === "request-sent" && (
            <div className="flex flex-col items-center py-3 sm:py-6 text-center">
              <div className="flex h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="mt-2 sm:mt-4 text-sm sm:text-lg font-bold text-zinc-900">Request Sent</h3>
              <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-500 leading-relaxed">
                Your device authorization request has been sent to your Super Admin. You will be able to log in once they approve this device for your account.
              </p>
              <button
                onClick={onClose}
                className="mt-3 sm:mt-6 w-full bg-brand-green py-2 sm:py-3 text-[11px] sm:text-sm font-bold text-white transition-colors hover:brightness-110"
              >
                Close
              </button>
            </div>
          )}

          {view === "forgot-password" && (
            <div>
              <h3 className="text-base sm:text-xl font-bold text-brand-green">Reset Password</h3>
              <p className="mt-0.5 text-[10px] sm:text-xs text-zinc-500">
                Enter your registered email address to receive a 6-digit verification code.
              </p>

              {resetError && (
                <div className="mt-2.5 sm:mt-4 rounded-lg bg-red-50 px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-medium text-red-600">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleRequestResetOtp} className="mt-3 sm:mt-6 space-y-3 sm:space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] sm:text-xs font-bold text-zinc-700">EMAIL ADDRESS</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={resetEmail || email}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-9 sm:h-11 flex-1 bg-transparent px-2 sm:px-3 text-[10px] sm:text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRequestingResetOtp}
                  className="w-full bg-brand-green py-2 sm:py-3 text-xs sm:text-base font-bold text-white transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  {isRequestingResetOtp ? "Sending Verification Code..." : "Send Verification Code"}
                </button>

                <button
                  type="button"
                  onClick={() => { setView("login"); setResetError(""); }}
                  className="w-full py-1.5 text-[10px] sm:text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          )}

          {view === "reset-otp" && (
            <div>
              <h3 className="text-base sm:text-xl font-bold text-brand-green">Set New Password</h3>
              <p className="mt-0.5 text-[10px] sm:text-xs text-zinc-500">
                Enter the code sent to <span className="font-bold text-zinc-700">{resetEmail || email}</span>
              </p>

              {resetSuccessMessage && !resetError && (
                <div className="mt-2.5 sm:mt-3 rounded-lg bg-emerald-50 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-medium text-emerald-700">
                  {resetSuccessMessage}
                </div>
              )}

              {resetError && (
                <div className="mt-2.5 sm:mt-3 rounded-lg bg-red-50 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-medium text-red-600">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="mt-3 sm:mt-5 space-y-2.5 sm:space-y-3.5">
                <div>
                  <label className="mb-1 block text-[10px] sm:text-xs font-bold text-zinc-700">VERIFICATION CODE</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="h-9 sm:h-11 flex-1 bg-transparent px-2 sm:px-3 text-xs sm:text-sm font-mono tracking-widest text-zinc-900 outline-none placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400"
                      placeholder="6-digit code"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] sm:text-xs font-bold text-zinc-700">NEW PASSWORD</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 sm:h-11 flex-1 bg-transparent px-2 sm:px-3 text-[10px] sm:text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="At least 6 characters"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] sm:text-xs font-bold text-zinc-700">CONFIRM NEW PASSWORD</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-9 sm:h-11 flex-1 bg-transparent px-2 sm:px-3 text-[10px] sm:text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="w-full bg-brand-green py-2 sm:py-3 text-xs sm:text-base font-bold text-white transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  {isResettingPassword ? "Updating Password..." : "Reset Password"}
                </button>

                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <button
                    type="button"
                    onClick={handleRequestResetOtp}
                    disabled={isRequestingResetOtp}
                    className="font-bold text-brand-green hover:underline disabled:opacity-50"
                  >
                    {isRequestingResetOtp ? "Resending..." : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView("login"); setResetError(""); }}
                    className="font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === "reset-success" && (
            <div className="flex flex-col items-center py-3 sm:py-6 text-center">
              <div className="flex h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="mt-2 sm:mt-4 text-sm sm:text-lg font-bold text-zinc-900">Password Reset Complete!</h3>
              <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-zinc-500 leading-relaxed">
                Your password has been successfully updated with Supabase Authentication. You can now sign in with your new password.
              </p>
              <button
                onClick={() => {
                  if (resetEmail) setEmail(resetEmail);
                  setPassword("");
                  setResetOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                  setResetError("");
                  setView("login");
                }}
                className="mt-3 sm:mt-6 w-full bg-brand-green py-2 sm:py-3 text-[11px] sm:text-sm font-bold text-white transition-colors hover:brightness-110"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>

      {legalModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            className="relative max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-stone-100 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              aria-label={legalModalContent[legalModal].ariaLabel}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative overflow-hidden bg-brand-green px-6 pb-6 pt-7 text-white sm:px-8">
              <div className="absolute right-[-28px] top-[-42px] h-36 w-36 rounded-full bg-white/5" />
              <div className="absolute bottom-[-34px] left-[-18px] h-28 w-28 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-pawn-gold">{BRAND_CONFIG.companyName}</p>
                <h3 id="terms-modal-title" className="mt-2 text-2xl font-bold">{legalModalContent[legalModal].title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
                  {legalModalContent[legalModal].intro}
                </p>
              </div>
            </div>

            <div className="relative bg-brand-green">
              <div className="h-2 rounded-t-lg sm:rounded-t-xl bg-stone-100" />
              <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8">
              <div className="space-y-4">
                {legalModalContent[legalModal].sections.map((section, index) => (
                  <section key={section.title} className="border-b border-zinc-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-green">{section.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600">{section.body}</p>
                        {section.contactItems && (
                          <ul className="mt-2 space-y-1.5">
                            {section.contactItems.map((item) => (
                              <li key={item.label} className="text-sm text-zinc-600">
                                <span className="font-bold text-brand-green">{item.label}:</span>{" "}{item.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-white/60 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-full bg-brand-green py-3 text-sm font-bold text-white transition-colors hover:brightness-110"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
