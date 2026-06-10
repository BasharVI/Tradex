const IMarketDataProvider = require("../IMarketDataProvider");

class MockProvider extends IMarketDataProvider {
  constructor() {
    super();
  }

  async getQuote(symbol) {
    const now = Date.now();
    const lastPrice = Number((Math.random() * 1000).toFixed(2));
    return {
      provider: "mock",
      symbol: String(symbol).toUpperCase(),
      lastPrice,
      timestamp: now,
      raw: { mocked: true },
    };
  }

  async getHistorical(symbol, fromTs, toTs, interval) {
    const candles = [];
    const step = Math.max(1, Math.floor((toTs - fromTs) / 50));
    for (let t = fromTs; t <= toTs; t += step) {
      const o = Number((Math.random() * 1000).toFixed(2));
      const h = o + Number((Math.random() * 10).toFixed(2));
      const l = Math.max(0, o - Number((Math.random() * 10).toFixed(2)));
      const c = Number((l + h) / 2).toFixed(2);
      const v = Math.floor(Math.random() * 10000);
      candles.push({ t, o, h, l, c: Number(c), v });
    }
    return { provider: "mock", symbol, interval, candles };
  }

  async search(query, limit = 20) {
    const q = String(query || "").toUpperCase();
    const results = [];
    for (let i = 0; i < limit; i++) {
      results.push({
        symbol: `${q || "MOCK"}${i}`,
        companyName: `Mock Company ${i}`,
        exchange: "NSE",
      });
    }
    return results;
  }
}

module.exports = MockProvider;
