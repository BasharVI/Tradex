const express = require("express");
const User = require("./db/User");
const request = require("request");
const cors = require("cors");
const { json } = require("express");

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

// Add to watchlist

app.post("/stock/:symbol", async (req, res) => {
  console.log(req.body);
  const symbol = req.params.symbol;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=UOASVEI0FTZC85M8`;

  await request.get(
    {
      url: url,
      json: true,
      headers: { "User-Agent": "request" },
    },
    (err, res, data) => {
      if (err) {
        console.log("Error:", err);
      } else if (res.statusCode !== 200) {
        console.log("Status:", res.statusCode);
      } else {
        // data is successfully parsed as a JSON object:
        let output = data;
        const [symbol, LTP] = Object.values(output).map((data, index) => {
          if (index === 0) {
            const stock = Object.values(data)[1];
            return stock;
          } else if (index === 1) {
            const price = Object.values(data)[1];
            return Object.values(price)[3];
          } else {
            return null;
          }
        });
        console.log(symbol, LTP);
      }
    }
  );
  res.send("success");
});

// Port connection
app.listen(5000, () => {
  console.log("server listening to port 5000");
});
