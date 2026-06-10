const Notification = require("../models/Notification");

let io = null;

function setNotificationServer(server) {
  io = server;
}

async function createNotification(userId, payload) {
  const notification = await Notification.create({
    userId,
    type: payload.type || "GENERAL",
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata || {},
  });

  if (io) {
    io.to(String(userId)).emit("notification:new", notification.toJSON());
  }

  return notification;
}

module.exports = {
  setNotificationServer,
  createNotification,
};
