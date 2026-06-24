"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getAuthorizedRedirect, getDefaultRouteForRole } from "@/lib/auth";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { api, ApiError } from "@/lib/api";

interface LoginModalProps {
  onClose: () => void;
  onRequestSignUp?: () => void;
}

type ViewState = "login" | "unauthorized-device" | "request-sent";
type LegalModalType = "privacy" | "terms" | null;

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

const termsSections = [
  {
    title: "Website Information",
    body: "The JCLB Buy Back Pawnshop website provides general information about our pawnshop services, branch operations, item selling, buy back services, and customer support. It is intended for customers and visitors who want to learn about our business.",
  },
  {
    title: "No Online Transaction Guarantee",
    body: "Information shown on the website does not guarantee approval of a pawn, sale, renewal, redemption, or any other transaction. Final service terms, item appraisal, pricing, fees, and acceptance are handled by authorized JCLB Buy Back Shop personnel.",
  },
  {
    title: "Customer Responsibilities",
    body: "Customers are responsible for providing accurate contact information, valid identification, truthful item details, and lawful ownership documents when required. Customers should review official receipts, pawn tickets, and agreements before completing a branch transaction.",
  },
  {
    title: "Service Availability",
    body: "Services, branch schedules, item availability, prices, promotions, and business requirements may change without prior notice. Some services may depend on branch location, staff review, item condition, and applicable pawnshop regulations.",
  },
  {
    title: "Respectful Use",
    body: "Visitors must not misuse the website, attempt unauthorized access to employee or administrator areas, submit false information, interfere with system security, or use the website for unlawful, harmful, or misleading activity.",
  },
  {
    title: "Internal Login",
    body: "The login area is reserved for authorized JCLB Buy Back Shop employees and administrators. Customers do not need an account to read the public information on this landing page.",
  },
  {
    title: "Limitations",
    body: "Website content is provided for general guidance only and should not replace official branch documents, signed agreements, receipts, or direct assistance from JCLB Buy Back Shop personnel.",
  },
  {
    title: "Acceptance",
    body: "By using this website, you agree to these terms and to any official policies, notices, and legal requirements that apply to JCLB Buy Back Shop services.",
  },
];

const privacySections = [
  {
    title: "Information We May Collect",
    body: "When customers contact us or complete branch transactions, JCLB Buy Back Shop may collect information such as name, contact details, identification details, item descriptions, photos, transaction records, and service-related documents.",
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
    body: "Customers may contact JCLB Buy Back Shop to ask about their records, request corrections, or raise privacy concerns, subject to identity verification, record retention rules, and applicable law.",
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
    intro: "This policy explains how JCLB Buy Back Shop handles customer and visitor information for inquiries, branch transactions, item records, customer support, and required business documentation.",
    sections: privacySections,
  },
  terms: {
    title: "Terms of Service",
    ariaLabel: "Close terms of service",
    intro: "These terms explain general use of the JCLB Buy Back Shop website and public information for customers, visitors, and anyone learning about our pawnshop services.",
    sections: termsSections,
  },
};

