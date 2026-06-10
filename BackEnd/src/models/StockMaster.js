const mongoose = require("mongoose");

const EXCHANGES = ["NSE", "BSE"];

const stockMasterSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    exchange: { type: String, required: true, enum: EXCHANGES, index: true },
    sector: { type: String, default: "UNCATEGORIZED", index: true },
    industry: { type: String, default: "UNCATEGORIZED", index: true },
    marketCap: { type: Number, default: 0, min: 0 },
    isin: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/,
      index: true,
      sparse: true,
    },
    lotSize: { type: Number, default: 1, min: 1 },
    // Last known price — fed by an external quote feed in production. Used by
    // the trading engine for MARKET orders and by analytics for LTP-based P&L.
    lastPrice: { type: Number, default: 0, min: 0 },
    previousClose: { type: Number, default: 0, min: 0 },
    dayHigh: { type: Number, default: 0, min: 0 },
    dayLow: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isTradable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A symbol can list on both NSE and BSE — uniqueness is per-exchange.
stockMasterSchema.index({ symbol: 1, exchange: 1 }, { unique: true });

stockMasterSchema.virtual("dayChange").get(function () {
  if (!this.previousClose) return 0;
  return this.lastPrice - this.previousClose;
});

stockMasterSchema.virtual("dayChangePct").get(function () {
  if (!this.previousClose) return 0;
  return ((this.lastPrice - this.previousClose) / this.previousClose) * 100;
});

stockMasterSchema.set("toJSON", { virtuals: true });
stockMasterSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("StockMaster", stockMasterSchema);
module.exports.EXCHANGES = EXCHANGES;
