const express = require("express");
const cors = require("cors");
const signupRouter = require("./routes/signup");
const loginRouter = require("./routes/login");
const addfundRouter = require("./routes/addFund");
const watchlistRouter = require("./routes/watchlist");
const portfolioRouter = require("./routes/portfolio");
const orderRouter = require("./routes/order");
const app = express();
require("./db/config");

// Middlewares
app.use(express.json());
app.use(cors());

// Routes handlers
app.use("/signup", signupRouter);
app.use("/login", loginRouter);
app.use("/watchlist", watchlistRouter);
app.use("/portfolio", portfolioRouter);
app.use("/addfund", addfundRouter);
app.use("/orders", orderRouter);

// Port connection
app.listen(5000, () => {
  console.log("server listening to port 5000");
});
