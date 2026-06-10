const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");
const { initRedis } = require("./services/redisClient");
const StreamingService = require("./services/streaming.service");
const { setNotificationServer } = require("./services/notification.service");
const { reserveAiJob, completeAiJob, failAiJob } = require("./services/ai/queue.service");
const { processAiJob, enqueueWeeklyReportsBatch } = require("./services/ai/ai.service");

(async () => {
  try {
    await connectDb();
    // init redis
    initRedis();

    const server = http.createServer(app);
    const io = new Server(server, { /* options */ });
    setNotificationServer(io);

    // simple socket logging
    io.on("connection", (socket) => {
      // eslint-disable-next-line no-console
      console.log("[io] client connected", socket.id);
      const userId = socket.handshake.auth && socket.handshake.auth.userId;
      if (userId) socket.join(String(userId));
      socket.on("disconnect", () => {
        // eslint-disable-next-line no-console
        console.log("[io] client disconnected", socket.id);
      });
    });

    // start streaming service
    const streaming = new StreamingService(io);
    streaming.start();

    const aiWorkers = Math.max(1, Number(process.env.AI_WORKER_CONCURRENCY || 2));
    for (let index = 0; index < aiWorkers; index += 1) {
      (async function workerLoop() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const job = await reserveAiJob(5);
          if (!job) continue;
          try {
            await processAiJob(job);
            await completeAiJob(job);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[ai-worker] job failed:", err.message);
            await failAiJob(job, true);
          }
        }
      })().catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[ai-worker] fatal:", err);
      });
    }

    if (String(process.env.AI_WEEKLY_ENABLED || "false").toLowerCase() === "true") {
      const intervalMs = Number(process.env.AI_WEEKLY_SCAN_MS || 6 * 60 * 60 * 1000);
      const runBatch = () =>
        enqueueWeeklyReportsBatch().catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[ai-weekly] enqueue failed:", err.message);
        });
      setInterval(runBatch, intervalMs);
      runBatch();
    }

    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] listening on port ${port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[server] failed to start:", err);
    process.exit(1);
  }
})();

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("[unhandledRejection]", err);
});
process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("[uncaughtException]", err);
  process.exit(1);
});
