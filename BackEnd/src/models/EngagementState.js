const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema(
  {
    count: { type: Number, default: 0 },
    best: { type: Number, default: 0 },
    lastAt: { type: Date, default: null },
  },
  { _id: false }
);

const engagementStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    login: { type: streakSchema, default: () => ({}) },
    trading: { type: streakSchema, default: () => ({}) },
    greenDay: { type: streakSchema, default: () => ({}) },
    learning: { type: streakSchema, default: () => ({}) },
    rewardPoints: { type: Number, default: 0 },
    lastGreenDayPnl: { type: Number, default: 0 },
    updatedAtSource: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EngagementState", engagementStateSchema);
