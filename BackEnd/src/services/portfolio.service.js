const User = require("../models/User");
const AppError = require("../utils/AppError");
const { trade } = require("../config/env");

// All money math at 2dp. Mongo doesn't have decimal128 enabled here so we round
// to cents to avoid float drift accumulating in cost basis.
const round2 = (n) => Math.round(n * 100) / 100;

async function executeBuy(userId, { symbol, quantity, price }) {
  const cost = round2(price * quantity);

  // Atomic guard: only debit funds if sufficient. Concurrent buys cannot both
  // pass this check for the same balance because findOneAndUpdate is atomic.
  const debited = await User.findOneAndUpdate(
    { _id: userId, fund: { $gte: cost } },
    { $inc: { fund: -cost } },
    { new: true }
  );
  if (!debited) {
    throw new AppError("Insufficient funds", 400, "INSUFFICIENT_FUNDS");
  }

  const existing = debited.portfolio.find((p) => p.symbol === symbol);
  if (existing) {
    const newQty = existing.quantity + quantity;
    const newInvested = round2(existing.totalInvested + cost);
    const newAvg = round2(newInvested / newQty);

    await User.updateOne(
      { _id: userId, "portfolio.symbol": symbol },
      {
        $set: {
          "portfolio.$.quantity": newQty,
          "portfolio.$.totalInvested": newInvested,
          "portfolio.$.averagePrice": newAvg,
          "portfolio.$.boughtPrice": newAvg,
          "portfolio.$.currentPrice": price,
          "portfolio.$.lastUpdate": new Date(),
        },
        $push: {
          orderHistory: {
            symbol,
            orderType: "buy",
            orderPrice: price,
            quantity,
            orderDate: new Date(),
          },
        },
      }
    );
  } else {
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          portfolio: {
            symbol,
            quantity,
            averagePrice: price,
            boughtPrice: price,
            totalInvested: cost,
            currentPrice: price,
            lastUpdate: new Date(),
          },
          orderHistory: {
            symbol,
            orderType: "buy",
            orderPrice: price,
            quantity,
            orderDate: new Date(),
          },
        },
      }
    );
  }

  return User.findById(userId).select("fund portfolio orderHistory");
}

async function executeSell(userId, { symbol, quantity, price }) {
  const user = await User.findById(userId).select("portfolio");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const holding = user.portfolio.find((p) => p.symbol === symbol);
  if (!holding) throw new AppError("Stock not in portfolio", 404, "NOT_HELD");
  if (holding.quantity < quantity) {
    throw new AppError("Quantity exceeds holding", 400, "INSUFFICIENT_QUANTITY");
  }

  // Sanity check the supplied sell price against the last known price for the
  // holding. Prevents arbitrary cash extraction via inflated sell prices.
  const ref = holding.currentPrice || holding.averagePrice;
  if (ref > 0) {
    const tol = trade.sellPriceTolerance;
    const lo = ref * (1 - tol);
    const hi = ref * (1 + tol);
    if (price < lo || price > hi) {
      throw new AppError(
        `Sell price outside allowed range (${lo.toFixed(2)} - ${hi.toFixed(2)})`,
        400,
        "PRICE_OUT_OF_RANGE"
      );
    }
  }

  const proceeds = round2(price * quantity);
  const sellingAll = holding.quantity === quantity;

  if (sellingAll) {
    await User.updateOne(
      { _id: userId },
      {
        $pull: { portfolio: { symbol } },
        $inc: { fund: proceeds },
        $push: {
          orderHistory: {
            symbol,
            orderType: "sell",
            orderPrice: price,
            quantity,
            orderDate: new Date(),
          },
        },
      }
    );
  } else {
    // Selling a partial position reduces the share count and the invested
    // amount proportionally — averagePrice stays the same.
    const remainingQty = holding.quantity - quantity;
    const remainingInvested = round2(holding.averagePrice * remainingQty);

    await User.updateOne(
      { _id: userId, "portfolio.symbol": symbol },
      {
        $set: {
          "portfolio.$.quantity": remainingQty,
          "portfolio.$.totalInvested": remainingInvested,
          "portfolio.$.currentPrice": price,
          "portfolio.$.lastUpdate": new Date(),
        },
        $inc: { fund: proceeds },
        $push: {
          orderHistory: {
            symbol,
            orderType: "sell",
            orderPrice: price,
            quantity,
            orderDate: new Date(),
          },
        },
      }
    );
  }

  return User.findById(userId).select("fund portfolio orderHistory");
}

module.exports = { executeBuy, executeSell };
