"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@/types";
import { api } from "@/lib/api";
import { normalizeUser } from "@/lib/auth";
import { getSupabaseBrowserClient, getTokenFromCookie } from "@/lib/supabase-browser";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const freshUser = await api.get<User>("/auth/me");
      const normalizedUser = normalizeUser(freshUser);
      if (normalizedUser) {
        setUser(normalizedUser);
        localStorage.setItem("pms_user", JSON.stringify(normalizedUser));
      }
    } catch (err) {
      console.warn("[AuthContext] Failed to refresh profile:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // 1. Initial Load: Check localStorage and Cookies
  useEffect(() => {
    const cachedUser = localStorage.getItem("pms_user");
    const token = document.cookie.match(/(?:^|;\s*)pms_token=([^;]*)/);

    if (cachedUser) {
      try {
        setUser(normalizeUser(JSON.parse(cachedUser)));
      } catch {
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
    void refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  // 3. Realtime Listener: Watch for user profile changes (e.g. branch transfers)
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const token = getTokenFromCookie();
    if (token) {
      void supabase.realtime.setAuth(token);
    }

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        () => {
          console.log("[AuthContext] Profile change detected, refreshing...");
          void refreshProfile();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, refreshProfile]);

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
    <AuthContext value={{ user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
