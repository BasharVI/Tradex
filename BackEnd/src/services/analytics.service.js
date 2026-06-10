const Holding = require("../models/Holding");
const StockMaster = require("../models/StockMaster");
const Trade = require("../models/Trade");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const round2 = (n) => Math.round(n * 100) / 100;
const pct = (n, d) => (d ? round2((n / d) * 100) : 0);

// Hydrate holdings with live LTP + sector/industry from StockMaster. We do
// this on read rather than denormalising into Holding so that price/sector
// changes don't require touching every holding row.
async function hydrateHoldings(userId) {
  const holdings = await Holding.find({ userId }).lean({ virtuals: false });
  if (holdings.length === 0) return [];

  const keys = [
    ...new Set(holdings.map((h) => `${h.symbol}|${h.exchange}`)),
  ].map((k) => {
    const [symbol, exchange] = k.split("|");
    return { symbol, exchange };
  });

  const stocks = await StockMaster.find({
    $or: keys,
  })
    .select(
      "symbol exchange sector industry lastPrice previousClose companyName"
    )
    .lean();
  const sMap = new Map(stocks.map((s) => [`${s.symbol}|${s.exchange}`, s]));

  return holdings.map((h) => {
    const m = sMap.get(`${h.symbol}|${h.exchange}`) || {};
    const ltp = m.lastPrice || h.lastPrice || h.averagePrice;
    const previousClose = m.previousClose || ltp;
    const currentValue = round2(ltp * h.quantity);
    const unrealizedPnL = round2((ltp - h.averagePrice) * h.quantity);
    const dayChange = round2((ltp - previousClose) * h.quantity);
    return {
      ...h,
      companyName: m.companyName || h.symbol,
      sector: m.sector || "UNCATEGORIZED",
      industry: m.industry || "UNCATEGORIZED",
      ltp,
      previousClose,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPct: pct(unrealizedPnL, h.investedAmount),
      dayChange,
      dayChangePct: pct(ltp - previousClose, previousClose),
    };
  });
}

async function getPortfolioSummary(userId) {
  const user = await User.findById(userId)
    .select(
      "startingCapital availableCash investedAmount realizedPnL"
    )
    .lean();
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const holdings = await hydrateHoldings(userId);

  const cncHoldings = holdings.filter((h) => h.productType === "CNC");
  const investedAmount = round2(
    cncHoldings.reduce((s, h) => s + h.investedAmount, 0)
  );
  const currentValue = round2(
    holdings.reduce((s, h) => s + h.currentValue, 0)
  );
  const unrealizedPnL = round2(
    holdings.reduce((s, h) => s + h.unrealizedPnL, 0)
  );
  const dayChange = round2(holdings.reduce((s, h) => s + h.dayChange, 0));

  const portfolioValue = round2(user.availableCash + currentValue);
  const totalReturn = round2(
    portfolioValue - user.startingCapital
  );
  const totalReturnPct = pct(totalReturn, user.startingCapital);

  return {
    startingCapital: user.startingCapital,
    availableCash: round2(user.availableCash),
    investedAmount,
    currentValue,
    portfolioValue,
    realizedPnL: round2(user.realizedPnL),
    unrealizedPnL,
    totalReturn,
    totalReturnPct,
    dailyReturn: dayChange,
    dailyReturnPct: pct(dayChange, portfolioValue - dayChange),
    holdingsCount: holdings.length,
  };
}

async function getHoldings(userId) {
  return hydrateHoldings(userId);
}

async function getAllocation(userId, by = "sector") {
  const field = by === "industry" ? "industry" : "sector";
  const holdings = await hydrateHoldings(userId);
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (total === 0) return [];

  const buckets = new Map();
  for (const h of holdings) {
    const k = h[field] || "UNCATEGORIZED";
    const b = buckets.get(k) || { name: k, value: 0, invested: 0, pnl: 0, count: 0 };
    b.value += h.currentValue;
    b.invested += h.investedAmount;
    b.pnl += h.unrealizedPnL;
    b.count += 1;
    buckets.set(k, b);
  }
  return [...buckets.values()]
    .map((b) => ({
      name: b.name,
      value: round2(b.value),
      invested: round2(b.invested),
      pnl: round2(b.pnl),
      pnlPct: pct(b.pnl, b.invested),
      allocationPct: pct(b.value, total),
      count: b.count,
    }))
    .sort((a, b) => b.value - a.value);
}

async function getRecentTrades(userId, limit = 50) {
  return Trade.find({ userId })
    .sort({ executedAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  hydrateHoldings,
  getPortfolioSummary,
  getHoldings,
  getAllocation,
  getRecentTrades,
};
