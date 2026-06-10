const mongoose = require("mongoose");

// Append-only double-entry-ish ledger. Every change to availableCash MUST emit a
// row here. Reconstructing the cash balance is `Σ amount` for the user.
const TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "TRADE_BUY",
  "TRADE_SELL",
  "BROKERAGE",
  "TAX",
  "DIVIDEND",
  "IPO_BLOCK",
  "IPO_RELEASE",
  "IPO_ALLOTMENT",
  "ADJUSTMENT",
];

const fundLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, required: true, enum: TYPES, index: true },
    // Signed: credits positive, debits negative.
    amount: { type: Number, required: true },
    // Running cash balance after this entry — denormalised for fast reads.
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: "" },

    // Optional cross-references so we can trace any ledger row back to the
    // domain event that produced it.
    referenceType: {
      type: String,
      enum: ["Trade", "Order", "IPOSubscription", "CorporateAction", null],
      default: null,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

fundLedgerSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("FundLedger", fundLedgerSchema);
module.exports.TYPES = TYPES;
