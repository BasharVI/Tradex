const AppError = require("../../utils/AppError");
const { getClient } = require("../redisClient");

async function enforceAiRateLimit(userId, bucket, limit, windowSeconds = 3600) {
  const key = `ai:rate:${bucket}:${userId}`;
  const client = getClient();
  const current = await client.incr(key);
  if (current === 1) {
    await client.expire(key, windowSeconds);
  }
  if (current > limit) {
    throw new AppError("AI rate limit exceeded", 429, "AI_RATE_LIMITED");
  }
}

module.exports = { enforceAiRateLimit };
