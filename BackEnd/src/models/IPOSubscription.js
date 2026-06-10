const mongoose = require("mongoose");

const STATUSES = ["PENDING", "APPLIED", "ALLOTTED", "NOT_ALLOTTED", "CANCELLED"];

const ipoSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ipoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IPO",
      required: true,
      index: true,
    },
    category: { type: String, default: "RETAIL", enum: ["RETAIL", "HNI", "QIB"] },

    lots: { type: Number, required: true, min: 1 },
    quantity: { type: Number, required: true, min: 1 },
    bidPrice: { type: Number, required: true, min: 0 },
    blockedAmount: { type: Number, required: true, min: 0 },

    status: { type: String, default: "PENDING", enum: STATUSES, index: true },

    // Populated post-allotment.
    allottedQuantity: { type: Number, default: 0, min: 0 },
    allottedAmount: { type: Number, default: 0, min: 0 },
    allottedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ipoSubscriptionSchema.index({ userId: 1, ipoId: 1 }, { unique: true });

module.exports = mongoose.model("IPOSubscription", ipoSubscriptionSchema);
module.exports.STATUSES = STATUSES;
