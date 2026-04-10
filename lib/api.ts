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

    if (!token && path !== "/auth/login") {
      console.warn(
        `[API] Missing auth token for ${path}. Check if login was successful and token is stored in cookies.`,
      );
    }

    const res = await fetch(`/api${path}`, { ...options, headers });
    
    if (res.status === 401) {
      console.error(
        `[API] 401 Unauthorized for ${path}. Token present: ${!!token}, Token: ${token?.substring(0, 20)}...`,
      );
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Unauthorized");
      }
      
      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: "Request failed" };
      }
      
      // Log full error details for debugging
      console.error(`[API Error ${res.status}] ${path}:`, errorData);
      
      // Extract detailed error message
      let errorMessage = '';
      
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      // Handle validation errors in 'data' field
      if (errorData.data && Array.isArray(errorData.data)) {
        const details = errorData.data
          .map((d: any) => `${d.field}: ${Array.isArray(d.errors) ? d.errors.join(', ') : d.errors}`)
          .join('; ');
        errorMessage = errorMessage ? `${errorMessage} - ${details}` : details;
      }
      
      if (!errorMessage) {
        errorMessage = 
          errorData.error ||
          errorData.errors?.join(', ') ||
          `HTTP ${res.status}`;
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
}

export const api = new ApiClient();
