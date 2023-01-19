import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Watchlist from "./Watchlist";

const Stocks = () => {
  const [stockData, setStockData] = useState({});
  const [quantity, setQuantity] = useState("");
  const [buySell, setBuySell] = useState("buy");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      let result = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${id}&interval=5min&apikey=UOASVEI0FTZC73M8`
      );
      result = await result.json();
      const [symbol, LTP] = Object.values(result).map((data, index) => {
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
      setStockData({ symbol, LTP });
    })();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const details = {
      symbol: id,
      quantity,
      buySell,
    };
    // API call
    const response = await fetch("/api/update-portfolio", {
      method: "POST",
      body: JSON.stringify(details),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.succuss) {
      console.log("Stock added to portfolio and order created");
      navigate("/Portfolio");
    } else {
      console.log("Error adding stock to portfolio and creating order");
    }
  };

  return (
    <div className="outercontainer">
      <Watchlist />
      <div className="stockspage">
        <h1>{stockData.symbol}</h1>
        <h2>{stockData.LTP}</h2>
        <form onSubmit={handleSubmit}>
          <div className="quantity-container">
            <label>
              Quantity:
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
          </div>
          <br />
          <div className="action-container">
            <label>
              Buy/Sell:
              <select
                value={buySell}
                onChange={(e) => setBuySell(e.target.value)}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>
            <br />
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Stocks;
