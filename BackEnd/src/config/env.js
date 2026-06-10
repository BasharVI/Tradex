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

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  },
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  trade: {
    maxFundDeposit: num(process.env.MAX_FUND_DEPOSIT, 1_000_000),
    sellPriceTolerance: num(process.env.SELL_PRICE_TOLERANCE, 0.1),
  },
};
