const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { corsOrigins, env } = require("./config/env");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const portfolioRoutes = require("./routes/portfolio.routes");
const ordersRoutes = require("./routes/orders.routes");
const fundsRoutes = require("./routes/funds.routes");
const watchlistRoutes = require("./routes/watchlist.routes");
const stocksRoutes = require("./routes/stocks.routes");
const heatmapRoutes = require("./routes/heatmap.routes");
const ipoRoutes = require("./routes/ipo.routes");
const corpActionRoutes = require("./routes/corporateActions.routes");
const retentionRoutes = require("./routes/retention.routes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS origin not allowed"));
    },
    // Required for the httpOnly refresh cookie to travel cross-origin.
    credentials: true,
    exposedHeaders: ["x-csrf-token"],
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

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/heatmap", heatmapRoutes);
app.use("/api/ipo", ipoRoutes);
app.use("/api/corporate-actions", corpActionRoutes);
app.use("/api/retention", retentionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
