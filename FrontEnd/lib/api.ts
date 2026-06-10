"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const STORAGE = {
  user: "tx_user",
  access: "tx_access",
};

const CSRF_COOKIE = "tx_csrf";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

export const auth = {
  get user() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.user) || "null");
    } catch {
      return null;
    }
  },
  get access() {
    return localStorage.getItem(STORAGE.access);
  },
  set(data: { user?: unknown; access?: string }) {
    if (data.user) localStorage.setItem(STORAGE.user, JSON.stringify(data.user));
    if (data.access) localStorage.setItem(STORAGE.access, data.access);
  },
  clear() {
    localStorage.removeItem(STORAGE.user);
    localStorage.removeItem(STORAGE.access);
  },
};

async function rawFetch(path: string, options: RequestInit = {}, withAuth = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any) };
  if (withAuth && auth.access) headers.Authorization = `Bearer ${auth.access}`;
  const csrf = readCookie(CSRF_COOKIE);
  if (csrf) headers["x-csrf-token"] = csrf;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  return res;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await rawFetch("/auth/refresh", { method: "POST", body: JSON.stringify({}) }, false);
    if (!res.ok) {
      auth.clear();
      return false;
    }
    const data = await res.json();
    auth.set(data);
    return true;
  } catch (_) {
    auth.clear();
    return false;
  }
}

export async function api(path: string, { method = "GET", body, retry = true } = {} as any) {
  const opts: RequestInit = { method };
  if (typeof body !== "undefined") opts.body = JSON.stringify(body);
  let res = await rawFetch(path, opts, true);
  if (res.status === 401 && retry && auth.access) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, opts, true);
    }
  }
  return res;
}

export async function logout() {
  try {
    await rawFetch("/auth/logout", { method: "POST", body: JSON.stringify({}) }, true);
  } catch (err) {
    // Best-effort — ignore errors.
  }
  auth.clear();
}

export default api;
