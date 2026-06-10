const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");
const { initRedis } = require("./services/redisClient");
const StreamingService = require("./services/streaming.service");
const { setNotificationServer } = require("./services/notification.service");

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
