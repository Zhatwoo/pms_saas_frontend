"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api, ApiError } from "@/lib/api";
import {
  Building2,
  MapPin,
  Phone,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Coins,
  LineChart,
  Loader2,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
}

export function OnboardingModal({ isOpen }: OnboardingModalProps) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Branch form state
  const [branchName, setBranchName] = useState("Main Branch");
  const [location, setLocation] = useState("");
  const [contactType, setContactType] = useState<"mobile" | "telephone">("mobile");
  const [contactNumber, setContactNumber] = useState("");

  if (!isOpen || !user || user.role !== "super_admin" || user.onboardingCompleted) {
    return null;
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = branchName.trim();
    const trimmedLocation = location.trim();
    const trimmedContact = contactNumber.trim();

    if (!trimmedName) {
      setErrorMsg("Branch name is required.");
      return;
    }
    if (!trimmedLocation) {
      setErrorMsg("Branch location / address is required.");
      return;
    }
    if (!trimmedContact) {
      setErrorMsg("Contact number is required.");
      return;
    }

    const digitsOnly = trimmedContact.replace(/\D/g, "");
    if (contactType === "mobile") {
      if (!/^09\d{9}$/.test(digitsOnly)) {
        setErrorMsg("Mobile number must be exactly 11 digits starting with 09 (e.g. 09XXXXXXXXX).");
        return;
      }
    } else if (contactType === "telephone") {
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setErrorMsg("Telephone number must be between 7 and 15 digits.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const updatedUser = await api.post<any>("/auth/complete-onboarding", {
        branchName: trimmedName,
        location: trimmedLocation,
        contactNumber: trimmedContact,
        contactType,
      });

      if (updatedUser) {
        updateUser(updatedUser);
        setStep(3);
      }
    } catch (err) {
      console.error("[OnboardingModal] Failed to complete onboarding:", err);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to save branch setup. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 transition-all duration-300"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 text-slate-100 shadow-2xl shadow-emerald-950/30">
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Modal Top Header Progress Bar */}
        <div className="relative border-b border-slate-800 bg-slate-900/80 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Account Setup Wizard
                </h3>
                <p className="text-xs text-slate-400">
                  Welcome to PMS SaaS — Step {step} of 3
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400">
              Standard Plan
            </span>
          </div>

          {/* Stepper indicators */}
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= 1 ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= 2 ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= 3 ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {/* STEP 1: WELCOME & SYSTEM INTRODUCTION */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Welcome to <span className="text-emerald-400">PMS SaaS</span>
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your Superadmin account has been successfully provisioned. Let's get your store initial configuration ready in just a few clicks.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-2">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-colors hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        Pawn & Inventory
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage tickets, renewals, and pawned items seamlessly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-colors hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        Branch Control
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Centralized store oversight and user permissions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-colors hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        Cash Drawer Sessions
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Employee daily session opening & closing balance tracking.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-colors hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-400">
                      <LineChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        Real-time Analytics
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Detailed reporting, audit logs, and performance metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:bg-emerald-700 transition-all cursor-pointer"
                >
                  Continue to Branch Setup
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BRANCH SETUP FORM */}
          {step === 2 && (
            <form onSubmit={handleBranchSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Setup Your Main Branch
                </h2>
                <p className="text-sm text-slate-400">
                  Your Standard Plan subscription includes <strong className="text-slate-200">1 Main Branch</strong>. Please provide your branch details below.
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4 pt-2">
                {/* Branch Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Branch Name <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Main Branch / Downtown Branch"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Location / Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Location / Address <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. 123 Commercial Ave, Manila"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Contact Number with Type Toggle */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Contact Number <span className="text-emerald-400">*</span>
                    </label>
                    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setContactType("mobile");
                          setErrorMsg(null);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                          contactType === "mobile"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Mobile (11 digits)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContactType("telephone");
                          setErrorMsg(null);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                          contactType === "telephone"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Telephone (Landline)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={contactNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const maxLen = contactType === "mobile" ? 11 : 15;
                        setContactNumber(val.slice(0, maxLen));
                      }}
                      placeholder={
                        contactType === "mobile"
                          ? "09XXXXXXXXX"
                          : ""
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {contactType === "mobile"
                      ? "11 digits starting with 09 (e.g. 09XXXXXXXXX)"
                      : "Telephone number up to 15 digits"}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Branch...
                    </>
                  ) : (
                    <>
                      Save Branch & Finish
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS / COMPLETION */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Onboarding Complete!
                </h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your main branch has been created and assigned to your Superadmin account. You are now ready to explore PMS SaaS.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left max-w-md mx-auto text-xs space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Main Branch:</span>
                  <span className="font-semibold text-slate-100">{branchName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-medium text-slate-200">{location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="font-medium text-slate-200">{contactNumber}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full max-w-md inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:bg-emerald-700 transition-all cursor-pointer"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
