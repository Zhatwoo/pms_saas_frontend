class ApiClient {
  private getToken(): string | null {
    if (typeof document === "undefined") return null;
    const name = "pms_token=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return decodeURIComponent(c.substring(name.length, c.length));
      }
    }
    return null;
  }

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const res = await fetch(`/api${path}`, { ...options, headers });
    
    if (res.status === 401) {
      console.error(`[API] 401 Unauthorized for ${path}. Token present: ${!!token}, Token length: ${token?.length}`);
    }

    if (!res.ok) {
      if (res.status === 401) {
        // We throw Unauthorized, but let the AuthContext decide if it wants to log out 
        // to avoid race conditions during refresh or network blips.
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
