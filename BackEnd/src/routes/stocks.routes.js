const express = require("express");
const StockMaster = require("../models/StockMaster");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { stockQuerySchema } = require("../validators/trade.schema");

const router = express.Router();
router.use(requireAuth);

// Search / list stocks. Cheap text-prefix match against symbol + companyName.
router.get(
  "/",
  validate(stockQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { q, exchange, sector, industry, limit, skip } = req.query;
    const filter = { isActive: true };
    if (exchange) filter.exchange = exchange;
    if (sector) filter.sector = sector;
    if (industry) filter.industry = industry;
    if (q) {
      const re = new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
      filter.$or = [{ symbol: re }, { companyName: re }];
    }

    const [stocks, total] = await Promise.all([
      StockMaster.find(filter)
        .sort({ marketCap: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMaster.countDocuments(filter),
    ]);
    res.json({ stocks, total });
  })
);

router.get(
  "/sectors",
  asyncHandler(async (_req, res) => {
    const sectors = await StockMaster.distinct("sector", { isActive: true });
    res.json({ sectors: sectors.sort() });
  })
);

router.get(
  "/:symbol/:exchange",
  asyncHandler(async (req, res) => {
    const stock = await StockMaster.findOne({
      symbol: req.params.symbol.toUpperCase(),
      exchange: req.params.exchange.toUpperCase(),
    }).lean();
    if (!stock) throw new AppError("Stock not found", 404, "UNKNOWN_SYMBOL");
    res.json({ stock });
  })
);

module.exports = router;
