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

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (event?: MouseEvent<HTMLElement>) => void;
  isDark: boolean;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "pms-theme";

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(
    (event?: MouseEvent<HTMLElement>) => {
      const next: Theme = theme === "light" ? "dark" : "light";
      const origin = event
        ? { x: event.clientX, y: event.clientY }
        : undefined;

      setIsTransitioning(true);
      void applyThemeWithAnimation(() => setTheme(next), origin).finally(() => {
        setIsTransitioning(false);
      });
    },
    [theme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      isDark: theme === "dark",
      isTransitioning,
    }),
    [theme, toggleTheme, isTransitioning],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
