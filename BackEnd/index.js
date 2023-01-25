const express = require("express");
const User = require("./db/User");
const cors = require("cors");
const { json } = require("express");
const mongoose = require("mongoose");
const { findById } = require("./db/User");

require("./db/config");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Signup
app.post("/signup", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  res.send(result);
});

// Login
app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      res.send(user);
    } else {
      res.send({ result: "No User found" });
    }
  } else {
    res.send({ result: "No result" });
  }
});

// Add to watchlist

app.post("/watchlist", async (req, res) => {
  // extract userId and stock from request body
  const { userId, stock, price } = req.body;
  try {
    // find user by id and push stock to their watchlist array
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $push: { watchlist: { stockName: stock, currentPrice: price } } },
      { new: true }
    );
    res.send(updatedUser);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Remove stock from watchlist

app.delete("/watchlist", async (req, res) => {
  const { userId, stock } = req.body;
  const updateUser = await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { watchlist: { stockName: stock } } }
  );
  res.send(updateUser);
});

// Adding stock to portfolio and order creation

app.post("/portfolio", async (req, res) => {
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

// Add fund
app.post("/addfund", async (req, res) => {
  const { userId, fund } = req.body;
  const user = await User.findByIdAndUpdate(
    { _id: userId },
    {
      $inc: {
        fund: fund,
      },
    }
  );
  res.send(user);
});

// get watchlist
app.get("/watchlist", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  res.send(user);
});

//get portfolio

app.get("/portfolio", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  res.send(user);
});

// get order history

app.get("/orders", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  res.send(user);
});

// Get accont balnce
app.get("/addfund", async (req, res) => {
  const { userId } = req.query;
  try {
    let result = await User.findById(userId).select("fund").lean();
    res.send(result);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Port connection
app.listen(5000, () => {
  console.log("server listening to port 5000");
});
