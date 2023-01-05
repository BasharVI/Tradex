const express = require("express");
const User = require("./db/User");
const cors = require("cors");

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

// Port connection
app.listen(5000, () => {
  console.log("server listening to port 5000");
});
