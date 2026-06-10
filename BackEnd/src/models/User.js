const mongoose = require("mongoose");

const STARTING_CAPITAL = Number(process.env.STARTING_CAPITAL || 1_000_000);

const EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const RISK_APPETITES = ["LOW", "MEDIUM", "HIGH"];
const GOALS = [
  "LEARN_INVESTING",
  "LEARN_TRADING",
  "BUILD_PORTFOLIO",
  "COMPETE_WITH_OTHERS",
];
const PROVIDERS = ["LOCAL", "GOOGLE", "FACEBOOK", "APPLE", "LINKEDIN"];

const watchlistItemSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    exchange: { type: String, enum: ["NSE", "BSE"], default: "NSE" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// One entry per active refresh-token / device session. Hashed so a DB leak
// can't be used to mint or replay sessions.
const refreshTokenSchema = new mongoose.Schema(
  {
    jtiHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    // Light-weight fingerprint for the device list UI ("Chrome on macOS").
    device: { type: String, default: "" },
  },
  { _id: true }
);

// External OAuth identity. A single user may have multiple providers linked
// (e.g. Google + email/password). Uniqueness is enforced via a partial index
// at the model level.
const oauthIdentitySchema = new mongoose.Schema(
  {
    provider: { type: String, enum: PROVIDERS, required: true },
    providerUserId: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    // --- Identity / auth ---
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Optional for OAuth-only users. `select: false` so it never accidentally
    // ships out of a generic .find().
    password: { type: String, select: false },
    emailVerified: { type: Boolean, default: false },
    primaryProvider: { type: String, enum: PROVIDERS, default: "LOCAL" },
    oauthIdentities: { type: [oauthIdentitySchema], default: [] },

    // --- Account-protection state ---
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },

    // --- Short-lived secrets (always stored hashed) ---
    emailVerifyTokenHash: { type: String, default: null, select: false },
    emailVerifyExpiresAt: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },

    // --- Profile ---
    displayName: { type: String, trim: true, maxlength: 60, default: "" },
    bio: { type: String, trim: true, maxlength: 280, default: "" },
    photoUrl: { type: String, trim: true, maxlength: 500, default: "" },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: null },
    riskAppetite: { type: String, enum: RISK_APPETITES, default: null },
    goals: { type: [{ type: String, enum: GOALS }], default: [] },

    // --- Onboarding state ---
    onboarding: {
      completed: { type: Boolean, default: false },
      // 0 = not started, 1..5 = current step the user is on.
      step: { type: Number, default: 0, min: 0, max: 5 },
      completedAt: { type: Date, default: null },
    },

    // --- Virtual capital book (unchanged invariants) ---
    startingCapital: { type: Number, default: STARTING_CAPITAL, min: 0 },
    availableCash: { type: Number, default: STARTING_CAPITAL, min: 0 },
    investedAmount: { type: Number, default: 0, min: 0 },
    realizedPnL: { type: Number, default: 0 },
    unrealizedPnL: { type: Number, default: 0 },

    watchlist: [watchlistItemSchema],

    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
  },
  { timestamps: true }
);

// Enforce one identity per (provider, providerUserId) globally.
userSchema.index(
  { "oauthIdentities.provider": 1, "oauthIdentities.providerUserId": 1 },
  {
    unique: true,
    partialFilterExpression: { "oauthIdentities.0": { $exists: true } },
  }
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.emailVerifyTokenHash;
    delete ret.emailVerifyExpiresAt;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpiresAt;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
module.exports.STARTING_CAPITAL = STARTING_CAPITAL;
module.exports.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
module.exports.RISK_APPETITES = RISK_APPETITES;
module.exports.GOALS = GOALS;
module.exports.PROVIDERS = PROVIDERS;
