const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  watchlist: Array,
  portfolio: Array,
});

module.exports = mongoose.model("users", userSchema);
