// Migrate existing user documents to the new auth schema. Idempotent.
//
//   1. Backfill displayName from username when blank.
//   2. Mark legacy users as emailVerified=true (we can't email them retroactively;
//      flip this default off and run the resend flow instead if you prefer).
//   3. Initialise onboarding state — legacy users are marked completed=true so
//      they aren't sent through the wizard on next login.
//   4. Set primaryProvider=LOCAL for users without one.
//   5. Drop any legacy refresh-token entries lacking the new metadata fields.
//
//   node src/scripts/migrate-auth.js [--dry-run]

const { connectDb } = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");

const DRY = process.argv.includes("--dry-run");

async function migrate() {
  await connectDb();
  // eslint-disable-next-line no-console
  console.log(`[migrate-auth] DRY=${DRY}`);

  const users = await User.find({}).select("+refreshTokens");
  let touched = 0;

  for (const user of users) {
    const $set = {};
    const $unset = {};

    if (!user.displayName) $set.displayName = user.username || "";
    if (user.emailVerified === undefined) $set.emailVerified = true;
    if (!user.primaryProvider) $set.primaryProvider = "LOCAL";
    if (!user.onboarding || user.onboarding.completed === undefined) {
      $set.onboarding = { completed: true, step: 5, completedAt: new Date() };
    }
    if (user.failedLoginAttempts === undefined) $set.failedLoginAttempts = 0;
    if (user.lockedUntil === undefined) $set.lockedUntil = null;

    // Prune sessions missing new fields (older logins are forced to reauth).
    const validSessions = (user.refreshTokens || []).filter(
      (s) => s.jtiHash && s.expiresAt
    );
    if (validSessions.length !== (user.refreshTokens || []).length) {
      $set.refreshTokens = validSessions;
    }

    if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) continue;

    touched++;
    if (DRY) {
      // eslint-disable-next-line no-console
      console.log(`[dry] ${user.email}: set keys ${Object.keys($set).join(",")}`);
      continue;
    }
    const update = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    await User.updateOne({ _id: user._id }, update);
  }

  // eslint-disable-next-line no-console
  console.log(`[migrate-auth] touched ${touched}/${users.length} users`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[migrate-auth] failed:", err);
  process.exit(1);
});
