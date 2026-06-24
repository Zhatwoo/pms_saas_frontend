type ApiRequestInit = RequestInit & {
  suppressAuthExpired?: boolean;
  suppressApiIssueLogging?: boolean;
};

/** Structured API failure (4xx/5xx JSON from Nest or proxy). */
export type ApiErrorPayload = Record<string, unknown> & {
  error?: string;
  code?: string;
  message?: string;
  available_balance?: number;
  required_amount?: number;
  branch_id?: string;
  business_date?: string;
  expectedAmount?: number;
  enteredAmount?: number;
  businessDate?: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly payload: ApiErrorPayload;

  constructor(message: string, statusCode: number, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.payload = payload;
  }

  get insufficientFunds(): boolean {
    return this.payload.error === "INSUFFICIENT_FUNDS";
  }

  get availableBalance(): number | undefined {
    const v = this.payload.available_balance;
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  }

  get requiredAmount(): number | undefined {
    const v = this.payload.required_amount;
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  }
}

class ApiClient {
  private pendingGets = new Map<string, Promise<unknown>>();

  private isAuthRefreshGraceActive() {
    if (typeof window === "undefined") return false;

    const rawUntil = window.sessionStorage.getItem("pms_auth_refresh_grace_until");
    const until = rawUntil ? Number(rawUntil) : 0;
    return Number.isFinite(until) && Date.now() < until;
  }

  private notifySessionExpired(message: string, path: string) {
    if (typeof window === "undefined") return;
    if (this.isAuthRefreshGraceActive()) return;

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

    if (status === 429) {
      return "Too many requests. Please try again later.";
    }

    if (status === 413) {
      return "Request is too large. Reduce attachments or split the operation.";
    }

    if (status >= 500) {
      return "Server is temporarily unavailable. Please try again.";
    }

    return "Request failed. Please try again.";
  }

  async fetch<T>(path: string, options?: ApiRequestInit): Promise<T> {
    const method = options?.method ?? "GET";
    const { suppressAuthExpired, ...requestOptions } = options ?? {};
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...requestOptions.headers,
    };

    const isPublicPath =
      path === "/auth/login" ||
      path === "/auth/logout" ||
      path === "/auth/register" ||
      path === "/auth/signup/branches" ||
      path === "/branches/public" ||
      path === "/inventory/public/for-sale" ||
      path === "/devices/request-authorization";

    let res: Response;
    let retryCount = 0;
    const maxRetries = 3;
    const suppressApiIssueLogging = Boolean(requestOptions.suppressApiIssueLogging);
    delete requestOptions.suppressApiIssueLogging;

