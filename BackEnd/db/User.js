const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  watchlist: [
    {
      stockName: String,
      tickerSymbol: String,
      currentPrice: Number,
      lastUpdate: Date,
    },
  ],
  portfolio: [
    {
      stockName: String,
      tickerSymbol: String,
      boughtPrice: Number,
      currentPrice: Number,
      quantity: Number,
      orderId: String,
      lastUpdate: Date,
    },
  ],
  orderHistory: [
    {
      stockName: String,
      orderType: String,
      orderPrice: Number,
      quantity: Number,
      orderDate: Date,
    },
  ],
});

module.exports = mongoose.model("users", userSchema);
