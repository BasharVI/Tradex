const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: "" },
    currentPrice: { type: Number, default: 0, min: 0 },
    lastUpdate: { type: Date, default: Date.now },
  },
  { _id: true }
);

const portfolioItemSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    // Weighted-average cost basis. `boughtPrice` kept for backward compat
    // and mirrors `averagePrice` on writes.
    averagePrice: { type: Number, required: true, min: 0 },
    boughtPrice: { type: Number, required: true, min: 0 },
    totalInvested: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, default: 0, min: 0 },
    lastUpdate: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    orderType: { type: String, required: true, enum: ["buy", "sell"] },
    orderPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    orderDate: { type: Date, default: Date.now },
  },
  { _id: true }
);

const refreshTokenSchema = new mongoose.Schema(
  {
    jtiHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // `select: false` keeps password out of every query by default.
    password: { type: String, required: true, select: false },
    fund: { type: Number, default: 0, min: 0 },
    watchlist: [watchlistItemSchema],
    portfolio: [portfolioItemSchema],
    orderHistory: [orderSchema],
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
  },
  { timestamps: true }
);

// Strip secrets from any JSON serialization.
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
