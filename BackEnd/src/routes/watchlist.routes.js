const express = require("express");
const User = require("../models/User");
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
    res.json({ watchlist: user.watchlist });
  })
);

router.post(
  "/",
  validate(watchlistAddSchema),
  asyncHandler(async (req, res) => {
    const { symbol, name = "", price = 0 } = req.body;
    const user = await User.findById(req.userId).select("watchlist");
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    if (user.watchlist.some((w) => w.symbol === symbol)) {
      throw new AppError("Symbol already in watchlist", 409, "DUPLICATE");
    }
    user.watchlist.push({
      symbol,
      name,
      currentPrice: price,
      lastUpdate: new Date(),
    });
    await user.save();
    res.status(201).json({ watchlist: user.watchlist });
  })
);

router.delete(
  "/",
  validate(watchlistRemoveSchema),
  asyncHandler(async (req, res) => {
    const { symbol } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { watchlist: { symbol } } },
      { new: true, projection: "watchlist" }
    );
    if (!updated) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ watchlist: updated.watchlist });
  })
);

module.exports = router;
