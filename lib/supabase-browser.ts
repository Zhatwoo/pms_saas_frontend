"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { api } from "./api";

let supabase: SupabaseClient | null = null;
let supabaseToken: string | null = null;

export type RealtimeOnlySupabaseClient = Pick<
  SupabaseClient,
  "channel" | "removeChannel" | "realtime"
>;

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

function toRealtimeOnlyClient(client: SupabaseClient): RealtimeOnlySupabaseClient {
  return {
    channel: client.channel.bind(client),
    removeChannel: client.removeChannel.bind(client),
    realtime: client.realtime,
  };
}

export async function getSupabaseBrowserClient(): Promise<RealtimeOnlySupabaseClient | null> {
  if (typeof window === "undefined") return null;

  const token = getTokenFromCookie();

  if (supabase && supabaseToken === token) {
    return toRealtimeOnlyClient(supabase);
  }

  try {
    const config = await api.get<{ supabaseUrl: string; supabaseAnonKey: string }>("/auth/config/public");
    const url = config.supabaseUrl;
    const anonKey = config.supabaseAnonKey;

    if (!url || !anonKey) {
      console.warn(
        "[Supabase] Missing config from backend. Realtime is disabled.",
      );
      return null;
    }

    supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    });
    supabaseToken = token;

    return toRealtimeOnlyClient(supabase);
  } catch (error) {
    console.warn("[Supabase] Failed to fetch config. Realtime disabled.", error);
    return null;
  }
}
