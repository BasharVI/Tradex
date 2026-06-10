const AppError = require("../utils/AppError");
const { cookies } = require("../config/env");

// Double-submit-cookie CSRF guard. Apply to endpoints that authenticate via
// the httpOnly refresh cookie (currently only /api/auth/refresh and
// /api/auth/logout). Bearer-token endpoints don't need this — they're not
// CSRF-vulnerable because the browser never automatically attaches them.
module.exports = function requireCsrf(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookieToken = req.cookies && req.cookies[cookies.csrfName];
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError("CSRF token missing or invalid", 403, "CSRF_FAILED"));
  }
  return next();
};
