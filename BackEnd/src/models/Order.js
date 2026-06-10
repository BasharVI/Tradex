const mongoose = require("mongoose");

const SIDES = ["BUY", "SELL"];
const ORDER_TYPES = ["MARKET", "LIMIT"];
const PRODUCT_TYPES = ["CNC", "MIS"]; // Delivery / Intraday
const STATUSES = ["PENDING", "EXECUTED", "PARTIALLY_FILLED", "REJECTED", "CANCELLED"];

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    exchange: { type: String, required: true, enum: ["NSE", "BSE"] },

    side: { type: String, required: true, enum: SIDES },
    orderType: { type: String, required: true, enum: ORDER_TYPES },
    productType: { type: String, required: true, enum: PRODUCT_TYPES },

    quantity: { type: Number, required: true, min: 1 },
    filledQuantity: { type: Number, default: 0, min: 0 },

    // limitPrice required for LIMIT orders, null for MARKET.
    limitPrice: { type: Number, default: null, min: 0 },
    // avgFillPrice is set once at least one fill posts.
    avgFillPrice: { type: Number, default: 0, min: 0 },

    status: { type: String, default: "PENDING", enum: STATUSES, index: true },
    rejectionReason: { type: String, default: null },

    placedAt: { type: Date, default: Date.now },
    executedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, placedAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
module.exports.SIDES = SIDES;
module.exports.ORDER_TYPES = ORDER_TYPES;
module.exports.PRODUCT_TYPES = PRODUCT_TYPES;
module.exports.STATUSES = STATUSES;
