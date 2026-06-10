const Joi = require("joi");

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

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { signupSchema, loginSchema, refreshSchema };
