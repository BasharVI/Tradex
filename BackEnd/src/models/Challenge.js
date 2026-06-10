const mongoose = require("mongoose");

const CHALLENGE_TYPES = ["RETURN", "TRADE_COUNT", "RISK_LIMIT"];

const challengeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    challengeType: { type: String, enum: CHALLENGE_TYPES, required: true },
    targetValue: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 20 },
    rewardPoints: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    recurring: { type: String, default: "DAILY", enum: ["DAILY"] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", challengeSchema);
module.exports.CHALLENGE_TYPES = CHALLENGE_TYPES;
