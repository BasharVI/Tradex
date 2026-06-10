require("dotenv").config();

const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
for (const key of required) {
  if (!process.env[key]) {
    // Fail fast — refuse to boot with insecure defaults.
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const bool = (v, fallback) => {
  if (v === undefined || v === null || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
};

const env = process.env.NODE_ENV || "development";

module.exports = {
  env,
  isProd: env === "production",
  port: num(process.env.PORT, 5000),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
    refreshTtlMs: 7 * 24 * 60 * 60 * 1000, // hard fallback for cookie maxAge
  },
  cookies: {
    refreshName: process.env.REFRESH_COOKIE_NAME || "tx_refresh",
    csrfName: process.env.CSRF_COOKIE_NAME || "tx_csrf",
    secure: bool(process.env.COOKIE_SECURE, env === "production"),
    sameSite: (process.env.COOKIE_SAMESITE || "strict").toLowerCase(),
  },
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),
  lockout: {
    maxAttempts: num(process.env.LOCKOUT_MAX_ATTEMPTS, 5),
    durationMs: num(process.env.LOCKOUT_DURATION_MIN, 15) * 60 * 1000,
  },
  tokens: {
    emailVerifyTtlMs: num(process.env.EMAIL_VERIFY_TTL_HOURS, 24) * 60 * 60 * 1000,
    passwordResetTtlMs: num(process.env.PASSWORD_RESET_TTL_MIN, 30) * 60 * 1000,
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || "",
      appSecret: process.env.FACEBOOK_APP_SECRET || "",
    },
  },
  email: {
    host: process.env.EMAIL_HOST || "",
    port: num(process.env.EMAIL_PORT, 587),
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "TradeX <no-reply@tradex.local>",
  },
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  trade: {
    maxFundDeposit: num(process.env.MAX_FUND_DEPOSIT, 1_000_000),
    sellPriceTolerance: num(process.env.SELL_PRICE_TOLERANCE, 0.1),
  },
};
