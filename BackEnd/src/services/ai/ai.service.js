const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Trade = require("../../models/Trade");
const Holding = require("../../models/Holding");
const StockMaster = require("../../models/StockMaster");
const AIAnalysis = require("../../models/AIAnalysis");
const BehaviorInsight = require("../../models/BehaviorInsight");
const PortfolioReview = require("../../models/PortfolioReview");
const WeeklyReport = require("../../models/WeeklyReport");
const RiskScoreHistory = require("../../models/RiskScoreHistory");
const TradeJournal = require("../../models/TradeJournal");
const AppError = require("../../utils/AppError");
const { getPortfolioSummary, getHoldings, getAllocation } = require("../analytics.service");
const { getRiskScore, getAchievements, getActiveChallenges } = require("../retention.service");
const { createProvider } = require("./providerFactory");
const { hashPayload, getCached, setCached } = require("./cache.service");
const { enforceAiRateLimit } = require("./rateLimit.service");
const { enqueueAiJob } = require("./queue.service");
const { PROMPT_VERSION, tradeReviewPrompt, portfolioReviewPrompt, behaviorPrompt, weeklyReportPrompt, learningCoachPrompt } = require("./promptTemplates");

const MODELS = {
  tradeReview: {
    analysisKind: "TRADE_REVIEW",
    cacheTtl: 60 * 60 * 24 * 14,
    rateBucket: "trade-review",
    monthlyLimit: 100,
  },
  portfolioReview: {
    analysisKind: "PORTFOLIO",
    cacheTtl: 60 * 60 * 12,
    rateBucket: "portfolio-review",
    monthlyLimit: 40,
  },
  behavior: {
    analysisKind: "BEHAVIOR",
    cacheTtl: 60 * 60 * 24 * 7,
    rateBucket: "behavior",
    monthlyLimit: 20,
  },
  weekly: {
    analysisKind: "WEEKLY",
    cacheTtl: 60 * 60 * 24 * 14,
    rateBucket: "weekly-report",
    monthlyLimit: 10,
  },
  learning: {
    analysisKind: "LEARNING",
    cacheTtl: 60 * 60 * 24 * 7,
    rateBucket: "learning",
    monthlyLimit: 50,
  },
};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function monthWindowFromDate(date = new Date()) {
  return {
    start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
    end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
  };
}

function weekWindowFromDate(date = new Date()) {
  const current = new Date(date);
  const day = current.getUTCDay();
  const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() - day));
  const end = new Date(start.getTime() + 7 * 86400000);
  return { start, end };
}

function normalizeProviderConfig(requested = {}) {
  return {
    provider: requested.provider || process.env.AI_PROVIDER || "mock",
    apiKey:
      requested.apiKey ||
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "",
    model:
      requested.model ||
      process.env.AI_MODEL ||
      process.env.OPENAI_MODEL ||
      process.env.ANTHROPIC_MODEL ||
      process.env.GEMINI_MODEL ||
      "",
    baseUrl: requested.baseUrl || "",
  };
}

async function buildTradeContext(userId, tradeId) {
  const trade = await Trade.findOne({ _id: tradeId, userId }).lean();
  if (!trade) throw new AppError("Trade not found", 404, "TRADE_NOT_FOUND");
  const user = await User.findById(userId).select("startingCapital availableCash investedAmount realizedPnL").lean();
  const holdings = await getHoldings(userId);
  const portfolio = await getPortfolioSummary(userId);
  const allocation = await getAllocation(userId);
  const journal = await TradeJournal.findOne({ tradeId, userId }).lean();
  const risk = await getRiskScore(userId, { month: trade.executedAt.toISOString().slice(0, 7) });

  return {
    trade,
    user,
    holdings,
    portfolio,
    allocation,
    journal,
    risk,
  };
}

function scoreFromTradeAnalysis(analysis) {
  const signals = analysis.signals || {};
  const total =
    Number(signals.entryQuality || 0) +
    Number(signals.exitQuality || 0) +
    Number(signals.riskManagement || 0) +
    Number(signals.positionSize || 0) +
    Number(signals.rewardRisk || 0);
  const normalized = Math.round(total / 5);
  return Math.max(0, Math.min(100, normalized));
}

