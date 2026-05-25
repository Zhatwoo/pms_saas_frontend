"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getAuthorizedRedirect, getDefaultRouteForRole } from "@/lib/auth";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { api } from "@/lib/api";

interface LoginModalProps {
  onClose: () => void;
  onRequestSignUp?: () => void;
}

type ViewState = "login" | "unauthorized-device" | "request-sent";

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
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("");
  const [isRequestingAuth, setIsRequestingAuth] = useState(false);

  useEffect(() => {
    // Pre-load fingerprint so login feels instant
    getDeviceFingerprint().then(setDeviceFingerprint).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      // Ensure fingerprint is available
      const fp = deviceFingerprint || (await getDeviceFingerprint());
      const user = await login(email, password, fp);
      const requestedRedirect =
        searchParams.get("reason") === "session-expired"
          ? null
          : searchParams.get("redirect");
      const redirect = getAuthorizedRedirect(user.role, requestedRedirect);
      router.replace(redirect || getDefaultRouteForRole(user.role));
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      // Show the device authorization request flow for device-related errors
      if (
        msg.includes("Unauthorized Device") ||
        msg.includes("authorization") ||
        msg.includes("UNKNOWN_DEVICE") ||
        msg.includes("Device not authorized")
      ) {
        setView("unauthorized-device");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAuthorization = async () => {
    setIsRequestingAuth(true);
    try {
      const fp = deviceFingerprint || (await getDeviceFingerprint());
      await api.post("/devices/request-authorization", {
        deviceFingerprint: fp,
        deviceName: `${navigator.platform || "Device"} — ${new Date().toLocaleDateString()}`,
        deviceType: "DESKTOP",
        email: email,
      });
      setView("request-sent");
    } catch {
      setError("Failed to send authorization request. Please try again.");
      setView("login");
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

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                  {error}
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
                  disabled={isSubmitting}
                  className="w-full bg-emerald-800 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="my-4 h-px bg-zinc-200" />
              <p className="text-center text-xs text-zinc-500">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => { onClose(); onRequestSignUp?.(); }} className="font-bold text-emerald-800 hover:underline">Sign Up</button>
              </p>
              <div className="mt-4 text-center text-[10px] text-zinc-400">
                <p>JCLB Buy Back Shop · <span className="text-emerald-800">Privacy Policy</span></p>
                <p className="mt-1">&copy; 2026 All rights reserved · <span className="text-emerald-800">Terms of Service</span></p>
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
                This device is not authorized to access the system. You can request authorization from your branch admin.
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
                Your device authorization request has been sent to your branch admin. You will be able to log in once they approve your device.
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
    </div>
  );
}
