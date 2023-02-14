const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../db/User");

router.post("/", async (req, res) => {
  if (req.body.password && req.body.email) {
    const hashedPassword = bcrypt.hashSync(req.body.password, 5);
    const data = {
      email: req.body.email,
      password: hashedPassword,
    };
    let user = await User.findOne({ data });
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.send(user);
    } else {
      res.send({ result: "No User found" });
    }
  } else {
    res.send({ result: "No result" });
  }
});

module.exports = router;
