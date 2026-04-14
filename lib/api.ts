class ApiClient {
  private getToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)pms_token=([^;]*)/);
    return match ? match[1] : null;
  }

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const isPublicPath =
      path === "/auth/login" ||
      path === "/auth/register" ||
      path === "/auth/signup/branches" ||
      path === "/branches/public";

    if (!token && !isPublicPath) {
      console.warn(
        `[API] Missing auth token for ${path}. Check if login was successful and token is stored in cookies.`,
      );
    }

    let res: Response;
    try {
      res = await fetch(`/api${path}`, { ...options, headers });
    } catch (networkErr) {
      const msg =
        networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.error(`[API] Network error for ${path}:`, msg);
      throw new Error(
        msg.includes("ECONNREFUSED") || msg.includes("fetch failed")
          ? "Cannot reach the server. Please check if the backend is running."
          : `Network error: ${msg}`,
      );
    }

    if (!res.ok) {
      const errorMessage = await this.extractErrorMessage(res, path, token);

      if (res.status === 401 && !isPublicPath) {
        console.error(
          `[API] 401 Unauthorized for ${path}. Token present: ${!!token}`,
        );
      }

      throw new Error(errorMessage);
    }

    const json = await res.json();
    return json.data ?? json;
  }

  private async extractErrorMessage(
    res: Response,
    path: string,
    token: string | null,
  ): Promise<string> {
    const fallback = `${res.statusText || "Error"} (HTTP ${res.status})`;

    let text = "";
    try {
      text = await res.text();
    } catch {
      console.error(`[API Error ${res.status}] ${path}: Could not read response body`);
      return fallback;
    }

    if (!text || !text.trim()) {
      console.error(`[API Error ${res.status}] ${path}: Empty response body`);
      return fallback;
    }

    if (text.trimStart().startsWith("<")) {
      console.error(
        `[API Error ${res.status}] ${path}: Received HTML instead of JSON (proxy or server error)`,
      );
      return res.status === 502 || res.status === 503
        ? "Server is temporarily unavailable. Please try again."
        : `Server error (HTTP ${res.status}). The backend may be down.`;
    }

    let errorData: Record<string, unknown>;
    try {
      errorData = JSON.parse(text) as Record<string, unknown>;
    } catch {
      console.error(
        `[API Error ${res.status}] ${path}: Non-JSON response:`,
        text.slice(0, 300),
      );
      return text.length <= 200 ? text : fallback;
    }

    if (!errorData || typeof errorData !== "object" || Object.keys(errorData).length === 0) {
      console.error(`[API Error ${res.status}] ${path}: Empty JSON object`);
      return fallback;
    }

    console.error(`[API Error ${res.status}] ${path}:`, errorData);

    let msg = "";

    const rawMsg = errorData.message;
    if (typeof rawMsg === "string" && rawMsg.trim()) {
      msg = rawMsg.trim();
    } else if (Array.isArray(rawMsg) && rawMsg.length > 0) {
      msg = rawMsg.map(String).join("; ");
    }

    if (errorData.data && Array.isArray(errorData.data)) {
      const details = (errorData.data as unknown[])
        .map((d) => {
          if (!d || typeof d !== "object") return "";
          const rec = d as Record<string, unknown>;
          const field = typeof rec.field === "string" ? rec.field : "?";
          const errs = Array.isArray(rec.errors)
            ? rec.errors.map(String).join(", ")
            : rec.errors != null
              ? String(rec.errors)
              : "";
          return `${field}: ${errs}`;
        })
        .filter(Boolean)
        .join("; ");
      if (details) {
        msg = msg ? `${msg} — ${details}` : details;
      }
    }

    if (!msg) {
      const errField = errorData.error;
      if (typeof errField === "string" && errField.trim()) {
        msg = errField.trim();
      }
    }

    if (!msg) {
      const errsField = errorData.errors;
      if (Array.isArray(errsField) && errsField.length > 0) {
        msg = errsField.map(String).join(", ");
      } else if (typeof errsField === "string" && errsField.trim()) {
        msg = errsField.trim();
      }
    }

    if (!msg) {
      msg = fallback;
    }

    return msg;
  }

  post<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  get<T>(path: string) {
    return this.fetch<T>(path, { method: "GET" });
  }

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: "DELETE" });
  }

  patch<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
  }
}

export const api = new ApiClient();
