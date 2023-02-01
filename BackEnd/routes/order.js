const express = require("express");
const User = require("../db/User");
const router = express.Router();

// get order history
router.get("/", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  res.send(user);
});
module.exports = router;
