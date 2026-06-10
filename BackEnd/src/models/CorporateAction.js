const mongoose = require("mongoose");

const TYPES = ["SPLIT", "BONUS", "DIVIDEND"];
const STATUSES = ["SCHEDULED", "APPLIED", "CANCELLED"];

// Capture a corporate action once at the symbol level; the apply step then fans
// out across every eligible holding on ex-date. Keeping it as one row per event
// (rather than per user) keeps reads cheap and prevents drift.
const corporateActionSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    exchange: { type: String, required: true, enum: ["NSE", "BSE"] },
    type: { type: String, required: true, enum: TYPES, index: true },

    // Type-specific payload.
    //   SPLIT:    { ratio: { from: 1, to: 5 } } => 1 old share becomes 5 new
    //   BONUS:    { ratio: { from: 2, to: 1 } } => 2 new shares per 1 held
    //   DIVIDEND: { amountPerShare: 12.5 }
    details: { type: mongoose.Schema.Types.Mixed, required: true },

    // Eligibility cutoff. Anyone holding on EOD on (recordDate - 1) is eligible.
    announcementDate: { type: Date, required: true },
    exDate: { type: Date, required: true, index: true },
    recordDate: { type: Date, required: true },

    status: { type: String, default: "SCHEDULED", enum: STATUSES, index: true },
    appliedAt: { type: Date, default: null },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

corporateActionSchema.index({ symbol: 1, exDate: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("CorporateAction", corporateActionSchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
