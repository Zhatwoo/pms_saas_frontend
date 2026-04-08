"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const name = "pms_token=";
  const parts = document.cookie.split(";");

  for (const item of parts) {
    const cookie = item.trim();
    if (cookie.startsWith(name)) {
      return decodeURIComponent(cookie.slice(name.length));
    }
  }

  return null;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Realtime is disabled.",
    );
    return null;
  }

  supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
}
