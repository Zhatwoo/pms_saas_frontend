"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@/types";
import { api } from "@/lib/api";
import { normalizeUser } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load: Check localStorage and Cookies
  useEffect(() => {
    const cachedUser = localStorage.getItem("pms_user");
    const token = document.cookie.match(/(?:^|;\s*)pms_token=([^;]*)/);

    if (cachedUser) {
      try {
        setUser(normalizeUser(JSON.parse(cachedUser)));
      } catch (e) {
        localStorage.removeItem("pms_user");
      }
    }

    if (!token) {
      setUser(null);
      localStorage.removeItem("pms_user");
      setIsLoading(false);
      return;
    }

    // 2. Background Verification: Verify token with server
    api
      .get<User>("/auth/me")
      .then((freshUser) => {
        const normalizedUser = normalizeUser(freshUser);

        if (!normalizedUser) {
          throw new Error("Unauthorized");
        }

        setUser(normalizedUser);
        localStorage.setItem("pms_user", JSON.stringify(normalizedUser));
      })
      .catch((err) => {
        // Expired/invalid token should be cleared to prevent repeated 401 loops.
        if (err?.message === "Unauthorized") {
          document.cookie = "pms_token=; path=/; max-age=0";
          localStorage.removeItem("pms_user");
          setUser(null);
          return;
        }

        // Keep optimistic session for transient network/server failures.
        console.warn("Background verification failed:", err.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ access_token: string; expires_in?: number; user: User }>(
      "/auth/login",
      { email, password },
    );

    const normalizedUser = normalizeUser(data.user);

    if (!normalizedUser) {
      throw new Error("Unauthorized");
    }

    const maxAge = Math.max(1, data.expires_in ?? 3600);
    
    // Save to cookies (without encoding - browser handles it)
    document.cookie = `pms_token=${data.access_token}; path=/; max-age=${maxAge}`;
    
    // Save to state and cache
    setUser(normalizedUser);
    localStorage.setItem("pms_user", JSON.stringify(normalizedUser));

    return normalizedUser;
  }, []);

  const logout = useCallback(() => {
    document.cookie = "pms_token=; path=/; max-age=0";
    localStorage.removeItem("pms_user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
