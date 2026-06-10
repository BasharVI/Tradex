const mongoose = require("mongoose");

// A Holding is a single open position for a (user, symbol, exchange, product).
// CNC = delivery (carries overnight). MIS = intraday (auto-squared-off at EOD).
// One row per product type — a user may simultaneously hold CNC and MIS for the
// same symbol (e.g. long-term portfolio plus a day-trade).
const holdingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    exchange: { type: String, required: true, enum: ["NSE", "BSE"] },
    productType: { type: String, required: true, enum: ["CNC", "MIS"] },

    quantity: { type: Number, required: true, min: 0 },
    averagePrice: { type: Number, required: true, min: 0 },
    // Weighted-average cost net of charges (used for true P&L).
    investedAmount: { type: Number, required: true, min: 0 },

    // Cached LTP — kept in sync by the trading engine on every fill and by
    // the quote feed on price updates. Snapshot, not source of truth.
    lastPrice: { type: Number, default: 0, min: 0 },

    openedAt: { type: Date, default: Date.now },
    lastTradedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

holdingSchema.index(
  { userId: 1, symbol: 1, exchange: 1, productType: 1 },
  { unique: true }
);

holdingSchema.virtual("currentValue").get(function () {
  return this.lastPrice * this.quantity;
});

holdingSchema.virtual("unrealizedPnL").get(function () {
  return (this.lastPrice - this.averagePrice) * this.quantity;
});

holdingSchema.virtual("unrealizedPnLPct").get(function () {
  if (!this.averagePrice) return 0;
  return ((this.lastPrice - this.averagePrice) / this.averagePrice) * 100;
});

holdingSchema.set("toJSON", { virtuals: true });
holdingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Holding", holdingSchema);
