const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { signupSchema, loginSchema, refreshSchema } = require("../validators/auth.schema");
const { bcryptRounds } = require("../config/env");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshJti,
  compareRefreshJti,
} = require("../services/token.service");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts" } },
});

function publicUser(user) {
  return { id: user._id, username: user.username, email: user.email };
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user._id);
  const { token: refreshToken, jti } = signRefreshToken(user._id);
  const jtiHash = await hashRefreshJti(jti);

  // 7-day default; expiry handled by JWT but we also track server-side so
  // logout/refresh-rotation can revoke individual sessions.
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { jtiHash, expiresAt } } }
  );

  return { accessToken, refreshToken };
}

router.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, bcryptRounds);
    let user;
    try {
      user = await User.create({ username, email, password: hashed });
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError("Email already registered", 409, "EMAIL_TAKEN");
      }
      throw err;
    }
    const tokens = await issueTokens(user);
    res.status(201).json({ user: publicUser(user), ...tokens });
  })
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // Need the password explicitly because it's `select: false`.
    const user = await User.findOne({ email }).select("+password");
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) {
      // Unified message to prevent user enumeration.
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
    const tokens = await issueTokens(user);
    res.json({ user: publicUser(user), ...tokens });
  })
);

router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== "refresh") {
      throw new AppError("Wrong token type", 401, "INVALID_TOKEN");
    }

    const user = await User.findById(payload.sub).select("+refreshTokens username email");
    if (!user) throw new AppError("Invalid token", 401, "INVALID_TOKEN");

    // Find the stored hash matching this jti.
    let matchedIdx = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      const entry = user.refreshTokens[i];
      if (entry.expiresAt < new Date()) continue;
      // eslint-disable-next-line no-await-in-loop
      if (await compareRefreshJti(payload.jti, entry.jtiHash)) {
        matchedIdx = i;
        break;
      }
    }
    if (matchedIdx === -1) {
      throw new AppError("Refresh token revoked", 401, "INVALID_TOKEN");
    }

    // Rotate: revoke old, issue new.
    const matched = user.refreshTokens[matchedIdx];
    await User.updateOne(
      { _id: user._id },
      { $pull: { refreshTokens: { _id: matched._id } } }
    );
    const tokens = await issueTokens(user);
    res.json({ user: publicUser(user), ...tokens });
  })
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(req.userId).select("+refreshTokens");
        if (user) {
          for (const entry of user.refreshTokens) {
            // eslint-disable-next-line no-await-in-loop
            if (await compareRefreshJti(payload.jti, entry.jtiHash)) {
              await User.updateOne(
                { _id: user._id },
                { $pull: { refreshTokens: { _id: entry._id } } }
              );
              break;
            }
          }
        }
      } catch {
        // Ignore — logout is idempotent.
      }
    }
    res.status(204).end();
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    res.json({ user: publicUser(user) });
  })
);

module.exports = router;
