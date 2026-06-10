const Joi = require("joi");

const symbol = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[A-Z0-9.\-&]{1,20}$/)
  .required();

const exchange = Joi.string().valid("NSE", "BSE").required();
const side = Joi.string().valid("BUY", "SELL").required();
const orderType = Joi.string().valid("MARKET", "LIMIT").required();
const productType = Joi.string().valid("CNC", "MIS").required();
const quantity = Joi.number().integer().min(1).max(10_000_000).required();
const price = Joi.number().positive().less(10_000_000);

const placeOrderSchema = Joi.object({
  symbol,
  exchange,
  side,
  orderType,
  productType,
  quantity,
  limitPrice: price.when("orderType", {
    is: "LIMIT",
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
});

const watchlistAddSchema = Joi.object({
  symbol,
  exchange: Joi.string().valid("NSE", "BSE").default("NSE"),
});

const watchlistRemoveSchema = Joi.object({ symbol });

const stockQuerySchema = Joi.object({
  q: Joi.string().trim().max(50).optional(),
  exchange: Joi.string().valid("NSE", "BSE").optional(),
  sector: Joi.string().max(60).optional(),
  industry: Joi.string().max(60).optional(),
  limit: Joi.number().integer().min(1).max(200).default(50),
  skip: Joi.number().integer().min(0).default(0),
});

const ipoSubscribeSchema = Joi.object({
  lots: Joi.number().integer().min(1).max(1000).required(),
  bidPrice: Joi.number().positive().required(),
  category: Joi.string().valid("RETAIL", "HNI", "QIB").default("RETAIL"),
});

const corporateActionSchema = Joi.object({
  symbol,
  exchange,
  type: Joi.string().valid("SPLIT", "BONUS", "DIVIDEND").required(),
  details: Joi.object().required(),
  announcementDate: Joi.date().required(),
  exDate: Joi.date().required(),
  recordDate: Joi.date().required(),
  notes: Joi.string().max(500).optional().allow(""),
});

module.exports = {
  placeOrderSchema,
  watchlistAddSchema,
  watchlistRemoveSchema,
  stockQuerySchema,
  ipoSubscribeSchema,
  corporateActionSchema,
};
