"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { BranchProvider } from "@/contexts/branch-context";
import { OpeningChecklistProvider } from "@/contexts/opening-checklist-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BranchProvider>
          <OpeningChecklistProvider>{children}</OpeningChecklistProvider>
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
