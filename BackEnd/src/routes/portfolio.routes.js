const express = require("express");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { tradeSchema } = require("../validators/trade.schema");
const { executeBuy, executeSell } = require("../services/portfolio.service");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("portfolio fund").lean();
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ portfolio: user.portfolio, fund: user.fund });
  })
);

router.post(
  "/",
  validate(tradeSchema),
  asyncHandler(async (req, res) => {
    const { buySell, symbol, quantity, price } = req.body;
    const updated =
      buySell === "buy"
        ? await executeBuy(req.userId, { symbol, quantity, price })
        : await executeSell(req.userId, { symbol, quantity, price });
    res.json({
      fund: updated.fund,
      portfolio: updated.portfolio,
    });
  })
);

module.exports = router;
