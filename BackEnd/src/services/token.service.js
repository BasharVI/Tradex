const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { jwt: jwtCfg, bcryptRounds, cookies, env } = require("../config/env");

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId), type: "access" }, jwtCfg.accessSecret, {
    expiresIn: jwtCfg.accessTtl,
  });
}

// Refresh tokens carry a `jti` so they can be rotated/revoked individually.
function signRefreshToken(userId) {
  const jti = crypto.randomBytes(16).toString("hex");
  const token = jwt.sign(
    { sub: String(userId), type: "refresh", jti },
    jwtCfg.refreshSecret,
    { expiresIn: jwtCfg.refreshTtl }
  );
  return { token, jti };
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtCfg.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtCfg.refreshSecret);
}

async function hashRefreshJti(jti) {
  return bcrypt.hash(jti, bcryptRounds);
}

async function compareRefreshJti(jti, hash) {
  return bcrypt.compare(jti, hash);
}

// --- Cookies -----------------------------------------------------------
// httpOnly refresh-token cookie defeats XSS exfiltration, while
// SameSite=Strict (default) defeats CSRF for the refresh endpoint.

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: cookies.secure,
    sameSite: cookies.sameSite,
    path: "/api/auth",
    maxAge: jwtCfg.refreshTtlMs,
  };
}

function setRefreshCookie(res, token) {
  res.cookie(cookies.refreshName, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(cookies.refreshName, { ...refreshCookieOptions(), maxAge: 0 });
}

// CSRF: double-submit cookie. The cookie is readable by the SPA (NOT httpOnly)
// and the SPA must echo its value in the `x-csrf-token` header on state-
// changing requests. Because attackers on cross-origin pages cannot read
// cookies for our domain, they cannot forge a matching header.
function issueCsrfToken(res) {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie(cookies.csrfName, token, {
    httpOnly: false,
    secure: cookies.secure,
    sameSite: cookies.sameSite,
    path: "/",
    maxAge: jwtCfg.refreshTtlMs,
  });
  return token;
}

function clearCsrfCookie(res) {
  res.clearCookie(cookies.csrfName, { path: "/" });
}

// Stable hash for password-reset / email-verify tokens — these are
// random opaque secrets, not user-chosen passwords, so SHA-256 is fine
// and avoids bcrypt's cost.
function hashOpaqueToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshJti,
  compareRefreshJti,
  setRefreshCookie,
  clearRefreshCookie,
  issueCsrfToken,
  clearCsrfCookie,
  hashOpaqueToken,
  randomToken,
  refreshCookieName: cookies.refreshName,
  csrfCookieName: cookies.csrfName,
};
