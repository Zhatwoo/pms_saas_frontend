"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode, MouseEvent } from "react";
import { applyThemeWithAnimation } from "@/lib/theme-transition";
import { useTheme } from "@/contexts/theme-context";
import {
  ACCENT_PRESETS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  applyAccentVars,
  type AccentId,
  type AccentPreset,
} from "@/lib/accent-vars";

export type { AccentId, AccentPreset };
export { ACCENT_PRESETS };

interface AccentContextValue {
  accent: AccentId;
  preset: AccentPreset;
  presets: AccentPreset[];
  setAccent: (id: AccentId, event?: MouseEvent<HTMLElement>) => void;
  isTransitioning: boolean;
}

const AccentContext = createContext<AccentContextValue | null>(null);

function readStoredAccent(): AccentId | null {
  try {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored && stored in ACCENT_PRESETS) return stored as AccentId;
  } catch {
    // ignore
  }
  return null;
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const stored = readStoredAccent();
    if (stored) setAccentState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyAccentVars(accent, isDark);
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [accent, mounted, isDark]);

  const setAccent = useCallback(
    (id: AccentId, event?: MouseEvent<HTMLElement>) => {
      if (id === accent) return;
      const origin = event
        ? { x: event.clientX, y: event.clientY }
        : undefined;

      setIsTransitioning(true);
      void applyThemeWithAnimation(() => setAccentState(id), origin).finally(() => {
        setIsTransitioning(false);
      });
    },
    [accent],
  );

  const value = useMemo<AccentContextValue>(
    () => ({
      accent,
      preset: ACCENT_PRESETS[accent],
      presets: Object.values(ACCENT_PRESETS),
      setAccent,
      isTransitioning,
    }),
    [accent, setAccent, isTransitioning],
  );

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within AccentProvider");
  return ctx;
}
