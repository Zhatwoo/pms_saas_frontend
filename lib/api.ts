class ApiClient {
  private getToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)pms_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const res = await fetch(`/api${path}`, { ...options, headers });

    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = "pms_token=; path=/; max-age=0";
        if (typeof window !== "undefined") {
          const currentPath = `${window.location.pathname}${window.location.search}`;
          const loginUrl = new URL("/login", window.location.origin);

          // Preserve where the user was so login can return them there.
          if (window.location.pathname !== "/login") {
            loginUrl.searchParams.set("redirect", currentPath);
          }

          window.location.href = loginUrl.toString();
        }
        throw new Error("Unauthorized");
      }
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data ?? json;
  }

  post<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  get<T>(path: string) {
    return this.fetch<T>(path, { method: "GET" });
  }
}

export const api = new ApiClient();
