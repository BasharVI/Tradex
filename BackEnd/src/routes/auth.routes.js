const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const FundLedger = require("../models/FundLedger");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const requireCsrf = require("../middleware/csrf");
const deviceInfo = require("../utils/deviceInfo");
const { bcryptRounds, cookies } = require("../config/env");
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  oauthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  onboardingSchema,
} = require("../validators/auth.schema");
const {
  verifyRefreshToken,
} = require("../services/token.service");
const {
  publicUser,
  issueSession,
  findSessionByJti,
  revokeSession,
  endSession,
  assertNotLocked,
  registerFailedLogin,
  registerSuccessfulLogin,
  issueEmailVerificationToken,
  consumeEmailVerificationToken,
  issuePasswordResetToken,
  consumePasswordResetToken,
} = require("../services/auth.service");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/email.service");
const { getProvider, listProviderNames } = require("../services/auth/providers");

const router = express.Router();

// --- Rate limiters -----------------------------------------------------
// Auth endpoints attract bruteforce. Separate buckets per route so a flood
// on /login doesn't lock out legitimate /signup traffic.
const baseLimiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Key by IP + email/username for credential endpoints to slow targeted
    // attacks against a single account from a botnet.
    keyGenerator: (req) =>
      `${req.ip}|${(req.body && (req.body.email || req.body.username)) || ""}`,
    message: { error: { code: "RATE_LIMITED", message: "Too many attempts" } },
  });

const loginLimiter = baseLimiter(10);
const signupLimiter = baseLimiter(5);
const forgotLimiter = baseLimiter(5);
const oauthLimiter = baseLimiter(20);

// --- Helpers -----------------------------------------------------------

function readRefreshToken(req) {
  return (
    (req.cookies && req.cookies[cookies.refreshName]) ||
    (req.body && req.body.refreshToken) ||
    ""
  );
}

// --- Signup (email + password) -----------------------------------------

router.post(
  "/signup",
  signupLimiter,
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, bcryptRounds);
    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashed,
        displayName: username,
        primaryProvider: "LOCAL",
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError("Email already registered", 409, "EMAIL_TAKEN");
      }
      throw err;
    }
    await FundLedger.create({
      userId: user._id,
      type: "DEPOSIT",
      amount: user.startingCapital,
      balanceAfter: user.startingCapital,
      description: "Starting virtual capital",
    });

    // Fire-and-forget the verification email so signup latency doesn't
    // include SMTP. Errors are logged inside the service.
    const verifyToken = await issueEmailVerificationToken(user);
    sendVerificationEmail(user, verifyToken).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[auth] verify email send failed:", err.message);
    });

    const tokens = await issueSession(res, user, deviceInfo(req));
    res.status(201).json({ user: publicUser(user), ...tokens });
  })
);

// --- Login (email + password) ------------------------------------------

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      // Unified message to prevent user enumeration. Don't reveal that the
      // account exists but uses OAuth-only login either.
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
    assertNotLocked(user);

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      await registerFailedLogin(user);
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const device = deviceInfo(req);
    await registerSuccessfulLogin(user, device);
    const tokens = await issueSession(res, user, device);
    res.json({ user: publicUser(user), ...tokens });
  })
);

// --- OAuth (Google / Facebook / future Apple, LinkedIn) ----------------

router.get(
  "/oauth/providers",
  asyncHandler(async (_req, res) => {
    res.json({ providers: listProviderNames() });
  })
);

router.post(
  "/oauth/:provider",
  oauthLimiter,
  validate(oauthSchema),
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const { credential } = req.body;
    const impl = getProvider(provider);
    const profile = await impl.verify(credential);
    if (!profile.emailVerified) {
      throw new AppError(
        "Your social-login email is not verified by the provider.",
        400,
        "OAUTH_EMAIL_UNVERIFIED"
      );
    }

    // The route param IS the canonical provider key — getProvider() already
    // normalised + validated it via the registry.
    const providerName = String(provider).toUpperCase();

    // Match by (provider, providerUserId) first; fall back to email so that
    // a user who signed up with email/password can link a social account.
    let user = await User.findOne({
      "oauthIdentities.provider": providerName,
      "oauthIdentities.providerUserId": profile.providerUserId,
    });

    if (!user) {
      user = await User.findOne({ email: profile.email });
    }

    const isNew = !user;
    if (!user) {
      // Auto-provision.
      user = await User.create({
        username: profile.displayName || profile.email.split("@")[0],
        email: profile.email,
        displayName: profile.displayName || "",
        photoUrl: profile.photoUrl || "",
        emailVerified: true,
        primaryProvider: providerName,
        oauthIdentities: [
          { provider: providerName, providerUserId: profile.providerUserId },
        ],
      });
      await FundLedger.create({
        userId: user._id,
        type: "DEPOSIT",
        amount: user.startingCapital,
        balanceAfter: user.startingCapital,
        description: "Starting virtual capital",
      });
    } else {
      const already = (user.oauthIdentities || []).some(
        (i) => i.provider === providerName && i.providerUserId === profile.providerUserId
      );
      const update = {};
      if (!already) {
        update.$push = {
          oauthIdentities: {
            provider: providerName,
            providerUserId: profile.providerUserId,
          },
        };
      }
      update.$set = { emailVerified: true };
      if (!user.photoUrl && profile.photoUrl) update.$set.photoUrl = profile.photoUrl;
      if (!user.displayName && profile.displayName) {
        update.$set.displayName = profile.displayName;
      }
      await User.updateOne({ _id: user._id }, update);
      user = await User.findById(user._id);
    }

    const device = deviceInfo(req);
    await registerSuccessfulLogin(user, device);
    const tokens = await issueSession(res, user, device);
    res.status(isNew ? 201 : 200).json({ user: publicUser(user), ...tokens });
  })
);

