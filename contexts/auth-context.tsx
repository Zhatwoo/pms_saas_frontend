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

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.match(/(?:^|;\s*)pms_token=([^;]*)/);
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ access_token: string; user: User }>(
      "/auth/login",
      { email, password },
    );
    document.cookie = `pms_token=${data.access_token}; path=/; max-age=${60 * 60 * 6}; SameSite=Lax`;
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    document.cookie = "pms_token=; path=/; max-age=0";
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
