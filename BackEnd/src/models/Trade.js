const mongoose = require("mongoose");

// A Trade is an executed fill — the immutable audit trail for an order.
// An order can have multiple trades (partial fills), each pointing back to it.
const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    exchange: { type: String, required: true, enum: ["NSE", "BSE"] },

    side: { type: String, required: true, enum: ["BUY", "SELL"] },
    productType: { type: String, required: true, enum: ["CNC", "MIS"] },

    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    // Gross notional = price * quantity, before charges.
    turnover: { type: Number, required: true, min: 0 },

    // Itemised charges so the user can see the full cost breakdown.
    charges: {
      brokerage: { type: Number, default: 0 },
      stt: { type: Number, default: 0 },
      exchangeTxnCharges: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      sebiCharges: { type: Number, default: 0 },
      stampDuty: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    // Net cash impact (signed):
    //   BUY:  -(turnover + total charges)
    //   SELL: +(turnover - total charges)
    netAmount: { type: Number, required: true },

    // Realized P&L on the holding closed by this trade (SELL only, FIFO basis).
    realizedPnL: { type: Number, default: 0 },

    executedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

tradeSchema.index({ userId: 1, executedAt: -1 });

module.exports = mongoose.model("Trade", tradeSchema);
