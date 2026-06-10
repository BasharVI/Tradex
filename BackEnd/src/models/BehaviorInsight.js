const mongoose = require("mongoose");

const behaviorInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    windowStart: { type: Date, required: true, index: true },
    windowEnd: { type: Date, required: true, index: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    behaviors: {
      revengeTrading: { type: Number, default: 0 },
      overtrading: { type: Number, default: 0 },
      holdingLosersTooLong: { type: Number, default: 0 },
      cuttingWinnersEarly: { type: Number, default: 0 },
      fomoEntries: { type: Number, default: 0 },
    },
    insights: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    evidence: { type: Object, default: {} },
    cached: { type: Boolean, default: false },
  },
  { timestamps: true }
);

behaviorInsightSchema.index({ userId: 1, windowEnd: -1 });
behaviorInsightSchema.index({ userId: 1, windowStart: 1, windowEnd: 1 }, { unique: true });

module.exports = mongoose.model("BehaviorInsight", behaviorInsightSchema);
