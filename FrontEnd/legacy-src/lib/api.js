// Thin fetch wrapper that injects the access token, auto-refreshes on 401
// (via httpOnly refresh cookie + CSRF header) and centralises error handling.
//
// Storage strategy:
//   - Access token: localStorage (short-lived, low XSS impact).
//   - User snapshot: localStorage (display-only, never trusted by server).
//   - Refresh token: httpOnly cookie (NOT readable from JS — defeats XSS exfiltration).
//   - CSRF token: non-httpOnly cookie, value mirrored into x-csrf-token header.

const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const STORAGE = {
  user: "tx_user",
  access: "tx_access",
};

const CSRF_COOKIE = "tx_csrf";

function readCookie(name) {
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
  /** Persist a session response from /auth/* endpoints. */
  set(session) {
    if (!session) return;
    if (session.user) {
      localStorage.setItem(STORAGE.user, JSON.stringify(session.user));
    }
    if (session.accessToken) {
      localStorage.setItem(STORAGE.access, session.accessToken);
    }
  },
  /** Update only the cached user record (after profile / onboarding edits). */
  setUser(user) {
    if (user) localStorage.setItem(STORAGE.user, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(STORAGE.user);
    localStorage.removeItem(STORAGE.access);
  },
};

async function rawFetch(path, options = {}, withAuth = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (withAuth && auth.access) {
    headers.Authorization = `Bearer ${auth.access}`;
  }
  // Mirror the CSRF cookie into the header on every state-changing request.
  // Safe to send on GETs too; the server only checks it where it matters.
  const csrf = readCookie(CSRF_COOKIE);
  if (csrf) headers["x-csrf-token"] = csrf;

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

async function tryRefresh() {
  const res = await rawFetch("/auth/refresh", { method: "POST", body: "{}" }, false);
  if (!res.ok) {
    auth.clear();
    return false;
  }
  const data = await res.json();
  auth.set(data);
  return true;
}

export async function api(path, { method = "GET", body, retry = true } = {}) {
  const opts = { method };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res = await rawFetch(path, opts);
  if (res.status === 401 && retry && auth.access) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, opts);
    }
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message =
      (data && data.error && data.error.message) ||
      (data && data.message) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data && data.error && data.error.code;
    throw err;
  }

  return data;
}

export const API_BASE_URL = API_BASE;

// Locale-aware INR formatter — Indian grouping (1,00,000 not 100,000).
const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
export const formatINR = (n) => inrFmt.format(Number(n || 0));
export const formatPct = (n) => `${Number(n || 0).toFixed(2)}%`;
