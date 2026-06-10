const mongoose = require("mongoose");

const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "EXTREME"];
const EMOTIONS = [
  "CALM",
  "CONFIDENT",
  "ANXIOUS",
  "GREEDY",
  "FEARFUL",
  "IMPULSIVE",
  "DISCIPLINED",
];

const tradeJournalSchema = new mongoose.Schema(
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
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    exchange: { type: String, required: true, enum: ["NSE", "BSE"] },
    side: { type: String, required: true, enum: ["BUY", "SELL"] },
    executedAt: { type: Date, required: true, index: true },

    tradeSetup: { type: String, trim: true, maxlength: 120, default: "" },
    entryReason: { type: String, trim: true, maxlength: 500, default: "" },
    exitReason: { type: String, trim: true, maxlength: 500, default: "" },
    riskLevel: { type: String, enum: RISK_LEVELS, default: "MEDIUM" },
    emotion: { type: String, enum: EMOTIONS, default: "CALM" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true }
);

tradeJournalSchema.index({ userId: 1, executedAt: -1 });

module.exports = mongoose.model("TradeJournal", tradeJournalSchema);
module.exports.RISK_LEVELS = RISK_LEVELS;
module.exports.EMOTIONS = EMOTIONS;
