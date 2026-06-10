const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
      index: true,
    },
    unlockedAt: { type: Date, default: Date.now },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model("UserAchievement", userAchievementSchema);
