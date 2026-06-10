const Holding = require("../models/Holding");
const CorporateAction = require("../models/CorporateAction");
const AppError = require("../utils/AppError");
const { postEntry } = require("./ledger.service");

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Apply a scheduled corporate action to every eligible holding.
 * Idempotent — the model status flag guards against double application.
 */
async function applyAction(actionId) {
  const action = await CorporateAction.findById(actionId);
  if (!action) throw new AppError("Action not found", 404, "NOT_FOUND");
  if (action.status === "APPLIED") return { skipped: true, action };
  if (action.status === "CANCELLED") {
    throw new AppError("Action is cancelled", 400, "CANCELLED");
  }

  // CNC only — MIS positions are squared off intraday and never carry overnight,
  // so they aren't eligible for corporate actions on ex-date.
  const holdings = await Holding.find({
    symbol: action.symbol,
    exchange: action.exchange,
    productType: "CNC",
    quantity: { $gt: 0 },
  });

  for (const h of holdings) {
    switch (action.type) {
      case "SPLIT":
        await applySplit(h, action);
        break;
      case "BONUS":
        await applyBonus(h, action);
        break;
      case "DIVIDEND":
        await applyDividend(h, action);
        break;
      default:
        break;
    }
  }

  action.status = "APPLIED";
  action.appliedAt = new Date();
  await action.save();

  return { skipped: false, action, affected: holdings.length };
}

// SPLIT: ratio { from, to }. 1:5 split -> qty *= 5, avg /= 5. invested stays.
async function applySplit(h, action) {
  const { from, to } = action.details.ratio || {};
  if (!from || !to) return;
  const factor = to / from;
  h.quantity = Math.round(h.quantity * factor);
  h.averagePrice = round2(h.investedAmount / h.quantity);
  await h.save();
}

// BONUS: ratio { from, to }. 1:2 bonus = 1 new free per 2 held.
// Invested amount unchanged; avg price falls because the cost basis is spread
// across more shares.
async function applyBonus(h, action) {
  const { from, to } = action.details.ratio || {};
  if (!from || !to) return;
  const bonusShares = Math.floor((h.quantity * to) / from);
  if (bonusShares <= 0) return;
  h.quantity += bonusShares;
  h.averagePrice = round2(h.investedAmount / h.quantity);
  await h.save();
}

// DIVIDEND: cash credit per share. Adds to availableCash via ledger.
async function applyDividend(h, action) {
  const perShare = Number(action.details.amountPerShare || 0);
  if (perShare <= 0) return;
  const credit = round2(perShare * h.quantity);
  if (credit <= 0) return;

  await postEntry({
    userId: h.userId,
    amount: credit,
    type: "DIVIDEND",
    description: `Dividend ${h.symbol} @ ${perShare}/share x ${h.quantity}`,
    referenceType: "CorporateAction",
    referenceId: action._id,
  });
}

async function listScheduled() {
  return CorporateAction.find({ status: "SCHEDULED" })
    .sort({ exDate: 1 })
    .lean();
}

async function scheduleAction(payload) {
  return CorporateAction.create(payload);
}

module.exports = { applyAction, scheduleAction, listScheduled };