    while (true) {
      try {
        res = await fetch(`/api${path}`, {
          ...requestOptions,
          method,
          headers,
          credentials: requestOptions.credentials ?? "include",
          ...(method === "GET" && requestOptions.cache == null ? { cache: "no-store" } : {}),
        });

        // Check if it's a pool exhaustion error
        if (res.status === 500) {
          const clonedRes = res.clone();
          try {
            const body = await clonedRes.text();
            if (body.includes("EMAXCONNSESSION") && retryCount < maxRetries) {
              retryCount++;
              const delay = 500 * Math.pow(2, retryCount - 1); // Exponential backoff: 500ms, 1000ms, 2000ms
              console.warn(`[API] Pool exhausted (EMAXCONNSESSION). Retrying ${path} in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } catch {
            // ignore clone read error
          }
        }
        break;
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
    }

    let text = "";
    try {
      text = await res.text();
    } catch {
      if (!res.ok) {
        const fb = this.fallbackMessage(res.status, path);
        throw new ApiError(fb, res.status, {});
      }
    }

    if (!res.ok) {
      const suppressLogging =
        suppressApiIssueLogging || Boolean(suppressAuthExpired && res.status === 401);
      const { message, payload } = this.parseErrorFromBody(
        res.status,
        text,
        path,
        res.headers,
        suppressLogging,
      );

      if (
        res.status === 401 &&
        !isPublicPath &&
        !suppressAuthExpired &&
        !this.isAuthRefreshGraceActive()
      ) {
        console.warn(`[API] 401 Unauthorized for ${path}.`);
        this.notifySessionExpired(message, path);
      }

      if (payload.error === "INSUFFICIENT_FUNDS") {
        console.warn("[API] Insufficient branch cash", {
          path,
          branch_id: payload.branch_id,
          business_date: payload.business_date,
          available_balance: payload.available_balance,
          required_amount: payload.required_amount,
          ts: new Date().toISOString(),
        });
      }

      throw new ApiError(message, res.status, payload);
    }

    if (!text || !text.trim()) {
      return {} as T;
    }

    if (text.trimStart().startsWith("<")) {
      return {} as T;
    }

    try {
      const json = JSON.parse(text) as { data?: T } & T;
      return json.data ?? (json as T);
    } catch {
      return {} as T;
    }
  }

  private parseErrorFromBody(
    status: number,
    text: string,
    path: string,
    resHeaders: Headers,
    suppressLogging: boolean,
  ): { message: string; payload: ApiErrorPayload } {
    const fallback = this.fallbackMessage(status, path);
    const emptyPayload = {} as ApiErrorPayload;

    if (!text || !text.trim()) {
      if (!suppressLogging) {
        this.logApiIssue(status, path, "Empty response body");
      }
      return { message: fallback, payload: emptyPayload };
    }

    if (text.trimStart().startsWith("<")) {
      if (!suppressLogging) {
        this.logApiIssue(
          status,
          path,
          "Received HTML instead of JSON (proxy or server error)",
        );
      }
      const msg =
        status === 502 || status === 503
          ? "Server is temporarily unavailable. Please try again."
          : `Server error (HTTP ${status}). The backend may be down.`;
      return { message: msg, payload: emptyPayload };
    }

    let errorData: ApiErrorPayload;
    try {
      errorData = JSON.parse(text) as ApiErrorPayload;
    } catch {
      const trimmedText = text.trim();
      const lower = trimmedText.toLowerCase();
      const likelyProxyBackendDown =
        status >= 500 &&
        text.length < 8000 &&
        !trimmedText.startsWith("{") &&
        (lower.includes("internal server error") ||
          lower.includes("bad gateway") ||
          lower.includes("gateway timeout") ||
          lower.includes("service unavailable"));

      if (likelyProxyBackendDown) {
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
            location: "PMS_frontend/lib/api.ts:parseErrorFromBody",
            message: "Non-JSON 5xx from /api (rewrite target unreachable)",
            data: {
              path,
              resStatus: status,
              bodyLen: trimmedText.length,
              snippet: trimmedText.slice(0, 160),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        if (!suppressLogging) {
          this.logApiIssue(
            status,
            path,
            "Next.js proxy could not reach Nest (ECONNREFUSED or 5xx from upstream)",
          );
        }
        return {
          message:
            "Cannot reach the backend API. Start Nest on port 4000 (npm run start:dev in PMS_backend) or run npm run dev from the project root to start both apps.",
          payload: emptyPayload,
        };
      }

      if (!suppressLogging) {
        this.logApiIssue(status, path, `Non-JSON response: ${text.slice(0, 300)}`);
      }
      return {
        message: text.length <= 200 ? text : fallback,
        payload: emptyPayload,
      };
    }

    if (!errorData || typeof errorData !== "object" || Object.keys(errorData).length === 0) {
      if (!suppressLogging) {
        this.logApiIssue(status, path, "Empty JSON object");
      }
      return { message: fallback, payload: emptyPayload };
    }

    if (!suppressLogging) {
      this.logApiIssue(status, path, errorData);
    }

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

    if (/missing bearer\s+token/i.test(msg)) {
      msg = "Session expired. Please sign in again.";
    }

    if (status === 429) {
      const retryAfter = resHeaders.get("retry-after");
      const sec = retryAfter != null && retryAfter.trim() !== "" ? parseInt(retryAfter, 10) : NaN;
      if (Number.isFinite(sec) && sec > 0) {
        msg = `${msg} Please try again in about ${sec}s.`;
      }
    }

    return { message: msg, payload: errorData };
  }

  post<T>(path: string, body: unknown, options?: ApiRequestInit) {
    return this.fetch<T>(path, { ...options, method: "POST", body: JSON.stringify(body) });
  }

  get<T>(path: string, options?: ApiRequestInit) {
    const key = JSON.stringify({
      path,
      headers: options?.headers ?? null,
      cache: options?.cache ?? null,
      credentials: options?.credentials ?? null,
      suppressAuthExpired: options?.suppressAuthExpired ?? false,
    });

    const existing = this.pendingGets.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const request = this.fetch<T>(path, { ...options, method: "GET" });
    this.pendingGets.set(key, request as Promise<unknown>);

    return request.finally(() => {
      if (this.pendingGets.get(key) === request) {
        this.pendingGets.delete(key);
      }
    });
  }

  delete<T>(path: string, options?: ApiRequestInit) {
    return this.fetch<T>(path, { ...options, method: "DELETE" });
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestInit) {
    return this.fetch<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown, options?: ApiRequestInit) {
    return this.fetch<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) });
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
