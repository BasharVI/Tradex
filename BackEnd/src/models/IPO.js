const mongoose = require("mongoose");

const STATUSES = ["UPCOMING", "OPEN", "CLOSED", "ALLOTTED", "LISTED", "CANCELLED"];
const CATEGORIES = ["RETAIL", "HNI", "QIB"];

const ipoSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    exchange: { type: String, required: true, enum: ["NSE", "BSE"] },
    sector: { type: String, default: "UNCATEGORIZED" },
    industry: { type: String, default: "UNCATEGORIZED" },

    // Book-built IPOs publish a price band. Retail bids must be at or above
    // the cut-off price; allotment uses the cut-off in this simulation.
    priceBand: {
      lower: { type: Number, required: true, min: 0 },
      upper: { type: Number, required: true, min: 0 },
    },
    cutoffPrice: { type: Number, default: null, min: 0 },

    lotSize: { type: Number, required: true, min: 1 },
    minLots: { type: Number, default: 1, min: 1 },
    maxLotsRetail: { type: Number, default: 14, min: 1 },

    totalIssueSize: { type: Number, required: true, min: 0 },
    retailReservation: { type: Number, default: 0.35 }, // 35% retail
    hniReservation: { type: Number, default: 0.15 },
    qibReservation: { type: Number, default: 0.5 },

    openDate: { type: Date, required: true },
    closeDate: { type: Date, required: true },
    allotmentDate: { type: Date, required: true },
    listingDate: { type: Date, required: true },

    status: { type: String, default: "UPCOMING", enum: STATUSES, index: true },

    // Populated after listing — drives heatmap & holding insertion.
    listingPrice: { type: Number, default: null, min: 0 },
    subscriptionStats: {
      retail: { type: Number, default: 0 },
      hni: { type: Number, default: 0 },
      qib: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IPO", ipoSchema);
module.exports.STATUSES = STATUSES;
module.exports.CATEGORIES = CATEGORIES;
