const crypto = require("crypto");
const { getClient } = require("../redisClient");

const TTL_SECONDS = Number(process.env.AI_CACHE_TTL_SECONDS || 60 * 60 * 24 * 7);

function hashPayload(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function getCached(key) {
  try {
    const client = getClient();
    const raw = await client.get(`ai:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setCached(key, value, ttlSeconds = TTL_SECONDS) {
  try {
    const client = getClient();
    await client.set(`ai:${key}`, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    return null;
  }
  return value;
}

module.exports = { hashPayload, getCached, setCached };
