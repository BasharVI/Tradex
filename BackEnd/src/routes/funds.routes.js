const express = require("express");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { addFundSchema } = require("../validators/trade.schema");
const { trade } = require("../config/env");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("fund").lean();
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ fund: user.fund });
  })
);

router.post(
  "/",
  validate(addFundSchema),
  asyncHandler(async (req, res) => {
    const { amount } = req.body;
    if (amount > trade.maxFundDeposit) {
      throw new AppError(
        `Deposit exceeds maximum (${trade.maxFundDeposit})`,
        400,
        "DEPOSIT_TOO_LARGE"
      );
    }
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { fund: amount } },
      { new: true, projection: "fund" }
    );
    if (!updated) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ fund: updated.fund });
  })
);

module.exports = router;
