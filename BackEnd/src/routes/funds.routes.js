const express = require("express");
const User = require("../models/User");
const FundLedger = require("../models/FundLedger");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");
const { postEntry } = require("../services/ledger.service");

const router = express.Router();
router.use(requireAuth);

// Capital snapshot.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId)
      .select(
        "startingCapital availableCash investedAmount realizedPnL unrealizedPnL"
      )
      .lean();
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ capital: user });
  })
);

// Ledger view: history of every cash movement.
router.get(
  "/ledger",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const entries = await FundLedger.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ entries });
  })
);

// Manual deposit / withdraw — paper trading convenience for top-ups.
router.post(
  "/deposit",
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("Amount must be positive", 400, "VALIDATION_ERROR");
    }
    const { balanceAfter } = await postEntry({
      userId: req.userId,
      amount,
      type: "DEPOSIT",
      description: "Manual deposit",
    });
    res.json({ availableCash: balanceAfter });
  })
);

router.post(
  "/withdraw",
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("Amount must be positive", 400, "VALIDATION_ERROR");
    }
    const { balanceAfter } = await postEntry({
      userId: req.userId,
      amount: -amount,
      type: "WITHDRAWAL",
      description: "Manual withdrawal",
    });
    res.json({ availableCash: balanceAfter });
  })
);

module.exports = router;
