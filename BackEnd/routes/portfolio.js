const express = require("express");
const User = require("../db/User");
const router = express.Router();

// Adding stock to portfolio and order creation
router.post("/", async (req, res) => {
  const { userId, symbol, quantity, price, buySell } = req.body;
  const cost = price * quantity;
  const user = await User.findOne({ _id: userId });
  if (!user) return res.status(404).send("User not found");
  if (buySell === "buy" && user.fund < cost)
    return res.status(400).send("Funds not sufficient");

  try {
    if (buySell === "buy") {
      const existingstock = await User.findOne({
        _id: userId,
        "portfolio.stockName": symbol,
      });
      if (existingstock) {
        const user = await User.findOneAndUpdate(
          { _id: userId, "portfolio.stockName": symbol },
          {
            $inc: {
              "portfolio.$.quantity": quantity,
              fund: -cost,
            },

            $push: {
              orderHistory: {
                stockName: symbol,
                orderPrice: price,
                quantity: quantity,
                orderDate: new Date().toLocaleDateString("en-US"),
                orderType: buySell,
              },
            },
          },
          { new: true }
        );
      } else {
        const user = await User.findOneAndUpdate(
          { _id: userId },
          {
            $push: {
              portfolio: {
                stockName: symbol,
                boughtPrice: price,
                quantity: quantity,
              },
              orderHistory: {
                stockName: symbol,
                orderPrice: price,
                quantity: quantity,
                orderDate: new Date().toLocaleDateString("en-US"),
                orderType: buySell,
              },
            },
            $inc: {
              fund: -cost,
            },
          },
          { new: true }
        );
      }
    } else {
      // stock sell
      const portfolioStock = user.portfolio.find(
        (stock) => stock.stockName === symbol
      );

      if (!portfolioStock) {
        return res.status(404).send("Stock not found in portfolio");
      } else if (portfolioStock.quantity == quantity) {
        // remove stock
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          {
            $pull: { portfolio: { stockName: symbol } },
            $inc: {
              fund: cost,
            },
            $push: {
              orderHistory: {
                stockName: symbol,
                orderPrice: price,
                quantity: quantity,
                orderDate: new Date().toLocaleDateString("en-US"),
                orderType: buySell,
              },
            },
          },
          { new: true }
        );
        return res.send(updatedUser);
      } else if (portfolioStock.quantity < quantity) {
        return res
          .status(400)
          .send("Quantity in portfolio is less than the quantity being sold");
      } else {
        // update stock quantity
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId, "portfolio.stockName": symbol },
          {
            $inc: { "portfolio.$.quantity": -quantity, fund: cost },
            $push: {
              orderHistory: {
                stockName: symbol,
                orderPrice: price,
                quantity: quantity,
                orderDate: new Date().toLocaleDateString("en-US"),
                orderType: buySell,
              },
            },
          },
          { new: true }
        );
        return res.send(updatedUser);
      }
    }

    // console.log("Stock added to portfolio and order created");
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

//get portfolio
router.get("/", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  res.send(user);
});

module.exports = router;
