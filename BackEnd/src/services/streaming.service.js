const marketData = require("./marketData/marketData.service");
const { getClient } = require("./redisClient");

const POLL_INTERVAL_MS = Number(process.env.MARKET_STREAM_POLL_MS || 2000);

class StreamingService {
  constructor(io) {
    this.io = io; // socket.io server
    this.subscribed = new Set();
    this.timer = null;
    this.redis = getClient();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), POLL_INTERVAL_MS);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(symbol) {
    this.subscribed.add(String(symbol).toUpperCase());
  }

  unsubscribe(symbol) {
    this.subscribed.delete(String(symbol).toUpperCase());
  }

  async _tick() {
    if (!this.subscribed.size) return;
    const syms = Array.from(this.subscribed);
    for (const s of syms) {
      try {
        const { data } = await marketData.quote(s).catch((e) => ({ data: null, error: e }));
        const src = data || {};
        const payload = { symbol: s, lastPrice: src.lastPrice ?? src.ltp ?? src.raw?.lastPrice ?? 0, timestamp: Date.now(), provider: src.provider || "provider" };
        // cache latest quote in redis
        try {
          await this.redis.set(`realtime:${s}`, JSON.stringify(payload), "EX", 10);
        } catch (err) {
          // ignore
        }
        // broadcast over socket.io
        if (this.io) this.io.emit("market:quote", payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[stream] tick error for", s, err && err.message ? err.message : err);
      }
    }
  }
}

module.exports = StreamingService;
