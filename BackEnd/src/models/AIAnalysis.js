const mongoose = require("mongoose");

const AIAnalysisKinds = ["TRADE_REVIEW", "BEHAVIOR", "LEARNING"];

const aiAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trade",
      default: null,
      index: true,
    },
    analysisKind: { type: String, enum: AIAnalysisKinds, required: true, index: true },
    provider: { type: String, required: true, index: true },
    model: { type: String, required: true },
    grade: { type: String, default: null, index: true },
    promptVersion: { type: String, required: true },
    cacheKey: { type: String, default: "", index: true },
    inputHash: { type: String, default: "", index: true },
    summary: { type: String, required: true },
    structured: { type: Object, default: {} },
    recommendations: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    cached: { type: Boolean, default: false },
    tokensUsed: { type: Number, default: 0 },
    costEstimateUsd: { type: Number, default: 0 },
    createdForDate: { type: Date, default: null, index: true },
    periodStart: { type: Date, default: null, index: true },
    periodEnd: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ userId: 1, analysisKind: 1, createdAt: -1 });
aiAnalysisSchema.index({ userId: 1, tradeId: 1, analysisKind: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
module.exports.AIAnalysisKinds = AIAnalysisKinds;
