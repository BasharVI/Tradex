const Joi = require("joi");

const tradeJournalSchema = Joi.object({
  tradeId: Joi.string().required(),
  orderId: Joi.string().allow(null, ""),
  symbol: Joi.string().trim().uppercase().required(),
  exchange: Joi.string().valid("NSE", "BSE").required(),
  side: Joi.string().valid("BUY", "SELL").required(),
  executedAt: Joi.date().required(),
  tradeSetup: Joi.string().trim().max(120).allow(""),
  entryReason: Joi.string().trim().max(500).allow(""),
  exitReason: Joi.string().trim().max(500).allow(""),
  riskLevel: Joi.string().valid("LOW", "MEDIUM", "HIGH", "EXTREME").default("MEDIUM"),
  emotion: Joi.string()
    .valid("CALM", "CONFIDENT", "ANXIOUS", "GREEDY", "FEARFUL", "IMPULSIVE", "DISCIPLINED")
    .default("CALM"),
  notes: Joi.string().trim().max(2000).allow(""),
});

const journalUpdateSchema = Joi.object({
  tradeSetup: Joi.string().trim().max(120).allow(""),
  entryReason: Joi.string().trim().max(500).allow(""),
  exitReason: Joi.string().trim().max(500).allow(""),
  riskLevel: Joi.string().valid("LOW", "MEDIUM", "HIGH", "EXTREME"),
  emotion: Joi.string().valid(
    "CALM",
    "CONFIDENT",
    "ANXIOUS",
    "GREEDY",
    "FEARFUL",
    "IMPULSIVE",
    "DISCIPLINED"
  ),
  notes: Joi.string().trim().max(2000).allow(""),
});

const periodSchema = Joi.object({
  start: Joi.date().optional(),
  end: Joi.date().optional(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  tradeJournalSchema,
  journalUpdateSchema,
  periodSchema,
};
