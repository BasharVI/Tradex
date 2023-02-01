const express = require("express");
const User = require("../db/User");
const router = express.Router();

router.post("/", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  res.send(result);
});

module.exports = router;
