const express = require("express");
const router = express.Router();
const User = require("../db/User");

// Add to watchlist

router.post("/", async (req, res) => {
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
router.delete("/", async (req, res) => {
  const { userId, stock } = req.body;
  const updateUser = await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { watchlist: { stockName: stock } } }
  );
  res.send(updateUser);
});

// get watchlist
router.get("/", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  res.send(user);
});

module.exports = router;
