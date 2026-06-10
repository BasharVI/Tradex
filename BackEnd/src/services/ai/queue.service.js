const { getClient } = require("../redisClient");

const QUEUE_KEY = "ai:jobs";
const PROCESSING_KEY = "ai:processing";

async function enqueueAiJob(job) {
  const client = getClient();
  await client.lpush(QUEUE_KEY, JSON.stringify(job));
}

async function reserveAiJob(timeoutSeconds = 5) {
  const client = getClient();
  const result = await client.brpoplpush(QUEUE_KEY, PROCESSING_KEY, timeoutSeconds);
  return result ? JSON.parse(result) : null;
}

async function completeAiJob(job) {
  const client = getClient();
  const serialized = JSON.stringify(job);
  await client.lrem(PROCESSING_KEY, 1, serialized);
}

async function failAiJob(job, retry = true) {
  const client = getClient();
  const serialized = JSON.stringify(job);
  await client.lrem(PROCESSING_KEY, 1, serialized);
  if (retry && (job.attempts || 0) < 3) {
    await client.lpush(
      QUEUE_KEY,
      JSON.stringify({
        ...job,
        attempts: (job.attempts || 0) + 1,
        lastErrorAt: Date.now(),
      })
    );
  }
}

module.exports = { enqueueAiJob, reserveAiJob, completeAiJob, failAiJob };
