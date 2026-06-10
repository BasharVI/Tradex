const axios = require("axios");
const IMarketDataProvider = require("../IMarketDataProvider");

class AngelOneProvider extends IMarketDataProvider {
  constructor(cfg = {}) {
    super();
    this.cfg = cfg;
    this.baseUrl = cfg.baseUrl || "https://api.angelone.in";
    this.apiKey = cfg.apiKey;
  }

  async getQuote(symbol) {
    // For now, this is a stub. Real implementation should call Angel One quote API.
    throw new Error("AngelOneProvider.getQuote not implemented");
  }

  async getHistorical(symbol, fromTs, toTs, interval) {
    throw new Error("AngelOneProvider.getHistorical not implemented");
  }

  async search(query, limit = 20) {
    throw new Error("AngelOneProvider.search not implemented");
  }
}

module.exports = AngelOneProvider;
