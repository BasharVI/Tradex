const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../services/token.service");

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Missing or malformed Authorization header", 401, "UNAUTHENTICATED"));
  }
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "access") {
      return next(new AppError("Wrong token type", 401, "UNAUTHENTICATED"));
    }
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(err);
  }
};
