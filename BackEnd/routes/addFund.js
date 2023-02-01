const express = require("express");
const router = express.Router();
const User = require("../db/User");

router.get("/", async (req, res) => {
  const { userId } = req.query;
  try {
    let result = await User.findById(userId).select("fund").lean();
    res.send(result);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/", async (req, res) => {
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

module.exports = router;
