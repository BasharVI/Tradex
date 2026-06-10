const express = require("express");
const User = require("../models/User");
const StockMaster = require("../models/StockMaster");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const {
  watchlistAddSchema,
  watchlistRemoveSchema,
} = require("../validators/trade.schema");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("watchlist").lean();
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    // Hydrate with live prices + names from StockMaster.
    const keys = user.watchlist.map((w) => ({ symbol: w.symbol, exchange: w.exchange }));
    const stocks = keys.length
      ? await StockMaster.find({ $or: keys })
          .select("symbol exchange companyName lastPrice previousClose sector")
          .lean()
      : [];
    const map = new Map(stocks.map((s) => [`${s.symbol}|${s.exchange}`, s]));

    const watchlist = user.watchlist.map((w) => {
      const m = map.get(`${w.symbol}|${w.exchange}`) || {};
      return {
        _id: w._id,
        symbol: w.symbol,
        exchange: w.exchange,
        companyName: m.companyName || w.symbol,
        sector: m.sector || "UNCATEGORIZED",
        lastPrice: m.lastPrice || 0,
        previousClose: m.previousClose || 0,
        changePct: m.previousClose
          ? ((m.lastPrice - m.previousClose) / m.previousClose) * 100
          : 0,
      };
    });
    res.json({ watchlist });
  })
);

router.post(
  "/",
  validate(watchlistAddSchema),
  asyncHandler(async (req, res) => {
    const { symbol, exchange } = req.body;

    const stock = await StockMaster.findOne({ symbol, exchange });
    if (!stock) throw new AppError("Symbol not listed", 404, "UNKNOWN_SYMBOL");

    const user = await User.findById(req.userId).select("watchlist");
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    if (user.watchlist.some((w) => w.symbol === symbol && w.exchange === exchange)) {
      throw new AppError("Already in watchlist", 409, "DUPLICATE");
    }
    user.watchlist.push({ symbol, exchange });
    await user.save();
    res.status(201).json({ ok: true });
  })
);

router.delete(
  "/",
  validate(watchlistRemoveSchema),
  asyncHandler(async (req, res) => {
    const { symbol } = req.body;
    await User.updateOne(
      { _id: req.userId },
      { $pull: { watchlist: { symbol } } }
    );
    res.json({ ok: true });
  })
);

module.exports = router;
