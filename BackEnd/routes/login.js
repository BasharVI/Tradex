const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../db/User");

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    let user = await User.findOne({ email: email });
    if (user && bcrypt.compareSync(password, user.password)) {
      res.send(user);
    } else {
      res.send({ result: "No User found" });
    }
  } else {
    res.send({ result: "No result" });
  }
});

module.exports = router;
