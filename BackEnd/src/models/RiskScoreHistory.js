const mongoose = require("mongoose");

const riskScoreHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    computedAt: { type: Date, default: Date.now, index: true },
    tradesCount: { type: Number, default: 0 },
    metrics: {
      winRate: { type: Number, default: 0 },
      profitFactor: { type: Number, default: 0 },
      averageRiskReward: { type: Number, default: 0 },
      maxDrawdown: { type: Number, default: 0 },
      positionSizingDiscipline: { type: Number, default: 0 },
    },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

riskScoreHistorySchema.index({ userId: 1, periodEnd: -1 });
riskScoreHistorySchema.index({ userId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

module.exports = mongoose.model("RiskScoreHistory", riskScoreHistorySchema);
