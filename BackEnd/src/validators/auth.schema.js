const Joi = require("joi");
const { EXPERIENCE_LEVELS, RISK_APPETITES, GOALS } = require("../models/User");

// Password policy: 8+ chars, mix of letters & digits at minimum.
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Za-z]/, "letter")
  .pattern(/\d/, "digit")
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.pattern.name": "Password must contain both letters and digits",
  });

const signupSchema = Joi.object({
  username: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password,
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

// `refreshToken` is optional — when present in the body it's a non-browser
// client; browser clients send it via httpOnly cookie.
const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

const oauthSchema = Joi.object({
  credential: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  token: Joi.string().required(),
  password,
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  token: Joi.string().required(),
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const onboardingSchema = Joi.object({
  step: Joi.number().integer().min(1).max(5).required(),
  experienceLevel: Joi.string().valid(...EXPERIENCE_LEVELS).optional(),
  goals: Joi.array().items(Joi.string().valid(...GOALS)).unique().optional(),
  startingCapital: Joi.number()
    .min(1)
    // Cap to avoid abuse — same hard ceiling we use for funds.
    .max(10_000_000)
    .optional(),
  displayName: Joi.string().trim().max(60).optional(),
  bio: Joi.string().trim().max(280).allow("").optional(),
  photoUrl: Joi.string().uri().max(500).allow("").optional(),
  riskAppetite: Joi.string().valid(...RISK_APPETITES).optional(),
  completed: Joi.boolean().optional(),
});

const profileSchema = Joi.object({
  displayName: Joi.string().trim().max(60).optional(),
  bio: Joi.string().trim().max(280).allow("").optional(),
  photoUrl: Joi.string().uri().max(500).allow("").optional(),
  experienceLevel: Joi.string().valid(...EXPERIENCE_LEVELS).optional(),
  riskAppetite: Joi.string().valid(...RISK_APPETITES).optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
  oauthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  onboardingSchema,
  profileSchema,
};
