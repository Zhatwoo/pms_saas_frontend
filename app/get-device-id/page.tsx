"use client";

import { useEffect, useState } from "react";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { BRAND_CONFIG } from "@/lib/brand-config";

export default function GetDeviceIdPage() {
  const [fingerprint, setFingerprint] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeviceFingerprint()
      .then((fp) => {
        setFingerprint(fp);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 px-8 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
            </svg>
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Device ID Lookup</h1>
          <p className="mt-1 text-sm text-emerald-200">
            {BRAND_CONFIG.companyName}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-8">
          <p className="text-sm text-zinc-600 text-center">
            This is the unique Device ID of <strong>this device</strong>. Give this to your Super Admin to authorize this device.
          </p>

          <div className="mt-6">
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">
              Your Device ID
            </label>

            {loading ? (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-8">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating Device ID...
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="break-all font-mono text-sm font-bold text-emerald-900 text-center leading-relaxed">
                  {fingerprint}
                </p>
              </div>
            )}
          </div>

          {!loading && fingerprint && (
            <button
              onClick={handleCopy}
              className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-700 text-white hover:bg-emerald-600"
              }`}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                  Copy Device ID
                </>
              )}
            </button>
          )}

          <div className="mt-6 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-4 text-xs text-zinc-500 space-y-2">
            <p className="font-bold text-zinc-700">What to do next:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Copy the Device ID above</li>
              <li>Send it to your Super Admin (via chat or verbally)</li>
              <li>Super Admin will go to <strong>Device Management → Add Device</strong></li>
              <li>Once approved, you can log in normally from this device</li>
            </ol>
          </div>
        </div>

        <div className="border-t border-zinc-100 px-8 py-4 text-center text-[10px] text-zinc-400">
          {BRAND_CONFIG.shortCompanyName} · Device Security System
        </div>
      </div>
    </div>
  );
}
