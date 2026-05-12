"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { BranchProvider } from "@/contexts/branch-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'flex w-auto items-center gap-3 rounded-xl border px-5 py-3 shadow-xl backdrop-blur-sm mx-auto',
            title: 'text-sm font-semibold',
            success: 'border-emerald-300/70 bg-emerald-100/70 text-emerald-900',
            error: 'border-red-300/70 bg-red-100/7  0 text-red-900',
          }
        }}
        icons={{
          success: (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          ),
          error: (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          ),
        }}
      />
      <AuthProvider>
        <BranchProvider>
          {children}
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
