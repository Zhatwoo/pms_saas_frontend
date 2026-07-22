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

export type AccentId = "green" | "blue" | "purple" | "rose" | "amber";

interface AccentPreset {
  id: AccentId;
  label: string;
  /** Primary sidebar/brand color (replaces --brand-green / --pawn-sidebar) */
  primary: string;
  /** Highlight/gold color (replaces --brand-gold / --pawn-gold) */
  accent: string;
  /** Swatch color shown in the picker */
  swatch: string;
}

export const ACCENT_PRESETS: Record<AccentId, AccentPreset> = {
  green: {
    id: "green",
    label: "Green",
    primary: "#0B5D3B",
    accent: "#E8C547",
    swatch: "#0B5D3B",
  },
  blue: {
    id: "blue",
    label: "Blue",
    primary: "#0B4A6F",
    accent: "#4FA8E8",
    swatch: "#1173B8",
  },
  purple: {
    id: "purple",
    label: "Purple",
    primary: "#4C1D7A",
    accent: "#C084F5",
    swatch: "#7C3AED",
  },
  rose: {
    id: "rose",
    label: "Rose",
    primary: "#7A1D3D",
    accent: "#F5738E",
    swatch: "#E11D48",
  },
  amber: {
    id: "amber",
    label: "Amber",
    primary: "#7A4A0B",
    accent: "#F5B84C",
    swatch: "#D97706",
  },
};

const DEFAULT_ACCENT: AccentId = "green";
const STORAGE_KEY = "pms-accent";

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in ACCENT_PRESETS) return stored as AccentId;
  } catch {
    // ignore
  }
  return null;
}

/** Lightens (positive amount) or darkens (negative amount) a hex color by a 0-1 fraction. */
function shadeHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel: number) =>
    amount >= 0
      ? Math.round(channel + (255 - channel) * amount)
      : Math.round(channel * (1 + amount));
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function applyAccentVars(id: AccentId, isDark: boolean) {
  const root = document.documentElement;
  const preset = ACCENT_PRESETS[id];
  root.style.setProperty("--brand-green", preset.primary);
  root.style.setProperty("--brand-gold", preset.accent);
  root.style.setProperty("--pawn-sidebar", preset.primary);
  root.style.setProperty("--pawn-sidebar-light", shadeHex(preset.primary, 0.18));
  root.style.setProperty("--pawn-gold", preset.accent);
  root.style.setProperty("--pawn-gold-light", shadeHex(preset.accent, 0.15));
  root.style.setProperty("--pawn-section", shadeHex(preset.primary, 0.35));
  root.style.setProperty(
    "--pawn-content",
    isDark ? shadeHex(preset.primary, -0.9) : shadeHex(preset.primary, 0.92),
  );
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
    localStorage.setItem(STORAGE_KEY, accent);
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