export function LoginModal({ onClose, onRequestSignUp }: LoginModalProps) {
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
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="relative bg-emerald-800 px-8 pb-8 pt-10">
          <div className="absolute right-[-20px] top-[-30px] h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute bottom-[20px] left-[-10px] h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute bottom-[-10px] right-[40px] h-20 w-20 rounded-full bg-white/5" />
          <div className="relative flex flex-col items-center">
            <div className="rounded-2xl bg-emerald-950/50 p-2">
              <div className="overflow-hidden rounded-xl ring-2 ring-amber-400/60">
                <Image src="/logo.png" alt="JCLB Logo" width={96} height={96} className="h-24 w-24 object-cover" />
              </div>
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">JCLB Buy Back</h2>
            <p className="text-lg font-bold text-amber-400">Pawnshop</p>
          </div>
        </div>

        <div className="relative bg-emerald-800">
          <div className="h-2 rounded-t-xl bg-stone-100" />
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
        </div>

        {/* Body */}
        <div className="bg-stone-100 px-8 pb-8 pt-6">
          {view === "login" && (
            <>
              <h3 className="text-xl font-bold text-emerald-950">Welcome back</h3>
              <p className="mt-1 text-xs text-zinc-500">Sign in to access your branch portal</p>

              {(error || fingerprintError) && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                  {error || fingerprintError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">USERNAME / EMAIL</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 flex-1 bg-transparent px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Enter username or email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-700">PASSWORD</label>
                  <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-zinc-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 flex-1 bg-transparent px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Enter password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex justify-end gap-1 text-xs">
                    <span className="text-zinc-500">Forgot password?</span>
                    <button type="button" className="font-bold text-emerald-800 hover:underline">Reset here</button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isRequestingAuth}
                  className="w-full bg-emerald-800 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? isRequestingAuth
                      ? "Sending device request..."
                      : "Signing in..."
                    : "Sign In"}
                </button>
              </form>

              <div className="my-4 h-px bg-zinc-200" />
              <p className="text-center text-xs text-zinc-500">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => { onClose(); onRequestSignUp?.(); }} className="font-bold text-emerald-800 hover:underline">Sign Up</button>
              </p>
              <div className="mt-4 text-center text-[10px] text-zinc-400">
                <p>
                  JCLB Buy Back Shop ·{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("privacy")}
                    className="font-semibold text-emerald-800 transition-colors hover:text-emerald-700 hover:underline"
                  >
                    Privacy Policy
                  </button>
                </p>
                <p className="mt-1">
                  &copy; 2026 All rights reserved ·{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("terms")}
                    className="font-semibold text-emerald-800 transition-colors hover:text-emerald-700 hover:underline"
                  >
                    Terms of Service
                  </button>
                </p>
              </div>
            </>
          )}

          {view === "unauthorized-device" && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900">Unauthorized Device</h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                This device is not authorized for your account. Request authorization from your Super Admin.
              </p>

              {deviceFingerprint && (
                <div className="mt-4 w-full rounded-lg bg-zinc-100 px-4 py-3 text-left">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">Device ID</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-zinc-600">{deviceFingerprint}</p>
                </div>
              )}

              {error && (
                <div className="mt-3 w-full rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">{error}</div>
              )}

              <button
                onClick={handleRequestAuthorization}
                disabled={isRequestingAuth}
                className="mt-6 w-full bg-emerald-800 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isRequestingAuth ? "Sending Request..." : "Request Device Authorization"}
              </button>
              <button
                onClick={() => { setView("login"); setError(""); }}
                className="mt-2 w-full py-2 text-xs text-zinc-500 hover:text-zinc-700"
              >
                Back to Login
              </button>
            </div>
          )}

          {view === "request-sent" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-emerald-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900">Request Sent</h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                Your device authorization request has been sent to your Super Admin. You will be able to log in once they approve this device for your account.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full bg-emerald-800 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {legalModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
          onClick={() => setLegalModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            className="relative max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-stone-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
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

            <div className="relative overflow-hidden bg-emerald-800 px-6 pb-6 pt-7 text-white sm:px-8">
              <div className="absolute right-[-28px] top-[-42px] h-36 w-36 rounded-full bg-white/5" />
              <div className="absolute bottom-[-34px] left-[-18px] h-28 w-28 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">JCLB Buy Back Pawnshop</p>
                <h3 id="terms-modal-title" className="mt-2 text-2xl font-bold">{legalModalContent[legalModal].title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/85">
                  {legalModalContent[legalModal].intro}
                </p>
              </div>
            </div>

            <div className="relative bg-emerald-800">
              <div className="h-2 rounded-t-xl bg-stone-100" />
              <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8">
              <div className="space-y-4">
                {legalModalContent[legalModal].sections.map((section, index) => (
                  <section key={section.title} className="border-b border-zinc-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">{section.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600">{section.body}</p>
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
                className="w-full bg-emerald-800 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
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
