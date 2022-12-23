const express = require("express");
const User = require("./db/User");
require("./db/config");

const app = express();

// Middlewares
app.use(express.json());

app.post("/signup", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  res.send(result);
});

// Port connection
app.listen(5000, () => {
  console.log("server listening to port 5000");
});
