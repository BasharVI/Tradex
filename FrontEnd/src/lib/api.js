// Thin fetch wrapper that injects the access token, auto-refreshes on 401,
// and centralises error handling for the React app.

const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const STORAGE = {
  user: "tx_user",
  access: "tx_access",
  refresh: "tx_refresh",
};

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
  get refresh() {
    return localStorage.getItem(STORAGE.refresh);
  },
  set(session) {
    if (!session) return;
    if (session.user) {
      localStorage.setItem(STORAGE.user, JSON.stringify(session.user));
    }
    if (session.accessToken) {
      localStorage.setItem(STORAGE.access, session.accessToken);
    }
    if (session.refreshToken) {
      localStorage.setItem(STORAGE.refresh, session.refreshToken);
    }
  },
  clear() {
    localStorage.removeItem(STORAGE.user);
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
  },
};

async function rawFetch(path, options = {}, withAuth = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (withAuth && auth.access) {
    headers.Authorization = `Bearer ${auth.access}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res;
}

async function tryRefresh() {
  const refreshToken = auth.refresh;
  if (!refreshToken) return false;
  const res = await rawFetch(
    "/auth/refresh",
    { method: "POST", body: JSON.stringify({ refreshToken }) },
    false
  );
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
  if (res.status === 401 && retry && auth.refresh) {
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
