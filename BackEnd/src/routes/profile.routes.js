const express = require("express");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { profileSchema } = require("../validators/auth.schema");
const { publicUser } = require("../services/auth.service");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ user: publicUser(user) });
  })
);

router.patch(
  "/",
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const $set = {};
    for (const key of [
      "displayName",
      "bio",
      "photoUrl",
      "experienceLevel",
      "riskAppetite",
    ]) {
      if (req.body[key] !== undefined) $set[key] = req.body[key];
    }
    if (Object.keys($set).length === 0) {
      throw new AppError("No fields to update", 400, "VALIDATION_ERROR");
    }
    await User.updateOne({ _id: req.userId }, { $set });
    const updated = await User.findById(req.userId);
    res.json({ user: publicUser(updated) });
  })
);

module.exports = router;
