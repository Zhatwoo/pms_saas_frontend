"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/types";
import { api } from "@/lib/api";
import { normalizeUser } from "@/lib/auth";
import { getSupabaseBrowserClient, getTokenFromCookie } from "@/lib/supabase-browser";
import { SessionExpiredModal } from "@/components/ui/session-expired-modal";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isSessionExpiryActive: boolean;
  requireReLogin: (message?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_EXPIRED_REASON = "session-expired";
const REMEMBERED_SESSION_COOKIE = "pms_was_logged_in=1; path=/; max-age=2592000; samesite=lax";
const CLEAR_REMEMBERED_SESSION_COOKIE = "pms_was_logged_in=; path=/; max-age=0; samesite=lax";
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";
const SESSION_REDIRECT_DELAY_MS = 3500;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(SESSION_EXPIRED_MESSAGE);
  const [isSessionExpiryActive, setIsSessionExpiryActive] = useState(false);
  const [secondsUntilRedirect, setSecondsUntilRedirect] = useState(
    Math.ceil(SESSION_REDIRECT_DELAY_MS / 1000),
  );
  const isRefreshingRef = useRef(false);
  const isHandlingSessionExpiryRef = useRef(false);
  const sessionRedirectTimeoutRef = useRef<number | null>(null);
  const sessionCountdownIntervalRef = useRef<number | null>(null);

  const clearSession = useCallback((clearRememberedSession = false) => {
    document.cookie = "pms_token=; path=/; max-age=0; samesite=lax";
    if (clearRememberedSession) {
      document.cookie = CLEAR_REMEMBERED_SESSION_COOKIE;
    }
    localStorage.removeItem("pms_user");
    setUser(null);
  }, []);

  const redirectToLogin = useCallback((reason?: string) => {
    const params = new URLSearchParams();
    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (reason) {
      params.set("reason", reason);
    }

    if (currentPath && !currentPath.startsWith("/login")) {
      params.set("redirect", currentPath);
    }

    const query = params.toString();
    window.location.href = query ? `/login?${query}` : "/login";
  }, []);

  const clearSessionExpiryTimers = useCallback(() => {
    if (sessionRedirectTimeoutRef.current != null) {
      window.clearTimeout(sessionRedirectTimeoutRef.current);
      sessionRedirectTimeoutRef.current = null;
    }

    if (sessionCountdownIntervalRef.current != null) {
      window.clearInterval(sessionCountdownIntervalRef.current);
      sessionCountdownIntervalRef.current = null;
    }
  }, []);

  const requireReLogin = useCallback((message?: string) => {
    if (typeof window === "undefined") return;
    if (isHandlingSessionExpiryRef.current) return;

    isHandlingSessionExpiryRef.current = true;
    clearSessionExpiryTimers();
    clearSession(false);

    const nextMessage = message?.trim() || SESSION_EXPIRED_MESSAGE;
    setSessionExpiredMessage(nextMessage);
    setSecondsUntilRedirect(Math.ceil(SESSION_REDIRECT_DELAY_MS / 1000));
    setIsSessionExpiryActive(true);
    sessionStorage.setItem("pms_session_expired_notice", "shown");

    const startedAt = Date.now();
    sessionCountdownIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, SESSION_REDIRECT_DELAY_MS - elapsed);
      setSecondsUntilRedirect(Math.ceil(remainingMs / 1000));
    }, 250);

    sessionRedirectTimeoutRef.current = window.setTimeout(() => {
      clearSessionExpiryTimers();
      redirectToLogin(SESSION_EXPIRED_REASON);
    }, SESSION_REDIRECT_DELAY_MS);
  }, [clearSession, clearSessionExpiryTimers, redirectToLogin]);

  const refreshProfile = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
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
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as { message?: string } | undefined)
          : undefined;

      requireReLogin(detail?.message);
    };

    window.addEventListener("pms:auth-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("pms:auth-expired", handleSessionExpired);
    };
  }, [requireReLogin]);

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

  useEffect(() => {
    if (isLoading) return;
    if (pathname.startsWith("/login")) return;
    if (user) return;

    const hasToken = document.cookie.includes("pms_token=");
    const hadPreviousSession = document.cookie.includes("pms_was_logged_in=1");

    if (!hasToken && hadPreviousSession) {
      requireReLogin();
    }
  }, [isLoading, pathname, requireReLogin, user]);

  useEffect(() => {
    return () => {
      clearSessionExpiryTimers();
    };
  }, [clearSessionExpiryTimers]);

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

    document.cookie = `pms_token=${encodeURIComponent(data.access_token)}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = REMEMBERED_SESSION_COOKIE;

    // Save to state and cache
    clearSessionExpiryTimers();
    isHandlingSessionExpiryRef.current = false;
    setIsSessionExpiryActive(false);
    setSessionExpiredMessage(SESSION_EXPIRED_MESSAGE);
    setSecondsUntilRedirect(Math.ceil(SESSION_REDIRECT_DELAY_MS / 1000));
    setUser(normalizedUser);
    localStorage.setItem("pms_user", JSON.stringify(normalizedUser));

    return normalizedUser;
  }, [clearSessionExpiryTimers]);

  const logout = useCallback(() => {
    clearSessionExpiryTimers();
    isHandlingSessionExpiryRef.current = false;
    setIsSessionExpiryActive(false);
    clearSession(true);
    window.location.href = "/login";
  }, [clearSession, clearSessionExpiryTimers]);

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshProfile,
        isSessionExpiryActive,
        requireReLogin,
      }}
    >
      {children}
      <SessionExpiredModal
        isOpen={isSessionExpiryActive}
        message={sessionExpiredMessage}
        secondsUntilRedirect={secondsUntilRedirect}
        onConfirm={() => {
          clearSessionExpiryTimers();
          redirectToLogin(SESSION_EXPIRED_REASON);
        }}
      />
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
