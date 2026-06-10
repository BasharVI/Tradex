const IORedis = require("ioredis");
const { redis } = require("../config/env");

let client;

function initRedis() {
  if (client) return client;
  client = new IORedis(redis.url);
  client.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[redis] error:", err && err.message ? err.message : err);
  });
  client.on("connect", () => {
    // eslint-disable-next-line no-console
    console.log("[redis] connected");
  });
  return client;
}

function getClient() {
  if (!client) return initRedis();
  return client;
}

module.exports = { initRedis, getClient };
