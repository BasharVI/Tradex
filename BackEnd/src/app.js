const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { corsOrigins, env } = require("./config/env");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const portfolioRoutes = require("./routes/portfolio.routes");
const ordersRoutes = require("./routes/orders.routes");
const fundsRoutes = require("./routes/funds.routes");
const watchlistRoutes = require("./routes/watchlist.routes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header).
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

if (env !== "test") {
  app.use(morgan(env === "production" ? "combined" : "dev"));
}

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));

// New canonical mount points.
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/watchlist", watchlistRoutes);

// Backward-compatibility shims for the existing frontend. Auth-required
// routes still require a Bearer token — old clients that posted a raw userId
// will now receive 401 instead of silently mutating data.
app.use("/signup", (req, res, next) => {
  req.url = "/signup";
  authRoutes(req, res, next);
});
app.use("/login", (req, res, next) => {
  req.url = "/login";
  authRoutes(req, res, next);
});
app.use("/portfolio", portfolioRoutes);
app.use("/orders", ordersRoutes);
app.use("/addfund", fundsRoutes);
app.use("/watchlist", watchlistRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
