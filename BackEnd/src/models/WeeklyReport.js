const mongoose = require("mongoose");

const weeklyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStart: { type: Date, required: true, index: true },
    weekEnd: { type: Date, required: true, index: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    performanceSummary: { type: String, required: true },
    mistakeSummary: { type: String, required: true },
    improvementAreas: { type: [String], default: [] },
    riskMetrics: { type: Object, default: {} },
    recommendations: { type: [String], default: [] },
    cached: { type: Boolean, default: false },
    inputHash: { type: String, default: "", index: true },
  },
  { timestamps: true }
);

weeklyReportSchema.index({ userId: 1, weekStart: 1, weekEnd: 1 }, { unique: true });
weeklyReportSchema.index({ userId: 1, weekEnd: -1 });

module.exports = mongoose.model("WeeklyReport", weeklyReportSchema);
