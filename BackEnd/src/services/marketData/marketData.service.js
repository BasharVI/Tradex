const { market, redis: redisCfg } = require("../../config/env");
const { getClient } = require("../redisClient");
const UpstoxProvider = require("./providers/UpstoxProvider");
const AngelOneProvider = require("./providers/AngelOneProvider");
const MockProvider = require("./providers/MockProvider");

function providerForConfig() {
  const p = (market && market.provider) || "upstox";
  if (p === "upstox") return new UpstoxProvider(market.upstox || {});
  if (p === "angelone") return new AngelOneProvider(market.angelone || {});
  return new MockProvider();
}

const provider = providerForConfig();

async function cacheGet(key) {
  try {
    const client = getClient();
    if (!client) return null; // Handle absence of Redis client gracefully
    const v = await client.get(key);
    if (!v) return null;
    return JSON.parse(v);
  } catch (err) {
    return null;
  }
}

async function cacheSet(key, value, ttlSec) {
  try {
    const client = getClient();
    if (!client) return; // Handle absence of Redis client gracefully
    const str = JSON.stringify(value);
    if (ttlSec && ttlSec > 0) {
      await client.set(key, str, "EX", ttlSec);
    } else {
      await client.set(key, str);
    }
  } catch (err) {
    // ignore cache failures
  }
}

async function quote(symbol, opts = {}) {
  const s = String(symbol).toUpperCase();
  const key = `quote:${s}`;
  const ttl = Number(process.env.MARKET_QUOTE_TTL || 5);

  // try cache
  const cached = await cacheGet(key);
  if (cached && !opts.force) return { data: cached, source: "cache" };

  // call provider with retries
  const maxRetries = 2;
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await provider.getQuote(s);
      await cacheSet(key, res, ttl);
      return { data: res, source: "provider" };
    } catch (err) {
      lastErr = err;
      // on failure, if we have cached data, return that as fallback
      if (cached) return { data: cached, source: "cache-fallback", error: err.message };
      // otherwise wait and retry
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  const e = new Error(`quote failed: ${lastErr ? lastErr.message : "unknown"}`);
  throw e;
}

async function historical(symbol, fromTs, toTs, interval = "1m") {
  const key = `hist:${symbol}:${fromTs}:${toTs}:${interval}`;
  const ttl = Number(process.env.MARKET_HIST_TTL || 3600);
  const cached = await cacheGet(key);
  if (cached) return { data: cached, source: "cache" };
  try {
    const res = await provider.getHistorical(symbol, fromTs, toTs, interval);
    await cacheSet(key, res, ttl);
    return { data: res, source: "provider" };
  } catch (err) {
    if (cached) return { data: cached, source: "cache-fallback", error: err.message };
    throw err;
  }
}

async function search(query, limit = 20) {
  const key = `search:${String(query || "").toLowerCase()}:${limit}`;
  const ttl = Number(process.env.MARKET_SEARCH_TTL || 30);
  const cached = await cacheGet(key);
  if (cached) return { data: cached, source: "cache" };
  try {
    const res = await provider.search(query, limit);
    await cacheSet(key, res, ttl);
    return { data: res, source: "provider" };
  } catch (err) {
    if (cached) return { data: cached, source: "cache-fallback", error: err.message };
    throw err;
  }
}

module.exports = { quote, historical, search, provider };
