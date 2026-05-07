class ApiClient {
  private notifySessionExpired(message: string, path: string) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("pms:auth-expired", {
        detail: { message, path },
      }),
    );
  }

  private logApiIssue(status: number, path: string, details: unknown) {
    const prefix = `[API Error ${status}] ${path}:`;
    if (status >= 500) {
      console.error(prefix, details);
      return;
    }
    console.warn(prefix, details);
  }

  private fallbackMessage(status: number, path: string): string {
    if (status === 401) {
      return "Session expired. Please sign in again.";
    }

    if (status === 403 && path.startsWith("/inventory/item/")) {
      return "This item belongs to another branch and cannot be scanned here.";
    }

    if (status === 404 && path.startsWith("/inventory/item/")) {
      return "Item not found in your branch inventory.";
    }

    if (status >= 500) {
      return "Server is temporarily unavailable. Please try again.";
    }

    return "Request failed. Please try again.";
  }

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const method = options?.method ?? "GET";
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const isPublicPath =
      path === "/auth/login" ||
      path === "/auth/register" ||
      path === "/auth/signup/branches" ||
      path === "/branches/public" ||
      path === "/inventory/public/for-sale";

    let res: Response;
    try {
      res = await fetch(`/api${path}`, {
        ...options,
        method,
        headers,
        credentials: "include",
        ...(method === "GET" && options?.cache == null ? { cache: "no-store" } : {}),
      });
    } catch (networkErr) {
      const msg =
        networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.warn(`[API] Network error for ${path}:`, msg);
      throw new Error(
        msg.includes("ECONNREFUSED") || msg.includes("fetch failed")
          ? "Cannot reach the server. Please check if the backend is running."
          : `Network error: ${msg}`,
      );
    }

    if (!res.ok) {
      const errorMessage = await this.extractErrorMessage(res, path);

      if (res.status === 401 && !isPublicPath) {
        console.warn(`[API] 401 Unauthorized for ${path}.`);
        this.notifySessionExpired(errorMessage, path);
      }

      throw new Error(errorMessage);
    }

    const json = await res.json();
    return json.data ?? json;
  }

  private async extractErrorMessage(
    res: Response,
    path: string,
  ): Promise<string> {
    const fallback = this.fallbackMessage(res.status, path);

    let text = "";
    try {
      text = await res.text();
    } catch {
      this.logApiIssue(res.status, path, "Could not read response body");
      return fallback;
    }

    if (!text || !text.trim()) {
      this.logApiIssue(res.status, path, "Empty response body");
      return fallback;
    }

    if (text.trimStart().startsWith("<")) {
      this.logApiIssue(
        res.status,
        path,
        "Received HTML instead of JSON (proxy or server error)",
      );
      return res.status === 502 || res.status === 503
        ? "Server is temporarily unavailable. Please try again."
        : `Server error (HTTP ${res.status}). The backend may be down.`;
    }

    let errorData: Record<string, unknown>;
    try {
      errorData = JSON.parse(text) as Record<string, unknown>;
    } catch {
      const trimmedText = text.trim();
      const lower = trimmedText.toLowerCase();
      const likelyProxyBackendDown =
        res.status >= 500 &&
        text.length < 8000 &&
        !trimmedText.startsWith("{") &&
        (lower.includes("internal server error") ||
          lower.includes("bad gateway") ||
          lower.includes("gateway timeout") ||
          lower.includes("service unavailable"));

      if (likelyProxyBackendDown) {
        // #region agent log
        fetch("http://127.0.0.1:7631/ingest/72ea5a90-3237-42ea-a50b-59d1cc22d712", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "70f8a0",
          },
          body: JSON.stringify({
            sessionId: "70f8a0",
            runId: "proxy-detect",
            hypothesisId: "H1",
            location: "PMS_frontend/lib/api.ts:extractErrorMessage",
            message: "Non-JSON 5xx from /api (rewrite target unreachable)",
            data: {
              path,
              resStatus: res.status,
              bodyLen: trimmedText.length,
              snippet: trimmedText.slice(0, 160),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => { });
        // #endregion
        this.logApiIssue(
          res.status,
          path,
          "Next.js proxy could not reach Nest (ECONNREFUSED or 5xx from upstream)",
        );
        return "Cannot reach the backend API. Start Nest on port 4000 (npm run start:dev in PMS_backend) or run npm run dev from the project root to start both apps.";
      }

      this.logApiIssue(res.status, path, `Non-JSON response: ${text.slice(0, 300)}`);
      return text.length <= 200 ? text : fallback;
    }

    if (!errorData || typeof errorData !== "object" || Object.keys(errorData).length === 0) {
      this.logApiIssue(res.status, path, "Empty JSON object");
      return fallback;
    }

    this.logApiIssue(res.status, path, errorData);

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

export function updateCustomer(
  id: string,
  data: {
    full_name?: string;
    contact_number?: string;
    email?: string;
    address?: string;
    barangay?: string;
    city?: string;
    region?: string;
    requestingEmployeeId?: string;
    logId?: string;
  },
) {
  return api.put(`/customers/${encodeURIComponent(id)}`, data);
}

export function requestCustomerEdit(id: string, notes: string, field?: string, mode?: string) {
  return api.post(`/customers/${encodeURIComponent(id)}/request-edit`, {
    notes,
    ...(field ? { field } : {}),
    ...(mode ? { mode } : {}),
  });
}

export function cancelCustomerEditRequest(id: string, logId: string) {
  return api.delete(`/customers/${encodeURIComponent(id)}/request-edit/${encodeURIComponent(logId)}`);
}
