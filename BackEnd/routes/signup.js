const express = require("express");
const User = require("../db/User");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/", async (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 5);
  const data = {
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  };
  let user = new User(data);
  let result = await user.save();
  res.send(result);
});

module.exports = router;
