const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectDb() {
  mongoose.connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[db] connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("[db] disconnected");
  });

  await mongoose.connect(mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10_000,
  });

  // eslint-disable-next-line no-console
  console.log("[db] connected");
}

module.exports = { connectDb };
