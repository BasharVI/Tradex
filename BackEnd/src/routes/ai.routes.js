const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");
const {
  generateTradeReview,
  getLatestTradeReview,
  generatePortfolioReview,
  getLatestPortfolioReview,
  detectBehavior,
  getLatestBehaviorInsight,
  generateWeeklyReport,
  getLatestWeeklyReport,
  recommendLearningContent,
  queueTradeReview,
  getAIOverview,
} = require("../services/ai/ai.service");
const { ai } = require("../config/env");

const router = express.Router();
router.use(requireAuth);

const providerSchema = Joi.object({
  provider: Joi.string().valid("mock", "openai", "claude", "gemini").optional(),
  apiKey: Joi.string().allow("").optional(),
  model: Joi.string().allow("").optional(),
  baseUrl: Joi.string().allow("").optional(),
  force: Joi.boolean().default(false),
});

const tradeParamSchema = Joi.object({ tradeId: Joi.string().required() });
const monthSchema = Joi.object({ month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional() });
const reviewBodySchema = providerSchema.keys({
  force: Joi.boolean().default(false),
});

function providerFromReq(body = {}) {
  if (body.provider || body.apiKey || body.model || body.baseUrl) return body;
  const provider = ai.provider || "mock";
  const config = { provider };
  if (provider === "openai") {
    config.apiKey = ai.openai.apiKey || ai.apiKey;
    config.model = ai.openai.model || ai.model;
    config.baseUrl = ai.openai.baseUrl;
  } else if (provider === "claude") {
    config.apiKey = ai.anthropic.apiKey || ai.apiKey;
    config.model = ai.anthropic.model || ai.model;
    config.baseUrl = ai.anthropic.baseUrl;
  } else if (provider === "gemini") {
    config.apiKey = ai.gemini.apiKey || ai.apiKey;
    config.model = ai.gemini.model || ai.model;
    config.baseUrl = ai.gemini.baseUrl;
  } else {
    config.provider = "mock";
  }
  return config;
}

router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    res.json({ overview: await getAIOverview(req.userId) });
  })
);

router.get(
  "/trade/:tradeId",
  validate(tradeParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json({ analysis: await getLatestTradeReview(req.userId, req.params.tradeId) });
  })
);

router.post(
  "/trade/:tradeId/review",
  validate(tradeParamSchema, "params"),
  validate(reviewBodySchema),
  asyncHandler(async (req, res) => {
    const analysis = await generateTradeReview(req.userId, req.params.tradeId, providerFromReq(req.body), {
      force: Boolean(req.body.force),
    });
    res.json({ analysis });
  })
);

router.post(
  "/trade/:tradeId/queue",
  validate(tradeParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.status(202).json({ job: await queueTradeReview(req.userId, req.params.tradeId, providerFromReq(req.body)) });
  })
);

router.get(
  "/portfolio",
  asyncHandler(async (req, res) => {
    res.json({ review: await getLatestPortfolioReview(req.userId) });
  })
);

router.post(
  "/portfolio/review",
  validate(providerSchema),
  asyncHandler(async (req, res) => {
    res.json({ review: await generatePortfolioReview(req.userId, providerFromReq(req.body), { force: Boolean(req.body.force) }) });
  })
);

router.get(
  "/behavior",
  asyncHandler(async (req, res) => {
    res.json({ insight: await getLatestBehaviorInsight(req.userId) });
  })
);

router.post(
  "/behavior/analyze",
  validate(providerSchema),
  asyncHandler(async (req, res) => {
    res.json({ insight: await detectBehavior(req.userId, providerFromReq(req.body), { force: Boolean(req.body.force) }) });
  })
);

router.get(
  "/weekly",
  asyncHandler(async (req, res) => {
    res.json({ report: await getLatestWeeklyReport(req.userId) });
  })
);

router.post(
  "/weekly/generate",
  validate(providerSchema),
  asyncHandler(async (req, res) => {
    res.json({ report: await generateWeeklyReport(req.userId, providerFromReq(req.body), { force: Boolean(req.body.force) }) });
  })
);

router.get(
  "/learning",
  asyncHandler(async (req, res) => {
    res.json({ learning: await recommendLearningContent(req.userId, providerFromReq(req.query)) });
  })
);

router.get(
  "/analytics",
  validate(monthSchema, "query"),
  asyncHandler(async (req, res) => {
    res.json({ overview: await getAIOverview(req.userId), month: req.query.month || null });
  })
);

module.exports = router;
