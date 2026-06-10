const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    criteriaType: {
      type: String,
      required: true,
      enum: ["FIRST_TRADE", "TRADE_COUNT", "PROFITABLE_WEEK", "PORTFOLIO_DBL"],
    },
    targetValue: { type: Number, default: 0 },
    rewardPoints: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Achievement", achievementSchema);