// --- Refresh -----------------------------------------------------------

router.post(
  "/refresh",
  requireCsrf,
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      throw new AppError("Missing refresh token", 401, "INVALID_TOKEN");
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid token", 401, "INVALID_TOKEN");
    }
    if (payload.type !== "refresh") {
      throw new AppError("Wrong token type", 401, "INVALID_TOKEN");
    }

    const user = await User.findById(payload.sub).select("+refreshTokens username email");
    if (!user) throw new AppError("Invalid token", 401, "INVALID_TOKEN");

    const match = await findSessionByJti(user, payload.jti);
    if (match.index === -1) {
      // Reuse-detection: token signed by us but no longer in the allowlist.
      // Could indicate replay after rotation — revoke everything to be safe.
      await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
      endSession(res);
      throw new AppError("Refresh token revoked", 401, "INVALID_TOKEN");
    }

    // Rotate: drop old entry, issue a new one.
    await revokeSession(user._id, match.entry._id);
    const tokens = await issueSession(res, user, deviceInfo(req));
    res.json({ user: publicUser(user), ...tokens });
  })
);

// --- Logout (current device) -------------------------------------------

router.post(
  "/logout",
  requireCsrf,
  asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.sub).select("+refreshTokens");
        if (user) {
          const match = await findSessionByJti(user, payload.jti);
          if (match.index !== -1) {
            await revokeSession(user._id, match.entry._id);
          }
        }
      } catch {
        // Idempotent — fall through.
      }
    }
    endSession(res);
    res.status(204).end();
  })
);

// --- Current user ------------------------------------------------------

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ user: publicUser(user) });
  })
);

// --- Email verification ------------------------------------------------

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const { email, token } = req.body;
    const user = await consumeEmailVerificationToken(email, token);
    res.json({ user: publicUser({ ...user.toObject(), emailVerified: true }) });
  })
);

router.post(
  "/resend-verification",
  forgotLimiter,
  validate(resendVerificationSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Don't leak whether the email exists.
    if (user && !user.emailVerified) {
      const token = await issueEmailVerificationToken(user);
      sendVerificationEmail(user, token).catch(() => {});
    }
    res.json({ ok: true });
  })
);

// --- Password reset ----------------------------------------------------

router.post(
  "/forgot-password",
  forgotLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond OK to avoid user-enumeration.
    if (user) {
      const token = await issuePasswordResetToken(user);
      sendPasswordResetEmail(user, token).catch(() => {});
    }
    res.json({ ok: true });
  })
);

router.post(
  "/reset-password",
  forgotLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email, token, password } = req.body;
    const user = await consumePasswordResetToken(email, token);
    const hashed = await bcrypt.hash(password, bcryptRounds);
    // Resetting the password also revokes every session — anyone holding
    // a stale refresh token must reauthenticate.
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashed,
          failedLoginAttempts: 0,
          lockedUntil: null,
          refreshTokens: [],
        },
        $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" },
      }
    );
    res.json({ ok: true });
  })
);

// --- Sessions / devices ------------------------------------------------

router.get(
  "/sessions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("+refreshTokens");
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    const now = new Date();
    const sessions = (user.refreshTokens || [])
      .filter((s) => s.expiresAt > now)
      .map((s) => ({
        id: String(s._id),
        device: s.device,
        ip: s.ip,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
      }));
    res.json({ sessions });
  })
);

router.delete(
  "/sessions/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeSession(req.userId, req.params.id);
    res.status(204).end();
  })
);

router.post(
  "/sessions/revoke-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.userId }, { $set: { refreshTokens: [] } });
    endSession(res);
    res.status(204).end();
  })
);

// --- Onboarding --------------------------------------------------------

router.post(
  "/onboarding",
  requireAuth,
  validate(onboardingSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const {
      step,
      experienceLevel,
      goals,
      startingCapital,
      displayName,
      bio,
      photoUrl,
      riskAppetite,
      completed,
    } = req.body;

    const $set = { "onboarding.step": Math.max(user.onboarding?.step || 0, step) };
    if (experienceLevel !== undefined) $set.experienceLevel = experienceLevel;
    if (goals !== undefined) $set.goals = goals;
    if (displayName !== undefined) $set.displayName = displayName;
    if (bio !== undefined) $set.bio = bio;
    if (photoUrl !== undefined) $set.photoUrl = photoUrl;
    if (riskAppetite !== undefined) $set.riskAppetite = riskAppetite;

    // Capital adjustment is only allowed BEFORE any trades exist (i.e. while
    // the user is still in onboarding). After completion, capital is fixed.
    if (startingCapital !== undefined && !user.onboarding?.completed) {
      const delta = startingCapital - user.startingCapital;
      $set.startingCapital = startingCapital;
      $set.availableCash = user.availableCash + delta;
    }

    if (completed) {
      $set["onboarding.completed"] = true;
      $set["onboarding.completedAt"] = new Date();
      $set["onboarding.step"] = 5;
    }

    await User.updateOne({ _id: user._id }, { $set });

    // If capital changed during onboarding, write a ledger correction so the
    // book stays auditable.
    if ($set.startingCapital !== undefined) {
      await FundLedger.create({
        userId: user._id,
        type: "ADJUSTMENT",
        amount: $set.startingCapital - user.startingCapital,
        balanceAfter: $set.availableCash,
        description: "Onboarding: initial virtual capital chosen",
      }).catch(() => {});
    }

    const updated = await User.findById(user._id);
    res.json({ user: publicUser(updated) });
  })
);

module.exports = router;
