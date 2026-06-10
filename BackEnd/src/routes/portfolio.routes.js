const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");
const {
  getHoldings,
  getPortfolioSummary,
  getAllocation,
  getRecentTrades,
} = require("../services/analytics.service");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [summary, holdings] = await Promise.all([
      getPortfolioSummary(req.userId),
      getHoldings(req.userId),
    ]);
    res.json({ summary, holdings });
  })
);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    res.json({ summary: await getPortfolioSummary(req.userId) });
  })
);

router.get(
  "/holdings",
  asyncHandler(async (req, res) => {
    res.json({ holdings: await getHoldings(req.userId) });
  })
);

router.get(
  "/allocation",
  asyncHandler(async (req, res) => {
    const by = req.query.by === "industry" ? "industry" : "sector";
    res.json({ by, allocation: await getAllocation(req.userId, by) });
  })
);

router.get(
  "/trades",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    res.json({ trades: await getRecentTrades(req.userId, limit) });
  })
);

module.exports = router;
