const User = require("../models/User");
const AppError = require("../utils/AppError");
const { lockout, jwt: jwtCfg, tokens } = require("../config/env");
const {
  signAccessToken,
  signRefreshToken,
  hashRefreshJti,
  compareRefreshJti,
  setRefreshCookie,
  clearRefreshCookie,
  issueCsrfToken,
  clearCsrfCookie,
  hashOpaqueToken,
  randomToken,
} = require("./token.service");

// What we expose to API consumers as the "current user".
function publicUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    primaryProvider: user.primaryProvider,
    providers: (user.oauthIdentities || []).map((i) => i.provider),
    displayName: user.displayName,
    bio: user.bio,
    photoUrl: user.photoUrl,
    experienceLevel: user.experienceLevel,
    riskAppetite: user.riskAppetite,
    goals: user.goals,
    onboarding: {
      completed: user.onboarding?.completed || false,
      step: user.onboarding?.step || 0,
    },
    startingCapital: user.startingCapital,
    availableCash: user.availableCash,
    createdAt: user.createdAt,
  };
}

// --- Sessions ----------------------------------------------------------

// Issue a fresh access+refresh pair AND record the device entry so we can
// list/revoke sessions later. Sets the refresh cookie and a CSRF cookie on
// the response.
async function issueSession(res, user, device) {
  const accessToken = signAccessToken(user._id);
  const { token: refreshToken, jti } = signRefreshToken(user._id);
  const jtiHash = await hashRefreshJti(jti);
  const expiresAt = new Date(Date.now() + jwtCfg.refreshTtlMs);

  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          jtiHash,
          expiresAt,
          ip: device.ip,
          userAgent: device.userAgent,
          device: device.device,
        },
      },
    }
  );

  setRefreshCookie(res, refreshToken);
  const csrfToken = issueCsrfToken(res);
  // Returning both tokens in body too so a non-browser client can use Bearer
  // auth. Browser SPA will ignore refreshToken in body and rely on the cookie.
  return { accessToken, refreshToken, csrfToken };
}

async function findSessionByJti(user, jti) {
  if (!user.refreshTokens) return { index: -1 };
  for (let i = 0; i < user.refreshTokens.length; i++) {
    const entry = user.refreshTokens[i];
    if (entry.expiresAt < new Date()) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await compareRefreshJti(jti, entry.jtiHash)) {
      return { index: i, entry };
    }
  }
  return { index: -1 };
}

async function revokeSession(userId, sessionId) {
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { _id: sessionId } } }
  );
}

async function revokeAllSessions(userId) {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
}

function endSession(res) {
  clearRefreshCookie(res);
  clearCsrfCookie(res);
}

// --- Lockout -----------------------------------------------------------

function isLocked(user) {
  return Boolean(user.lockedUntil && user.lockedUntil > new Date());
}

async function registerFailedLogin(user) {
  const nextAttempts = (user.failedLoginAttempts || 0) + 1;
  const update = { $set: { failedLoginAttempts: nextAttempts } };
  if (nextAttempts >= lockout.maxAttempts) {
    update.$set.lockedUntil = new Date(Date.now() + lockout.durationMs);
    update.$set.failedLoginAttempts = 0; // reset counter after lockout
  }
  await User.updateOne({ _id: user._id }, update);
}

async function registerSuccessfulLogin(user, device) {
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: device.ip || "",
      },
    }
  );
}

function assertNotLocked(user) {
  if (isLocked(user)) {
    const minutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new AppError(
      `Account is temporarily locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      423,
      "ACCOUNT_LOCKED"
    );
  }
}

// --- Email verification ------------------------------------------------

async function issueEmailVerificationToken(user) {
  const token = randomToken(32);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerifyTokenHash: hashOpaqueToken(token),
        emailVerifyExpiresAt: new Date(Date.now() + tokens.emailVerifyTtlMs),
      },
    }
  );
  return token;
}

async function consumeEmailVerificationToken(email, token) {
  const user = await User.findOne({ email: String(email).toLowerCase() })
    .select("+emailVerifyTokenHash +emailVerifyExpiresAt");
  if (!user || !user.emailVerifyTokenHash || !user.emailVerifyExpiresAt) {
    throw new AppError("Invalid or expired verification link", 400, "INVALID_TOKEN");
  }
  if (user.emailVerifyExpiresAt < new Date()) {
    throw new AppError("Invalid or expired verification link", 400, "INVALID_TOKEN");
  }
  if (user.emailVerifyTokenHash !== hashOpaqueToken(token)) {
    throw new AppError("Invalid or expired verification link", 400, "INVALID_TOKEN");
  }
  await User.updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true },
      $unset: { emailVerifyTokenHash: "", emailVerifyExpiresAt: "" },
    }
  );
  return user;
}

// --- Password reset ----------------------------------------------------

async function issuePasswordResetToken(user) {
  const token = randomToken(32);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetTokenHash: hashOpaqueToken(token),
        passwordResetExpiresAt: new Date(Date.now() + tokens.passwordResetTtlMs),
      },
    }
  );
  return token;
}

async function consumePasswordResetToken(email, token) {
  const user = await User.findOne({ email: String(email).toLowerCase() })
    .select("+passwordResetTokenHash +passwordResetExpiresAt");
  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
    throw new AppError("Invalid or expired reset link", 400, "INVALID_TOKEN");
  }
  if (user.passwordResetExpiresAt < new Date()) {
    throw new AppError("Invalid or expired reset link", 400, "INVALID_TOKEN");
  }
  if (user.passwordResetTokenHash !== hashOpaqueToken(token)) {
    throw new AppError("Invalid or expired reset link", 400, "INVALID_TOKEN");
  }
  return user;
}

module.exports = {
  publicUser,
  issueSession,
  findSessionByJti,
  revokeSession,
  revokeAllSessions,
  endSession,
  isLocked,
  assertNotLocked,
  registerFailedLogin,
  registerSuccessfulLogin,
  issueEmailVerificationToken,
  consumeEmailVerificationToken,
  issuePasswordResetToken,
  consumePasswordResetToken,
};
