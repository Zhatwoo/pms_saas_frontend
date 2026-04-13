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

    const res = await fetch(`/api${path}`, { ...options, headers });

    if (!res.ok) {
      const text = await res.text();
      let errorData: Record<string, unknown> = {};
      if (text) {
        try {
          errorData = JSON.parse(text) as Record<string, unknown>;
        } catch {
          errorData = {
            message:
              text.length > 500 ? `${text.slice(0, 500)}…` : text,
          };
        }
      } else {
        errorData = { message: `HTTP ${res.status} (empty body)` };
      }

      if (res.status === 401) {
        console.error(
          `[API] 401 Unauthorized for ${path}. Token present: ${!!token}, Token: ${token?.substring(0, 20)}...`,
        );
        const msg =
          typeof errorData.message === "string"
            ? errorData.message
            : "Unauthorized";
        throw new Error(msg);
      }

      // Log full error details for debugging
      console.error(`[API Error ${res.status}] ${path}:`, errorData);
      
      // Extract detailed error message
      let errorMessage = "";
      const rawMsg = errorData.message;
      if (typeof rawMsg === "string") {
        errorMessage = rawMsg;
      } else if (Array.isArray(rawMsg)) {
        errorMessage = rawMsg.map(String).join("; ");
      }
      
      // Handle validation errors in 'data' field
      if (errorData.data && Array.isArray(errorData.data)) {
        const details = errorData.data
          .map((d: unknown) => {
            if (!d || typeof d !== "object") return "";
            const rec = d as Record<string, unknown>;
            const field = rec.field;
            const errs = rec.errors;
            const errStr = Array.isArray(errs)
              ? errs.map(String).join(", ")
              : errs != null
                ? String(errs)
                : "";
            return `${typeof field === "string" ? field : "?"}: ${errStr}`;
          })
          .filter(Boolean)
          .join("; ");
        errorMessage = errorMessage ? `${errorMessage} - ${details}` : details;
      }
      
      if (!errorMessage) {
        const errField = errorData.error;
        const errsField = errorData.errors;
        const errorsJoined = Array.isArray(errsField)
          ? errsField.map(String).join(", ")
          : typeof errsField === "string"
            ? errsField
            : "";
        const detail =
          (typeof errField === "string" ? errField : "") ||
          errorsJoined ||
          (Object.keys(errorData).length > 0
            ? JSON.stringify(errorData)
            : "");
        errorMessage =
          detail ||
          (typeof errorData.statusCode === "number"
            ? `Request failed (${errorData.statusCode})`
            : "") ||
          `HTTP ${res.status}${
            Object.keys(errorData).length === 0
              ? " (empty error body — check API / network proxy logs)"
              : ""
          }`;
      }
        
      throw new Error(String(errorMessage));
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

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: "DELETE" });
  }

  patch<T>(path: string, body: unknown) {
    return this.fetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }
}

export const api = new ApiClient();
