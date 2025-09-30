import { getToken, clearAuth } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data && data.success === false)) {
    const msg = data?.error || data?.message || `API ${res.status} ${res.statusText}`;
    if (res.status === 401) clearAuth();
    throw new Error(msg);
  }
  return data as T;
}

export const http = {
  get:  <T>(p: string, auth = true) => request<T>(p, { method: "GET" }, auth),
  post: <T>(p: string, body?: unknown, auth = true) =>
    request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }, auth),
  del:  <T>(p: string, auth = true) => request<T>(p, { method: "DELETE" }, auth),
  put:  <T>(p: string, body?: unknown, auth = true) =>
    request<T>(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, auth),
};
