const axios = require("axios");
const IMarketDataProvider = require("../IMarketDataProvider");

class UpstoxProvider extends IMarketDataProvider {
  constructor(cfg = {}) {
    super();
    this.cfg = cfg;
    this.baseUrl = cfg.baseUrl || "https://api.upstox.com";
    this.apiKey = cfg.apiKey;
    this.apiSecret = cfg.apiSecret;
  }

  async _request(path, opts = {}) {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const headers = Object.assign({}, opts.headers || {});
    if (this.apiKey) headers["x-api-key"] = this.apiKey;
    const res = await axios({ url, method: opts.method || "get", headers, data: opts.data, params: opts.params, timeout: 10_000 });
    return res.data;
  }

  async getQuote(symbol) {
    if (!symbol) throw new Error("symbol required");
    // Best-effort implementation — Upstox API details may differ; adapt when real credentials are available.
    try {
      const data = await this._request(`/quote/${encodeURIComponent(symbol)}`);
      return { provider: "upstox", symbol, raw: data, lastPrice: data?.lastPrice ?? data?.ltp ?? null, timestamp: Date.now() };
    } catch (err) {
      err.message = `UpstoxProvider.getQuote failed: ${err.message}`;
      throw err;
    }
  }

  async getHistorical(symbol, fromTs, toTs, interval) {
    try {
      const params = { from: fromTs, to: toTs, interval };
      const data = await this._request(`/historical/${encodeURIComponent(symbol)}`, { params });
      return { provider: "upstox", symbol, interval, raw: data };
    } catch (err) {
      err.message = `UpstoxProvider.getHistorical failed: ${err.message}`;
      throw err;
    }
  }

  async search(query, limit = 20) {
    try {
      const params = { q: query, limit };
      const data = await this._request(`/search`, { params });
      return Array.isArray(data) ? data : data?.results || [];
    } catch (err) {
      err.message = `UpstoxProvider.search failed: ${err.message}`;
      throw err;
    }
  }
}

module.exports = UpstoxProvider;