async function generateTradeReview(userId, tradeId, providerConfig = {}, options = {}) {
  const context = await buildTradeContext(userId, tradeId);
  const cachePayload = { kind: "trade", tradeId: String(tradeId), provider: normalizeProviderConfig(providerConfig).provider, context: { trade: context.trade, journal: context.journal, risk: context.risk } };
  const cacheKey = hashPayload(cachePayload);
  const cached = await getCached(cacheKey);
  if (cached && !options.force) return persistTradeAnalysis(userId, context.trade, cached, cacheKey, true, providerConfig);
  await enforceAiRateLimit(userId, MODELS.tradeReview.rateBucket, MODELS.tradeReview.monthlyLimit);

  const normalized = normalizeProviderConfig(providerConfig);
  const provider = createProvider(normalized);
  const prompt = tradeReviewPrompt({
    trade: context.trade,
    context: {
      portfolio: context.portfolio,
      holdings: context.holdings,
      allocation: context.allocation,
      journal: context.journal,
      risk: context.risk,
    },
  });
  const response = await provider.generateJson(prompt);
  const analysis = {
    grade: response.grade || "B",
    summary: response.summary || "",
    strengths: response.strengths || [],
    weaknesses: response.weaknesses || [],
    recommendations: response.recommendations || [],
    structured: response.signals || {},
    score: scoreFromTradeAnalysis(response),
    tokensUsed: 0,
    costEstimateUsd: estimateCost(provider.name, provider.model, prompt, response),
  };
  await setCached(cacheKey, analysis, MODELS.tradeReview.cacheTtl);
  return persistTradeAnalysis(userId, context.trade, analysis, cacheKey, false, normalized);
}

async function persistTradeAnalysis(userId, trade, analysis, cacheKey, cached, providerConfig) {
  const doc = await AIAnalysis.findOneAndUpdate(
    { userId, tradeId: trade._id, analysisKind: "TRADE_REVIEW" },
    {
      $set: {
        provider: normalizeProviderConfig(providerConfig).provider,
        model: normalizeProviderConfig(providerConfig).model || "mock",
        grade: analysis.grade,
        promptVersion: PROMPT_VERSION,
        cacheKey,
        inputHash: cacheKey,
        summary: analysis.summary,
        structured: analysis.structured || {},
        recommendations: analysis.recommendations || [],
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        cached,
        tokensUsed: analysis.tokensUsed || 0,
        costEstimateUsd: analysis.costEstimateUsd || 0,
        createdForDate: trade.executedAt,
      },
      $setOnInsert: {
        userId,
        tradeId: trade._id,
        analysisKind: "TRADE_REVIEW",
      },
    },
    { new: true, upsert: true }
  );
  return doc;
}

function estimateCost(providerName, model, prompt, response) {
  const size = JSON.stringify({ prompt, response }).length;
  const tokens = Math.max(1, Math.round(size / 4));
  const rates = {
    openai: 0.00001,
    claude: 0.000012,
    gemini: 0.000008,
    mock: 0,
  };
  return round2(tokens * (rates[providerName] || 0.00001));
}

async function getLatestTradeReview(userId, tradeId) {
  return AIAnalysis.findOne({ userId, tradeId, analysisKind: "TRADE_REVIEW" }).lean();
}

async function generatePortfolioReview(userId, providerConfig = {}, options = {}) {
  const portfolio = await getPortfolioSummary(userId);
  const holdings = await getHoldings(userId);
  const allocation = await getAllocation(userId);
  const cachePayload = { kind: "portfolio", userId: String(userId), provider: normalizeProviderConfig(providerConfig).provider, portfolio, holdings, allocation };
  const cacheKey = hashPayload(cachePayload);
  const cached = await getCached(cacheKey);
  if (cached && !options.force) return persistPortfolioReview(userId, cached, cacheKey, true, providerConfig);
  await enforceAiRateLimit(userId, MODELS.portfolioReview.rateBucket, MODELS.portfolioReview.monthlyLimit);

  const normalized = normalizeProviderConfig(providerConfig);
  const provider = createProvider(normalized);
  const prompt = portfolioReviewPrompt({ portfolio, holdings: { allocation, holdings } });
  const response = await provider.generateJson(prompt);
  const review = {
    summary: response.summary || "",
    sectorConcentration: response.sectorConcentration || {},
    industryConcentration: response.industryConcentration || {},
    diversification: response.diversification || {},
    riskExposure: response.riskExposure || {},
    cashAllocation: response.cashAllocation || {},
    recommendations: response.recommendations || [],
  };
  await setCached(cacheKey, review, MODELS.portfolioReview.cacheTtl);
  return persistPortfolioReview(userId, review, cacheKey, false, normalized);
}

async function persistPortfolioReview(userId, review, cacheKey, cached, providerConfig) {
  return PortfolioReview.findOneAndUpdate(
    { userId },
    {
      $set: {
        provider: normalizeProviderConfig(providerConfig).provider,
        model: normalizeProviderConfig(providerConfig).model || "mock",
        summary: review.summary,
        sectorConcentration: review.sectorConcentration || {},
        industryConcentration: review.industryConcentration || {},
        diversification: review.diversification || {},
        riskExposure: review.riskExposure || {},
        cashAllocation: review.cashAllocation || {},
        recommendations: review.recommendations || [],
        cached,
        inputHash: cacheKey,
      },
    },
    { upsert: true, new: true }
  );
}

