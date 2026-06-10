const Joi = require("joi");

const symbol = Joi.string().trim().uppercase().pattern(/^[A-Z0-9.\-]{1,15}$/).required();
const price = Joi.number().positive().less(1_000_000).required();
const quantity = Joi.number().integer().min(1).max(1_000_000).required();

const tradeSchema = Joi.object({
  symbol,
  quantity,
  price,
  buySell: Joi.string().valid("buy", "sell").required(),
});

const addFundSchema = Joi.object({
  amount: Joi.number().positive().finite().required(),
});

const watchlistAddSchema = Joi.object({
  symbol,
  name: Joi.string().max(200).allow("").optional(),
  price: Joi.number().min(0).optional(),
});

const watchlistRemoveSchema = Joi.object({
  symbol,
});

module.exports = {
  tradeSchema,
  addFundSchema,
  watchlistAddSchema,
  watchlistRemoveSchema,
};
