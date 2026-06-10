const AppError = require("../utils/AppError");
const { env } = require("../config/env");

// 404 handler — installed after all routes.
function notFound(req, res, next) {
  next(new AppError("Route not found", 404, "NOT_FOUND"));
}

// Central error handler — never leak stacks or raw mongoose errors.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Something went wrong";

  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
  } else if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = "Invalid identifier";
  } else if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE";
    message = "Resource already exists";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Authentication failed";
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error]", err);
  }

  const body = { error: { code, message } };
  if (env !== "production" && statusCode >= 500) {
    body.error.stack = err.stack;
  }
  res.status(statusCode).json(body);
}

module.exports = { errorHandler, notFound };