async function getLatestPortfolioReview(userId) {
  return PortfolioReview.findOne({ userId }).sort({ reviewedAt: -1 }).lean();
}

async function detectBehavior(userId, providerConfig = {}, options = {}) {
  const window = weekWindowFromDate(new Date());
  const trades = await Trade.find({ userId, executedAt: { $gte: window.start, $lt: window.end } }).sort({ executedAt: 1 }).lean();
  const journals = await TradeJournal.find({ userId, executedAt: { $gte: window.start, $lt: window.end } }).sort({ executedAt: 1 }).lean();
  const risk = await getRiskScore(userId, { start: window.start, end: window.end });
  const cachePayload = { kind: "behavior", userId: String(userId), provider: normalizeProviderConfig(providerConfig).provider, trades, journals, risk };
  const cacheKey = hashPayload(cachePayload);
  const cached = await getCached(cacheKey);
  if (cached && !options.force) return persistBehaviorInsight(userId, window, cached, cacheKey, true, providerConfig);
  await enforceAiRateLimit(userId, MODELS.behavior.rateBucket, MODELS.behavior.monthlyLimit);

  const normalized = normalizeProviderConfig(providerConfig);
  const provider = createProvider(normalized);
  const prompt = behaviorPrompt({ trades, context: { journals, risk } });
  const response = await provider.generateJson(prompt);
  const insight = {
    insights: response.insights || [],
    recommendations: response.recommendations || [],
    behaviors: response.behaviors || {},
    evidence: response.evidence || {},
  };
  await setCached(cacheKey, insight, MODELS.behavior.cacheTtl);
  return persistBehaviorInsight(userId, window, insight, cacheKey, false, normalized);
}

async function persistBehaviorInsight(userId, window, insight, cacheKey, cached, providerConfig) {
  return BehaviorInsight.findOneAndUpdate(
    { userId, windowStart: window.start, windowEnd: window.end },
    {
      $set: {
        provider: normalizeProviderConfig(providerConfig).provider,
        model: normalizeProviderConfig(providerConfig).model || "mock",
        behaviors: insight.behaviors || {},
        insights: insight.insights || [],
        recommendations: insight.recommendations || [],
        evidence: insight.evidence || {},
        cached,
      },
    },
    { upsert: true, new: true }
  );
}

async function getLatestBehaviorInsight(userId) {
  return BehaviorInsight.findOne({ userId }).sort({ windowEnd: -1 }).lean();
}

async function generateWeeklyReport(userId, providerConfig = {}, options = {}) {
  const window = weekWindowFromDate(new Date());
  const trades = await Trade.find({ userId, executedAt: { $gte: window.start, $lt: window.end } }).sort({ executedAt: 1 }).lean();
  const risk = await getRiskScore(userId, { start: window.start, end: window.end });
  const behavior = await detectBehavior(userId, providerConfig, { force: options.force });
  const portfolio = await getPortfolioSummary(userId);
  const cachePayload = {
    kind: "weekly",
    userId: String(userId),
    provider: normalizeProviderConfig(providerConfig).provider,
    trades,
    risk,
    behaviorId: behavior?._id ? String(behavior._id) : "",
    portfolio,
  };
  const cacheKey = hashPayload(cachePayload);
  const cached = await getCached(cacheKey);
  if (cached && !options.force) return persistWeeklyReport(userId, window, cached, cacheKey, true, providerConfig);
  await enforceAiRateLimit(userId, MODELS.weekly.rateBucket, MODELS.weekly.monthlyLimit);

  const normalized = normalizeProviderConfig(providerConfig);
  const provider = createProvider(normalized);
  const prompt = weeklyReportPrompt({ trades, risk, behavior, portfolio });
  const response = await provider.generateJson(prompt);
  const report = {
    performanceSummary: response.performanceSummary || "",
    mistakeSummary: response.mistakeSummary || "",
    improvementAreas: response.improvementAreas || [],
    riskMetrics: response.riskMetrics || {},
    recommendations: response.recommendations || [],
  };
  await setCached(cacheKey, report, MODELS.weekly.cacheTtl);
  return persistWeeklyReport(userId, window, report, cacheKey, false, normalized);
}

