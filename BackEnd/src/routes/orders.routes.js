const express = require("express");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("orderHistory").lean();
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    // Most-recent first.
    const orders = [...user.orderHistory].sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
    );
    res.json({ orderHistory: orders });
  })
);

module.exports = router;
