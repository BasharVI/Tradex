const mongoose = require("mongoose");

const challengeProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    progressValue: { type: Number, default: 0 },
    targetValue: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    rewardGranted: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

challengeProgressSchema.index({ userId: 1, challengeId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("ChallengeProgress", challengeProgressSchema);
