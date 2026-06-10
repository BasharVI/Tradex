const { hydrateHoldings } = require("./analytics.service");

const round2 = (n) => Math.round(n * 100) / 100;
const pct = (n, d) => (d ? round2((n / d) * 100) : 0);

// Holdings heatmap: one tile per (symbol, exchange, productType). Size driven
// by current value; colour intensity driven by day change %.
async function holdingsHeatmap(userId) {
  const holdings = await hydrateHoldings(userId);
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  return holdings
    .map((h) => ({
      symbol: h.symbol,
      exchange: h.exchange,
      productType: h.productType,
      companyName: h.companyName,
      sector: h.sector,
      industry: h.industry,
      value: h.currentValue,
      weight: pct(h.currentValue, total),
      ltp: h.ltp,
      change: h.dayChange,
      changePct: h.dayChangePct,
      pnl: h.unrealizedPnL,
      pnlPct: h.unrealizedPnLPct,
    }))
    .sort((a, b) => b.value - a.value);
}

// Sector heatmap: aggregate of holdings by sector. Each sector cell carries
// rolled-up day change and unrealized P&L plus the constituents.
async function sectorHeatmap(userId) {
  const holdings = await hydrateHoldings(userId);
  const buckets = new Map();
  let total = 0;

  for (const h of holdings) {
    const k = h.sector || "UNCATEGORIZED";
    const b = buckets.get(k) || {
      sector: k,
      value: 0,
      invested: 0,
      dayChange: 0,
      pnl: 0,
      holdings: [],
    };
    b.value += h.currentValue;
    b.invested += h.investedAmount;
    b.dayChange += h.dayChange;
    b.pnl += h.unrealizedPnL;
    b.holdings.push({
      symbol: h.symbol,
      exchange: h.exchange,
      value: h.currentValue,
      changePct: h.dayChangePct,
      pnlPct: h.unrealizedPnLPct,
    });
    buckets.set(k, b);
    total += h.currentValue;
  }

  return [...buckets.values()]
    .map((b) => ({
      sector: b.sector,
      value: round2(b.value),
      invested: round2(b.invested),
      weight: pct(b.value, total),
      dayChange: round2(b.dayChange),
      dayChangePct: pct(b.dayChange, b.value - b.dayChange),
      pnl: round2(b.pnl),
      pnlPct: pct(b.pnl, b.invested),
      holdings: b.holdings,
    }))
    .sort((a, b) => b.value - a.value);
}

module.exports = { holdingsHeatmap, sectorHeatmap };
