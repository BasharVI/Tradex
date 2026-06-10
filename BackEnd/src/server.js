const app = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");

(async () => {
  try {
    await connectDb();
    app.listen(port, () => {
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