async function persistWeeklyReport(userId, window, report, cacheKey, cached, providerConfig) {
  return WeeklyReport.findOneAndUpdate(
    { userId, weekStart: window.start, weekEnd: window.end },
    {
      $set: {
        provider: normalizeProviderConfig(providerConfig).provider,
        model: normalizeProviderConfig(providerConfig).model || "mock",
        performanceSummary: report.performanceSummary || "",
        mistakeSummary: report.mistakeSummary || "",
        improvementAreas: report.improvementAreas || [],
        riskMetrics: report.riskMetrics || {},
        recommendations: report.recommendations || [],
        cached,
        inputHash: cacheKey,
      },
    },
    { upsert: true, new: true }
  );
}

async function getLatestWeeklyReport(userId) {
  return WeeklyReport.findOne({ userId }).sort({ weekEnd: -1 }).lean();
}

async function recommendLearningContent(userId, providerConfig = {}, options = {}) {
  const [risk, behavior, recentReview, weekly] = await Promise.all([
    getRiskScore(userId),
    getLatestBehaviorInsight(userId),
    getLatestTradeReview(userId),
    getLatestWeeklyReport(userId),
  ]);
  const cachePayload = { kind: "learning", userId: String(userId), provider: normalizeProviderConfig(providerConfig).provider, risk, behavior, recentReview, weekly };
  const cacheKey = hashPayload(cachePayload);
  const cached = await getCached(cacheKey);
  if (cached && !options.force) return cached;
  await enforceAiRateLimit(userId, MODELS.learning.rateBucket, MODELS.learning.monthlyLimit);

  const normalized = normalizeProviderConfig(providerConfig);
  const provider = createProvider(normalized);
  const prompt = learningCoachPrompt({ risk, behavior, recentReview, weekly });
  const response = await provider.generateJson(prompt);
  const learning = {
    summary: response.summary || "",
    recommendations: response.recommendations || [],
    provider: normalized.provider,
    model: normalized.model || "mock",
    cacheKey,
  };
  await setCached(cacheKey, learning, MODELS.learning.cacheTtl);
  return learning;
}

async function queueTradeReview(userId, tradeId, providerConfig = {}) {
  await enqueueAiJob({ type: "TRADE_REVIEW", userId: String(userId), tradeId: String(tradeId), providerConfig, enqueuedAt: Date.now() });
  return { queued: true };
}

async function enqueueWeeklyReportsBatch() {
  const { getClient } = require("../redisClient");
  const client = getClient();
  const window = weekWindowFromDate(new Date());
  const userIds = await Trade.distinct("userId", {
    executedAt: { $gte: window.start, $lt: window.end },
  });
  let queued = 0;
  for (const userId of userIds) {
    // Prevent duplicate enqueues if the scheduler runs multiple times a day.
    // eslint-disable-next-line no-await-in-loop
    const lock = await client.set(
      `ai:weekly:queued:${window.end.toISOString().slice(0, 10)}:${userId}`,
      "1",
      "NX",
      "EX",
      60 * 60 * 24 * 10
    );
    if (!lock) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await WeeklyReport.exists({ userId, weekStart: window.start, weekEnd: window.end })) continue;
    // eslint-disable-next-line no-await-in-loop
    await enqueueAiJob({
      type: "WEEKLY_REPORT",
      userId: String(userId),
      providerConfig: {},
      weekStart: window.start,
      weekEnd: window.end,
      enqueuedAt: Date.now(),
    });
    queued += 1;
  }
  return { queued, weekStart: window.start, weekEnd: window.end };
}

async function processAiJob(job) {
  if (job.type === "TRADE_REVIEW") return generateTradeReview(job.userId, job.tradeId, job.providerConfig, { force: true });
  if (job.type === "PORTFOLIO_REVIEW") return generatePortfolioReview(job.userId, job.providerConfig, { force: true });
  if (job.type === "BEHAVIOR") return detectBehavior(job.userId, job.providerConfig, { force: true });
  if (job.type === "WEEKLY_REPORT") return generateWeeklyReport(job.userId, job.providerConfig, { force: true });
  if (job.type === "LEARNING") return recommendLearningContent(job.userId, job.providerConfig, { force: true });
  throw new AppError("Unknown AI job type", 400, "AI_JOB_UNKNOWN");
}

async function getAIOverview(userId) {
  const [latestTradeReview, latestPortfolioReview, latestBehavior, latestWeekly, learning] = await Promise.all([
    AIAnalysis.findOne({ userId, analysisKind: "TRADE_REVIEW" }).sort({ createdAt: -1 }).lean(),
    getLatestPortfolioReview(userId),
    getLatestBehaviorInsight(userId),
    getLatestWeeklyReport(userId),
    recommendLearningContent(userId),
  ]);
  const analyses = await AIAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  return { latestTradeReview, latestPortfolioReview, latestBehavior, latestWeekly, learning, analyses };
}

module.exports = {
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
  processAiJob,
  enqueueWeeklyReportsBatch,
  getAIOverview,
  PROMPT_VERSION,
};
