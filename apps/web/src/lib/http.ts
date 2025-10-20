import { getToken, clearAuth } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

/**
 * Special request handler for blob responses (like CSV exports)
 */
async function requestBlob(
  path: string,
  init: RequestInit = {},
  auth: boolean = true
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Accept": "text/csv,application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  // Attach token when needed
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token found for authenticated request:", path);
    }
  }

  const url = `${API_BASE}${path}`;
  console.debug(`HTTP ${init.method || "GET"} → ${url} (blob)`, {
    auth,
    hasAuthHeader: !!headers.Authorization,
  });

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    // Try to get error message from JSON response
    try {
      const errorData = await res.json();
      const msg = errorData?.error || errorData?.message || `API ${res.status} ${res.statusText}`;
      throw new Error(msg);
    } catch {
      throw new Error(`API ${res.status} ${res.statusText}`);
    }
  }

  return res.blob();
}

/**
 * Centralized API request handler.
 * Automatically attaches Bearer token when available.
 * Handles JSON parsing and 401/403 cleanups.
 */
async function request<T>(
  path: string,
  init: RequestInit = {},
  auth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  // Attach token when needed
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token found for authenticated request:", path);
    }
  }

  const url = `${API_BASE}${path}`;
  console.debug(`HTTP ${init.method || "GET"} → ${url}`, {
    auth,
    hasAuthHeader: !!headers.Authorization,
  });

  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data && data.success === false)) {
    const msg = data?.error || data?.message || `API ${res.status} ${res.statusText}`;
    console.error("❌ API Error:", msg, { path, status: res.status });

    // ⬇️ Only clear on 401 (unauthorized), not on 403 (forbidden).
    if (res.status === 401) {
      console.warn("Clearing auth due to invalid/expired token.");
      clearAuth();
    }

    throw new Error(msg);
  }

  return data as T;
}

/**
 * Exported helpers for convenience.
 * `auth` defaults to true for all calls except when explicitly disabled.
 */
export const http = {
  get: <T>(p: string, auth = true) =>
    request<T>(p, { method: "GET" }, auth),

  post: <T>(p: string, body?: unknown, auth = true) =>
    request<T>(
      p,
      { method: "POST", body: body ? JSON.stringify(body) : undefined },
      auth
    ),

  del: <T>(p: string, auth = true) =>
    request<T>(p, { method: "DELETE" }, auth),

  put: <T>(p: string, body?: unknown, auth = true) =>
    request<T>(
      p,
      { method: "PUT", body: body ? JSON.stringify(body) : undefined },
      auth
    ),

  // Special method for blob responses (CSV exports)
  blob: (p: string, auth = true) =>
    requestBlob(p, { method: "GET" }, auth),
};
