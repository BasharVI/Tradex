const mongoose = require("mongoose");

const portfolioReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewedAt: { type: Date, default: Date.now, index: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    summary: { type: String, required: true },
    sectorConcentration: { type: Object, default: {} },
    industryConcentration: { type: Object, default: {} },
    diversification: { type: Object, default: {} },
    riskExposure: { type: Object, default: {} },
    cashAllocation: { type: Object, default: {} },
    recommendations: { type: [String], default: [] },
    cached: { type: Boolean, default: false },
    inputHash: { type: String, default: "", index: true },
  },
  { timestamps: true }
);

portfolioReviewSchema.index({ userId: 1, reviewedAt: -1 });

module.exports = mongoose.model("PortfolioReview", portfolioReviewSchema);
