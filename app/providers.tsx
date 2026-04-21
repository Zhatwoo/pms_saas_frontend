"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { BranchProvider } from "@/contexts/branch-context";
import { OpeningChecklistProvider } from "@/contexts/opening-checklist-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <BranchProvider>
          <OpeningChecklistProvider>{children}</OpeningChecklistProvider>
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
