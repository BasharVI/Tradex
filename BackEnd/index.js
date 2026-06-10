// Legacy entry point — kept so existing scripts (e.g. `node index.js`,
// `pm2 start index.js`) keep working. Real bootstrap lives in src/server.js.
require("./src/server");
